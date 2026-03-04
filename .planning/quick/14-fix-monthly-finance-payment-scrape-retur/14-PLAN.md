# Quick Task 14 — Fix monthly finance payment scrape returning 0

## Goal
Monthly finance payment is scraped as 0 instead of 288. Fix three bugs in `src/lib/scraper/sunpitch.ts`.

## Root Cause
1. `rate_1 = 0.004228` is an interest rate, but code treats it as a dollar amount → `Math.round(0.004228) = 0` → `configMonthlyPayment = "0"`
2. Priority wrong: `configMonthlyPayment ?? domMonthlyPayment` — "0" wins over DOM-scraped "288"
3. DOM selector `span.mb-1.text span.float-right` too narrow; actual element is `span.float-right`

## Fix (applied directly)
- Guard `rate_1 >= 10` to distinguish dollar amounts from fractional interest rates
- Flip priority to `domMonthlyPayment ?? configMonthlyPayment`
- Broaden selector: try nested first, fall back to any `span.float-right` containing `$`

## Commit
`fb26cbd`
