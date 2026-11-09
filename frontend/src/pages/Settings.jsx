import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  User,
  HardDrive
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setSystemInfo(res.data.system_info);
    } catch (err) {
      console.error(err);
      addToast('Failed to load system settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System & AI Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your AI model providers, view environment status, and inspect system limits.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              User Profile & Authentication
            </h3>
            <p className="text-xs text-slate-400">JWT-secured user account session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Full Name
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {user?.full_name || 'Not specified'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* AI Provider Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Large Language Model (LLM) Integration
            </h3>
            <p className="text-xs text-slate-400">Modular provider architecture (Gemini & OpenAI)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Provider</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {systemInfo?.active_provider || 'Detecting...'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Google Gemini Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Google Gemini</span>
                {systemInfo?.has_gemini_key ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Key Not Set
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Recommended for fast, multi-modal hierarchical document summarization and precision grounded Q&A.
              </p>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-1"
              >
                <span>Get free Gemini API Key</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* OpenAI Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">OpenAI</span>
                {systemInfo?.has_openai_key ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Key Not Set
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Modular support for OpenAI GPT-4o-mini and GPT-4o structured JSON response formats.
              </p>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-1"
              >
                <span>OpenAI Platform</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* How to add key guide */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>How to Configure Your LLM API Key:</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Open <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold">backend/.env</code> in your editor and paste your key into:
            </p>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl font-mono text-[11px] text-brand-700 dark:text-brand-300 border border-indigo-100 dark:border-indigo-900 overflow-x-auto">
              GEMINI_API_KEY="AIzaSyYourActualKeyHere"
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              No frontend exposure: API keys are securely read by FastAPI backend environment variables only.
            </p>
          </div>
        </div>
      </div>

      {/* System Limits & Specifications */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Specifications & Limits
            </h3>
            <p className="text-xs text-slate-400">Application thresholds and parsers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Max Upload Size
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {systemInfo?.max_upload_size_mb || 25} MB
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Supported Formats
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              PDF, DOCX, TXT
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Database Engine
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              SQLite (SQLAlchemy ORM)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

