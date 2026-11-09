import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Calendar,
  CheckSquare,
  Tag,
  Info,
  RefreshCw,
  Sliders,
  FileCode,
  FileDown,
  Trash2,
  MessageSquare,
  BrainCircuit,
  SearchCheck,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';

export default function SummaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoFinderOpen, setInfoFinderOpen] = useState(false);
  const [infoFinderLoading, setInfoFinderLoading] = useState(false);
  const [importantInfo, setImportantInfo] = useState(null);

  // Summary generation options
  const [summaryLength, setSummaryLength] = useState('Medium');
  const [summaryStyle, setSummaryStyle] = useState('Structured Report');
  const [summaryTone, setSummaryTone] = useState('Professional');
  const [summaryLanguage, setSummaryLanguage] = useState('English');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      setDocument(res.data);
      if (res.data.summary_length) setSummaryLength(res.data.summary_length);
      if (res.data.summary_style) setSummaryStyle(res.data.summary_style);
      if (res.data.summary_tone) setSummaryTone(res.data.summary_tone);
      if (res.data.summary_language) setSummaryLanguage(res.data.summary_language);
    } catch (err) {
      console.error(err);
      addToast('Failed to load document details.', 'error');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setSummarizing(true);
    setSettingsOpen(false);
    try {
      const res = await api.post(`/documents/${id}/summarize`, {
        length: summaryLength,
        style: summaryStyle,
        tone: summaryTone,
        language: summaryLanguage,
      });
      setDocument(res.data);
      addToast('AI summary generated successfully!', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to generate summary.';
      addToast(detail, 'error');
    } finally {
      setSummarizing(false);
    }
  };

  const handleToggleActionStatus = async (item) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await api.patch(`/action-items/${item.id}`, { status: nextStatus });
      setDocument(prev => ({
        ...prev,
        action_items: prev.action_items.map(act => act.id === item.id ? res.data : act)
      }));
      addToast(`Task marked as ${nextStatus.toLowerCase()}`, 'success');
    } catch (err) {
      addToast('Failed to update action item status.', 'error');
    }
  };

  const handleCopySummary = () => {
    if (!document?.executive_summary) return;
    const textToCopy = `EXECUTIVE SUMMARY - ${document.filename}\n\n${document.executive_summary}\n\nDETAILED SUMMARY:\n${document.detailed_summary || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    addToast('Summary copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = async () => {
    try {
      const response = await api.get(`/documents/${id}/export?format=txt`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.filename.replace(/\.[^/.]+$/, '')}_summary.txt`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Downloaded summary as TXT.', 'success');
    } catch (err) {
      addToast('Failed to download TXT file.', 'error');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/documents/${id}/export?format=pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.filename.replace(/\.[^/.]+$/, '')}_report.pdf`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Downloaded executive report as PDF.', 'success');
    } catch (err) {
      addToast('Failed to download PDF report.', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get(`/action-items/export/csv?document_id=${id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.filename.replace(/\.[^/.]+$/, '')}_action_items.csv`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Exported action items as CSV.', 'success');
    } catch (err) {
      addToast('Failed to export CSV.', 'error');
    }
  };

  const handleExtractImportantInfo = async () => {
    setInfoFinderOpen(true);
    if (importantInfo) return;
    setInfoFinderLoading(true);
    try {
      const res = await api.post(`/documents/${id}/extract-info`);
      setImportantInfo(res.data);
    } catch (err) {
      addToast('Failed to extract deep information.', 'error');
    } finally {
      setInfoFinderLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${document.filename}"?`)) return;
    try {
      await api.delete(`/documents/${id}`);
      addToast('Document deleted.', 'success');
      navigate('/documents');
    } catch (err) {
      addToast('Failed to delete document.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse"></div>
        <SkeletonLoader count={3} type="summary" />
      </div>
    );
  }

  const isSummarized = document.status === 'summarized';

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header & Meta Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                {document.document_type || 'Document'}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                .{document.file_type}
              </span>
              {document.ocr_applied && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  OCR Applied
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight break-all">
              {document.filename}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {document.page_count} {document.page_count === 1 ? 'page' : 'pages'} • {document.word_count.toLocaleString()} words • Uploaded on {new Date(document.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>{isSummarized ? 'Summary Settings' : 'Configure AI'}</span>
            </button>

            <button
              onClick={handleGenerateSummary}
              disabled={summarizing}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-brand-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              {summarizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isSummarized ? 'Regenerate Summary' : 'Generate Summary'}</span>
                </>
              )}
            </button>

            <Link
              to={`/chat?doc=${document.id}`}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-brand-600 dark:text-brand-300 font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat / Q&A</span>
            </Link>

            <button
              onClick={handleDeleteDocument}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Settings Drawer / Panel */}
        {settingsOpen && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-slide-in">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              AI Summary Customization
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Length */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Summary Length
                </label>
                <select
                  value={summaryLength}
                  onChange={(e) => setSummaryLength(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="Short">Short (~150 words)</option>
                  <option value="Medium">Medium (~300 words)</option>
                  <option value="Detailed">Detailed (~500+ words)</option>
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Output Style
                </label>
                <select
                  value={summaryStyle}
                  onChange={(e) => setSummaryStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="Structured Report">Structured Report</option>
                  <option value="Paragraphs">Paragraphs</option>
                  <option value="Bullet Points">Bullet Points</option>
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tone
                </label>
                <select
                  value={summaryTone}
                  onChange={(e) => setSummaryTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="Professional">Professional</option>
                  <option value="Academic">Academic</option>
                  <option value="Simple English">Simple English</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Summary Language
                </label>
                <select
                  value={summaryLanguage}
                  onChange={(e) => setSummaryLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Chinese">Chinese (中文)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Portuguese">Portuguese (Português)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerateSummary}
                disabled={summarizing}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors"
              >
                Apply & Generate Summary
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner if summarization failed */}
      {document.status === 'error' && document.error_message && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 text-rose-900 dark:text-rose-200 shadow-subtle space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                Summarization Error
              </h3>
              <p className="text-xs text-rose-800/90 dark:text-rose-200/90 leading-relaxed">
                {document.error_message}
              </p>
            </div>
          </div>
          <div className="pl-8 pt-1 flex flex-wrap gap-3">
            <button
              onClick={handleGenerateSummary}
              disabled={summarizing}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${summarizing ? 'animate-spin' : ''}`} />
              <span>Retry Summarization</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Results or Unsummarized Prompt */}
      {!isSummarized && !summarizing ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 text-center shadow-subtle space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Ready to Analyze Document
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Text has been parsed ({document.word_count} words). Click below to trigger the Large Language Model to synthesize summaries, key points, and actionable items.
          </p>
          <button
            onClick={handleGenerateSummary}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/25 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Summary Now</span>
          </button>
        </div>
      ) : summarizing ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 text-center shadow-subtle space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto animate-pulse">
            <BrainCircuit className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Synthesizing Document Insights...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Processing semantic chunks, extracting deadlines, and verifying factual groundings.
          </p>
          <SkeletonLoader count={2} type="summary" />
        </div>
      ) : (
        <>
          {/* Export & Utility Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handleExtractImportantInfo}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <SearchCheck className="w-3.5 h-3.5" />
                <span>Deep Info Finder</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shadow-sm"
                title="Download Summary as Plain Text"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>TXT</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-brand-500/20"
                title="Download Formatted PDF Executive Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shadow-sm"
                title="Export Action Items as CSV spreadsheet"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-6">
            {/* 1. Executive Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Executive Summary
                    </h2>
                    <p className="text-xs text-slate-400">
                      High-level distillation of core findings
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {document.executive_summary}
              </div>
            </div>

            {/* 2. Key Points Card */}
            {document.key_points && document.key_points.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Key Points & Findings
                    </h2>
                    <p className="text-xs text-slate-400">
                      Critical facts, statistics, and takeaways
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                  {document.key_points.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Action Items Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Extracted Action Items ({document.action_items?.length || 0})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Concrete tasks, owners, and deadlines identified in the text
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {document.action_items && document.action_items.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {document.action_items.map((item) => {
                    const isCompleted = item.status === 'Completed';
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isCompleted
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 opacity-75'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1">
                          <button
                            onClick={() => handleToggleActionStatus(item)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="space-y-1">
                            <p className={`text-xs font-medium leading-relaxed ${
                              isCompleted
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {item.task_description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                              <span>
                                Responsible: <strong className="text-slate-600 dark:text-slate-300">{item.responsible_person || 'Not specified'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Due: <strong className="text-slate-600 dark:text-slate-300">{item.due_date || 'Not specified'}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-8 sm:pl-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.is_explicit
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                          }`}>
                            {item.is_explicit ? 'Explicit Task' : 'AI Suggested'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific action items identified in this document.</p>
              )}
            </div>

            {/* 4. Important Dates & Keywords Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dates */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Important Dates & Deadlines
                    </h3>
                    <p className="text-xs text-slate-400">Milestones extracted from text</p>
                  </div>
                </div>

                {document.important_dates && document.important_dates.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {document.important_dates.map((dateStr, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{dateStr}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No explicit dates found.</p>
                )}
              </div>

              {/* Keywords */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Keywords & Topic Domains
                    </h3>
                    <p className="text-xs text-slate-400">Core themes and vocabulary</p>
                  </div>
                </div>

                {document.keywords && document.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {document.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No keywords extracted.</p>
                )}
              </div>
            </div>

            {/* 5. Detailed Summary */}
            {document.detailed_summary && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Detailed Document Analysis
                    </h2>
                    <p className="text-xs text-slate-400">
                      In-depth breakdown of contents and structural sections
                    </p>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-2">
                  {document.detailed_summary}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Deep Information Finder Modal */}
      {infoFinderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-dropdown border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <SearchCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Important Information Finder
                  </h3>
                  <p className="text-xs text-slate-400">Structured entities, statistics, and decisions</p>
                </div>
              </div>
              <button
                onClick={() => setInfoFinderOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {infoFinderLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Analyzing document for key entities, decisions, and metrics...</p>
                </div>
              ) : importantInfo ? (
                <div className="space-y-5 text-xs">
                  {/* Decisions Made */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-emerald-600 dark:text-emerald-400">
                      Decisions & Approvals
                    </h4>
                    <div className="space-y-1.5">
                      {importantInfo.decisions_made?.map((d, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300">
                          • {d}
                        </div>
                      )) || <p className="text-slate-400">None detected.</p>}
                    </div>
                  </div>

                  {/* Key Metrics and Stats */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-brand-600 dark:text-brand-400">
                      Key Metrics & Quantitative Stats
                    </h4>
                    <div className="space-y-1.5">
                      {importantInfo.key_metrics_and_stats?.map((m, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 text-slate-700 dark:text-slate-300">
                          • {m}
                        </div>
                      )) || <p className="text-slate-400">None detected.</p>}
                    </div>
                  </div>

                  {/* Names and Entities */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-indigo-600 dark:text-indigo-400">
                      Identified Names & Organizations
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {importantInfo.names_and_entities?.map((name, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {name}
                        </span>
                      )) || <p className="text-slate-400">None detected.</p>}
                    </div>
                  </div>

                  {/* Conclusions */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 text-purple-600 dark:text-purple-400">
                      Conclusions & Directives
                    </h4>
                    <div className="space-y-1.5">
                      {importantInfo.conclusions?.map((c, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 text-slate-700 dark:text-slate-300">
                          • {c}
                        </div>
                      )) || <p className="text-slate-400">None detected.</p>}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInfoFinderOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

