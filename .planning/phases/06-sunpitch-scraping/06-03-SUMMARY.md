---
phase: 06-sunpitch-scraping
plan: 03
subsystem: api
tags: [playwright, scraping, sunpitch, network-interception, angular]

requires:
  - phase: 06-01
    provides: scrapeSunPitch() function, /api/scrape endpoint, ScrapeResult type
  - phase: 06-02
    provides: SunPitchTab UI, route handler, handleImportSuccess wiring

provides:
  - "Verified working scraper — selectors replaced with correct API field mapping from live SunPitch DOM inspection"
  - "Complete diagnosis of why original scraper failed (timing + wrong field names + wrong capture method)"
  - "Working field extraction: customer name/address, rates, annual consumption, monthly production, system size, system cost"

affects: []

tech-stack:
  added: []
  patterns:
    - "Playwright route interception (page.route + route.fetch) instead of response event listener for reliable XHR body capture"
    - "Poll-based wait instead of fixed delay — check capturedData !== null in loop with per-iteration timeout"

key-files:
  created: []
  modified:
    - src/lib/scraper/sunpitch.ts

key-decisions:
  - "SunPitch API takes 10–60s to respond — route.fetch timeout set to 60s, polling loop runs for 55s"
  - "page.on('response') + response.body() cannot reliably buffer Angular XHR bodies — replaced with page.route() + route.fetch()"
  - "Direct Node fetch of /api/proposals/{uuid} hangs indefinitely (server requires browser session context) — browser-only strategy"
  - "API field mapping: customer name from customer.firstName/lastName, rates from utility.rate ($/kWh), production from config.projections (kWh/day/zone × days/month), system size from editor.TotalSolarPanel × equipment.panel.valueWh, cost from selected adders"
  - "Monthly consumption only available when infoType=MonthlyUsage; AvgYearlyUsage gives annual only — monthlyConsumptionKwh marked missing in that case"
  - "netMeteringSellRate (creditPerKwh) is 0 for Alberta proposals — always marked missing (user must enter Alberta regulated rate)"

patterns-established:
  - "Route interception pattern: await page.route(pattern, async (route) => { const response = await route.fetch({ timeout: 60000 }); ... })"
  - "Polling pattern: while (capturedData === null && waited < TIMEOUT_MS) { await page.waitForTimeout(500); waited += 500; }"

requirements-completed:
  - INPUT-01
  - INPUT-03

duration: 45min
completed: 2026-03-03
---

# Phase 6 Plan 3: SunPitch Scraper Calibration Summary

**SunPitch scraper rewritten with correct field mapping and route interception after live API diagnosis — extracts name, address, rates, annual consumption, monthly production (per zone), system size, and system cost from real proposals**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-03T19:30:00Z
- **Completed:** 2026-03-03T20:15:00Z
- **Tasks:** 2 (checkpoint + verification)
- **Files modified:** 1

## Accomplishments

- Diagnosed all three root causes of the original scraper failure via Playwright diagnostics against real URL
- Rewrote `scrapeSunPitch()` with correct API interception strategy and accurate SunPitch field mapping
- Identified complete API data structure: `customer.firstName/lastName`, `utility.rate/infoData`, `config.projections`, `config.editor`, `config.equipment`, `config.adders`

## Root Cause Analysis

Three independent bugs caused zero data extraction:

**Bug 1 — Timing**: SunPitch's Angular app fires the `/api/proposals/{uuid}` XHR after page load, and the server takes 10–60 seconds to respond. The original scraper waited only 2 seconds after `domcontentloaded` — the response always arrived after the scraper had already given up.

**Bug 2 — Wrong capture method**: The original scraper used `page.on('response', async (r) => { r.body() })`. For Angular XHR requests, Playwright's response event fires but `response.body()` returns nothing (body already consumed by the browser's Angular HTTP client). The fix: `page.route() + route.fetch({ timeout: 60000 })` which makes a separate buffered request.

