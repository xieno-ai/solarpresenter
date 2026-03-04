'use client';

import { useState, useEffect, useRef } from 'react';
import { validateSunPitchUrl } from '@/lib/scraper/url-validator';
import type { ScrapeResult } from '@/lib/scraper/types';

const STATUS_MESSAGES = [
  'Opening SunPitch proposal...',
  'Extracting customer information...',
  'Reading system specifications...',
  'Extracting monthly production data...',
  'Extracting consumption data...',
  'Reading financing terms...',
  'Finalizing import...',
];

interface SunPitchTabProps {
  onImportSuccess: (result: ScrapeResult) => void;
}

export function SunPitchTab({ onImportSuccess }: SunPitchTabProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle status messages during loading
  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading]);

  function handleUrlChange(value: string) {
    setUrl(value);
    if (urlError) setUrlError(null);
    if (scrapeError) setScrapeError(null);
  }

  async function handleImport() {
    // Client-side URL validation
    const validationError = validateSunPitchUrl(url);
    if (validationError) {
      setUrlError(validationError);
      return;
    }

    setIsLoading(true);
    setScrapeError(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result: ScrapeResult = await response.json();

      if (result.status === 'error') {
        setScrapeError(result.message ?? 'Failed to import data from SunPitch.');
      } else {
        onImportSuccess(result);
      }
    } catch {
      setScrapeError('Network error — check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* URL input area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-300">
          SunPitch Proposal URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://app.sunpitch.com/facing/proposals/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          disabled={isLoading}
          className={`w-full bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:opacity-50 disabled:cursor-not-allowed ${
            urlError
              ? 'border-red-500/60 focus:border-red-500/60'
              : 'border-neutral-700 focus:border-neutral-600'
          }`}
        />
        {urlError && (
          <p className="text-xs text-red-400 mt-1">{urlError}</p>
        )}
        <p className="text-xs text-neutral-500">
          Paste your SunPitch proposal link to auto-fill all fields. You can review and edit any value after import.
        </p>
      </div>

      {/* Import button */}
      <button
        type="button"
        onClick={handleImport}
        disabled={isLoading}
        className="flex items-center gap-2.5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-950 text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm"
      >
        {isLoading ? (
          <>
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
            <span className="text-neutral-400">{STATUS_MESSAGES[statusIndex]}</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import Data
          </>
        )}
      </button>

      {/* Scrape error panel */}
      {scrapeError && (
        <div className="p-4 rounded-lg bg-amber-400/5 border border-amber-400/20">
          <div className="flex items-start gap-3">
            <svg
              className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
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
            <p className="text-sm text-amber-300">{scrapeError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
