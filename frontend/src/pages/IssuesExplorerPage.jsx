import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  FileCode, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Hash,
  Wrench,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Issues' },
  { id: 'Missing Values', label: 'Missing Values' },
  { id: 'Duplicate Records', label: 'Duplicates' },
  { id: 'Numerical Outliers & Impossible Values', label: 'Outliers & Math' },
  { id: 'Inconsistent Values', label: 'Inconsistencies' },
];

export default function IssuesExplorerPage({ 
  issues = [], 
  activeDataset, 
  initialCategory = 'all', 
  initialSeverity = 'all',
  onNavigate 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedSeverity, setSelectedSeverity] = useState(initialSeverity || 'all');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedRowsId, setCopiedRowsId] = useState(null);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialSeverity) setSelectedSeverity(initialSeverity);
  }, [initialCategory, initialSeverity]);

  // Filter issues
  const filtered = issues.filter((iss) => {
    const matchesSearch = 
      iss.column_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iss.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || iss.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || iss.severity === selectedSeverity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const totalAnomalies = filtered.reduce((acc, i) => acc + (i.issue_count || 1), 0);

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyRows = (id, rows) => {
    if (!rows || rows.length === 0) return;
    navigator.clipboard.writeText(rows.join(', '));
    setCopiedRowsId(id);
    setTimeout(() => setCopiedRowsId(null), 2000);
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Detected Issues & Anomalies</h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspecting {issues.length} detected defect patterns across {activeDataset?.filename || 'dataset'}.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('cleaning')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500 transition-all shrink-0"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Open Cleaning Pipeline</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map(cat => {
          const count = cat.id === 'all' 
            ? issues.length 
            : issues.filter(i => i.category === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search column or issue description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <span className="text-xs text-slate-400">
            {filtered.length} issues ({totalAnomalies} occurrences)
          </span>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((issue) => {
            const isExpanded = expandedId === issue.id;
            const rows = issue.affected_rows || [];

            return (
              <div
                key={issue.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3.5 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      {issue.column_name}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {issue.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {issue.issue_count} affected records
                    </span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Explanation & Recommendation */}
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Problem Details</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{issue.explanation}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Recommended Fix</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{issue.recommendation}</p>
                  </div>
                </div>

                {/* Sample Original Values */}
                {issue.original_values && issue.original_values.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Sample Values Detected:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {issue.original_values.map((v, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-amber-800 font-mono text-[11px] dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                        >
                          {v === '' ? '"" (empty string)' : String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affected Excel Rows & Code (Visible when expanded or always compact) */}
                {rows.length > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Hash className="h-3 w-3 text-brand-500" />
                        <span>Affected Excel Row Numbers ({rows.length} total):</span>
                      </span>
                      <button
                        onClick={() => copyRows(issue.id, rows)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                      >
                        {copiedRowsId === issue.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600">Copied {rows.length} rows</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Row Numbers</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      {rows.slice(0, isExpanded ? 200 : 25).map((rowNum) => (
                        <span
                          key={rowNum}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-medium border border-slate-200/80 dark:border-slate-700"
                        >
                          Row #{rowNum}
                        </span>
                      ))}
                      {!isExpanded && rows.length > 25 && (
                        <button
                          onClick={() => setExpandedId(issue.id)}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold hover:underline"
                        >
                          +{rows.length - 25} more rows
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Pandas Code Block */}
                {issue.cleaning_code && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <FileCode className="h-3 w-3 text-brand-500" />
                        <span>Remediation Python Code:</span>
                      </span>
                      <button
                        onClick={() => copyCode(issue.id, issue.cleaning_code)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                      >
                        {copiedId === issue.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      <code>{issue.cleaning_code}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No issues match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
