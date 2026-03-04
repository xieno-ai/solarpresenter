'use client';

import { useState, useEffect, useRef } from 'react';
import type { ExtractedBillFields, ExtractBillResult } from '@/lib/bill/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MESSAGES = [
  'Uploading bill...',
  'Reading document...',
  'Extracting usage data...',
  'Extracting rate information...',
  'Finalizing results...',
];

const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'upload' | 'loading' | 'results';

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for non-HTTPS or browsers without clipboard API
      try {
        const input = document.createElement('input');
        input.value = value;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Silent fallback failure
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 shrink-0 px-2 py-0.5 text-xs rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all duration-150"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({ label, value, copyValue }: { label: string; value: string | null; copyValue?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-400 shrink-0 mr-4">{label}</span>
      <div className="flex items-center justify-end flex-1 min-w-0">
        {value !== null ? (
          <>
            <span className="text-sm text-neutral-100 truncate">{value}</span>
            <CopyButton value={copyValue ?? value} />
          </>
        ) : (
          <span className="bg-amber-400/10 text-amber-400 rounded px-2 py-0.5 text-xs">
            Not found
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2 pb-1">
      <span className="text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

// ─── Month Chip ───────────────────────────────────────────────────────────────

function MonthChip({ month, value }: { month: string; value: number | null }) {
  const [flash, setFlash] = useState(false);

  async function handleCopy() {
    if (value === null) return;
    try {
      await navigator.clipboard.writeText(String(value));
    } catch {
      try {
        const input = document.createElement('input');
        input.value = String(value);
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      } catch { /* silent */ }
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={value === null}
      title={value !== null ? `Copy ${value.toLocaleString()}` : undefined}
      style={{
        transition: 'background-color 600ms ease-out',
        backgroundColor: flash ? 'rgba(251,191,36,0.18)' : undefined,
      }}
      className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 ${
        value !== null
          ? 'bg-neutral-800/60 hover:bg-neutral-700/80 cursor-pointer active:scale-95'
          : 'bg-neutral-800/30 cursor-default'
      }`}
    >
      <span className="text-[9px] font-mono text-neutral-500 uppercase">{month}</span>
      <span className={`text-xs font-medium ${value !== null ? 'text-neutral-200' : 'text-neutral-600'}`}>
        {value !== null ? value.toLocaleString() : '—'}
      </span>
    </button>
  );
}

// ─── Results Card ─────────────────────────────────────────────────────────────

function ResultsCard({
  result,
  onReupload,
}: {
  result: ExtractBillResult;
  onReupload: () => void;
}) {
  // Pure error case — no fields at all
  if (result.status === 'error' && result.fields === null) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-amber-400/5 border border-amber-400/20">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-amber-300">
                {result.message ?? 'Could not extract data from this document.'}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onReupload}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-150"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 5 17 10" />
            <line x1="12" y1="5" x2="12" y2="15" />
          </svg>
          Try re-uploading
        </button>
      </div>
    );
  }

  const fields = result.fields as ExtractedBillFields;

  // Build "copy all as text" string (skip null fields)
  function buildCopyAllText(): string {
    const lines: string[] = [];

    if (fields.annualKwh !== null) {
      lines.push(`Annual kWh: ${fields.annualKwh.toLocaleString()} kWh`);
    }
    if (fields.monthlyKwh !== null) {
      const months = fields.monthlyKwh
        .map((v, i) => `${MONTH_ABBRS[i]}: ${v !== null ? v.toLocaleString() : '—'}`)
        .join(', ');
      lines.push(`Monthly kWh: ${months}`);
    }
    if (fields.allInRateCentsPerKwh !== null) {
      lines.push(`All-in Rate: ${fields.allInRateCentsPerKwh.toFixed(1)} ¢/kWh`);
    }
    if (fields.energyRateCentsPerKwh !== null) {
      lines.push(`Energy Rate: ${fields.energyRateCentsPerKwh.toFixed(1)} ¢/kWh`);
    }
    if (fields.utilityProvider !== null) {
      lines.push(`Provider: ${fields.utilityProvider}`);
    }
    if (fields.accountHolderName !== null) {
      lines.push(`Account Holder: ${fields.accountHolderName}`);
    }
    if (fields.serviceAddress !== null) {
      lines.push(`Service Address: ${fields.serviceAddress}`);
    }
    return lines.join('\n');
  }

  async function handleCopyAll() {
    const text = buildCopyAllText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Silent fallback failure
      }
    }
  }

  // Monthly kWh grid
  const monthlyGrid = fields.monthlyKwh !== null ? (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1.5">
        {fields.monthlyKwh.map((val, i) => (
          <MonthChip key={i} month={MONTH_ABBRS[i]} value={val} />
        ))}
      </div>
      <p className="text-xs text-neutral-600">
        {fields.monthlyKwh.filter((v) => v !== null).length} of 12 months found
      </p>
    </div>
  ) : null;

  const isPartial = result.status === 'partial';

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-neutral-100">Extracted Bill Data</h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              isPartial
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
            }`}
          >
            {isPartial ? 'Partial' : 'Complete'}
          </span>
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy all as text
          </button>
        </div>
      </div>

      {/* Fields card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">

        {/* Consumption section */}
        <SectionHeader title="Consumption" />

        {/* Annual kWh */}
        <FieldRow
          label="Annual kWh"
          value={fields.annualKwh !== null ? `${fields.annualKwh.toLocaleString()} kWh` : null}
        />

        {/* Monthly kWh — custom row with grid */}
        <div className="py-2.5 border-b border-neutral-800">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm text-neutral-400">Monthly kWh</span>
            {fields.monthlyKwh === null && (
              <span className="bg-amber-400/10 text-amber-400 rounded px-2 py-0.5 text-xs">
                Not found
              </span>
            )}
          </div>
          {monthlyGrid}
        </div>

        {/* Rates section */}
        <SectionHeader title="Rates" />

        <FieldRow
          label="All-in Rate"
          value={fields.allInRateCentsPerKwh !== null ? `${fields.allInRateCentsPerKwh.toFixed(1)} ¢/kWh` : null}
          copyValue={fields.allInRateCentsPerKwh !== null ? (fields.allInRateCentsPerKwh / 100).toFixed(3) : undefined}
        />
        <FieldRow
          label="Energy Rate"
          value={fields.energyRateCentsPerKwh !== null ? `${fields.energyRateCentsPerKwh.toFixed(1)} ¢/kWh` : null}
          copyValue={fields.energyRateCentsPerKwh !== null ? (fields.energyRateCentsPerKwh / 100).toFixed(3) : undefined}
        />

        {/* Account section */}
        <SectionHeader title="Account" />

        <FieldRow label="Provider" value={fields.utilityProvider} />
        <FieldRow label="Account Holder" value={fields.accountHolderName} />
        <FieldRow label="Service Address" value={fields.serviceAddress} />
      </div>

      {/* Re-upload button */}
      <button
        type="button"
        onClick={onReupload}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 hover:border-neutral-600 transition-all duration-150"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 5 17 10" />
          <line x1="12" y1="5" x2="12" y2="15" />
        </svg>
        Re-upload
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillPage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [result, setResult] = useState<ExtractBillResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cycle status messages while loading
  useEffect(() => {
    if (phase === 'loading') {
      setStatusIndex(0);
      intervalRef.current = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
      }, 2500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    setUploadError(null);

    for (const file of arr) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        setUploadError('Unsupported file type. Please upload PDF, JPG, PNG, or HEIC files.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds 4 MB — please use a smaller file.`);
        return;
      }
    }

    setQueuedFiles((prev) => {
      // Deduplicate by name+size
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...arr.filter((f) => !existing.has(`${f.name}:${f.size}`))];
    });
  }

  function removeFile(index: number) {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleExtract() {
    if (queuedFiles.length === 0) return;
    setPhase('loading');
    setUploadError(null);

    const formData = new FormData();
    for (const file of queuedFiles) {
      formData.append('file', file);
    }

    try {
      const res = await fetch('/api/extract-bill', {
        method: 'POST',
        body: formData,
      });
      const data: ExtractBillResult = await res.json();
      setResult(data);
      setPhase('results');
    } catch {
      setResult({ status: 'error', fields: null, message: 'Network error — check your connection.' });
      setPhase('results');
    }
  }

  function handleReupload() {
    setResult(null);
    setQueuedFiles([]);
    setPhase('upload');
    setUploadError(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  return (
    <div className="bg-neutral-950 min-h-screen">
      {/* Top bar */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          All Tools
        </a>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Upload phase ── */}
        {phase === 'upload' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-widest">
                  Bill Extractor
                </span>
              </div>
              <h1 className="text-3xl font-bold text-neutral-100 leading-tight">
                Upload a Utility Bill
              </h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Upload one or more pages of a customer&rsquo;s utility bill to extract usage data, rates,
                and account info — ready to copy into your proposal tools.
              </p>
            </div>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-neutral-900 border rounded-xl cursor-pointer transition-all duration-150 ${
                isDragging
                  ? 'border-amber-400/60 bg-amber-400/5'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-4 py-12 px-8">
                <svg
                  className={`w-10 h-10 transition-colors duration-150 ${isDragging ? 'text-amber-400' : 'text-neutral-600'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>

                <div className="text-center space-y-1">
                  <p className={`text-base font-medium transition-colors duration-150 ${isDragging ? 'text-amber-300' : 'text-neutral-300'}`}>
                    {queuedFiles.length > 0 ? 'Add more pages' : 'Drag & drop your bill here'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    or <span className="text-amber-400 underline underline-offset-2">click to browse</span>
                  </p>
                </div>

                <p className="text-xs text-neutral-600">
                  PDF, JPG, PNG, HEIC &mdash; up to 4 MB each
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Queued files list */}
            {queuedFiles.length > 0 && (
              <div className="space-y-2">
                {queuedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <svg className="w-4 h-4 shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-sm text-neutral-300 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-neutral-600 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleExtract}
                  className="w-full mt-2 py-3 rounded-xl bg-amber-400 text-neutral-950 text-sm font-semibold hover:bg-amber-300 active:scale-[0.98] transition-all duration-150"
                >
                  Extract Bill{queuedFiles.length > 1 ? ` (${queuedFiles.length} files)` : ''}
                </button>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="p-4 rounded-lg bg-amber-400/5 border border-amber-400/20">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-sm text-amber-300">{uploadError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading phase ── */}
        {phase === 'loading' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-widest">
                  Bill Extractor
                </span>
              </div>
              <h1 className="text-3xl font-bold text-neutral-100 leading-tight">
                Analyzing Bill
              </h1>
            </div>

            {/* Progress panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
              {/* Current status row */}
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin w-4 h-4 shrink-0 text-amber-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-sm text-neutral-300">
                  {STATUS_MESSAGES[statusIndex]}
                </span>
              </div>

              {/* Step list */}
              <div className="space-y-2 border-t border-neutral-800 pt-4">
                {STATUS_MESSAGES.map((msg, i) => {
                  const isCompleted = i < statusIndex;
                  const isCurrent = i === statusIndex;
                  const isFuture = i > statusIndex;

                  return (
                    <div key={msg} className="flex items-center gap-2.5">
                      {/* Step indicator */}
                      {isCompleted && (
                        <svg
                          className="w-3.5 h-3.5 shrink-0 text-amber-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {isCurrent && (
                        <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </span>
                      )}
                      {isFuture && (
                        <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                        </span>
                      )}

                      {/* Step label */}
                      <span
                        className={`text-xs leading-snug ${
                          isCompleted
                            ? 'text-neutral-500 line-through'
                            : isCurrent
                              ? 'text-amber-400 font-medium'
                              : 'text-neutral-700'
                        }`}
                      >
                        {msg}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Time note */}
              <p className="text-xs text-neutral-600 border-t border-neutral-800 pt-3">
                Extraction typically takes 5&ndash;15 seconds
              </p>
            </div>
          </div>
        )}

        {/* ── Results phase ── */}
        {phase === 'results' && result && (
          <ResultsCard result={result} onReupload={handleReupload} />
        )}
      </div>
    </div>
  );
}
