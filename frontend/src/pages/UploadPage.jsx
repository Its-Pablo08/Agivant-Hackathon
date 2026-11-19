import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ArrowRight, 
  Play, 
  Loader2, 
  FileText,
  Trash2,
  Table
} from 'lucide-react';
import dataGuardAPI from '../services/api';

export default function UploadPage({ 
  onUploadSuccess, 
  onRunAnalysis, 
  analyzing, 
  activeDataset,
  onLoadSample 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file (.csv format only).');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const data = await dataGuardAPI.uploadFile(file);
      setFilePreview(data);
      onUploadSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload CSV. Please verify file integrity.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dataset Ingestion & Validation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload any CSV dataset up to 10,000+ records. DataGuard AI will validate format, inspect columns, and prepare automated profiling.
        </p>
      </div>

      {/* One-Click Hackathon Sample Ingestion Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Official Hackathon Practice Dataset Ready
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Instant one-click access to <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[11px]">online_store_orders.csv</code> (500 orders with 24 planted data quality anomaly groups).
            </p>
          </div>
        </div>
        <button
          onClick={onLoadSample}
          disabled={uploading || analyzing}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-400 transition-all shrink-0 disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          <span>Load Hackathon Dataset</span>
        </button>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[0.99]'
            : 'border-slate-300 bg-white hover:border-brand-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 shadow-sm mb-4">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <UploadCloud className="h-8 w-8" />
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {uploading ? 'Validating and Uploading CSV...' : 'Click to Browse or Drag & Drop CSV'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Supports UTF-8, Latin-1, Excel-exported CSV files up to 25MB.
        </p>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
          <span>Max ~10,000 rows recommended</span>
          <span>•</span>
          <span>Automatic schema inference</span>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File Preview Card (If loaded) */}
      {(filePreview || activeDataset) && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {filePreview?.filename || activeDataset?.filename}
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Ready for Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {(filePreview?.total_rows || activeDataset?.total_rows)?.toLocaleString()} total rows • {(filePreview?.total_columns || activeDataset?.total_columns)} columns detected
              </p>
            </div>

            <button
              onClick={() => onRunAnalysis((filePreview?.dataset_id || activeDataset?.id))}
              disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/30 hover:bg-brand-500 transition-all disabled:opacity-50 shrink-0"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Profiling & Scanning Dataset...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run Full Quality Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Table Preview */}
          {filePreview?.preview && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sample Record Preview (First 5 Rows):
              </span>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      {filePreview.columns.map((col, idx) => (
                        <th key={idx} className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filePreview.preview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        {filePreview.columns.map((col, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : '<empty>'}
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
