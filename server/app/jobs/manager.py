import os
import time
import wave
import asyncio
import logging
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

from app.jobs.models import Job, JobCreateReq, JobFileProgress
from app.text.md_strip import clean_markdown
from app.text.segment import split_text_by_punctuation
from app.tts.engine import engine

logger = logging.getLogger(__name__)

JOBS: Dict[str, Job] = {}
job_queue = asyncio.Queue()

tts_executor = ThreadPoolExecutor(max_workers=1)

def generate_silence(ms: int, framerate: int) -> bytes:
    frames = int(framerate * ms / 1000)
    return (b"\x00\x00") * frames

async def worker():
    while True:
        job_id = await job_queue.get()
        job = JOBS.get(job_id)
        if not job or job.cancel_requested:
            job_queue.task_done()
            continue
            
        job.status = "running"
        job.started_at = time.time()
        logger.info(f"开始处理任务: {job_id}")
        
        try:
            for f_progress in job.files:
                if job.cancel_requested:
                    job.status = "cancelled"
                    break
                    
                await process_file(job, f_progress)
                
            if not job.cancel_requested:
                if any(f.status == "failed" for f in job.files):
                    job.status = "failed"
                else:
                    job.status = "succeeded"
                    
        except Exception as e:
            logger.error(f"任务 {job_id} 发生严重错误: {e}")
            job.status = "failed"
            job.error = str(e)
        finally:
            job.completed_at = time.time()
            job_queue.task_done()

async def process_file(job: Job, f_progress: JobFileProgress):
    f_progress.status = "processing"
    
    try:
        with open(f_progress.file_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
            
        if job.config.ignore_code_blocks:
            text = clean_markdown(text)
            
        segments = split_text_by_punctuation(text, max_chars=job.config.max_chars_per_segment)
        f_progress.total_segments = len(segments)
        
        if not segments:
            f_progress.status = "completed"
            return
            
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        outputs_dir = os.path.join(base_dir, "data", "outputs")
        out_dir = os.path.join(outputs_dir, job.id)
        os.makedirs(out_dir, exist_ok=True)
        basename = os.path.basename(f_progress.file_path)
        name, _ = os.path.splitext(basename)
        out_wav = os.path.join(out_dir, f"{name}.wav")
        f_progress.output_wav = out_wav
        
        loop = asyncio.get_event_loop()
        
        # 如果所有的片段都被跳过了（比如全是特殊符号，或者全是 OOV 导致所有片段都返回了空音频）
        # 此时 wav_file 已经被创建，但没有写入任何 frames，这会导致 WAV 头部信息不完整或损坏，
        # 在关闭文件时 wave 模块会抛出错误，或者生成一个无法播放的 0 字节文件。
        has_written_frames = False
        
        with wave.open(out_wav, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(engine.sample_rate)
            
            silence_bytes = generate_silence(job.config.pause_ms_between_segments, engine.sample_rate)
            
            for i, seg in enumerate(segments):
                if job.cancel_requested:
                    f_progress.status = "failed"
                    f_progress.error = "Cancelled"
                    return
                    
                pcm_data = await loop.run_in_executor(tts_executor, engine.generate_audio_pcm, seg)
                
                # 防御性写入：只有当模型真的吐出了音频数据时，才写入文件。
                if pcm_data and len(pcm_data) > 0:
                    wav_file.writeframes(pcm_data)
                    has_written_frames = True
                    # 只有写入了有效音频，才追加静音
                    if i < len(segments) - 1:
                        wav_file.writeframes(silence_bytes)
                    
                f_progress.done_segments += 1
                
        # 如果从头到尾什么都没写进去，我们要把它标记为失败，或者写入一点静音占位，否则文件是坏的
        if not has_written_frames:
            raise ValueError("所有文本片段都被模型跳过或无法识别（可能全是生僻词/符号），未能生成任何有效音频。")
            
        f_progress.status = "completed"
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"处理文件失败 {f_progress.file_path}:\n{error_details}")
        f_progress.status = "failed"
        f_progress.error = str(e)
        
def create_job(req: JobCreateReq) -> Job:
    files = []
    for inp in req.inputs:
        if inp.type == "file":
            if os.path.isfile(inp.path):
                files.append(JobFileProgress(file_path=inp.path))
        elif inp.type == "folder":
            if os.path.isdir(inp.path):
                for root, _, filenames in os.walk(inp.path):
                    for fname in filenames:
                        if fname.endswith(('.md', '.txt')):
                            files.append(JobFileProgress(file_path=os.path.join(root, fname)))
                            
    job = Job(config=req.config, files=files)
    JOBS[job.id] = job
    job_queue.put_nowait(job.id)
    return job

def cancel_job(job_id: str):
    if job_id in JOBS:
        JOBS[job_id].cancel_requested = True
