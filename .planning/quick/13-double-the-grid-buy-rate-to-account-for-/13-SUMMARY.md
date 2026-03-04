---
phase: quick-13
plan: 13
subsystem: proposal-rendering
tags: [calculation, net-metering, display, rates]
dependency_graph:
  requires: []
  provides: [doubled-grid-buy-rate-engine, doubled-grid-buy-rate-display]
  affects: [NetMeteringPage, AllInCostsPage, net-metering-engine]
tech_stack:
  added: []
  patterns: [conditional-rate-multiplier]
key_files:
  modified:
    - src/app/proposal/page.tsx
decisions:
  - Doubling applied at the single input boundary (buildProposalInputs) so all downstream calculations receive the correct rate without touching any engine file
  - Display props updated independently to keep JSX display in sync with engine inputs
  - Guard condition `> 0` ensures zero-rate scenarios are unaffected
metrics:
  duration: 3
  completed_date: "2026-03-04"
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 13: Double the Grid Buy Rate Summary

**One-liner:** 2× netMeteringBuyRate multiplier at engine input boundary so transmission-adjusted grid purchase costs flow through all calculations and displays automatically.

## What Was Done

Applied two targeted changes to `src/app/proposal/page.tsx`:

1. **Engine input (buildProposalInputs):** Changed `netMeteringBuyRate` assignment to apply `× 2` when the rate is greater than 0. The Decimal.js `.greaterThan(0)` guard prevents inflating zero-rate scenarios.

2. **Display props (JSX return):** Both `gridBuyRate` props passed to `NetMeteringPage` and `AllInCostsPage` now compute `parseFloat(rate) * 2` when the raw rate is > 0, keeping displayed cents (e.g. 16.8¢) consistent with the engine input.

No engine files (net-metering.ts, calculate.ts, cash-back.ts, savings.ts) or page components were modified — all downstream calculations inherit the doubled rate automatically through the single input boundary.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Double netMeteringBuyRate at engine input boundary and display props | 78e730b | src/app/proposal/page.tsx |

## Verification

- `npx tsc --noEmit` exits 0 with no errors
- With netMeteringBuyRate = 0.084: engine receives 0.168, LO Rate displays ~16.8¢
- With netMeteringBuyRate = 0: engine and display both remain 0

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/app/proposal/page.tsx modified: FOUND
- Commit 78e730b: FOUND
