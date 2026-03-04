---
phase: quick-8
plan: 8
subsystem: deployment
tags: [vercel, chromium, next-config, file-tracing]
dependency_graph:
  requires: [quick-7]
  provides: [vercel-chromium-bundle]
  affects: [api/scrape, api/pdf]
tech_stack:
  added: []
  patterns: [outputFileTracingIncludes]
key_files:
  created: []
  modified:
    - next.config.ts
decisions:
  - "outputFileTracingIncludes used (not serverExternalPackages) — the issue is missing binary assets, not webpack bundling"
  - "Both /api/scrape and /api/pdf get the same glob — both use Playwright/Chromium"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-04T16:36:30Z"
  tasks_completed: 1
  files_modified: 1
---

# Phase quick-8: Fix /api/scrape and /api/pdf 500 errors on Vercel (Chromium binary tracing) Summary

**One-liner:** Added `outputFileTracingIncludes` in `next.config.ts` so Next.js bundles `@sparticuz/chromium`'s `.br` binary files into the Vercel serverless function — fixes cold-start 500s on `/api/scrape` and `/api/pdf`.

## What Was Done

`@sparticuz/chromium` ships three binary archives in its `bin/` directory:
- `chromium.br`
- `fonts.tar.br`
- `swiftshader.tar.br`

At runtime, `executablePath()` extracts these archives to `/tmp`. If they are absent, it throws `"input directory does not exist"` immediately at function cold start, surfacing as an HTTP 500 before any scraper logic runs.

Next.js file tracing follows JS `import`/`require` edges but ignores `.br` binary files. The fix is one configuration key: `outputFileTracingIncludes`, which explicitly tells Next.js to include a glob of files alongside specific API routes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add outputFileTracingIncludes to next.config.ts | 6d8bc81 | next.config.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` — passes clean (no output)
- After Vercel deploy: `/api/scrape` should return JSON instead of HTTP 500

## Self-Check

- [x] `next.config.ts` modified with `outputFileTracingIncludes`
- [x] Commit `6d8bc81` exists
- [x] TypeScript compiles clean

## Self-Check: PASSED
