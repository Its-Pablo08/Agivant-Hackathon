import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Layers, 
  HelpCircle, 
  FileCode, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  Hash,
  ShieldAlert
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Anomalies' },
  { id: 'Missing Values', label: '1. Missing Values' },
  { id: 'Duplicate Records', label: '2. Duplicate Records' },
  { id: 'Numerical Outliers & Impossible Values', label: '3. Outliers & Impossible Values' },
  { id: 'Inconsistent Values', label: '4. Inconsistent Values' },
];

export default function AnomalyDetectionPage({ issues = [], activeDataset }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const filteredIssues = activeCategory === 'all' 
    ? issues 
    : issues.filter((iss) => iss.category === activeCategory);

  const toggleExpand = (id) => {
    setExpandedIssueId(expandedIssueId === id ? null : id);
  };

  const copyToClipboard = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Anomaly Detection Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic audit of {issues.length} defect signatures across 4 data quality categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
            {issues.reduce((acc, i) => acc + (i.issue_count || 0), 0)} Total Anomaly Occurrences
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {CATEGORIES.map((tab) => {
          const count = tab.id === 'all' 
            ? issues.length 
            : issues.filter((i) => i.category === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeCategory === tab.id
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            return (
              <div
                key={issue.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Main Header Row */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => toggleExpand(issue.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mt-0.5">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {issue.column_name}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getSeverityBadge(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          [{issue.category}]
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                        {issue.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-12 sm:pl-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {issue.issue_count} rows
                      </div>
                      <div className="text-[10px] font-medium text-slate-400">
                        Affected records
                      </div>
                    </div>
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Business Impact */}
                      <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                          Business Impact
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {issue.business_impact}
                        </p>
                      </div>

                      {/* Recommended Fix */}
                      <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                          Recommended Action
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {issue.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Sample Original Values */}
                    {issue.original_values && issue.original_values.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1.5">
                          Detected Sample Anomalies:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {issue.original_values.map((v, i) => (
                            <span 
                              key={i}
                              className="rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[11px] font-mono text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                            >
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Affected Row Indices */}
                    {issue.affected_rows && issue.affected_rows.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                          Affected Row Indices (Excel line matching):
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono break-words bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                          Rows: {issue.affected_rows.slice(0, 30).join(', ')}
                          {issue.affected_rows.length > 30 && ` ... and ${issue.issue_count - 30} more`}
                        </div>
                      </div>
                    )}

                    {/* Python Pandas Code Snippet */}
                    {issue.cleaning_code && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <FileCode className="h-3.5 w-3.5 text-brand-600" />
                            <span>Suggested Pandas Cleaning Code:</span>
                          </span>
                          <button
                            onClick={() => copyToClipboard(issue.id, issue.cleaning_code)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                          >
                            {copiedCodeId === issue.id ? (
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
                        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed">
                          <code>{issue.cleaning_code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No anomalies found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