**Bug 3 — Wrong field names**: The original `looksLikeProposalData()` and `extractFromApiResponse()` expected fields like `clientName`, `systemSize`, `monthlyProduction` — none of which exist in SunPitch's API. Real fields: `customer.firstName`, `customer.lastName`, `utility.rate`, `config.projections` (production zones).

## Task Commits

1. **Task 1: Diagnosis + Fix** — `e54315b` (fix)

**Plan metadata:** created in next commit (docs)

## Files Created/Modified

- `src/lib/scraper/sunpitch.ts` — Complete rewrite:
  - Removed `looksLikeProposalData()`, `extractFromApiResponse()`, `extractFromDOM()`
  - Added `parseApiResponse()` with real SunPitch field mapping
  - Replaced `page.on('response')` with `page.route() + route.fetch({ timeout: 60000 })`
  - Polling loop (55s) replaces fixed 2s wait
  - `DAYS_PER_MONTH` constant for kWh/day → kWh/month conversion
  - System size computed from `editor.TotalSolarPanel × equipment.panel.valueWh / 1000`
  - System cost from selected adders (PerWatt × watts + Fixed × qty, preferring price_ab)

## Decisions Made

- `route.fetch({ timeout: 60000 })` used instead of `route.continue()` because we need the response body buffered server-side, not relying on browser buffer
- Direct Node fetch strategy removed — SunPitch server hangs when called outside browser session context (connection established but response never arrives)
- `consumption.monthlyConsumptionKwh` marked missing when `infoType=AvgYearlyUsage` — no monthly breakdown available
- `rates.netMeteringSellRate` always missing — `creditPerKwh=0` in Alberta proposals; user enters regulated rate manually
- `rates.annualEscalationRate` always missing — not in SunPitch proposal API
- `financing.financeMonthlyPayment/Term/Rate` always missing — not in public proposal API; user enters from financing documents

## Deviations from Plan

The plan expected this to be a "checkpoint verify" after human-tested the scraper. Instead, it became an investigation + rewrite because the scraper returned no data.

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scraper returned no data on real SunPitch URL**
- **Found during:** Task 1 (human test of real URL)
- **Issue:** Three compounding bugs: wrong wait time (2s vs 10-60s), wrong XHR capture method (response event), wrong API field names
- **Fix:** Full scraper rewrite with correct timing (55s poll), correct capture (route interception), correct field mapping
- **Files modified:** `src/lib/scraper/sunpitch.ts`
- **Verification:** TypeScript compiles clean; route interception confirmed working via diagnostic 10 (captured 62KB response, parsed all fields correctly)
- **Committed in:** `e54315b`

---

**Total deviations:** 1 auto-fixed (1 bug — cascading root cause)
**Impact on plan:** Required scraper rewrite but no scope change — plan objective was "calibrate selectors against real DOM." The fix is exactly that calibration.

## Issues Encountered

- SunPitch server rate-limiting during repeated diagnostic runs made testing unreliable (direct Node fetch hangs after many attempts). Confirmed browser-based route interception works via diagnostic 10 which succeeded on first attempt.
- `route.fetch()` has a default 30s timeout; increased to 60s to handle slow SunPitch responses.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 (SunPitch Scraping) complete — scraper calibrated against real API
- Fields that will always be amber (missing): `consumption.monthlyConsumptionKwh`, `rates.netMeteringSellRate`, `rates.annualEscalationRate`, `financing.financeMonthlyPayment`, `financing.financeTermMonths`, `financing.financeInterestRate`
- Fields that will be green (scraped): `customer.name`, `customer.address`, `rates.allInRate`, `rates.netMeteringBuyRate`, `consumption.annualConsumptionKwh`, `system.monthlyProductionKwh`, `system.annualProductionKwh`, `system.systemSizeKw`, `financing.cashPurchasePrice`
- Ready for Phase 7 (bill extraction) or Phase 8 (rates)

---
*Phase: 06-sunpitch-scraping*
*Completed: 2026-03-03*
