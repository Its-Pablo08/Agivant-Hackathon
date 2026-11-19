import React, { useState } from 'react';
import { 
  Table2, 
  Search, 
  Filter, 
  Hash, 
  Calendar, 
  Type, 
  CheckCircle, 
  AlertCircle, 
  BarChart2, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export default function ProfilingPage({ profileData, activeDataset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const columns = profileData?.columns || [];

  const filteredColumns = columns.filter((col) => {
    const matchesSearch = col.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || col.semantic_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'integer':
      case 'float':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'datetime':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'categorical':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dataset Column Profiling</h1>
          <p className="text-xs text-slate-500 mt-1">
            Statistical characterization across {columns.length} columns in {activeDataset?.filename || 'dataset'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {profileData?.total_rows || activeDataset?.total_rows} Total Rows
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {profileData?.exact_duplicates || 0} Exact Duplicates
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search column by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Semantic Types</option>
            <option value="integer">Integer</option>
            <option value="float">Float</option>
            <option value="categorical">Categorical</option>
            <option value="datetime">Datetime</option>
            <option value="text">Text</option>
          </select>
        </div>
      </div>

      {/* Column Profiling Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredColumns.map((col, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{col.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getTypeBadge(col.semantic_type)}`}>
                    {col.semantic_type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  dtype: <code className="font-mono text-slate-600 dark:text-slate-300">{col.data_type}</code> • {col.unique_count} distinct values
                </div>
              </div>

              {/* Missing Badge */}
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {col.missing_count} missing
                </div>
                <div className={`text-[10px] font-semibold ${col.missing_percentage > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {col.missing_percentage}% of total
                </div>
              </div>
            </div>

            {/* Missing Value Progress Bar */}
            <div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${col.missing_percentage > 5 ? 'bg-amber-500' : col.missing_percentage > 0 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.max(2, 100 - col.missing_percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Completeness: {roundNumber(100 - col.missing_percentage)}%</span>
                <span>{col.total_records - col.missing_count} valid records</span>
              </div>
            </div>

            {/* Numeric Stats (if numeric) */}
            {(col.semantic_type === 'integer' || col.semantic_type === 'float') && col.min !== null && (
              <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Min</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{col.min}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Max</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{col.max}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Mean</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{col.mean}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Median</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{col.median}</div>
                </div>
              </div>
            )}

            {/* Mini Histogram (if numeric) */}
            {col.histogram && col.histogram.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Distribution Histogram:
                </span>
                <div className="h-20 w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={col.histogram} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Frequent Values */}
            {col.top_values && col.top_values.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Most Frequent Values:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {col.top_values.map((v, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <span className="truncate max-w-[120px]">{v.value || '<empty>'}</span>
                      <span className="rounded bg-slate-200/80 px-1 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {v.count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Distinct Samples */}
            {col.sample_distinct && col.sample_distinct.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sample Distinct Values:
                </span>
                <div className="mt-1 text-[11px] text-slate-500 font-mono truncate">
                  {col.sample_distinct.join(', ')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function roundNumber(num) {
  return Math.round(num * 10) / 10;
}
