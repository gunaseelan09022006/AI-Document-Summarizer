import React from 'react';
import { FileQuestion } from 'lucide-react';

export default function EmptyState({
  title = "No data found",
  description = "Get started by uploading your first document or creating a record.",
  actionLabel,
  onAction,
  icon: Icon = FileQuestion
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-brand-500/20 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

