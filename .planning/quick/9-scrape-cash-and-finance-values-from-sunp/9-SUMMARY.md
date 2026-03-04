---
phase: quick-9
plan: 9
subsystem: scraper
tags: [scraper, sunpitch, playwright, finance, dom-scraping]
dependency_graph:
  requires: []
  provides: [financing.financeMonthlyPayment, financing.financeTermMonths]
  affects: [src/lib/scraper/sunpitch.ts]
tech_stack:
  added: []
  patterns: [route-interception, dom-scraping, graceful-degradation]
key_files:
  modified:
    - src/lib/scraper/sunpitch.ts
decisions:
  - "Two-layer capture: API sub-route intercept (preferred) then DOM scrape (fallback)"
  - "Finance values absent from main /api/proposals/{uuid} endpoint — must come from sub-routes or DOM"
  - "Graceful degradation preserved: if neither layer finds values, fields remain in missingFields"
  - "capturedFinanceData typed explicitly with `as` cast to prevent TypeScript `never` narrowing on null-initialized variable"
metrics:
  duration: 8
  completed_date: "2026-03-04"
  tasks_completed: 2
  files_modified: 1
---

# Quick Task 9: Scrape Finance Values from SunPitch — Summary

**One-liner:** DOM scrape + sub-API intercept for financeMonthlyPayment/financeTermMonths with API-first, DOM-fallback, missingFields degradation.

## What Was Implemented

### Two-Layer Finance Value Capture

Previously, `financing.financeMonthlyPayment` and `financing.financeTermMonths` were hardcoded as always-missing because the main `/api/proposals/{uuid}` API does not include financing details. The SunPitch Angular app renders these in the browser DOM.

**Layer 1 — Sub-API Route Interceptor (preferred):**

A second `page.route()` interceptor is registered before `page.goto()` with the pattern `**/api/proposals/${uuid}/**` (trailing `/**` catches sub-routes only, not the main endpoint). It:

- Logs every sub-route URL fired during page load
- Parses JSON responses and looks for finance-shaped keys: `monthlyPayment`, `payment`, `monthly_payment`, `termMonths`, `term_months`, `months`, `loanTermMonths`
- Stores extracted values in `capturedFinanceData`
- Fulfills the route normally (no blocking)

The existing main-endpoint interceptor was updated to use the exact pattern `**/api/proposals/${uuid}` (no trailing wildcard) to avoid routing conflicts.

**Layer 2 — DOM Scraping (fallback):**

After the polling loop completes (main API responded), the scraper:

1. Waits up to 10s for Angular finance selectors to render: `[class*="finance"], [class*="payment"], [class*="monthly"]`
2. Calls `page.evaluate(() => document.body.innerText)` to get rendered text
3. Applies regex patterns:
   - Monthly payment: `/\$\s*([\d,]+(?:\.\d+)?)\s*\/\s*mo(?:nth)?/i` — matches `$220/mo`, `$1,200/month`, `$220 /month`
   - Term in months: `/MONTHS\s+1[-–](\d+)/i` OR `/(\d+)[- ]months?/i` — matches `MONTHS 1-60`, `60 months`, `60-month`

**Priority chain:** API intercept → DOM scrape → missingFields (graceful degradation)

### parseApiResponse() Update

Signature updated to:
```typescript
function parseApiResponse(
  raw: SunPitchProposalApiResponse,
  domMonthlyPayment?: string | null,
  domTermMonths?: string | null,
): ScrapeResult
```

The hardcoded always-missing block was replaced with conditional logic:
- When a value is non-null: populate `data.financing.financeMonthlyPayment` / `financeTermMonths`
- When null: push to `missingFields` (same graceful degradation behavior as before)

### Logging

All log lines use `[scraper]` prefix for Vercel log filtering:
- `[scraper] sub-route intercepted: <url>`
- `[scraper] sub-route JSON keys: <keys>`
- `[scraper] finance API data captured: { monthlyPayment, termMonths }`
- `[scraper] DOM finance scan — raw payment match: <match> → <value>`
- `[scraper] DOM finance scan — raw term match: <match> → <value>`
- `[scraper] DOM finance scan — payment: X | term: Y`
- `[scraper] final finance values — monthlyPayment: X | termMonths: Y`
- `[scraper] financing.financeMonthlyPayment (DOM/API): X`
- `[scraper] financing.financeTermMonths: not found — added to missingFields`

## Finance Fields: Now vs Before

| Field | Before | After |
|-------|--------|-------|
| `financing.financeMonthlyPayment` | Always missingFields | Populated from sub-API or DOM when found; missingFields when not |
| `financing.financeTermMonths` | Always missingFields | Populated from sub-API or DOM when found; missingFields when not |
| `financing.cashPurchasePrice` | Scraped from adders | Unchanged |
| `financing.financeInterestRate` | Defaulted to '0' | Unchanged |

## Deviations from Plan

**1. [Rule 1 - Bug] TypeScript `never` narrowing on `capturedFinanceData`**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** TypeScript inferred `capturedFinanceData` as type `never` at usage site despite explicit type annotation, because the route handler callback closure set the variable inside a closure after TS narrowed the outer scope
- **Fix:** Added explicit `as { monthlyPayment?: number; termMonths?: number } | null` cast to the initializer to force the correct type
- **Files modified:** `src/lib/scraper/sunpitch.ts`
- **Commit:** e3e5567

## Self-Check

### Files Verified
- `src/lib/scraper/sunpitch.ts` — modified with all three changes: sub-route interceptor, DOM scrape, parseApiResponse signature update

### Commits Verified
- e3e5567: feat(quick-9): scrape financeMonthlyPayment and financeTermMonths from SunPitch

## Self-Check: PASSED
