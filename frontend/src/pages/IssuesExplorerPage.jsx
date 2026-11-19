import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function IssuesExplorerPage({ issues = [], activeDataset, initialCategory = 'all', initialSeverity = 'all' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedSeverity, setSelectedSeverity] = useState(initialSeverity || 'all');
  const [sortBy, setSortBy] = useState('count_desc');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedRowsId, setCopiedRowsId] = useState(null);

  React.useEffect(() => {
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

  // Sort issues
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'count_desc') return b.issue_count - a.issue_count;
    if (sortBy === 'count_asc') return a.issue_count - b.issue_count;
    if (sortBy === 'severity') {
      const order = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
      return (order[a.severity] || 5) - (order[b.severity] || 5);
    }
    return 0;
  });

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Issues Explorer</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search, filter, and inspect verified data quality defects across {activeDataset?.filename || 'dataset'}.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search column or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">All Categories</option>
          <option value="Missing Values">Missing Values</option>
          <option value="Duplicate Records">Duplicate Records</option>
          <option value="Numerical Outliers & Impossible Values">Outliers & Impossible</option>
          <option value="Inconsistent Values">Inconsistent Values</option>
        </select>

        {/* Severity */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="count_desc">Sort: Affected Count (High → Low)</option>
          <option value="count_asc">Sort: Affected Count (Low → High)</option>
          <option value="severity">Sort: Severity Hierarchy</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Column</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Count</th>
                <th className="py-3 px-4">Explanation</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {sorted.length > 0 ? (
                sorted.map((issue) => {
                  const isExp = expandedId === issue.id;
                  return (
                    <React.Fragment key={issue.id}>
                      <tr 
                        onClick={() => setExpandedId(isExp ? null : issue.id)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {issue.column_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {issue.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {issue.issue_count} rows
                        </td>
                        <td className="py-3 px-4 max-w-md truncate text-slate-500" title={issue.explanation}>
                          {issue.explanation}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                            {isExp ? 'Hide' : 'Expand'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row details */}
                      {isExp && (
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                          <td colSpan={6} className="p-4 space-y-4">
                            {/* Affected Row Numbers Section */}
                            {issue.affected_rows && issue.affected_rows.length > 0 && (
                              <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                      Affected Excel Row Numbers ({issue.issue_count} rows total):
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(issue.affected_rows.join(', '));
                                      setCopiedRowsId(issue.id);
                                      setTimeout(() => setCopiedRowsId(null), 2000);
                                    }}
                                    className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                  >
                                    {copiedRowsId === issue.id ? 'Copied Rows!' : 'Copy Row Numbers'}
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                                  {issue.affected_rows.map((rowNum, rIdx) => (
                                    <span
                                      key={rIdx}
                                      className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                                    >
                                      Row #{rowNum}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sample Anomalies vs Recommended Values */}
                            {issue.original_values && issue.original_values.length > 0 && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1.5">
                                  Sample Detected Problematic Values:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {issue.original_values.map((val, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="rounded bg-white/80 px-2 py-1 text-xs font-mono text-amber-900 border border-amber-200 dark:bg-slate-900 dark:text-amber-300 dark:border-amber-800"
                                    >
                                      {String(val)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] block mb-1">
                                  Business Impact
                                </span>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {issue.business_impact}
                                </p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] block mb-1">
                                  Recommended Fix
                                </span>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {issue.recommendation}
                                </p>
                              </div>
                            </div>

                            {issue.cleaning_code && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold uppercase text-slate-500">
                                    Pandas Cleaning Snippet:
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyCode(issue.id, issue.cleaning_code);
                                    }}
                                    className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                  >
                                    {copiedId === issue.id ? 'Copied!' : 'Copy Code'}
                                  </button>
                                </div>
                                <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                                  <code>{issue.cleaning_code}</code>
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No issues match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
