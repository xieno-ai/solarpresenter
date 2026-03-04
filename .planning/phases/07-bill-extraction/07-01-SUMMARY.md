---
phase: 07-bill-extraction
plan: "01"
subsystem: bill-extraction-api
tags: [gemini, zod, api-route, file-upload, structured-output]
dependency_graph:
  requires: []
  provides: [extract-bill-api, ExtractedBillFields-type, extractedBillSchema, BILL_EXTRACTION_PROMPT]
  affects: [07-02-bill-extractor-ui, 07-03-landing-hub]
tech_stack:
  added: ["@google/genai@^1.43.0", "zod-to-json-schema@^3.25.1"]
  patterns: [gemini-inline-base64, zod-structured-output, nextjs-formdata-route]
key_files:
  created:
    - src/lib/bill/schema.ts
    - src/lib/bill/prompt.ts
    - src/app/api/extract-bill/route.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "zodToJsonSchema cast as any to bridge zod v4 types with zod-to-json-schema v3 (runtime works, types incompatible)"
  - "All 7 extracted fields nullable — AI never crashes on partial extraction"
  - "Status logic: 0 non-null fields = error, 1-6 = partial, 7 = success"
  - "GEMINI_MODEL constant with env var override (gemini-2.5-flash default) for easy model updates"
  - "HTTP 200 always from POST handler — client reads status field (mirrors /api/scrape convention)"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-04"
  tasks_completed: 2
  files_created: 3
---

# Phase 7 Plan 1: Bill Extraction API Summary

**One-liner:** Zod-validated Gemini Flash extraction API for Alberta utility bills — PDF/image upload to structured `ExtractedBillFields` JSON via `@google/genai` inline base64 with typed response envelope.

## What Was Built

Three files establishing the complete backend contract for the bill extractor:

1. **`src/lib/bill/schema.ts`** — Zod schema with 7 nullable fields (monthlyKwh 12-element array, annualKwh, allInRateCentsPerKwh, energyRateCentsPerKwh, utilityProvider, accountHolderName, serviceAddress). Exports `extractedBillSchema`, `ExtractedBillFields` type, and `ExtractBillResult` envelope interface that mirrors the existing `ScrapeResult` shape.

2. **`src/lib/bill/prompt.ts`** — `BILL_EXTRACTION_PROMPT` string with Alberta-specific context: typical rate range (14–25¢/kWh), major providers (EPCOR, ENMAX, ATCOenergy, Encor, Direct Energy), clear field descriptions including the distinction between all-in rate (total bill ÷ kWh) vs energy-only rate, and null-return instructions for uncertain fields.

3. **`src/app/api/extract-bill/route.ts`** — POST handler that reads multipart file, validates MIME type (PDF/JPEG/PNG/HEIC/HEIF) and size (4MB limit → 413), converts to base64, calls Gemini Flash with `responseSchema` structured output, Zod-validates the response, determines status from non-null field count, and returns `ExtractBillResult`. Wraps Gemini call in try/catch for graceful error handling.

## Packages Installed

- `@google/genai@^1.43.0` — Official Google Generative AI SDK (GA since May 2025; replaces legacy `@google/generative-ai`)
- `zod-to-json-schema@^3.25.1` — Bridges Zod schema → JSON Schema for Gemini `responseSchema` parameter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 type incompatibility with zod-to-json-schema v3**
- **Found during:** Task 2 TypeScript compile verification
- **Issue:** `zod-to-json-schema` v3's TypeScript types expect Zod v3's `ZodType` shape; Zod v4 changed internal types, causing TS2345 error on `zodToJsonSchema(extractedBillSchema)`
- **Fix:** Cast schema as `any` at call site: `zodToJsonSchema(extractedBillSchema as any)`. Runtime behavior is correct (tested via Node.js) — the JSON Schema output is valid. Added eslint-disable comment for clarity.
- **Files modified:** `src/app/api/extract-bill/route.ts`
- **Commit:** 0f7a248

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/lib/bill/schema.ts | FOUND |
| src/lib/bill/prompt.ts | FOUND |
| src/app/api/extract-bill/route.ts | FOUND |
| Commit 4e4a9a4 (schema + prompt) | FOUND |
| Commit 0f7a248 (route handler) | FOUND |
| TypeScript compiles without errors | PASSED |
