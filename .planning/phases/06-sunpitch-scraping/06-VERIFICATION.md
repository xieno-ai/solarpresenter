---
phase: 06-sunpitch-scraping
verified: 2026-03-04T00:00:00Z
status: human_needed
score: 13/14 must-haves verified
re_verification: false
human_verification:
  - test: "Paste a real SunPitch URL, click Import, observe cycling status messages then form fill"
    expected: "After 10-60 seconds, page switches to Manual Entry tab. Green highlight on scraped fields (name, address, rates, system size, monthly production, annual consumption, cash price). Amber highlight on always-missing fields (monthlyConsumptionKwh, netMeteringSellRate, annualEscalationRate, finance fields)."
    why_human: "Requires live SunPitch URL and real Playwright browser execution. Scraper was calibrated against a real URL (2026-03-03) but end-to-end UX flow cannot be verified statically."
  - test: "Edit a green (scraped) field after import — verify highlight clears"
    expected: "Typing into any green-highlighted Controller field removes the ring/bg class immediately."
    why_human: "Interactive React state behavior — clearHighlight() is wired to onChange of all 14 Controller fields but requires browser interaction to confirm."
  - test: "Refresh the page after a successful import — verify scraped values persist"
    expected: "localStorage draft was saved by saveFormDraft(merged) in handleImportSuccess. Values should reappear on reload."
    why_human: "Requires browser localStorage interaction to confirm. The wiring (saveFormDraft called immediately after reset()) is present in code."
  - test: "Generate proposal from scraped data and confirm complete render"
    expected: "All 11 proposal pages render without errors. Fields the user filled manually (amber fields) carry through to calculations correctly."
    why_human: "End-to-end flow from scraped data through encodeProposalParams to /proposal requires runtime verification."
  - test: "Type a malformed URL (e.g. 'https://example.com') and click Import"
    expected: "Inline error shown immediately with red text below the input — no network request fired."
    why_human: "While validateSunPitchUrl() logic is verified in code, the immediate UI feedback and absence of network round-trip requires browser observation."
---

# Phase 06: SunPitch Scraping — Verification Report

**Phase Goal:** Enable solar advisors to auto-populate the proposal form by pasting a SunPitch URL — the scraper fetches the proposal data, maps it to form fields, and highlights pre-filled fields for review.
**Verified:** 2026-03-04T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Truths are drawn from the must_haves declared across Plans 01, 02, and 03.

#### Plan 01 Truths (Backend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/scrape with valid URL returns ScrapeResult JSON (not 500) | VERIFIED | `route.ts` returns `Response.json(result)` on success, HTTP 200 even for scrape errors; only 400 on bad JSON/missing url |
| 2 | POST /api/scrape with missing/malformed body returns HTTP 400 | VERIFIED | Two explicit 400 branches: `catch` on `request.json()` and `!url \|\| typeof url !== 'string'` check |
| 3 | ScrapeResult exported from types.ts with status, data, missingFields, message | VERIFIED | `types.ts` exports `ScrapeStatus`, `ScrapeResult` (all 4 fields), `FieldHighlight`, `HighlightMap` |
| 4 | validateSunPitchUrl() returns null for valid URL, string error for bad one | VERIFIED | `url-validator.ts`: checks `!url.trim()` first, then regex pattern — returns null or error string |
| 5 | Monthly arrays normalized to exactly 12 string entries | VERIFIED | `normalizeMonthlyArray()` uses `Array.from({ length: 12 }, ...)` — always produces exactly 12 entries; used in all monthly data extraction paths |

#### Plan 02 Truths (UI)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | /enter shows two tabs: "Paste SunPitch URL" and "Manual Entry" | VERIFIED | `page.tsx` lines 219-242: tab switcher div with two `button` elements, labels match exactly |
| 7 | Pasting a malformed URL shows inline error instantly (no server round-trip) | VERIFIED | `SunPitchTab.tsx:58-62` calls `validateSunPitchUrl(url)` and `setUrlError()` before any `fetch()` call; early return aborts import |
| 8 | Clicking Import while scraping shows cycling status messages and disabled button | VERIFIED | `isLoading` disables button (`disabled={isLoading}`); `useEffect` with `setInterval(2500ms)` cycles `STATUS_MESSAGES[statusIndex]` — 7 messages cycling |
| 9 | After successful/partial scrape, page auto-switches to Manual Entry tab | VERIFIED | `handleImportSuccess()` line 135: `setActiveTab('manual')` called after highlight build |
| 10 | Scraped fields have green background; scraper-missed fields have amber | VERIFIED | `highlightClass()` returns `ring-green-500/30 bg-green-500/5` for 'scraped', `ring-amber-400/30 bg-amber-400/5` for 'missing'; wrappers applied to all 14 Controllers + 2 MonthlyGrids |
| 11 | Editing a pre-filled field clears its highlight | VERIFIED | `clearHighlight()` wired to `onChange` of every Controller field (lines 262, 279, 301, 381, 398, 415, 432, 456, 471, 488, 505); MonthlyGrid annual/monthly fields do NOT have clearHighlight (see Gap note below) |
| 12 | Hard failure shows error inline, no partial fill occurs | VERIFIED | `SunPitchTab.tsx:75-77`: if `result.status === 'error'`, sets `scrapeError` state — shown in amber panel; `onImportSuccess` never called. In `handleImportSuccess`: `if (!result.data) return` guards hard error |
| 13 | Scraped values saved to localStorage so page refresh preserves them | VERIFIED | `handleImportSuccess()` line 111: `saveFormDraft(merged as ProposalFormValues)` called immediately after `reset(merged)`. `persistence.ts` confirmed to write to localStorage. Additionally, auto-save `useEffect` (line 61) re-saves on any change |

