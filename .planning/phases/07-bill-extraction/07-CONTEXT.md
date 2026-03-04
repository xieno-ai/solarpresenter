# Phase 7: Bill Extraction - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Two deliverables:
1. **Landing page hub** (`/`) — a card-grid tool selector that serves as the app's new homepage, replacing the current smoke test page. Links to Proposal Creator and Bill Extractor (and future tools).
2. **Bill Extractor tool** (`/bill`) — standalone AI-powered utility bill reader. User uploads a bill, AI extracts consumption and rate data, results display as a structured card for manual copy/paste. Does NOT connect to the proposal form — no pre-fill, no auto-submit.

**Route changes:**
- `/` → Landing hub (replaces current smoke test page)
- `/enter` → renamed to `/proposal` (Proposal Creator)
- `/bill` → new Bill Extractor tool

**Out of scope:** Pre-filling the proposal form from bill data (user explicitly chose standalone tool). Authentication and saved history (deferred to future phase).

</domain>

<decisions>
## Implementation Decisions

### Landing Page (/)
- Card grid layout — each tool is a card with name + one-line description
- Open access — no login required (consistent with current app)
- Extensible: adding future tools means adding cards, no structural change needed
- Two cards at launch: "Proposal Creator" (→ /proposal) and "Bill Extractor" (→ /bill)

### Route Structure
- `/` — landing hub
- `/proposal` — proposal creator (rename from `/enter`)
- `/bill` — bill extractor (new)
- Any existing `/enter` links should redirect to `/proposal`

### AI Service
- **Gemini Flash** (latest available model at implementation time) via Google Generative AI SDK
- Chosen for native PDF support — no PDF-to-image conversion step needed
- Accepts: PDF, JPG, PNG, HEIC

### Extraction Fields
Full extraction — AI attempts all of:
- Monthly electricity usage (kWh) × 12 months
- Annual electricity usage (kWh total)
- All-in rate (¢/kWh)
- Energy/commodity rate (¢/kWh)
- Utility provider name
- Account holder name
- Service address

### Result UX
- After upload + processing, the upload UI **swaps out** and the extracted values card **replaces it** in place — no navigation, no scroll
- "Re-upload" option available to try again
- **Missing fields** shown in the card with "Not found" label in amber — same visual language as Phase 6's amber highlight for scrape gaps
- **Copy UX**: per-field copy button on each value + "Copy all as text" button at the top/bottom of the card
- "Copy all" formats as plain text block (e.g. label: value pairs) suitable for pasting into notes or email

### Loading Experience
- Step-by-step status messages during extraction (5–15 second wait):
  - "Uploading bill..."
  - "Reading document..."
  - "Extracting usage data..."
  - "Extracting rate information..."
  - "Finalizing results..."
- Same pattern as SunPitch scraping — makes wait feel like progress

### Claude's Discretion
- Exact Gemini model ID (use latest Flash at implementation time)
- Gemini API prompt design and structured output schema
- File size limits and validation messaging
- Error handling for unreadable bills (corrupt file, non-bill document uploaded)
- Exact copy-all text format
- Landing page card visual design (within the project's dark theme)
- Whether `/enter` redirects (301) or is removed entirely

</decisions>

<specifics>
## Specific Ideas

- User referenced 123apps.com as a functional reference for the landing page concept — tool selection hub where each tool is self-contained. NOT a design reference, just the interaction model: land → pick tool → use tool → done.
- Bill extractor is a utility for sales reps to quickly read a customer's bill during a site visit or call — the copy/paste flow suggests it'll be used alongside other tools (SunPitch, manual form), not as a pipeline.
- Auth + saved history was mentioned as a future desire: "save proposals created and extracted values for easy review later." Noted for future phase planning.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SunPitchTab` component (`src/app/enter/components/SunPitchTab.tsx`): Step-by-step status message pattern — bill extractor loading UX should follow the same approach
- `HighlightMap` type (`src/lib/scraper/types.ts`): Amber/green highlight system — "Not found" amber styling can reuse the same visual pattern
- `SectionCard` (`src/components/form/SectionCard.tsx`): Card component for structured content display
- `/api/scrape/route.ts`: API route pattern (POST → process → return structured result) — `/api/extract-bill` should follow same shape
- `ProposalFormValues` schema: No direct use, but the extracted field names should align with this schema's field names for future compatibility

### Established Patterns
- Dark theme: neutral-950 bg, neutral-100 text, amber-400 accents, emerald-400 positive values
- All API routes are Next.js App Router route handlers (`route.ts`)
- Client components use `'use client'` + `useState`/`useEffect`
- Loading/error states handled inline (no toast library — inline status messages)

### Integration Points
- `/` (homepage): currently `src/app/page.tsx` (smoke test) — replace with landing hub
- `/proposal`: new route, move `/enter` page here (rename `src/app/enter/` → `src/app/proposal/` — note: proposal rendering is at `src/app/proposal/` already — need to check for collision)
- `/bill`: new route at `src/app/bill/page.tsx`
- `/api/extract-bill`: new API route, POST with file, returns `{ fields: ExtractedBillFields, status: 'success' | 'partial' | 'error' }`

### Route Collision Note
- `src/app/proposal/` currently contains the proposal rendering (11-page proposal viewer)
- The proposal creator (form) is at `src/app/enter/`
- Renaming `/enter` → `/proposal` would collide with the existing proposal renderer
- Planner must resolve: either keep `/enter` URL (add redirect from old URL), use `/create` or `/new`, or restructure the proposal renderer to a different path

</code_context>

<deferred>
## Deferred Ideas

- **Auth + user accounts + saved history** — user wants login and the ability to review past proposals and extracted bills. Significant new capability requiring auth infrastructure. Future phase after current roadmap.
- **Bill extraction → proposal form pre-fill** — original Phase 7 roadmap goal. User chose standalone tool instead. Could be re-added as a "connect" feature once both tools are stable.

</deferred>

---

*Phase: 07-bill-extraction*
*Context gathered: 2026-03-04*
