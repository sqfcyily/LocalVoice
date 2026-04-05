import os
import sys
import logging
import numpy as np
import sherpa_onnx
import subprocess

logger = logging.getLogger(__name__)

def auto_patch_model(model_path: str):
    """
    自动调用 patch_onnx.py 为模型打补丁，修复 missing metadata 错误
    如果补丁脚本执行失败，不再打印烦人的错误日志，静默放行。
    """
    try:
        patch_script = os.path.join(os.path.dirname(__file__), "patch_onnx.py")
        if os.path.exists(patch_script):
            # Run the python script to patch it
            subprocess.run([sys.executable, patch_script, model_path], check=True, capture_output=True, text=True)
    except Exception:
        # 我们在这里彻底闭嘴，只要模型还能被 Sherpa-onnx 加载就行。
        pass

class TTSEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TTSEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self, models_dir: str):
        if self._initialized:
            return
            
        logger.info(f"Scanning models directory: {models_dir}")
        
        # Sherpa-onnx 典型需要 model.onnx, lexicon.txt, tokens.txt, 有的需要 dict 目录
        vits_model = ""
        matcha_acoustic = ""
        matcha_vocoder = ""
        lexicon = ""
        tokens = ""
        dict_dir = ""
        rule_fsts = []
        
        for root, dirs, files in os.walk(models_dir):
            for file in files:
                if file.endswith(".onnx"):
                    # Heuristic to separate matcha from vits
                    if "vocoder" in file or "hifigan" in file:
                        matcha_vocoder = os.path.join(root, file)
                    elif "matcha" in file or "model-steps" in file:
                        matcha_acoustic = os.path.join(root, file)
                    else:
                        vits_model = os.path.join(root, file)
                elif file == "lexicon.txt":
                    lexicon = os.path.join(root, file)
                elif file == "tokens.txt":
                    tokens = os.path.join(root, file)
                elif file.endswith(".fst") and ("rule" in file or "phone" in file or "date" in file or "number" in file):
                    rule_fsts.append(os.path.join(root, file))
                    
            if "dict" in dirs:
                dict_dir = os.path.join(root, "dict")
        
        # Determine if it's VITS or Matcha
        if matcha_acoustic and not vits_model:
            logger.info(f"Detected Matcha TTS model: {matcha_acoustic}")
            auto_patch_model(matcha_acoustic)
            matcha_config = sherpa_onnx.OfflineTtsMatchaModelConfig(
                acoustic_model=matcha_acoustic,
                vocoder=matcha_vocoder,
                lexicon=lexicon,
                tokens=tokens,
            )
            if dict_dir:
                matcha_config.dict_dir = dict_dir
                
            model_config = sherpa_onnx.OfflineTtsModelConfig(
                matcha=matcha_config,
                num_threads=1,
                debug=False,
                provider="cpu",
            )
        elif vits_model:
            logger.info(f"Detected VITS TTS model: {vits_model}")
            auto_patch_model(vits_model)
            vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
                model=vits_model,
                lexicon=lexicon,
                tokens=tokens,
            )
            if dict_dir:
                vits_config.dict_dir = dict_dir
                
            model_config = sherpa_onnx.OfflineTtsModelConfig(
                vits=vits_config,
                num_threads=1,
                debug=False,
                provider="cpu",
            )
        else:
            logger.warning(f"在 {models_dir} 中未找到受支持的 ONNX 模型 (VITS 或 Matcha)，TTS 引擎将不可用。")
            self.tts = None
            self.sample_rate = 16000
            return
        
        # 组装完整的 TTS 配置
        rule_fsts_str = ",".join(rule_fsts) if rule_fsts else ""
        tts_config = sherpa_onnx.OfflineTtsConfig(
            model=model_config,
            rule_fsts=rule_fsts_str,
            max_num_sentences=1,
        )
        
        self.tts = sherpa_onnx.OfflineTts(tts_config)
        self.sample_rate = self.tts.sample_rate
        self._initialized = True
        logger.info(f"TTS 引擎初始化成功，原生采样率: {self.sample_rate}Hz")

    def generate_audio_pcm(self, text: str, sid: int = 0, speed: float = 1.0) -> bytes:
        """
        推理并返回 16-bit PCM 字节流
        """
        if not self._initialized or not self.tts:
            raise RuntimeError("TTS Engine is not initialized or model is missing.")
            
        try:
            # audio.samples 是一维 float32 NumPy 数组，范围 [-1.0, 1.0]
            audio = self.tts.generate(text, sid=sid, speed=speed)
            
            if audio is None or len(audio.samples) == 0:
                logger.warning(f"模型未能对以下文本生成有效音频，已跳过: '{text}'")
                return b""
                
            # 极端的防御：如果模型因为底层 C++ 内存泄漏或者字典越界，
            # 吐出了一个大得离谱的垃圾数组（比如几十亿个元素），在乘以 32767 时会导致 MemoryError。
            # 假设一句话最长 300 字，按最慢语速，生成的音频也极少超过 3 分钟（以 24000Hz 算约 4320000 个采样点）。
            # 我们设置一个 10,000,000 采样点的硬上限（约 7 分钟音频），超过这个直接丢弃。
            if len(audio.samples) > 10000000:
                logger.error(f"严重异常：模型返回了异常巨大的音频数组 ({len(audio.samples)} samples)，已强行丢弃以防止内存溢出。文本: '{text}'")
                return b""
                
            # 转换为 16-bit PCM
            samples_int16 = (audio.samples * 32767).astype(np.int16)
            return samples_int16.tobytes()
        except Exception as e:
            logger.error(f"TTS 推理引擎崩溃! 文本: '{text}', 错误: {e}")
            raise

# 全局单例
engine = TTSEngine()
