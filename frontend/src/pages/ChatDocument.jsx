import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  FileText,
  HelpCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';

export default function ChatDocument() {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('doc');

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || '');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI document intelligence assistant. Select a document and ask me anything about its findings, decisions, or deadlines.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await api.get('/documents');
      setDocuments(res.data);
      if (!selectedDocId && res.data.length > 0) {
        setSelectedDocId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load documents.', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  const currentDocument = documents.find((d) => d.id.toString() === selectedDocId);

  const handleSendMessage = async (msgToSend = inputMessage) => {
    const text = msgToSend.trim();
    if (!text || !selectedDocId) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const history = messages.filter((m) => m.role !== 'system');
      const res = await api.post(`/documents/${selectedDocId}/chat`, {
        message: text,
        history: history,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.message }]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to query document.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${detail}` }
      ]);
      addToast(detail, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleSendMessage(question);
  };

  const sampleQuestions = [
    "What are the primary conclusions of this document?",
    "List all specific deadlines and required dates mentioned.",
    "What decisions or approvals were agreed upon?",
    "Who are the key people or stakeholders involved?",
  ];

  if (loadingDocs) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Chat With Document
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ask targeted questions and receive strictly grounded answers from your uploaded files.
          </p>
        </div>
        <EmptyState
          title="No documents to chat with"
          description="Upload a document first so the AI can answer your questions."
          actionLabel="Upload Document"
          onAction={() => window.location.href = '/upload'}
          icon={FileText}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Header and Document Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Chat & Precision Q&A</span>
          </h1>
          <p className="text-xs text-slate-400">
            Answers are strictly grounded in document context without hallucinations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Document:
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setMessages([
                {
                  role: 'assistant',
                  content: `Switched context to document. What would you like to know about it?`
                }
              ]);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 max-w-xs"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-brand-600 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-indigo-900'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Suggested:
        </span>
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleQuickQuestion(q)}
            disabled={sending}
            className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask anything about "${currentDocument?.filename || 'the document'}"...`}
          disabled={sending}
          className="flex-1 px-4 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-all shadow-sm shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

