---
phase: quick-8
plan: 8
type: execute
wave: 1
depends_on: []
files_modified:
  - next.config.ts
autonomous: true
requirements: [QUICK-8]

must_haves:
  truths:
    - "POST /api/scrape returns a JSON response (not 500) on Vercel"
    - "GET /api/pdf returns a PDF (not 500) on Vercel"
    - "Chromium binary files are included in the Vercel deployment bundle"
  artifacts:
    - path: "next.config.ts"
      provides: "outputFileTracingIncludes for @sparticuz/chromium bin files"
      contains: "outputFileTracingIncludes"
  key_links:
    - from: "next.config.ts outputFileTracingIncludes"
      to: "node_modules/@sparticuz/chromium/bin/*.br"
      via: "Next.js file tracing"
      pattern: "outputFileTracingIncludes"
---

<objective>
Fix /api/scrape (and /api/pdf) 500 errors on Vercel caused by missing Chromium binary files in the deployment bundle.

Purpose: @sparticuz/chromium's executablePath() extracts chromium.br, fonts.tar.br, and swiftshader.tar.br from its bin/ directory at runtime. Next.js file tracing only follows JS imports — it does not detect .br binary files as dependencies. Without outputFileTracingIncludes in next.config.ts, these files are absent from the Vercel bundle, causing executablePath() to throw "input directory does not exist" immediately at function cold start, which surfaces as a 500.

Output: Updated next.config.ts with outputFileTracingIncludes; deployed Vercel function can extract and run Chromium.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@D:/Cursor/Solar Presenter/.planning/STATE.md

Root cause analysis:
- `@sparticuz/chromium` resolves its binary path via `getBinPath()` → `path.join(__dirname, '../../bin')` (relative to build/cjs/paths.cjs.cjs)
- This resolves to `node_modules/@sparticuz/chromium/bin/` at runtime
- The bin/ directory contains: chromium.br, fonts.tar.br, swiftshader.tar.br, al2023.tar.br
- Next.js uses `outputFileTracingIncludes` to include non-JS assets for serverless routes
- Both @sparticuz/chromium and playwright-core are on Next.js's serverExternalPackages auto-opt-out list (no webpack issue)
- The only missing piece is telling Next.js to include the .br binary files

Current next.config.ts: empty — `const nextConfig: NextConfig = {}`
Fix: add outputFileTracingIncludes for the two Playwright routes
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add outputFileTracingIncludes to next.config.ts</name>
  <files>next.config.ts</files>
  <action>
Replace the empty nextConfig object with one that includes outputFileTracingIncludes. This tells Next.js file tracing to bundle the @sparticuz/chromium bin/ directory alongside the two API routes that use Playwright.

The correct next.config.ts:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Include @sparticuz/chromium binary files in the Vercel deployment bundle.
  // Next.js file tracing only follows JS imports — it cannot detect .br binaries.
  // Without this, executablePath() throws "input directory does not exist" on Vercel → 500.
  outputFileTracingIncludes: {
    '/api/scrape': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
```

Do not add any other config. TypeScript must compile clean (`npx tsc --noEmit`).
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>next.config.ts contains outputFileTracingIncludes with entries for /api/scrape and /api/pdf pointing to node_modules/@sparticuz/chromium/bin/**. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
After deploying to Vercel:
1. POST /api/scrape with a valid SunPitch URL returns JSON with status "success", "partial", or "error" — never HTTP 500
2. GET /api/pdf?d=... returns a PDF binary — never HTTP 500
3. Vercel function logs show [scraper] console entries (proving the function reached scraper code, not crashed at browser launch)

Local verification (TypeScript only — Playwright requires browser binary on dev machine):
- `npx tsc --noEmit` passes clean
- `npm run build` succeeds without errors
</verification>

<success_criteria>
- next.config.ts updated with outputFileTracingIncludes
- TypeScript compiles clean
- After Vercel deploy: /api/scrape returns JSON body instead of 500
</success_criteria>

<output>
After completion, create `.planning/quick/8-fix-api-scrape-500-error-on-vercel-deplo/8-SUMMARY.md`
</output>
