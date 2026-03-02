import React from 'react';

export interface SectionCardProps {
  label: string;          // Section header label (e.g., "Customer Information")
  warning?: string;       // Amber non-blocking warning message (optional)
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ label, warning, children, className }: SectionCardProps) {
  return (
    <div className={`rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800/50">
        <span className="text-xs font-[family-name:var(--font-mono)] text-amber-400 uppercase tracking-widest">
          {label}
        </span>
      </div>

      {/* Warning banner — non-blocking, purely informational */}
      {warning && (
        <div className="px-6 py-3 bg-amber-400/5 border-b border-amber-400/20 flex items-start gap-3">
          <svg
            className="w-4 h-4 text-amber-400 mt-0.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-amber-300">{warning}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}
