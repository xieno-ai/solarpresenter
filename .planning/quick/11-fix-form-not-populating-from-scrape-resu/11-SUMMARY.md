---
phase: quick-11
plan: 01
subsystem: form
tags: [bug-fix, react-hook-form, scraper, consumption]
key-files:
  modified:
    - src/app/enter/page.tsx
    - src/lib/scraper/sunpitch.ts
decisions:
  - "setActiveTab('manual') moved before reset() so fields are mounted when RHF processes reset"
  - "Explicit setValue force-writes added as belt-and-suspenders after reset() for consumption fields"
  - "Monthly-sum fallback added before annualElectricityCost computation so derived annual feeds it"
metrics:
  duration: ~5min
  completed: "2026-03-04"
  tasks: 2
  files: 2
---

# Quick Task 11: Fix Form Not Populating from Scrape Result

One-liner: Fixed RHF field population after SunPitch import by switching tab before reset and force-writing consumption values via setValue.

## What Was Done

### Task 1 — Force-write consumption fields after tab switch (enter/page.tsx)

Three changes to `handleImportSuccess`:

**Change 1 — Move setActiveTab before reset:**
`setActiveTab('manual')` now fires before `reset(merged)` so the consumption/system fields are mounted in the DOM when RHF processes the reset. Previously the tab switch happened last, meaning reset() ran against unmounted fields which caused values to be silently dropped.

**Change 2 — Explicit setValue force-writes:**
After `reset(merged)`, individual `setValue` calls write:
- `consumption.annualConsumptionKwh` (shouldDirty: true)
- `consumption.annualElectricityCost` (shouldDirty: false)
- `consumption.monthlyConsumptionKwh.0` through `.11` (shouldDirty: true)
- `system.monthlyProductionKwh.0` through `.11` (shouldDirty: true)

These ensure values land in RHF even if the tab-switch/reset race condition still occurs.

**Change 3 — Annual from monthly fallback:**
Before computing `annualElectricityCost`, a guard checks: if `annualConsumptionKwh` is empty or '0' but the monthly array sums to >0, derive annual from the sum. This handles edge cases where the scraper produces monthly data but annual is missing/zero.

### Task 2 — Debug log in parseApiResponse (sunpitch.ts)

Added `console.log('[scraper] data.consumption before return:', JSON.stringify(data.consumption))` immediately before the `return buildResult(...)` line. This lets developers confirm whether the scraper is producing consumption data at all, distinguishing a scraper bug from a form-population bug.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/app/enter/page.tsx` modified: confirmed
- `src/lib/scraper/sunpitch.ts` modified: confirmed
- Task 1 commit: a8d35d7
- Task 2 commit: ab711b8
- `npx tsc --noEmit` passes with no errors