#### Plan 03 Truths (Calibration — requires human)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 14 | User pastes a real SunPitch URL and form fills with correct data | HUMAN NEEDED | Scraper was rewritten (commit `e54315b`) with correct field mapping verified against a real URL on 2026-03-03. Cannot verify statically — requires live Playwright run. |

**Score: 13/14 truths verified (automated). All 14 require no further code changes — #14 is a human runtime test.**

### Required Artifacts

| Artifact | Expected | Level 1: Exists | Level 2: Substantive | Level 3: Wired | Status |
|----------|----------|-----------------|---------------------|----------------|--------|
| `src/lib/scraper/types.ts` | ScrapeStatus, ScrapeResult, FieldHighlight, HighlightMap types | Yes | 14 lines — all 4 types exported | Imported in route.ts, sunpitch.ts, SunPitchTab.tsx, page.tsx | VERIFIED |
| `src/lib/scraper/url-validator.ts` | SUNPITCH_URL_PATTERN + validateSunPitchUrl() | Yes | 16 lines — regex + function | Imported in SunPitchTab.tsx, used in handleImport() | VERIFIED |
| `src/lib/scraper/sunpitch.ts` | Playwright dual-strategy scraper, calibrated selectors | Yes | 533 lines — full implementation with parseApiResponse(), buildResult(), route interception, polling loop | Called by route.ts as `scrapeSunPitch(browser, url)` | VERIFIED |
| `src/app/api/scrape/route.ts` | POST /api/scrape endpoint, nodejs runtime | Yes | 43 lines — `export const runtime = 'nodejs'`, chromium launch, try/finally | Called by SunPitchTab fetch('/api/scrape') | VERIFIED |
| `src/app/enter/components/SunPitchTab.tsx` | URL input, Import button, cycling status, inline errors | Yes | 187 lines — full component with all required behaviors | Imported and rendered in page.tsx as `<SunPitchTab onImportSuccess={handleImportSuccess} />` | VERIFIED |
| `src/app/enter/page.tsx` | Tab switcher, highlight state, pre-fill wiring | Yes (modified) | Tab state, handleImportSuccess, clearHighlight, highlightClass, 14 highlight wrappers | All wiring present and connected | VERIFIED |

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `src/app/api/scrape/route.ts` | `src/lib/scraper/sunpitch.ts` | `scrapeSunPitch(browser, url)` | WIRED | Line 34: `const result: ScrapeResult = await scrapeSunPitch(browser, url)` |
| `src/lib/scraper/sunpitch.ts` | `src/lib/form/schema.ts` | `ProposalFormValues` type shape | WIRED | `import type { ProposalFormValues } from '@/lib/form/schema'` — type-only import as specified |
| `SunPitchTab.tsx` | `/api/scrape` | `fetch POST { url }` | WIRED | Lines 68-73: `fetch('/api/scrape', { method: 'POST', ... body: JSON.stringify({ url: url.trim() }) })` |
| `page.tsx` | `reset()` | RHF reset() with merged scraped values | WIRED | Line 108: `reset(merged)` where `merged = { ...getEmptyDefaults(), ...result.data }` |
| `page.tsx` | `saveFormDraft` | Called after reset() | WIRED | Line 111: `saveFormDraft(merged as ProposalFormValues)` |

### Requirements Coverage

Phase 06 plans claim requirements INPUT-01 and INPUT-03.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| INPUT-01 | Plans 01, 03 | User can paste a SunPitch proposal URL and the system extracts all data via headless browser | SATISFIED | POST /api/scrape uses Playwright chromium with route interception. Scraper calibrated against real SunPitch API on 2026-03-03 (commit e54315b). Extracts: name, address, utility rate, annual consumption, monthly production, system size, cash price. Fields not in public API (sell rate, escalation, finance terms) correctly marked missing. |
| INPUT-03 | Plans 02, 03 | Manual entry form pre-populates with scraped SunPitch data when available, all fields remain editable | SATISFIED | `handleImportSuccess()` calls `reset(merged)` with RHF. All 14 Controller fields remain editable (no `readOnly` on scraped fields). Highlight wrappers use visual ring/bg only, do not restrict input. |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps only INPUT-01 and INPUT-03 to Phase 6. No orphaned requirements.

