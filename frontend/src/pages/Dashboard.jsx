import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  CheckSquare,
  Clock,
  UploadCloud,
  ArrowRight,
  FileCheck,
  Calendar,
  Layers,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    return <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Quick Upload Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-indigo-600 to-brand-800 rounded-3xl p-8 text-white shadow-card">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Multi-Modal AI Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Document Summarizer & Action Extractor
            </h1>
            <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
              Upload PDF, Word, or Text files to instantly synthesize executive summaries, extract structured action items, and query documents with conversational intelligence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="px-6 py-3.5 rounded-2xl bg-white text-brand-700 hover:bg-indigo-50 font-bold text-sm transition-all duration-200 shadow-md flex items-center gap-2 shrink-0 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Provider Status Note if in Fallback / Demo mode */}
      {stats?.system_info && !stats.system_info.has_gemini_key && !stats.system_info.has_openai_key && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">LLM API Key Required for AI Summarization</p>
            <p className="text-amber-800/80 dark:text-amber-300/80">
              To generate AI summaries using Google Gemini or OpenAI, please set your <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono font-bold">GEMINI_API_KEY</code> in <code className="font-mono">backend/.env</code>.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <SkeletonLoader count={4} type="card" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Documents"
            value={stats?.total_documents ?? 0}
            icon={FileText}
            color="indigo"
            subtitle="Uploaded & parsed files"
          />
          <StatCard
            title="Summaries Generated"
            value={stats?.total_summaries ?? 0}
            icon={Sparkles}
            color="emerald"
            subtitle="AI reports synthesized"
          />
          <StatCard
            title="Action Items Extracted"
            value={stats?.total_action_items ?? 0}
            icon={CheckSquare}
            color="amber"
            subtitle="Tasks with owners & dates"
          />
          <StatCard
            title="Pending Actions"
            value={stats?.pending_action_items ?? 0}
            icon={Clock}
            color="purple"
            subtitle={`${stats?.completed_action_items ?? 0} marked completed`}
          />
        </div>
      )}

      {/* Recent Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Documents
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Previously processed files and analysis states
            </p>
          </div>
          <Link
            to="/documents"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1.5 group"
          >
            <span>View All Documents</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader count={3} type="table" />
        ) : stats?.recent_documents && stats.recent_documents.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-4">Document</th>
                    <th scope="col" className="px-6 py-4">Type</th>
                    <th scope="col" className="px-6 py-4">Size & Pages</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Date</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recent_documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {getFileIcon(doc.file_type)}
                          </div>
                          <div>
                            <Link
                              to={`/summary/${doc.id}`}
                              className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-xs block"
                            >
                              {doc.filename}
                            </Link>
                            <span className="text-xs text-slate-400 uppercase font-mono">
                              .{doc.file_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {doc.document_type || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {formatFileSize(doc.file_size)}
                        </p>
                        <p className="text-slate-400">
                          {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} • {doc.word_count} words
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === 'summarized' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <FileCheck className="w-3.5 h-3.5" />
                            Summarized
                          </span>
                        ) : doc.status === 'error' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/summary/${doc.id}`}
                            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-600 dark:text-brand-400 font-medium text-xs transition-colors"
                          >
                            {doc.status === 'summarized' ? 'View Summary' : 'Summarize'}
                          </Link>
                          <Link
                            to={`/chat?doc=${doc.id}`}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Chat with document"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No documents yet"
            description="Upload your first PDF, Word, or Text document to extract insights and actionable tasks."
            actionLabel="Upload Now"
            onAction={() => navigate('/upload')}
            icon={UploadCloud}
          />
        )}
      </div>
    </div>
  );
}

