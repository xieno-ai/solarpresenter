---
quick_task: 7
description: fix scraper on Vercel: replace playwright with playwright-core and sparticuz chromium
date: 2026-03-04
---

# Quick Task 7: Fix Playwright on Vercel

## Problem

`/api/scrape` and `/api/pdf` return 500 on Vercel because:
- `playwright` downloads Chromium to `~/.cache/ms-playwright/` at install time
- That path is ephemeral — the binary is NOT included in the Vercel deployment bundle
- `chromium.launch()` fails at runtime with "Executable doesn't exist"

## Fix

1. Replace `playwright` with `playwright-core` (no bundled browser) + `@sparticuz/chromium` (Lambda-compatible binary)
2. In both routes, use `chromiumPkg.executablePath()` when `process.env.VERCEL` is set; fall back to `undefined` (local system browser) otherwise

## Files Changed

- `package.json` — uninstall `playwright`, add `playwright-core` + `@sparticuz/chromium`
- `src/app/api/scrape/route.ts` — import from `playwright-core` + `@sparticuz/chromium`, conditional executablePath
- `src/app/api/pdf/route.ts` — same
- `src/lib/scraper/sunpitch.ts` — type import changed from `playwright` to `playwright-core`
