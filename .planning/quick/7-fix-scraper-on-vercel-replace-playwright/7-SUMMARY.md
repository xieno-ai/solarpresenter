---
quick_task: 7
status: complete
date: 2026-03-04
---

# Summary

Replaced `playwright` with `playwright-core` + `@sparticuz/chromium` across all three files that used Playwright. Both `/api/scrape` and `/api/pdf` now conditionally use the sparticuz Chromium binary on Vercel and fall back to the system browser locally. TypeScript compiles clean.

## Files Changed
- `package.json` — removed `playwright`, added `playwright-core@^1.58.2` and `@sparticuz/chromium@^143.0.4`
- `src/app/api/scrape/route.ts` — playwright-core + sparticuz chromium, conditional executablePath
- `src/app/api/pdf/route.ts` — same
- `src/lib/scraper/sunpitch.ts` — `import type { Browser } from 'playwright-core'`

## Local Dev Note
Since `playwright-core` has no bundled browser, local dev requires running `npx playwright install chromium` once to install the browser binary. The routes detect `process.env.VERCEL` and use sparticuz only in production.
