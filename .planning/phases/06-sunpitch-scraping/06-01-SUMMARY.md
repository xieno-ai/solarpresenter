---
phase: 06-sunpitch-scraping
plan: 01
subsystem: scraper
tags: [playwright, scraping, api-route, typescript]
dependency_graph:
  requires: []
  provides: [POST /api/scrape, ScrapeResult type, validateSunPitchUrl, scrapeSunPitch]
  affects: [src/app/enter/page.tsx (Plan 02 UI consumes /api/scrape)]
tech_stack:
  added: []
  patterns: [playwright-api-route, dual-strategy-scraping, network-interception-dom-fallback]
key_files:
  created:
    - src/lib/scraper/types.ts
    - src/lib/scraper/url-validator.ts
    - src/lib/scraper/sunpitch.ts
    - src/app/api/scrape/route.ts
  modified: []
decisions:
  - "ScrapeResult returns HTTP 200 even on scrape failures — client reads status field not HTTP code; only structural errors (bad JSON, missing url) return 4xx"
  - "normalizeMonthlyArray() always pads/trims to exactly 12 string entries using '0' as fill"
  - "Hard-error threshold: customer name AND system size AND monthly production all missing returns status:'error' with descriptive message"
  - "Redirect detection after page.goto() checks page.url() for /facing/proposals/ — catches SunPitch auth redirect silently"
  - "annualElectricityCost intentionally excluded from missingFields — it is computed by watch() in the form, not scraped"
  - "page.waitForTimeout(2000) after waitForSelector gives async data loads time to complete before extraction"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-04"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 06 Plan 01: SunPitch Scraper Backend Summary

**One-liner:** Playwright dual-strategy scraper (network interception + DOM fallback) with typed ScrapeResult contracts and POST /api/scrape route mirroring the existing /api/pdf pattern.

## What Was Built

### Task 1: Scraper contracts and Playwright scraper

**src/lib/scraper/types.ts**
- `ScrapeStatus = 'success' | 'partial' | 'error'`
- `ScrapeResult` interface with status, data, missingFields, message
- `FieldHighlight = 'scraped' | 'missing'` for UI highlight state
- `HighlightMap = Partial<Record<string, FieldHighlight>>` for per-field tracking

**src/lib/scraper/url-validator.ts**
- `SUNPITCH_URL_PATTERN` regex matching `https?://app.sunpitch.com/facing/proposals/{uuid}`
- `validateSunPitchUrl(url)` returns null if valid, error string if not

**src/lib/scraper/sunpitch.ts**
- `scrapeSunPitch(browser, url)` — main entry point
- Network interception via `page.on('response')` set up BEFORE `page.goto()` — captures any JSON API responses with proposal-relevant fields
- Auth redirect detection: checks `page.url()` after goto for `/facing/proposals/`
- Soft `waitForSelector` with `.catch(() => null)` — continues even if no element found
- 2-second wait after DOM ready for async data loads to complete
- `extractFromApiResponse()` — maps captured payloads to ProposalFormValues shape
- `extractFromDOM()` — DOM fallback with resilient selectors (avoids hashed class names)
- `normalizeMonthlyArray()` — always produces exactly 12 string entries
- `buildResult()` — enforces hard-error threshold, determines success/partial status
- Extensive `console.log('[scraper]', ...)` throughout for debugging

### Task 2: POST /api/scrape route

**src/app/api/scrape/route.ts**
- `export const runtime = 'nodejs'` — required for Playwright
- `try { body = await request.json() } catch` — returns HTTP 400 on malformed JSON
- Missing/non-string `url` returns HTTP 400
- `chromium.launch({ headless: true, args: [...] })` matching /api/pdf pattern
- `try { scrapeSunPitch(browser, url) } catch { ... } finally { browser.close() }`
- All scrape failures return HTTP 200 with `{ status: 'error' }` — client reads status field

## Verification

TypeScript compilation: `npx tsc --noEmit` — clean, no errors.

All exports are present:
- `src/lib/scraper/types.ts`: ScrapeStatus, ScrapeResult, FieldHighlight, HighlightMap
- `src/lib/scraper/url-validator.ts`: validateSunPitchUrl, SUNPITCH_URL_PATTERN
- `src/lib/scraper/sunpitch.ts`: scrapeSunPitch
- `src/app/api/scrape/route.ts`: POST, runtime

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 392527b | feat(06-01): add scraper contracts and Playwright dual-strategy scraper |
| 2 | 233629c | feat(06-01): add POST /api/scrape route with Playwright browser automation |

## Deviations from Plan

None - plan executed exactly as written.

Key implementation choices within spec:
- `page.waitForTimeout(2000)` added after `waitForSelector` to allow async SPA data loads to settle before extraction
- `context.close()` in `finally` block (cleaner than just `page.close()`) — context cleanup handles any lingering network connections
- `looksLikeProposalData()` helper centralizes the heuristic check for relevant API payloads
- `extractKwValue()` helper reused in both API and DOM extraction paths

## Next Step

Plan 06-02: SunPitch URL tab UI — adds "Paste SunPitch URL" / "Manual Entry" tabs to `/enter`, calls POST /api/scrape, applies RHF `reset()` with highlight map for scraped/missing fields.
