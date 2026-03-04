---
phase: quick-12
plan: 01
subsystem: scraper
tags: [scraper, finance, dom-scrape, sunpitch]
dependency_graph:
  requires: []
  provides: [targeted-dom-payment-selector, hardcoded-240-term]
  affects: [src/lib/scraper/sunpitch.ts]
tech_stack:
  added: []
  patterns: [targeted-dom-query, hardcoded-constant]
key_files:
  created: []
  modified:
    - src/lib/scraper/sunpitch.ts
decisions:
  - "Finance term is always 240 months — hardcoded in both DOM block and parseApiResponse resolution"
  - "Cash purchase price is never scraped from DOM — it remains a manual input computed from adders"
  - "DOM payment selector changed from broad innerText regex to span.mb-1.text span.float-right"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-04"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase quick-12 Plan 01: Scrape Finance Payment from DOM, Remove Cash DOM Scrape Summary

Replaced unreliable innerText payment regex with targeted `span.mb-1.text span.float-right` DOM query, removed the cash price DOM scrape entirely (cash is manual input), and hardcoded the finance term to 240 months throughout.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Fix DOM payment selector, remove cash price scrape, hardcode term to 240 | abb46cf | Done |

## Changes Made

### parseApiResponse function
- Removed `domCashPrice?: string | null` parameter from signature
- Removed `domTermMonths?: string | null` parameter from signature
- Removed the `if (domCashPrice)` branch — adder calculation now runs unconditionally
- Replaced `const resolvedTermMonths = configTermMonths ?? domTermMonths` with `const resolvedTermMonths = '240'`
- Removed `let configTermMonths: string | null = null` declaration
- Removed `configTermMonths = String(termMonths)` assignment in config.finance block
- Updated fallback payment calculation to use hardcoded `240` instead of `termMonths` variable

### scrapeSunPitch DOM block
- Removed `let scrapedTermMonths: string | null = null` declaration
- Removed `let scrapedCashPrice: string | null = null` declaration
- Removed entire cash price DOM scrape block (`span.d-inline.ml-auto` query)
- Removed entire term regex block (`financeText.match(...)` + `if (termMatch)`)
- Removed `financeText` variable (was only used for the now-removed term regex)
- Replaced `paymentMatch` regex on `document.body.innerText` with targeted `span.mb-1.text span.float-right` query
- `finalTermMonths` is now `'240'` (hardcoded, no computation needed)
- `parseApiResponse(...)` call reduced from 4 args to 2 (`capturedData, finalMonthlyPayment`)

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `grep -n "domCashPrice\|scrapedCashPrice\|d-inline ml-auto\|scrapedTermMonths\|configTermMonths" src/lib/scraper/sunpitch.ts` — no matches
- `grep -n "mb-1.text" src/lib/scraper/sunpitch.ts` — shows new payment selector (lines 751, 753, 759, 761)
- `grep -n "'240'" src/lib/scraper/sunpitch.ts` — shows two matches (lines 487 and 773)
- `npx tsc --noEmit` — passed with zero errors

## Self-Check: PASSED

- `src/lib/scraper/sunpitch.ts` exists and was modified
- Commit `abb46cf` exists
- All removed identifiers confirmed absent
- All new identifiers confirmed present
- TypeScript compilation clean
