import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Eye, 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  ArrowRight,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import dataGuardAPI from '../services/api';

const AVAILABLE_OPERATIONS = [
  {
    id: 'deduplicate_exact',
    title: '1. Remove Exact Duplicate Rows',
    desc: 'Eliminates 100% duplicate row copies while keeping the first recorded instance.',
    category: 'Duplicates'
  },
  {
    id: 'fix_arithmetic_totals',
    title: '2. Correct Arithmetic Mismatches in Total Amount',
    desc: 'Recomputes total_amount = quantity * unit_price where blank or calculated incorrectly.',
    category: 'Outliers & Math'
  },
  {
    id: 'standardize_cities',
    title: '3. Standardize City Names & Official Designations',
    desc: 'Maps obsolete names (Bombay->Mumbai, Bangalore->Bengaluru, Madras->Chennai, Calcutta->Kolkata, Gurgaon->Gurugram) and strips irregular whitespace.',
    category: 'Inconsistencies'
  },
  {
    id: 'standardize_categories',
    title: '4. Harmonize Product Category Taxonomy',
    desc: 'Corrects singular/plural forms (Book->Books, Electronic->Electronics) and casing (SPORTS->Sports, home & kitchen).',
    category: 'Inconsistencies'
  },
  {
    id: 'standardize_payment_methods',
    title: '5. Standardize Payment Gateway Terms',
    desc: 'Normalizes abbreviations: COD / C.O.D -> Cash on Delivery, CC / CreditCard -> Credit Card, netbanking -> Net Banking.',
    category: 'Inconsistencies'
  },
  {
    id: 'clean_phones',
    title: '6. Sanitize Phone Numbers to 10-Digit Mobile',
    desc: 'Strips country codes (+91), hyphens, negative signs, and scientific notation to produce clean mobile numbers.',
    category: 'Inconsistencies'
  },
  {
    id: 'clean_names',
    title: '7. Title-Case & Clean Customer Names',
    desc: 'Fixes ALL-CAPS names, lowercase names, and collapses multiple whitespace characters into clean single spaces.',
    category: 'Inconsistencies'
  },
  {
    id: 'clean_emails',
    title: '8. Fix Email Syntax Typos',
    desc: 'Replaces double @@ with @, double dots with single dot, and removes trailing spaces from email addresses.',
    category: 'Inconsistencies'
  },
  {
    id: 'standardize_dates',
    title: '9. Standardize Dates to ISO 8601 (YYYY-MM-DD)',
    desc: 'Converts mixed date formats (M/D/YYYY, 28-Aug-26) to standard YYYY-MM-DD and fixes non-existent 2026-02-30 calendar dates.',
    category: 'Inconsistencies'
  },
  {
    id: 'clamp_ratings',
    title: '10. Enforce Customer Rating Scale [1 - 5]',
    desc: 'Clamps anomalous ratings like 0 or 10 into the valid 1-to-5 star business scale.',
    category: 'Outliers & Math'
  }
];

