import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Filter,
  Download,
  Trash2,
  Check,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [documentFilter, setDocumentFilter] = useState('All');
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [statusFilter, documentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (documentFilter !== 'All') params.document_id = documentFilter;

      const [itemsRes, docsRes] = await Promise.all([
        api.get('/action-items', { params }),
        api.get('/documents')
      ]);

      setItems(itemsRes.data);
      setDocuments(docsRes.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load action items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await api.patch(`/action-items/${item.id}`, { status: nextStatus });
      setItems((prev) => prev.map((act) => (act.id === item.id ? { ...act, status: nextStatus } : act)));
      addToast(`Action marked as ${nextStatus.toLowerCase()}.`, 'success');
    } catch (err) {
      addToast('Failed to update action item status.', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.delete(`/action-items/${itemId}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      addToast('Action item removed.', 'success');
    } catch (err) {
      addToast('Failed to delete action item.', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (documentFilter !== 'All') params.append('document_id', documentFilter);

      const response = await api.get(`/action-items/export/csv?${params.toString()}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'action_items_export.csv');
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Downloaded action items CSV.', 'success');
    } catch (err) {
      addToast('Failed to export CSV.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Action Items & Task Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, track, and manage all actionable deliverables extracted from your analyzed documents.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={items.length === 0}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span>Export All as CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['All', 'Pending', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Document dropdown filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            Document:
          </span>
          <select
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500"
          >
            <option value="All">All Documents</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Items List */}
      {loading ? (
        <SkeletonLoader count={4} type="table" />
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const isCompleted = item.status === 'Completed';
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 opacity-75'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-subtle'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4" />}
                  </button>

                  <div className="space-y-1.5 flex-1">
                    <p className={`text-sm font-semibold leading-relaxed ${
                      isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {item.task_description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Assigned To: <strong className="text-slate-700 dark:text-slate-200">{item.responsible_person || 'Not specified'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Deadline: <strong className="text-slate-700 dark:text-slate-200">{item.due_date || 'Not specified'}</strong>
                      </span>
                      {item.document_filename && (
                        <>
                          <span>•</span>
                          <Link
                            to={`/summary/${item.document_id}`}
                            className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{item.document_filename}</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    item.is_explicit
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                      : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                  }`}>
                    {item.is_explicit ? 'Explicit Task' : 'AI Suggested'}
                  </span>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                  }`}>
                    {item.status}
                  </span>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No action items found"
          description={
            statusFilter !== 'All'
              ? `There are no action items with status "${statusFilter}".`
              : "Generate an AI summary from any uploaded document to automatically extract actionable deliverables."
          }
          icon={CheckSquare}
        />
      )}
    </div>
  );
}