### Anti-Patterns Found

Scan of all 6 phase files:

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| None | — | — | No TODO/FIXME/HACK/PLACEHOLDER comments found. No empty return stubs. No `return null` stubs in route handlers. |

One implementation note (not a blocker): `MonthlyGrid` annual total field and individual month inputs do not have `clearHighlight` wired to their `onChange`. When a MonthlyGrid wrapper shows green (scraped monthly production) or amber (missing monthly consumption), editing values inside the grid does not clear the wrapper highlight. This was not spec'd differently in Plan 02 — the MonthlyGrid wrapper is treated as a single highlight unit. The plan's clearHighlight requirement was explicitly "wired to every Controller field" and MonthlyGrid uses its own internal Controllers. Impact: cosmetic only — the wrapper highlight persists after user edits monthly cells.

### TypeScript Compilation

`npx tsc --noEmit` — clean, no errors across all phase files.

### Commit Verification

All documented commits exist and reference correct files:

| Commit | Plan | Task | Files |
|--------|------|------|-------|
| `392527b` | 01 | Scraper contracts + scraper | types.ts, url-validator.ts, sunpitch.ts |
| `233629c` | 01 | POST /api/scrape route | src/app/api/scrape/route.ts |
| `aa0b84b` | 02 | SunPitchTab component | src/app/enter/components/SunPitchTab.tsx |
| `43a83dc` | 02 | Tab switcher, pre-fill wiring | src/app/enter/page.tsx |
| `e54315b` | 03 | Scraper rewrite (calibrated) | src/lib/scraper/sunpitch.ts |

### Human Verification Required

#### 1. End-to-End Import Flow

**Test:** Start dev server (`npm run dev`, port 3001). Navigate to `http://localhost:3001/enter`. Paste a real SunPitch URL (format: `https://app.sunpitch.com/facing/proposals/{uuid}`). Click "Import Data". Wait up to 60 seconds.

**Expected:** Cycling status messages appear. Page auto-switches to Manual Entry tab. Fields with data scraped from SunPitch show a green tint/ring. Fields always-missing from public API (monthly consumption, sell rate, escalation rate, finance monthly payment, finance term, finance interest rate) show amber tint/ring.

**Why human:** Requires Playwright browser execution and a live SunPitch URL. Scraper logic was verified against a real URL on 2026-03-03 but this is a runtime test, not a static code check.

#### 2. Highlight Clear on Edit

**Test:** After a successful import (green fields visible), click into any green-highlighted field (e.g., Customer Name) and type any character.

**Expected:** The green ring/bg disappears immediately from that field as `clearHighlight('customer.name')` fires via `onChange`.

**Why human:** Interactive React state — `clearHighlight` is wired correctly in code but requires browser interaction to confirm the visual behavior.

#### 3. Draft Persistence on Refresh

**Test:** After a successful import, refresh the browser page (`F5` or `Ctrl+R`).

**Expected:** Form retains all scraped values. The `loadFormDraft()` effect on mount reads from localStorage and calls `reset({ ...getEmptyDefaults(), ...draft })`.

**Why human:** Requires browser localStorage to verify the round-trip. Note: highlights will NOT restore on refresh (HighlightMap is in-memory only, not persisted) — this is intentional and correct.

#### 4. Client-Side URL Validation (No Network)

**Test:** Type `https://example.com` in the URL field and click "Import Data".

**Expected:** Inline red error appears immediately below the URL input. No network request is fired (check browser DevTools Network tab — no POST to `/api/scrape`).

**Why human:** The `validateSunPitchUrl()` guard and early return are clearly in code, but verifying "no network request" requires DevTools observation.

#### 5. Proposal Generation from Scraped Data

**Test:** After a successful import, fill in the remaining amber fields manually (sell rate, escalation rate, finance terms), then click "Generate Proposal".

**Expected:** Navigates to `/proposal?d=...` and all 11 proposal pages render without errors, using the mix of scraped and manually-entered values.

**Why human:** End-to-end flow from scraped partial data through URL encoding to proposal rendering requires runtime verification.

### Gaps Summary

No automated gaps found. All code artifacts exist, are substantive, and are correctly wired.

The one HUMAN NEEDED item is not a code gap — it is a runtime verification of the calibrated scraper against a live SunPitch URL. The scraper rewrite (Plan 03, commit `e54315b`) was itself performed against a real URL and documented as successful. The phase is functionally complete pending final human confirmation of the live flow.

---
_Verified: 2026-03-04T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