export default function CleaningPage({ activeDataset, onDownloadCleaned }) {
  const [selectedOps, setSelectedOps] = useState([
    'deduplicate_exact',
    'fix_arithmetic_totals',
    'standardize_cities',
    'standardize_categories',
    'standardize_payment_methods',
    'clean_phones',
    'clean_names',
    'clean_emails',
    'standardize_dates',
    'clamp_ratings'
  ]);
  const [previewData, setPreviewData] = useState(null);
  const [previewingOp, setPreviewingOp] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  const toggleOp = (id) => {
    if (selectedOps.includes(id)) {
      setSelectedOps(selectedOps.filter((item) => item !== id));
    } else {
      setSelectedOps([...selectedOps, id]);
    }
  };

  const handlePreview = async (opId) => {
    if (!activeDataset) return;
    setPreviewingOp(opId);
    try {
      const data = await dataGuardAPI.previewCleaning(activeDataset.id, opId);
      setPreviewData(data);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setPreviewingOp(null);
    }
  };

  const handleApplyCleaning = async () => {
    if (!activeDataset || selectedOps.length === 0) return;
    setCleaning(true);
    try {
      const res = await dataGuardAPI.applyCleaning(activeDataset.id, selectedOps);
      setCleanResult(res);
    } catch (err) {
      console.error('Cleaning failed:', err);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Data Cleaning & Remediation Pipeline</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select verified remediation rules to execute on a copy of {activeDataset?.filename || 'dataset'}.
        </p>
      </div>

      {/* Non-Destructive Guarantee Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="text-xs">
          <span className="font-bold text-emerald-900 dark:text-emerald-200">Non-Destructive Architecture Guarantee:</span>{' '}
          <span className="text-emerald-800 dark:text-emerald-300">
            Original uploaded datasets are strictly immutable. All transformations are applied to an isolated copy, generating a fresh, audit-verified cleaned CSV file.
          </span>
        </div>
      </div>

      {/* Cleaning Operations Selector */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Approved Cleaning Transformations ({selectedOps.length}/{AVAILABLE_OPERATIONS.length} Selected)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Toggle the rules you want included in the remediation pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOps(AVAILABLE_OPERATIONS.map((o) => o.id))}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setSelectedOps([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {AVAILABLE_OPERATIONS.map((op) => {
            const isSelected = selectedOps.includes(op.id);
            return (
              <div
                key={op.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 ${
                  isSelected
                    ? 'border-brand-200 bg-brand-50/30 dark:border-brand-900/60 dark:bg-brand-950/20'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOp(op.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{op.title}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500 dark:bg-slate-800">
                        {op.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{op.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => handlePreview(op.id)}
                  disabled={previewingOp === op.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0 self-start sm:self-auto"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{previewingOp === op.id ? 'Previewing...' : 'Preview Diff'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {selectedOps.length} cleaning operations configured.
          </div>
          <button
            onClick={handleApplyCleaning}
            disabled={cleaning || selectedOps.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/30 hover:bg-brand-500 transition-all disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{cleaning ? 'Applying Clean Pipeline...' : 'Execute Cleaning Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Preview Diff Modal / Card */}
      {previewData && (
        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Operation Preview: {previewData.operation}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {previewData.description} • {previewData.affected_count} records affected
              </p>
            </div>
            <button
              onClick={() => setPreviewData(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Close Preview ✕
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Column</th>
                  <th className="py-2.5 px-3">Original Value (Before)</th>
                  <th className="py-2.5 px-3">Cleaned Value (After)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {previewData.sample_diffs.map((diff, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                      Row {diff.row_number}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      {diff.column}
                    </td>
                    <td className="py-2 px-3 text-rose-600 font-mono">
                      {diff.before}
                    </td>
                    <td className="py-2 px-3 text-emerald-600 font-mono font-bold">
                      {diff.after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clean Success Results Card */}
      {cleanResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Cleaned Dataset Successfully Generated!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Original records: {cleanResult.original_rows} → Cleaned records: {cleanResult.cleaned_rows} ({cleanResult.original_rows - cleanResult.cleaned_rows} exact duplicate rows pruned).
                </p>
              </div>
            </div>

            <a
              href={`/api/export/cleaned/${activeDataset?.id}`}
              download="cleaned_dataset.csv"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Download Cleaned CSV</span>
            </a>
          </div>

          {/* Sample Cleaned Rows Table */}
          {cleanResult.preview && cleanResult.preview.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Sample Cleaned Records:
              </span>
              <div className="mt-1.5 overflow-x-auto rounded-xl border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-100/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      {Object.keys(cleanResult.preview[0]).map((col) => (
                        <th key={col} className="py-2 px-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {cleanResult.preview.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.keys(cleanResult.preview[0]).map((col) => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap">
                            {String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
