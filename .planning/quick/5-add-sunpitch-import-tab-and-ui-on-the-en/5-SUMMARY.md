---
phase: quick-5
plan: 5
subsystem: enter-ui
tags: [ui, sunpitch, import, ux]
dependency_graph:
  requires: []
  provides: [polished-sunpitch-import-panel]
  affects: [src/app/enter]
tech_stack:
  added: []
  patterns: [step-list-progress, card-input-pattern, conditional-render-loading]
key_files:
  created: []
  modified:
    - src/app/enter/components/SunPitchTab.tsx
decisions:
  - "Hide import button during loading and replace with step-list progress panel — cleaner than showing both simultaneously"
  - "Progress panel uses conditional class ternary for step state (completed/current/future) — single map() render, no extra state"
  - 'Add "Try a different URL" text link inside error panel to clear scrapeError without page reload'
  - "URL input uses font-[family-name:var(--font-mono)] for monospace rendering — matches existing --font-mono CSS variable convention"
metrics:
  duration: 5
  completed_date: "2026-03-04T16:16:10Z"
  tasks_completed: 1
  files_modified: 1
---

# Phase Quick-5: Add SunPitch Import Tab and UI on the Enter Page — Summary

**One-liner:** Replaced bare URL input in SunPitchTab with a structured import panel — header eyebrow, URL input card, animated 7-step progress panel, and error reset link — while preserving all fetch/validation logic.

## What Was Built

The SunPitch import tab on `/enter` previously showed a minimal URL text field with no context about what to paste or what would happen. This task replaced the JSX entirely with a polished, purposeful import panel:

### Header Section
- Amber dot + monospace "AUTOMATED IMPORT" eyebrow label
- Bold 1.5rem "Import from SunPitch" headline (text-neutral-100)
- Descriptive sub-copy explaining what the system extracts (text-neutral-500)

### URL Input Card
- Wrapped in `bg-neutral-900 border border-neutral-800 rounded-xl p-5` container
- "PROPOSAL URL" label in uppercase tracking-wider text-neutral-400
- Input uses `py-3 px-4` (larger than before) with `font-[family-name:var(--font-mono)]` for URL rendering
- Inline red validation error preserved below input
- Helper text showing expected URL format in mono text-neutral-600

### Import Button
- Full-width on mobile (`w-full sm:w-auto`), amber fill, `py-3 px-6`
- Download SVG icon + "Import Data" text preserved
- **Hidden during loading** — replaced by the progress panel

### Progress Panel (loading state)
- `bg-neutral-900 border border-neutral-800 rounded-xl p-5` card
- Top row: amber spinning SVG + current `STATUS_MESSAGES[statusIndex]` text
- Step list: maps all 7 STATUS_MESSAGES with three visual states:
  - **Completed** (i < statusIndex): amber check SVG + line-through text-neutral-500
  - **Current** (i === statusIndex): amber pulsing dot + amber text-amber-400 font-medium
  - **Future** (i > statusIndex): dim dot + text-neutral-700
- Footer note: "SunPitch proposals typically take 10–60 seconds to process."
- `intervalRef` cycling (every 2500ms) drives `statusIndex` — fully preserved

### Error Panel
- Preserved existing amber warning design (bg-amber-400/5, border-amber-400/20)
- Added "Try a different URL" text link below the error message
- Clicking calls `setScrapeError(null)` — resets to idle state

## Logic Preserved (Unchanged)
- `validateSunPitchUrl(url)` pre-flight validation
- `fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }) })`
- `result.status === 'error'` check — shows error, does NOT call onImportSuccess
- All state variables: `url`, `isLoading`, `urlError`, `scrapeError`, `statusIndex`
- `intervalRef` + `useEffect` for status cycling
- `handleUrlChange` clearing both error states on input change

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- `src/app/enter/components/SunPitchTab.tsx` — FOUND
- Commit `48fc6a7` — FOUND
- `npx tsc --noEmit` — zero errors

## Self-Check: PASSED
