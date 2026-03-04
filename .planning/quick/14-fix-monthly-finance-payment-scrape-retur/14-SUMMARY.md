# Quick Task 14 — Summary

**Completed:** 2026-03-04
**Commit:** fb26cbd

## Changes — `src/lib/scraper/sunpitch.ts`

1. **rate_1 guard** — `if (rate1 > 0)` → `if (rate1 >= 10)`. Values < 10 (e.g. 0.004228) are interest rates, not dollar payments; they're now skipped with a log message.
2. **Priority flip** — `configMonthlyPayment ?? domMonthlyPayment` → `domMonthlyPayment ?? configMonthlyPayment`. DOM scrape is now the primary source; config calculation is the fallback.
3. **Selector broadened** — tries `span.mb-1.text span.float-right` first; falls back to any `span.float-right` whose text contains `$`. Handles both the nested and standalone rendering.
