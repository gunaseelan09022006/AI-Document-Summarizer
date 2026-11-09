import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  File,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState(null);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];
  const MAX_FILE_SIZE_MB = 25;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorDetails(null);
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorDetails({
        title: 'Unsupported File Format',
        message: `.${ext} files are not supported. Please upload a PDF, DOCX, or TXT file.`
      });
      addToast('Unsupported file type.', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorDetails({
        title: 'File Too Large',
        message: `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
      });
      addToast('File too large.', 'error');
      return;
    }

    if (file.size === 0) {
      setErrorDetails({
        title: 'Empty Document',
        message: 'The selected file is empty (0 bytes). Please upload a file containing text.'
      });
      addToast('File is empty.', 'error');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(20);
    setErrorDetails(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadProgress(50);
      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setUploadProgress(100);
      addToast('Document uploaded and parsed successfully!', 'success');
      // Redirect to the summary detail page for this document
      navigate(`/summary/${res.data.id}`);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      const detail = err.response?.data?.detail || 'Document upload failed. Please try again.';

      // Check if it's a scanned PDF error
      if (err.response?.status === 422 && detail.toLowerCase().includes('scanned document')) {
        setErrorDetails({
          title: 'Scanned Document Detected (OCR Required)',
          message: detail,
          isScanned: true
        });
      } else {
        setErrorDetails({
          title: 'Upload Failed',
          message: detail
        });
      }
      addToast(detail, 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Upload Document
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload PDF, DOCX, or TXT documents to extract structured executive summaries, dates, and action items.
        </p>
      </div>

      {/* Error alert banner */}
      {errorDetails && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-4 text-rose-900 dark:text-rose-100 animate-slide-in">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-bold text-sm">{errorDetails.title}</h4>
            <p className="text-xs text-rose-800/90 dark:text-rose-200/90 leading-relaxed">
              {errorDetails.message}
            </p>
            {errorDetails.isScanned && (
              <div className="mt-2 text-[11px] p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-800/60 text-slate-700 dark:text-slate-300">
                <strong>Tip:</strong> The document does not contain an embedded digital text layer. To analyze this document, ensure OCR (Optical Character Recognition) has been performed, or convert it to a searchable PDF.
              </div>
            )}
          </div>
          <button
            onClick={() => setErrorDetails(null)}
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Drag and drop your document here, or <span className="text-brand-600 dark:text-brand-400 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Supports PDF, DOCX, and TXT files up to {MAX_FILE_SIZE_MB}MB
          </p>

          <div className="flex items-center gap-2 mt-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              PDF
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              DOCX
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              TXT
            </span>
          </div>
        </div>
      </div>

      {/* Selected File Card */}
      {selectedFile && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatFileSize(selectedFile.size)} • {selectedFile.name.split('.').pop().toUpperCase()}
                </p>
              </div>
            </div>

            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Extracting & Parsing Document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-brand-500/25 flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upload & Analyze Document</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Security and Processing Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Untrusted Input Isolation</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Files are parsed safely with PyMuPDF & python-docx; scripts are never executed.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Scanned Document Detection</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Instant heuristic detection for non-searchable or scanned PDF image files.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Strict Data Privacy</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Documents are secured under your user account with JWT authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

