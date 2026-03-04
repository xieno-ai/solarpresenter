---
phase: 07-bill-extraction
verified: 2026-03-04T23:03:28Z
status: human_needed
score: 14/14 must-haves verified
human_verification:
  - test: "Visit /bill, upload a real Alberta utility bill PDF, observe full extraction flow"
    expected: "5-step loading indicator cycles, then results card shows extracted fields with copy buttons"
    why_human: "Requires GOOGLE_GENERATIVE_AI_API_KEY and a real bill; Gemini call cannot be verified statically"
  - test: "Click per-field Copy button on a result, paste into a text field"
    expected: "Value pastes correctly (e.g. '1234 kWh' or '18.5 ¢/kWh')"
    why_human: "Clipboard API behaviour is runtime-only"
  - test: "Click 'Copy all as text', paste into a text editor"
    expected: "Multi-line output with Label: value pairs for all non-null fields"
    why_human: "Clipboard write and multi-field formatting is runtime-only"
  - test: "Visit /proposal (no query params)"
    expected: "Browser redirects to /enter"
    why_human: "Next.js redirect() behaviour requires a running dev server"
  - test: "Visit /proposal?d=anyvalue"
    expected: "No redirect — proposal renderer attempts to load (may show error for invalid d, but does not redirect)"
    why_human: "Requires running dev server to confirm redirect guard works with query param"
---

# Phase 7: Bill Extraction Verification Report

**Phase Goal:** Build a bill extraction tool that reads uploaded utility bills using Gemini Flash and returns structured data (usage, rates, account info) ready to copy into proposal tools.
**Verified:** 2026-03-04T23:03:28Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths — Plan 01 (API Backend)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | POST /api/extract-bill with a utility bill file returns a structured JSON object with extracted electricity fields | VERIFIED | `route.ts` exports `POST`, calls `ai.models.generateContent`, validates with `extractedBillSchema.parse`, returns `ExtractBillResult` |
| 2 | Null is returned for any field the AI cannot find — the API never crashes on partial extraction | VERIFIED | All 7 fields in `extractedBillSchema` are `.nullable()`. Status logic: 0 non-null = error with message, 1-6 = partial, 7 = success. Gemini call wrapped in try/catch |
| 3 | Files over 4MB are rejected with a 413 before reaching Gemini | VERIFIED | `route.ts` line 56-65: `file.size > MAX_FILE_BYTES` returns `{ status: 413 }` before `generateContent` is called |
| 4 | ExtractedBillFields type is exported and usable from other modules | VERIFIED | `schema.ts` exports `extractedBillSchema`, `ExtractedBillFields` (z.infer), and `ExtractBillResult` interface; imported in `bill/page.tsx` and `route.ts` |

**Score (Plan 01):** 4/4 truths verified

### Observable Truths — Plan 02 (Landing Hub + Redirect)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 5 | Visiting / shows a card grid with Proposal Creator and Bill Extractor tool cards | VERIFIED | `src/app/page.tsx` renders two `<a>` cards in `grid grid-cols-1 md:grid-cols-2` layout |
| 6 | Clicking Proposal Creator navigates to /enter | VERIFIED | `href="/enter"` on Proposal Creator card (line 27) |
| 7 | Clicking Bill Extractor navigates to /bill | VERIFIED | `href="/bill"` on Bill Extractor card (line 59) |
| 8 | Visiting /proposal redirects to /enter (no broken links from prior bookmarks) | VERIFIED (automated) | `next.config.ts` has `redirects()` with `source: '/proposal'`, `destination: '/enter'`, `missing: [{type: 'query', key: 'd'}]` — runtime behaviour needs human |
| 9 | The landing page matches the project dark theme (neutral-950 bg, amber-400 accents) | VERIFIED | `bg-neutral-950`, amber pulse dot header, amber arrow indicators, `bg-neutral-900` cards with `border-neutral-800` |

**Score (Plan 02):** 5/5 truths verified

