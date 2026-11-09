import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Sparkles,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

export default function CompareDocs() {
  const [documents, setDocuments] = useState([]);
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await api.get('/documents');
      setDocuments(res.data);
      if (res.data.length >= 2) {
        setDoc1Id(res.data[0].id.toString());
        setDoc2Id(res.data[1].id.toString());
      } else if (res.data.length === 1) {
        setDoc1Id(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load documents for comparison.', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCompare = async () => {
    if (!doc1Id || !doc2Id) {
      addToast('Please select two documents to compare.', 'error');
      return;
    }
    if (doc1Id === doc2Id) {
      addToast('Please select two different documents to compare.', 'error');
      return;
    }

    setComparing(true);
    setResult(null);

    try {
      const res = await api.post('/documents/compare', {
        doc_id_1: parseInt(doc1Id),
        doc_id_2: parseInt(doc2Id),
      });
      setResult(res.data);
      addToast('Documents compared successfully!', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to compare documents.';
      addToast(detail, 'error');
    } finally {
      setComparing(false);
    }
  };

  if (loadingDocs) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (documents.length < 2) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Compare Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compare two documents side-by-side to discover mutual themes, variances, and strategic differences.
          </p>
        </div>
        <EmptyState
          title="At least 2 documents required"
          description="Please upload at least two documents into your account to perform comparative analysis."
          actionLabel="Upload Documents"
          onAction={() => window.location.href = '/upload'}
          icon={GitCompare}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Document Comparison
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Synthesize mutual themes, variances, and alignment points between any two documents in your repository.
        </p>
      </div>

      {/* Selectors Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Doc 1 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Primary Document (Document 1)
            </label>
            <div className="relative">
              <select
                value={doc1Id}
                onChange={(e) => setDoc1Id(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-brand-500 font-medium"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.id.toString() === doc2Id}>
                    {d.filename} ({d.document_type || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doc 2 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comparative Document (Document 2)
            </label>
            <div className="relative">
              <select
                value={doc2Id}
                onChange={(e) => setDoc2Id(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-brand-500 font-medium"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.id.toString() === doc1Id}>
                    {d.filename} ({d.document_type || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCompare}
            disabled={comparing || doc1Id === doc2Id}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-brand-500/25 flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {comparing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Comparative Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compare Both Documents</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparing && (
        <div className="space-y-4">
          <SkeletonLoader count={2} type="summary" />
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-slide-in">
          {/* Executive Comparative Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Comparative Executive Summary
                </h3>
                <p className="text-xs text-slate-400">
                  Comparing "{result.doc1_title}" vs "{result.doc2_title}"
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-2 font-medium">
              {result.comparison_summary}
            </p>
          </div>

          {/* Similarities & Differences side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Similarities */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Key Similarities & Alignments
                  </h4>
                  <p className="text-xs text-slate-400">Shared concepts and mutual goals</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {result.key_similarities?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    • {item}
                  </div>
                )) || <p className="text-xs text-slate-400">No major similarities noted.</p>}
              </div>
            </div>

            {/* Differences */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Key Differences & Divergences
                  </h4>
                  <p className="text-xs text-slate-400">Contrasting scopes, metrics, and tactics</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {result.key_differences?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    • {item}
                  </div>
                )) || <p className="text-xs text-slate-400">No major differences noted.</p>}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Strategic Next Steps & Recommendations
                  </h4>
                  <p className="text-xs text-slate-400">How to reconcile and leverage both documents</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                  >
                    👉 {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

