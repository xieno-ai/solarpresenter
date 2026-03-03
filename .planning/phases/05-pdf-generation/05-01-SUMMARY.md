---
phase: 05-pdf-generation
plan: 01
subsystem: api
tags: [playwright, pdf, next-api-route, chromium, speed-dial]

# Dependency graph
requires:
  - phase: 04-proposal-rendering
    provides: All 11 proposal page components rendering correctly
provides:
  - /proposal/pdf — clean PDF render target (no FAB, no scroll-snap, proposal-pdf-root class)
  - /api/pdf GET handler — Playwright-based PDF generation returning binary buffer
  - ProposalFAB Download PDF action — fetch /api/pdf, save NorthernNRG_[LastName]_[YYYY-MM-DD].pdf
affects:
  - 05-02 (verification checkpoint — tests this pipeline end-to-end)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PDF render target: duplicate proposal page with proposal-pdf-root class overriding scroll-snap"
    - "Playwright in Next.js API route: runtime=nodejs, emulateMedia(screen) before goto to preserve backgrounds"
    - "Buffer → Uint8Array conversion for BodyInit compatibility in Next.js Response"
    - "Speed-dial Download PDF: button (not anchor), isGenerating state, AbortSignal.timeout(35000), blob download pattern"

key-files:
  created:
    - src/app/proposal/pdf/page.tsx
    - src/app/proposal/pdf/pdf.css
    - src/app/api/pdf/route.ts
  modified:
    - src/app/proposal/ProposalFAB.tsx
    - src/app/proposal/page.tsx
    - src/test-data/paul-friesen-config.ts

key-decisions:
  - "PDF render target returns error div (not redirect) on missing d param — Playwright redirect would fail silently"
  - "emulateMedia('screen') called before page.goto — ensures screen CSS throughout load, without this all backgrounds are stripped by @media print"
  - "Viewport set to 816x1056 (Letter at 96 DPI) before goto so vw/vh resolve to correct paper dimensions"
  - "Buffer → Uint8Array: page.pdf() returns Buffer which TypeScript 5.x does not accept as BodyInit without conversion"
  - "pdf.css scoped to .proposal-pdf-root (not :root) — avoids polluting other routes"
  - "Spinner @keyframes spin defined in inline <style> tag in ProposalFAB — no global proposal CSS needed for client-only animation"
  - "Download PDF item placed first in speed-dial (visually top when expanded) with delay 0ms; link items stagger from 55ms"

patterns-established:
  - "PDF route pattern: /proposal/pdf renders all pages with css overrides, /api/pdf launches Playwright to render it"
  - "ProposalFAB receives d and customerName from server component parent"

requirements-completed: [PROP-08]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 5 Plan 1: PDF Generation Implementation Summary

**Playwright-based PDF export: /proposal/pdf clean render target + /api/pdf GET route returning Letter-format PDF with all 11 pages via Chromium headless browser**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T22:26:26Z
- **Completed:** 2026-03-03T22:29:48Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- `/proposal/pdf` render target renders all 11 pages with `proposal-pdf-root` class (disables scroll-snap, adds `break-after: page`, forces `print-color-adjust: exact`)
- `/api/pdf` GET route launches Playwright Chromium headless, emulates screen media, sets Letter viewport, returns binary PDF buffer
- `ProposalFAB` gains Download PDF action: loading state with spinner, 35s AbortSignal timeout, `NorthernNRG_[LastName]_[YYYY-MM-DD].pdf` filename, inline red error pill on failure

## Task Commits

Each task was committed atomically:

1. **Task 1: /proposal/pdf render target + pdf.css** - `a73e56d` (feat)
2. **Task 2: /api/pdf Playwright route + ProposalFAB update** - `9fbe3fb` (feat)

## Files Created/Modified
- `src/app/proposal/pdf/page.tsx` - Clean PDF render target: all 11 pages, proposal-pdf-root class, no ProposalFAB, error div instead of redirect
- `src/app/proposal/pdf/pdf.css` - PDF overrides: break-after page, overflow visible, print-color-adjust exact, scroll-snap disabled
- `src/app/api/pdf/route.ts` - GET handler: Playwright chromium launch, emulateMedia screen, networkidle wait, 500ms safety buffer, Letter format zero-margin PDF
- `src/app/proposal/ProposalFAB.tsx` - Added Download PDF speed-dial item with isGenerating state, spinner animation, blob download, error pill; accepts { d, customerName } props
- `src/app/proposal/page.tsx` - Passes d={params.d} and customerName={formValues.customer.name} to ProposalFAB
- `src/test-data/paul-friesen-config.ts` - Added missing defaultPreSolarRate field (auto-fix, pre-existing bug)

## Decisions Made
- `emulateMedia('screen')` must be called before `page.goto()` — ensures screen CSS is active from the start of page load; calling after goto would miss CSS applied during initial render
- `Buffer` from `page.pdf()` must be converted to `Uint8Array` for Next.js `Response` body compatibility (TypeScript 5.x strict check)
- PDF render target returns `<div>No proposal data</div>` instead of redirect — Playwright would silently fail if the page redirects before rendering
- Spinner `@keyframes spin` defined in inline `<style>` tag inside ProposalFAB — keeps the client component self-contained without needing global CSS changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed paul-friesen-config.ts missing defaultPreSolarRate field**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** `AlbertaConfig` interface had `defaultPreSolarRate` added in a previous phase but the test fixture was never updated, causing a TS2741 compile error
- **Fix:** Added `defaultPreSolarRate: d('0.0725')` to the fixture (matches the fallback value in `alberta.ts`)
- **Files modified:** `src/test-data/paul-friesen-config.ts`
- **Verification:** `npx tsc --noEmit` passes with 0 errors
- **Committed in:** `a73e56d` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Buffer not assignable to BodyInit in api/pdf/route.ts**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** `page.pdf()` returns `Buffer<ArrayBufferLike>` which TypeScript rejects as `BodyInit` for `new Response()` body
- **Fix:** Converted `pdfBuffer` to `new Uint8Array(pdfBuffer)` before passing to Response constructor
- **Files modified:** `src/app/api/pdf/route.ts`
- **Verification:** `npx tsc --noEmit` passes with 0 errors
- **Committed in:** `9fbe3fb` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes required for TypeScript compilation to pass. No scope creep — fixes pre-existing bug + TypeScript version incompatibility.

## Issues Encountered
None beyond the auto-fixed TypeScript errors above.

## User Setup Required

**Environment variable required before testing:**
Add to `.env.local`:
```
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```
Without this, the API route falls back to deriving the base URL from request headers (which works correctly for local dev but should be explicit).

## Next Phase Readiness
- Full PDF pipeline implemented and TypeScript-clean
- Ready for Plan 05-02: end-to-end verification checkpoint (navigate to /proposal, click Download PDF, verify file downloads)
- No blockers — Playwright is already installed (`^1.58.2` in package.json)

---
*Phase: 05-pdf-generation*
*Completed: 2026-03-03*
