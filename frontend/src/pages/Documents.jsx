import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Sparkles,
  MessageSquare,
  FileCheck,
  Calendar,
  Layers,
  UploadCloud,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState('All');
  const { addToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [selectedType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== 'All') params.doc_type = selectedType;
      const res = await api.get('/documents', { params });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load documents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      addToast('Document deleted.', 'success');
    } catch (err) {
      addToast('Failed to delete document.', 'error');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchTerm) return true;
    return doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const docTypes = ['All', 'Report', 'Meeting Notes', 'Research Paper', 'Business Document', 'General Document'];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Browse, search, and manage your analyzed documents and generated summaries.
          </p>
        </div>
        <Link
          to="/upload"
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {docTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedType === type
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table or Empty State */}
      {loading ? (
        <SkeletonLoader count={4} type="table" />
      ) : filteredDocs.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Filename</th>
                  <th scope="col" className="px-6 py-4">Classification</th>
                  <th scope="col" className="px-6 py-4">Length</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Uploaded</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                          <Link
                            to={`/summary/${doc.id}`}
                            className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors block max-w-xs truncate"
                          >
                            {doc.filename}
                          </Link>
                          <span className="text-xs text-slate-400 uppercase font-mono">
                            .{doc.file_type} • {formatFileSize(doc.file_size)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.document_type || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} • {doc.word_count.toLocaleString()} words
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
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/summary/${doc.id}`}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 font-medium text-xs transition-colors"
                        >
                          {doc.status === 'summarized' ? 'Summary' : 'Summarize'}
                        </Link>
                        <Link
                          to={`/chat?doc=${doc.id}`}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Chat with Document"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          title="No documents match your query"
          description={searchTerm ? `No documents found matching "${searchTerm}". Try a different search.` : "Upload your first document to see it listed here."}
          actionLabel={searchTerm ? "Clear Search" : "Upload Document"}
          onAction={searchTerm ? () => setSearchTerm('') : () => navigate('/upload')}
          icon={FileText}
        />
      )}
    </div>
  );
}

