---
phase: 07-bill-extraction
plan: 03
subsystem: bill-extractor-ui
tags: [ui, bill-extraction, file-upload, clipboard, loading-state]
dependency_graph:
  requires: [07-01, 07-02]
  provides: [bill-extractor-page]
  affects: [src/app/bill/page.tsx]
tech_stack:
  added: []
  patterns: [phase-state-machine, drag-and-drop, clipboard-fallback, step-loading-indicator]
key_files:
  created:
    - src/app/bill/page.tsx
  modified: []
decisions:
  - CopyButton uses navigator.clipboard with execCommand fallback for non-HTTPS environments
  - Loading indicator mirrors SunPitchTab step pattern exactly (5 steps, 2500ms interval)
  - Phase state machine (upload/loading/results) drives full UI swap rather than conditional overlays
  - Monthly kWh rendered as 6-column grid (2 rows of 6 months) for compact display
  - Drag-over state uses isDragging boolean with amber highlight treatment
requirements-completed: [INPUT-04, INPUT-05]
metrics:
  duration_minutes: 17
  completed_date: "2026-03-04"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
status: complete
---

# Phase 7 Plan 03: Bill Extractor UI Summary

**One-liner:** Full-featured bill upload page with drag-and-drop, 5-step Gemini loading indicator, and per-field copy buttons across all 7 extracted fields.

## What Was Built

`src/app/bill/page.tsx` — a `'use client'` component implementing the complete Bill Extractor page at `/bill`.

### Phase State Machine

Three phases drive the entire UI:
- `upload` — drag-and-drop zone with file input, client-side validation
- `loading` — 5-step progress indicator with animated spinner and cycling status
- `results` — results card showing all 7 extracted fields with copy buttons

### Upload UI
- Drop zone with drag-over amber highlight treatment
- Hidden `<input type="file">` triggered by click or drop
- Client-side checks before any network call:
  - File size > 4MB → amber error: "File too large — please use a file under 4 MB."
  - Invalid MIME → amber error: "Unsupported file type. Please upload a PDF, JPG, PNG, or HEIC file."

### Loading UI
- Mirrors SunPitchTab exactly: 5 steps, 2500ms interval via `useRef<setInterval>`
- Step states: completed (checkmark amber + strikethrough), current (amber pulse dot + amber text), future (small gray dot + gray text)
- animate-spin SVG spinner with amber stroke

### Results Card
- Status badge: emerald "Complete" or amber "Partial"
- "Copy all as text" — generates `Label: value` pairs for all non-null fields
- 3 sections rendered in `bg-neutral-900` card:
  1. **Consumption** — Annual kWh, Monthly kWh (6-column grid with month abbrs, "X of 12 months found" note)
  2. **Rates** — All-in Rate (¢/kWh), Energy Rate (¢/kWh)
  3. **Account** — Provider, Account Holder, Service Address
- Each field: amber "Not found" badge when null, CopyButton when non-null
- Re-upload button resets to upload phase

### CopyButton
- Primary: `navigator.clipboard.writeText()`
- Fallback: creates hidden `<input>`, `select()`, `document.execCommand('copy')` for non-HTTPS environments
- "Copied!" state for 1500ms, then resets

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/app/bill/page.tsx` created (655 lines)
- [x] TypeScript compiles: `npx tsc --noEmit` — no errors
- [x] Contains `'use client'`
- [x] Phase state machine: upload/loading/results
- [x] All 7 field groups rendered
- [x] CopyButton with clipboard fallback
- [x] Re-upload button
- [x] Commit `65c9e1d` exists

## Self-Check: PASSED

## Verification

Human verification passed all 6 checks (Task 2 checkpoint approved):
- Landing page shows two tool cards, old smoke test content gone
- /proposal redirects to /enter; /proposal?d=... renders proposal viewer (no redirect)
- /bill upload UI renders with drag-and-drop zone
- File size and MIME type errors shown client-side before any network call
- Extraction flow: 5-step loading indicator → results card with copy buttons
- TypeScript / `npm run build` completes without errors

## Plan Complete
