import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Download, 
  XCircle, 
  FileText, 
  FolderOpen, 
  Settings2, 
  Layers, 
  Languages, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  List,
  Library
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- i18n Dictionary ---
const dict = {
  en: {
    appTitle: "LocalVoice",
    appSubtitle: "Bilingual TTS Engine",
    navNew: "New Job",
    navQueue: "Task Queue",
    navLibrary: "Library",
    newJobTitle: "Create Conversion Job",
    inputType: "Input Source",
    typeFile: "Single File (.md, .txt)",
    typeFolder: "Directory (Batch)",
    absPath: "Absolute Path",
    pathPlaceholderFile: "e.g., /workspace/docs/my-file.md",
    pathPlaceholderFolder: "e.g., /workspace/docs",
    advancedSettings: "Advanced Settings",
    maxChars: "Max Chars per Segment",
    pauseMs: "Pause Between Segments (ms)",
    ignoreCode: "Ignore Markdown Code Blocks",
    startBtn: "Synthesize Audio",
    emptyQueue: "The queue is currently empty.",
    emptyLibrary: "No generated audio files yet.",
    cancelJob: "Abort",
    download: "Download",
    statusRunning: "Synthesizing",
    statusQueued: "Queued",
    statusSucceeded: "Completed",
    statusFailed: "Failed",
    successMsg: "Job submitted to the void.",
    failMsg: "Failed to submit job.",
  },
  zh: {
    appTitle: "LocalVoice",
    appSubtitle: "双语离线语音引擎",
    navNew: "新建任务",
    navQueue: "任务队列",
    navLibrary: "输出库",
    newJobTitle: "创建语音合成任务",
    inputType: "输入源类型",
    typeFile: "单文件 (.md, .txt)",
    typeFolder: "本地目录 (批量转换)",
    absPath: "绝对路径",
    pathPlaceholderFile: "例如: /workspace/docs/my-file.md",
    pathPlaceholderFolder: "例如: /workspace/docs",
    advancedSettings: "高级配置",
    maxChars: "单段最大字符数",
    pauseMs: "段落停顿 (毫秒)",
    ignoreCode: "跳过 Markdown 代码块",
    startBtn: "开始合成",
    emptyQueue: "队列空空如也",
    emptyLibrary: "还没有生成任何音频",
    cancelJob: "终止任务",
    download: "下载",
    statusRunning: "合成中",
    statusQueued: "排队中",
    statusSucceeded: "已完成",
    statusFailed: "失败",
    successMsg: "任务已投入虚空队列。",
    failMsg: "任务创建失败。",
  }
};

type Lang = 'en' | 'zh';

// --- Main App Component ---
export default function App() {
  const [tab, setTab] = useState<'new' | 'jobs' | 'library'>('new');
  const [lang, setLang] = useState<Lang>('zh');
  const t = dict[lang];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white/5 border-r border-white/10 backdrop-blur-2xl flex flex-col z-10"
      >
        <div className="p-8">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent flex items-center gap-3">
            <Layers className="text-purple-500" size={28} />
            {t.appTitle}
          </h1>
          <p className="text-xs text-white/40 font-medium tracking-widest uppercase mt-2 pl-10">{t.appSubtitle}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem active={tab === 'new'} onClick={() => setTab('new')} icon={<Settings2 size={18} />} label={t.navNew} />
          <NavItem active={tab === 'jobs'} onClick={() => setTab('jobs')} icon={<List size={18} />} label={t.navQueue} />
          <NavItem active={tab === 'library'} onClick={() => setTab('library')} icon={<Library size={18} />} label={t.navLibrary} />
        </nav>

        {/* Lang Switcher */}
        <div className="p-6">
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors group"
          >
            <Languages size={16} className="group-hover:text-purple-400 transition-colors" />
            {lang === 'en' ? 'Switch to 中文' : 'Switch to English'}
          </button>
        </div>
      </motion.div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div 
            key={tab}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto p-10 min-h-full flex flex-col"
          >
            {tab === 'new' && <NewJobView t={t} />}
            {tab === 'jobs' && <JobsQueueView t={t} />}
            {tab === 'library' && <LibraryView t={t} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Components ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
        active ? "text-white" : "text-white/50 hover:text-white/90 hover:bg-white/[0.02]"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-pill" 
          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/5 border border-white/10 rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className={cn("transition-colors duration-300", active ? "text-purple-400" : "group-hover:text-white/70")}>{icon}</span>
      <span className="font-medium tracking-wide text-sm">{label}</span>
    </button>
  );
}

