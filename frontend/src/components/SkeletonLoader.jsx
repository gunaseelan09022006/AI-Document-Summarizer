import React from 'react';

export default function SkeletonLoader({ count = 3, type = 'card' }) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-3 w-2/3">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-6"></div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2 w-1/3">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'summary') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
          <div className="h-3.5 bg-slate-100 dark:bg-slate-800/80 rounded w-full"></div>
          <div className="h-3.5 bg-slate-100 dark:bg-slate-800/80 rounded w-5/6"></div>
          <div className="h-3.5 bg-slate-100 dark:bg-slate-800/80 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-full"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-3/4"></div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-full"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