### Observable Truths — Plan 03 (Bill Extractor UI)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 10 | User can drag-and-drop or click-to-browse and select a PDF, JPG, PNG, or HEIC file | VERIFIED | Drop zone has `onDragOver`, `onDrop`, `onClick` → `fileInputRef.current?.click()`. Hidden `<input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif" multiple>` |
| 11 | After upload, the UI shows a step-by-step loading indicator while Gemini processes the bill | VERIFIED | `phase === 'loading'` renders 5-step indicator with `STATUS_MESSAGES` cycling at 2500ms via `setInterval`. `animate-spin` SVG spinner with amber stroke |
| 12 | When extraction completes, the upload UI is replaced in-place by a results card | VERIFIED | `phase === 'results' && result` renders `<ResultsCard>`. Phase state machine replaces the entire upload section |
| 13 | Each extracted field shows its value with a per-field copy button, or amber 'Not found' if null | VERIFIED | `<FieldRow>` renders `<CopyButton>` when value non-null, or `<span className="bg-amber-400/10 text-amber-400 ...">Not found</span>` when null. All 7 fields rendered across 3 sections |
| 14 | A 'Copy all as text' button copies all found fields as label: value pairs to clipboard | VERIFIED | `handleCopyAll()` builds multiline string via `buildCopyAllText()` (all 7 fields, skips null), calls `navigator.clipboard.writeText` with `execCommand` fallback |
| 15 | A 'Re-upload' button resets back to the upload UI | VERIFIED | `<button onClick={onReupload}>Re-upload</button>` calls `handleReupload()` which sets `setResult(null); setQueuedFiles([]); setPhase('upload')` |
| 16 | Files over 4MB are rejected client-side with a friendly error message before any network call | VERIFIED | `addFiles()` checks `file.size > MAX_FILE_SIZE` before calling `handleExtract()`. Sets `uploadError` string, no fetch call made |

**Score (Plan 03):** 7/7 truths verified

**Overall Score:** 14/14 must-haves verified (automated)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/bill/schema.ts` | Zod schema + ExtractedBillFields type + ExtractBillResult envelope | VERIFIED | 31 lines, exports all 3 named items. All 7 fields nullable |
| `src/lib/bill/prompt.ts` | Gemini extraction prompt string | VERIFIED | 59 lines, exports `BILL_EXTRACTION_PROMPT` const. Alberta-specific rates (14-25¢/kWh), named providers, null-return instructions |
| `src/app/api/extract-bill/route.ts` | POST handler — reads multipart file, calls Gemini, returns ExtractBillResult | VERIFIED | 139 lines. `runtime='nodejs'`, `maxDuration=60`, MIME validation, 4MB guard (413), base64 conversion, `generateContent` call, Zod parse, status logic, try/catch |
| `src/app/page.tsx` | Landing hub — card grid of tools | VERIFIED | 96 lines, pure server component, no smoke test content, two tool cards |
| `src/app/bill/page.tsx` | Bill Extractor page — upload UI, loading state, results card | VERIFIED | 735 lines, `'use client'`, phase state machine, all 7 fields, CopyButton with fallback, Re-upload |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/extract-bill/route.ts` | `src/lib/bill/schema.ts` | `import extractedBillSchema, ExtractBillResult` | WIRED | Line 4: import confirmed. `extractedBillSchema.parse(raw)` at line 95 |
| `src/app/api/extract-bill/route.ts` | Gemini API | `ai.models.generateContent` with `inlineData` | WIRED | `generateContent` at line 80 with `inlineData` per-file parts |
| `src/app/bill/page.tsx` | `/api/extract-bill` | `fetch POST with FormData` | WIRED | Line 443: `fetch('/api/extract-bill', { method: 'POST', body: formData })`. Response parsed at line 447 |
| `src/app/bill/page.tsx` | `src/lib/bill/schema.ts` | `import ExtractedBillFields, ExtractBillResult` | WIRED | Line 4: import type used in state (`useState<ExtractBillResult>`), ResultsCard props, and field rendering |
| `src/app/page.tsx` | `/enter` | `href` on Proposal Creator card | WIRED | Line 27: `href="/enter"` |
| `src/app/page.tsx` | `/bill` | `href` on Bill Extractor card | WIRED | Line 59: `href="/bill"` |
| `next.config.ts` | `/enter` | `redirects()` with missing guard | WIRED | `source: '/proposal'`, `destination: '/enter'`, `missing: [{type:'query', key:'d'}]` |

