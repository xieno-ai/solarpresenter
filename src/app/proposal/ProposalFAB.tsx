'use client';
import { useState } from 'react';

const ITEMS = [
  {
    label: 'NAIT Study: Snow Impact on Solar',
    href: 'https://drive.google.com/file/d/1gIknvdnlDEpoJxM9DOMsT3mkgR76Zfs4/view?usp=sharing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h8l4 4v8H4V4z" stroke="#fff" strokeWidth="1.75" strokeLinejoin="round"/>
        <path d="M12 4v4h4" stroke="#fff" strokeWidth="1.75" strokeLinejoin="round"/>
        <path d="M7 10h6M7 13h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Watch Hail Test',
    href: 'https://drive.google.com/file/d/1eGb2WDqYwZ-1JNTLzo4Vmi_xYX-fyOnF/view?usp=share_link',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="7,4 17,10 7,16" fill="#fff"/>
      </svg>
    ),
  },
  {
    label: 'Solar Club',
    href: 'https://solarclub.ca',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#fff" strokeWidth="2"/>
        <ellipse cx="10" cy="10" rx="3.5" ry="7" stroke="#fff" strokeWidth="1.5"/>
        <path d="M3 10h14" stroke="#fff" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Solar Offset Calculator',
    href: 'https://www.solaroffset.ca/calculator',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="#fff" strokeWidth="1.75"/>
        <rect x="6" y="5" width="8" height="3" rx="1" fill="#fff"/>
        <circle cx="6.5" cy="11.5" r="1" fill="#fff"/>
        <circle cx="10" cy="11.5" r="1" fill="#fff"/>
        <circle cx="13.5" cy="11.5" r="1" fill="#fff"/>
        <circle cx="6.5" cy="14.5" r="1" fill="#fff"/>
        <circle cx="10" cy="14.5" r="1" fill="#fff"/>
        <circle cx="13.5" cy="14.5" r="1" fill="#fff"/>
      </svg>
    ),
  },
];

const downloadIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 3v10M6 9l4 4 4-4" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16h12" stroke="#fff" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const spinnerIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="10" cy="10" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
    <path d="M10 3a7 7 0 0 1 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export function ProposalFAB({ d, customerName }: { d: string; customerName: string }) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    setIsGenerating(true);
    setPdfError(null);
    try {
      const response = await fetch(`/api/pdf?d=${encodeURIComponent(d)}`, {
        signal: AbortSignal.timeout(35000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const lastName = customerName.trim().split(/\s+/).pop() ?? 'Customer';
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `NorthernNRG_${lastName}_${date}.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setPdfError('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      {/* Keyframes for spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Backdrop — click to close */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9990,
          }}
        />
      )}

      {/* FAB container */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.75rem',
        }}
      >
        {/* Speed dial items — Download PDF first (top), then link items */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.75rem',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {/* Download PDF — primary action at top of speed dial */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'none',
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              padding: 0,
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
              transition: 'opacity 220ms ease 0ms, transform 220ms ease 0ms',
            }}
          >
            {/* Label pill */}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1a2b3c',
                background: '#ffffff',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
                whiteSpace: 'nowrap',
              }}
            >
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </span>

            {/* Icon button */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--nrg-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0,121,63,0.35)',
                flexShrink: 0,
                opacity: isGenerating ? 0.75 : 1,
              }}
            >
              {isGenerating ? spinnerIcon : downloadIcon}
            </div>
          </button>

          {/* Link items */}
          {ITEMS.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
                transition: `opacity 220ms ease ${(i + 1) * 55}ms, transform 220ms ease ${(i + 1) * 55}ms`,
              }}
            >
              {/* Label pill */}
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1a2b3c',
                  background: '#ffffff',
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>

              {/* Icon button */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--nrg-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,121,63,0.35)',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
            </a>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open quick links'}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--nrg-green)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,121,63,0.4)',
            transition: 'transform 250ms ease, box-shadow 250ms ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          {/* Plus / X icon */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <line x1="11" y1="3" x2="11" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="3" y1="11" x2="19" y2="11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Error pill — rendered below FAB when PDF generation fails */}
      {pdfError && (
        <div
          style={{
            position: 'fixed',
            bottom: '6.5rem',
            right: '2rem',
            zIndex: 9999,
            background: '#df584d',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            padding: '0.4rem 0.85rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            maxWidth: '220px',
            textAlign: 'center',
          }}
        >
          {pdfError}
        </div>
      )}
    </>
  );
}