function NewJobView({ t }: { t: typeof dict['en'] }) {
  const [path, setPath] = useState('');
  const [type, setType] = useState<'file'|'folder'>('file');
  const [maxChars, setMaxChars] = useState(300);
  const [pauseMs, setPauseMs] = useState(150);
  const [ignoreCode, setIgnoreCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:7860/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: [{ type, path }],
          config: { max_chars_per_segment: maxChars, ignore_code_blocks: ignoreCode, pause_ms_between_segments: pauseMs }
        })
      });
      if (res.ok) {
        // Show subtle success toast conceptually here
        setPath('');
      } else {
        alert(t.failMsg);
      }
    } catch (err) {
      alert('Network error. Backend down?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-black tracking-tight mb-3 text-white">{t.newJobTitle}</h2>
        <div className="h-1 w-12 bg-purple-500 rounded-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative">
        {/* Glass panel for form */}
        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
          <div className="space-y-6">
            
            {/* Input Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3">{t.inputType}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('file')}
                  className={cn(
                    "flex flex-col items-center justify-center py-6 rounded-2xl border transition-all duration-300",
                    type === 'file' 
                      ? "bg-purple-500/10 border-purple-500/50 text-purple-300" 
                      : "bg-black/20 border-white/5 text-white/40 hover:border-white/20 hover:bg-white/[0.02]"
                  )}
                >
                  <FileText size={24} className="mb-2" />
                  <span className="text-sm font-medium">{t.typeFile}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('folder')}
                  className={cn(
                    "flex flex-col items-center justify-center py-6 rounded-2xl border transition-all duration-300",
                    type === 'folder' 
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-300" 
                      : "bg-black/20 border-white/5 text-white/40 hover:border-white/20 hover:bg-white/[0.02]"
                  )}
                >
                  <FolderOpen size={24} className="mb-2" />
                  <span className="text-sm font-medium">{t.typeFolder}</span>
                </button>
              </div>
            </div>

            {/* Path Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3">{t.absPath}</label>
              <input 
                type="text" 
                value={path} 
                onChange={(e) => setPath(e.target.value)} 
                placeholder={type === 'file' ? t.pathPlaceholderFile : t.pathPlaceholderFolder} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                required 
              />
            </div>

            <div className="pt-4 border-t border-white/5">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-4">{t.advancedSettings}</label>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-white/40 mb-2">{t.maxChars}</label>
                  <input type="number" value={maxChars} onChange={e=>setMaxChars(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white/80 focus:outline-none focus:border-purple-500/50 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">{t.pauseMs}</label>
                  <input type="number" value={pauseMs} onChange={e=>setPauseMs(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white/80 focus:outline-none focus:border-purple-500/50 font-mono text-sm" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <input type="checkbox" id="ignoreCode" checked={ignoreCode} onChange={e=>setIgnoreCode(e.target.checked)} className="rounded border-white/10 bg-black/40 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900" />
                <label htmlFor="ignoreCode" className="ml-2 text-sm text-white/60">{t.ignoreCode}</label>
              </div>
            </div>

          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || !path}
          className={cn(
            "w-full relative group overflow-hidden rounded-2xl p-[1px] transition-all duration-300",
            (isSubmitting || !path) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-70 group-hover:opacity-100 bg-[length:200%_auto] animate-gradient" />
          <div className="relative flex items-center justify-center bg-black/50 backdrop-blur-xl px-8 py-5 rounded-2xl gap-3">
            {isSubmitting ? <Loader2 className="animate-spin text-white" size={20} /> : <Play className="text-white fill-white/20" size={20} />}
            <span className="font-bold text-lg text-white tracking-wide">{t.startBtn}</span>
          </div>
        </button>
      </form>
    </div>
  );
}

function JobsQueueView({ t }: { t: typeof dict['en'] }) {
  const [jobs, setJobs] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('http://localhost:7860/api/jobs');
        if (res.ok) setJobs(await res.json());
      } catch (e) {}
    };
    fetchJobs();
    const timer = setInterval(fetchJobs, 1500);
    return () => clearInterval(timer);
  }, []);

  const cancelJob = async (id: string) => {
    await fetch(`http://localhost:7860/api/jobs/${id}/cancel`, { method: 'POST' });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'running': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'succeeded': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'failed': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'running': return t.statusRunning;
      case 'succeeded': return t.statusSucceeded;
      case 'failed': return t.statusFailed;
      default: return t.statusQueued;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-3 text-white">{t.navQueue}</h2>
          <div className="h-1 w-12 bg-blue-500 rounded-full" />
        </div>
        <div className="text-xs font-mono text-white/30">{jobs.length} JOBS</div>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-3xl bg-white/[0.01]">
            <List size={48} className="text-white/10 mb-4" />
            <p className="text-white/30 font-medium tracking-wide">{t.emptyQueue}</p>
          </div>
        )}
        
        <AnimatePresence>
          {jobs.map(job => (
            <motion.div 
              key={job.id} 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/[0.05] transition-colors relative overflow-hidden group"
            >
              {job.status === 'running' && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 animate-shimmer" />
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs text-white/40 bg-black/50 px-2 py-1 rounded-md">{job.id.split('-')[0]}</div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border", getStatusColor(job.status))}>
                    {getStatusLabel(job.status)}
                  </div>
                </div>
                {(job.status === 'running' || job.status === 'queued') && (
                  <button 
                    onClick={() => cancelJob(job.id)} 
                    className="text-xs text-rose-400/70 hover:text-rose-400 flex items-center gap-1 transition-colors bg-rose-400/5 hover:bg-rose-400/10 px-3 py-1.5 rounded-lg"
                  >
                    <XCircle size={14} /> {t.cancelJob}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {job.files.map((f: any, idx: number) => {
                  const progress = f.total_segments > 0 ? (f.done_segments / f.total_segments) * 100 : 0;
                  const isDone = f.status === 'completed';
                  const isFail = f.status === 'failed';
                  
                  return (
                    <div key={idx} className="bg-black/20 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                      {/* Progress bar background */}
                      {!isDone && !isFail && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all duration-500 ease-out" 
                          style={{ width: `${progress}%` }} 
                        />
                      )}
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3 w-2/3">
                          {isDone ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : 
                           isFail ? <AlertCircle size={16} className="text-rose-500 shrink-0" /> :
                           <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />}
                          <span className="truncate text-sm font-medium text-white/80" title={f.file_path}>
                            {f.file_path.split('/').pop()}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-white/40 bg-black/40 px-2 py-1 rounded">
                          {f.done_segments} / {f.total_segments}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LibraryView({ t }: { t: typeof dict['en'] }) {
  const [jobs, setJobs] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('http://localhost:7860/api/jobs?status=succeeded');
        if (res.ok) setJobs(await res.json());
      } catch (e) {}
    };
    fetchJobs();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-4xl font-black tracking-tight mb-3 text-white">{t.navLibrary}</h2>
        <div className="h-1 w-12 bg-emerald-500 rounded-full" />
      </div>

      <div className="space-y-8">
        {jobs.length === 0 && (
           <div className="py-20 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-3xl bg-white/[0.01]">
           <Library size={48} className="text-white/10 mb-4" />
           <p className="text-white/30 font-medium tracking-wide">{t.emptyLibrary}</p>
         </div>
        )}
        
        {jobs.map(job => {
          const validFiles = job.files.filter((f: any) => f.status === 'completed' && f.output_wav);
          if (validFiles.length === 0) return null;
          
          const date = new Date(job.created_at * 1000);
          
          return (
            <div key={job.id} className="relative pl-6 border-l-2 border-white/10">
              <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              
              <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-3">
                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/30">{job.id.split('-')[0]}</span>
              </div>
              
              <div className="grid gap-3">
                {validFiles.map((f: any, idx: number) => {
                  const filename = f.output_wav.split(/[/\\]/).pop();
                  const url = `http://localhost:7860/api/outputs/${job.id}/${filename}`;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/5 transition-colors group">
                      <div className="flex items-center gap-4 w-1/3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Play className="text-emerald-400 fill-emerald-400/20 ml-1" size={16} />
                        </div>
                        <span className="font-medium text-sm text-white/90 truncate" title={filename}>
                          {filename}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 flex-1 justify-end">
                        <audio 
                          controls 
                          src={url} 
                          className="h-9 w-64 opacity-50 hover:opacity-100 transition-opacity [&::-webkit-media-controls-panel]:bg-white/10 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white" 
                        />
                        <a 
                          href={url} 
                          download 
                          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                          title={t.download}
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
