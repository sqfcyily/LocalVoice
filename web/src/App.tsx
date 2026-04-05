import React, { useState, useEffect } from 'react';
import { PlusCircle, List, Library, Play, Download, XCircle } from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('new');
  
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 text-xl font-bold tracking-tight text-indigo-600">Local TTS</div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setTab('new')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${tab === 'new' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'}`}>
            <PlusCircle size={20} /><span>New Job</span>
          </button>
          <button onClick={() => setTab('jobs')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${tab === 'jobs' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'}`}>
            <List size={20} /><span>Queue</span>
          </button>
          <button onClick={() => setTab('library')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${tab === 'library' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'}`}>
            <Library size={20} /><span>Library</span>
          </button>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[80vh]">
          {tab === 'new' && <NewJob />}
          {tab === 'jobs' && <JobsQueue />}
          {tab === 'library' && <LibraryView />}
        </div>
      </div>
    </div>
  );
}

function NewJob() {
  const [path, setPath] = useState('');
  const [type, setType] = useState('file');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:7860/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: [{ type, path }],
          config: { max_chars_per_segment: 300, ignore_code_blocks: true, pause_ms_between_segments: 150 }
        })
      });
      if (res.ok) {
        alert('Job created successfully!');
        setPath('');
      } else {
        alert('Failed to create job');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure backend is running.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Create New TTS Job</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Input Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border">
            <option value="file">Single File (.md, .txt)</option>
            <option value="folder">Directory (Batch)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Absolute Path</label>
          <input type="text" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/workspace/docs/my-file.md" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border" required />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
          Start Conversion
        </button>
      </form>
    </div>
  );
}

function JobsQueue() {
  const [jobs, setJobs] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('http://localhost:7860/api/jobs');
        if (res.ok) setJobs(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchJobs();
    const timer = setInterval(fetchJobs, 2000);
    return () => clearInterval(timer);
  }, []);

  const cancelJob = async (id: string) => {
    await fetch(`http://localhost:7860/api/jobs/${id}/cancel`, { method: 'POST' });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Task Queue</h2>
      <div className="space-y-4">
        {jobs.length === 0 && <p className="text-gray-500 italic">No jobs in queue.</p>}
        {jobs.map(job => (
          <div key={job.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="font-mono text-sm text-gray-500 truncate w-64">{job.id}</div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'running' ? 'bg-blue-100 text-blue-700' : job.status === 'succeeded' ? 'bg-green-100 text-green-700' : job.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {job.status.toUpperCase()}
              </div>
            </div>
            <div className="space-y-2">
              {job.files.map((f: any, idx: number) => (
                <div key={idx} className="text-sm flex items-center justify-between">
                  <span className="truncate w-3/4" title={f.file_path}>{f.file_path.split('/').pop()}</span>
                  <span className="text-gray-500">{f.done_segments}/{f.total_segments}</span>
                </div>
              ))}
            </div>
            {(job.status === 'running' || job.status === 'queued') && (
              <button onClick={() => cancelJob(job.id)} className="mt-4 text-sm text-red-600 flex items-center hover:underline">
                <XCircle size={16} className="mr-1"/> Cancel Job
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LibraryView() {
  const [jobs, setJobs] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('http://localhost:7860/api/jobs?status=succeeded');
        if (res.ok) setJobs(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchJobs();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Output Library</h2>
      <div className="space-y-6">
        {jobs.length === 0 && <p className="text-gray-500 italic">No completed jobs yet.</p>}
        {jobs.map(job => (
          <div key={job.id} className="border border-gray-100 rounded-xl p-5 bg-gray-50">
            <div className="text-xs text-gray-400 mb-3">{new Date(job.created_at * 1000).toLocaleString()}</div>
            <div className="space-y-3">
              {job.files.filter((f: any) => f.status === 'completed' && f.output_wav).map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-medium text-sm truncate w-1/2">{f.file_path.split('/').pop()}</span>
                  <div className="flex items-center space-x-3">
                    <audio controls src={`http://localhost:7860/api/outputs/${job.id}/${f.output_wav.split('/').pop()}`} className="h-8 w-48" />
                    <a href={`http://localhost:7860/api/outputs/${job.id}/${f.output_wav.split('/').pop()}`} download className="text-indigo-600 hover:text-indigo-800">
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
