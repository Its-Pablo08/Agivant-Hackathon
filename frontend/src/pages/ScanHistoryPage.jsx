import React from 'react';
import { 
  History, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Database 
} from 'lucide-react';

export default function ScanHistoryPage({ datasets = [], onSelectDataset, onNavigate }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dataset Scan History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Catalog of all datasets stored in SQLite. Select any previous dataset to review its profile, detected issues, and score card.
        </p>
      </div>

      {/* History Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Dataset ID</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Columns</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {datasets && datasets.length > 0 ? (
                datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-brand-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{d.filename}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {d.id.slice(0, 12)}...
                    </td>
                    <td className="py-3.5 px-4 font-medium">{d.total_rows}</td>
                    <td className="py-3.5 px-4 font-medium">{d.total_columns}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.analysis_status === 'analyzed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {d.analysis_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {d.uploaded_at ? d.uploaded_at.replace('T', ' ').slice(0, 16) : 'Recently'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectDataset(d.id);
                          onNavigate('overview');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No datasets recorded yet. Upload a CSV to get started.
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
