import React, { useState } from 'react';
import { 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ExternalLink,
  Cpu,
  Layers,
  Save,
  Check
} from 'lucide-react';
import dataGuardAPI from '../services/api';

export default function SettingsPage({ geminiStatus, onStatusChange }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await dataGuardAPI.updateGeminiKey(apiKeyInput.trim());
      setFeedback({
        type: res.status === 'success' ? 'success' : 'warning',
        message: res.message
      });
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to update Gemini API key.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Settings & AI Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Google Gemini API connection credentials, models, and fallback rule parameters.
        </p>
      </div>

      {/* Primary Key Input Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Gemini API Key</h3>
            <p className="text-xs text-slate-500">
              Powers automated business explanations, executive summaries, and intelligent cleaning rules.
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Current Status:</span>
            {geminiStatus?.gemini_configured ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected ({geminiStatus.masked_key})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Using Rule-Based Fallback Engine (No API key set)</span>
              </span>
            )}
          </div>
          <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-mono text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            Model: {geminiStatus?.model || 'gemini-1.5-flash'}
          </span>
        </div>

        {/* Form to update key */}
        <form onSubmit={handleSaveKey} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Enter or Update Google Gemini API Key:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !apiKeyInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500 transition-all disabled:opacity-50 shrink-0"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Testing & Saving...' : 'Save & Verify Key'}</span>
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : feedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Guide: Where to apply API key */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Where to apply your Gemini Key</h3>
        
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Method 1: Direct in the Application (Recommended)</span>
            Paste your key into the input box above and click "Save & Verify Key". It takes effect immediately without needing to restart the server.
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Method 2: In the .env file</span>
            Open <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">backend/.env</code> in your editor and add:
            <pre className="mt-2 p-2 rounded bg-slate-900 text-emerald-400 font-mono text-[11px]">
              GEMINI_API_KEY=AIzaSyYourActualGeminiKeyHere
            </pre>
          </div>

          <div className="flex items-center gap-1.5 pt-2 text-brand-600 dark:text-brand-400 font-semibold">
            <ExternalLink className="h-3.5 w-3.5" />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Get a Free Gemini API key from Google AI Studio →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
