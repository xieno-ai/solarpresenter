# Phase 5: PDF Generation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "Download PDF" button to the proposal that triggers a Playwright-based PDF export matching the web preview pixel-for-pixel. This phase delivers PROP-08 only — the PDF file a sales rep hands to a customer. It does NOT change the web proposal layout or add new proposal pages.

</domain>

<decisions>
## Implementation Decisions

### Invocation Architecture
- **API route `/api/pdf`** — client passes the same `d` param (base64-encoded form values), API route spins up Playwright, navigates to the proposal, waits for full render, returns PDF buffer as `application/pdf` response
- Client-side download: response blob → `URL.createObjectURL()` → programmatic `<a>` click → PDF saved to disk
- Playwright runs inside the Next.js API route process (same Node.js server) — no separate PDF service needed for v1

### Print Layout
- **Separate `/proposal/pdf` route** — identical to `/proposal` but with no ProposalFAB, no back/edit button, no scroll chrome
- Playwright navigates to `/proposal/pdf?d=<base64>` (not the interactive `/proposal` URL) — gives a clean, UI-chrome-free target
- The `/proposal/pdf` route is not linked from the app UI; it exists only as Playwright's render target
- Print CSS (`@media print`) on both routes as a fallback, but the PDF route is the primary mechanism

### Page Size & Breaks
- **US Letter (8.5×11")** — standard for Alberta/Canada sales documents; use `format: 'Letter'` in Playwright `page.pdf()` options
- `printBackground: true` in Playwright options (required for background colors and gradients to appear)
- Each 100vh proposal page gets `break-after: page` (CSS) in the PDF route — one PDF page per proposal section
- No margin: `margin: { top: '0', right: '0', bottom: '0', left: '0' }` — full bleed matching web preview
- Pages use `width: 100vw; height: 100vh` in the PDF route, which maps to Letter dimensions at 96 DPI

### Font Loading
- Wait for `networkidle` before capturing: `page.waitForLoadState('networkidle')` — ensures Google Fonts finish loading
- Additional `page.waitForTimeout(500)` safety buffer after networkidle for chart animations to settle
- If fonts fail to load (offline/CI), Playwright proceeds anyway — fallback fonts are acceptable for testing but not production

### Download UX & File Naming
- **Add to ProposalFAB** as a 4th action item (primary action — appears first in the speed dial list, or as a prominent "Download PDF" button separate from the FAB)
- Loading state: FAB item shows spinner + "Generating..." while API route is working (disable re-click during generation)
- File name format: `NorthernNRG_[CustomerLastName]_[YYYY-MM-DD].pdf` — sorted alphabetically in file systems, branded, identifiable
- Error handling: if PDF generation fails (>30s timeout or Playwright crash), show a toast/inline error; don't leave user in silent failure

### Claude's Discretion
- Exact Playwright browser launch options (headless, args for sandboxing in various environments)
- Whether to cache the Playwright browser binary or install fresh each deploy
- How to pass the dev server URL to the API route (localhost:3001 in dev, production URL in prod — use `NEXT_PUBLIC_BASE_URL` env var or derive from request headers)
- Exact CSS for `break-after: page` and page height normalization in the PDF route
- Spinner/loading animation in the FAB

</decisions>

<specifics>
## Specific Ideas

- The PDF route `/proposal/pdf` should be visually identical to the web proposal — same CSS, same components, same data. The only difference is no interactive elements (FAB, back button) and the `break-after: page` CSS rules.
- The download button should feel fast-to-click even if generation takes 10-15s. Show immediate feedback (spinner starts instantly) so the user knows it's working.
- Playwright is already in package.json — just needs to be wired up. No new library decisions needed.
- File size target: under 5 MB. Playwright PDF output is typically 1-3 MB for 11 pages of CSS-rendered content without heavy raster images.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProposalFAB` (`src/app/proposal/ProposalFAB.tsx`): Client component with speed-dial pattern — add PDF download as a new item (or modify the FAB to make Download PDF the primary action)
- `/proposal/page.tsx`: Server component that decodes `d` param and renders all 11 pages — duplicate this logic for `/proposal/pdf/page.tsx`
- `decodeProposalParams()` from `src/lib/proposal/url-params` — reuse in the PDF route
- `calculateProposal()` from `src/lib/engine/calculate` — same call in the PDF route

### Established Patterns
- API routes don't exist yet — `src/app/api/pdf/route.ts` will be the first. Follow Next.js App Router API route conventions (`export async function GET(request: Request)`)
- `'playwright'` is already in package.json dependencies — no install step needed
- Client-side download via blob URL is the standard pattern for binary API responses in React

### Integration Points
- `ProposalFAB` is the primary entry point — add Download PDF trigger here
- New API route: `src/app/api/pdf/route.ts` — receives `?d=<base64>`, uses Playwright to hit `/proposal/pdf?d=<base64>`, returns PDF
- New PDF render route: `src/app/proposal/pdf/page.tsx` — same structure as `/proposal/page.tsx` but stripped of interactive UI
- Environment variable: `NEXT_PUBLIC_BASE_URL` (or derive from `request.headers.get('host')`) for Playwright to know which URL to navigate to

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-pdf-generation*
*Context gathered: 2026-03-03*