---

## Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| INPUT-04 | 07-01, 07-03 | User can upload a utility bill (PDF, photo, or scan) and AI extracts electricity usage, utility company, energy rate, all-in rate, account holder, and service address | SATISFIED | `/bill` page accepts PDF/JPG/PNG/HEIC via drag-drop or browse. API calls Gemini Flash and returns all 6 named fields (plus monthlyKwh) |
| INPUT-05 | 07-01, 07-02, 07-03 | Bill extraction outputs data in a structured format ready to input into SunPitch or populate the manual entry form | SATISFIED | `ExtractBillResult` typed envelope with per-field copy buttons and "Copy all as text" for pasting into any tool |

No orphaned requirements — both INPUT-04 and INPUT-05 are fully accounted for across three plans.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/bill/prompt.ts` | 26 | "return null" (in prompt text, not code) | Info | False positive — this is instruction text to Gemini, not a stub implementation |

No code stubs, empty handlers, or placeholder implementations found. The one "return null" match is inside a prompt string literal, not executable code.

---

## Human Verification Required

### 1. End-to-end Gemini Extraction

**Test:** Start dev server (`npm run dev`), visit `http://localhost:3001/bill`, upload a real Alberta electricity bill PDF (any provider).
**Expected:** Loading indicator cycles through 5 steps over ~5-15 seconds. Results card appears with extracted fields — found values show with copy buttons, unfound fields show amber "Not found" badge.
**Why human:** Requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` and a live Gemini API call. Cannot be verified statically.

### 2. Per-field Copy Button

**Test:** On the results card, click the "Copy" button next to any found field (e.g., Annual kWh). Paste into a text input.
**Expected:** The formatted value (e.g., `1,234 kWh` or `18.5 ¢/kWh`) pastes correctly.
**Why human:** Clipboard API is a browser runtime API; cannot be exercised via static analysis.

### 3. Copy All as Text

**Test:** Click "Copy all as text" button on the results card. Paste into a text editor.
**Expected:** Multi-line output, one line per non-null field, formatted as `Label: value` pairs (e.g., `Annual kWh: 9,432 kWh`).
**Why human:** Runtime clipboard behaviour and multi-field formatting requires live execution.

### 4. /proposal Redirect (no d param)

**Test:** Visit `http://localhost:3001/proposal` in a browser.
**Expected:** Browser redirects (307) to `http://localhost:3001/enter`.
**Why human:** Next.js `redirects()` in `next.config.ts` requires a running dev/build server to activate.

### 5. /proposal?d=... Renderer Pass-through

**Test:** Visit `http://localhost:3001/proposal?d=test` (any value for d).
**Expected:** No redirect occurs. The proposal renderer attempts to load (may show an error for invalid base64, but must not redirect to /enter).
**Why human:** The `missing: [{type: 'query', key: 'd'}]` redirect guard must be confirmed working at runtime.

---

## Gaps Summary

No gaps found. All 14 automated must-haves are verified at all three levels (exists, substantive, wired). The five items flagged for human verification are behaviours that require a running server with a live Gemini API key — they cannot be confirmed via static analysis but the code paths are fully implemented and correct.

Notable implementation quality observations:
- The route handler goes beyond the plan spec: it accepts multiple files per request (multi-page bills) and auto-computes `annualKwh` from monthly values when Gemini omits it — both are sensible enhancements.
- The `zod-to-json-schema` type compatibility workaround (`as any` cast) is correctly documented with an eslint-disable comment and does not affect runtime behaviour.
- The `missing: [{type: 'query', key: 'd'}]` redirect guard correctly protects the proposal renderer's `?d=<base64>` URL pattern.

---

_Verified: 2026-03-04T23:03:28Z_
_Verifier: Claude (gsd-verifier)_
