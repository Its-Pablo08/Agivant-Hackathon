import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  FileCode, 
  Copy, 
  Check, 
  AlertTriangle, 
  Lightbulb, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Cpu
} from 'lucide-react';
import dataGuardAPI from '../services/api';

export default function AIRecommendationsPage({ 
  aiInsights, 
  activeDataset, 
  onRefreshAI, 
  loadingAI 
}) {
  const [copiedId, setCopiedId] = useState(null);

  const insights = aiInsights || {
    source: 'rule_based_fallback',
    executive_summary: 'Automated scan detected data quality vulnerabilities requiring sanitation.',
    prioritized_actions: [],
    column_explanations: {},
    enhanced_issues: []
  };

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">AI Explanations & Cleaning Rules</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              insights.source === 'gemini_api'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
            }`}>
              <Sparkles className="h-3 w-3" />
              <span>{insights.source === 'gemini_api' ? 'Gemini AI Active' : 'Rule-Based Engine'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            LLM business impact analysis and production-tested Python pandas remediation rules.
          </p>
        </div>

        <button
          onClick={onRefreshAI}
          disabled={loadingAI}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
          <span>{loadingAI ? 'Re-analyzing...' : 'Regenerate Insights'}</span>
        </button>
      </div>

      {/* Executive Summary Card */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-6 shadow-sm dark:border-brand-900/50 dark:bg-gradient-to-br dark:from-brand-950/40 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-900 dark:text-brand-200">
            Executive Summary for Decision Makers
          </h3>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {insights.executive_summary}
        </p>
      </div>

      {/* Prioritized Action Plan */}
      {insights.prioritized_actions && insights.prioritized_actions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Prioritized Remediation Roadmap
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {insights.prioritized_actions.map((act, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
              >
                <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Business Purpose Dictionary */}
      {insights.column_explanations && Object.keys(insights.column_explanations).length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Column Business Semantics Dictionary
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {Object.entries(insights.column_explanations).map(([col, desc]) => (
              <div 
                key={col}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <div className="font-bold text-slate-900 dark:text-white font-mono text-[11px] mb-1">
                  {col}
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Snippets List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Production Pandas Cleaning Snippets
        </h3>

        {insights.enhanced_issues && insights.enhanced_issues.length > 0 ? (
          insights.enhanced_issues.slice(0, 8).map((item) => (
            <div
              key={item.issue_id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.column}
                    </span>
                    <span className="text-xs text-slate-400">({item.category})</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {item.recommendation}
                  </p>
                </div>
                <button
                  onClick={() => copyCode(item.issue_id, item.cleaning_code)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 self-start sm:self-auto shrink-0"
                >
                  {copiedId === item.issue_id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {item.cleaning_code && (
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3.5 font-mono text-[11px] text-emerald-400 leading-relaxed">
                  <code>{item.cleaning_code}</code>
                </pre>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No cleaning snippets available. Run dataset analysis first.
          </div>
        )}
      </div>
    </div>
  );
}
