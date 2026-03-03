# Phase 6: SunPitch Scraping - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can paste a SunPitch proposal URL and have all manual entry form fields auto-populated via Playwright-based browser automation, eliminating manual data entry for the primary sales workflow. This phase covers the scraping pipeline, URL entry UX, and pre-fill behavior only — the manual entry form already exists and is not modified beyond adding the URL tab.

</domain>

<decisions>
## Implementation Decisions

### URL Entry UX
- Two tabs at the top of `/enter`: **"Paste SunPitch URL"** and **"Manual Entry"**
- URL tab contains the SunPitch URL field and Import button
- After a successful scrape, auto-switch to the Manual Entry tab so the user can review and edit pre-filled values
- URL field starts blank every time (no localStorage persistence for the URL)
- Client-side format validation before hitting the server: check that the URL matches `app.sunpitch.com/facing/proposals/{uuid}` — show an inline error instantly if the format is wrong

### Pre-fill Behavior
- Scraped data performs a **full reset** — replaces all form values, no merging with existing manual entries
- Scraped fields are highlighted with a **light green background** on the input
- The green highlight clears when the user edits that field (their edit takes ownership)
- Fields the scraper tried but couldn't find get an **amber/yellow highlight** (distinguishes "scrape gap" from "user hasn't touched it")

### Partial Scrape Handling
- Default behavior: **partial fill** — populate every field that was found, leave the rest blank (or amber-highlighted)
- Auto-switch to Manual Entry tab after a partial scrape so the user can fill the gaps
- **Hard error threshold**: if customer name AND system size AND monthly production are all missing, treat as a critical failure (show error, don't partial-fill)
- Any data at all beyond those core fields = proceed with partial fill

### Progress & Error Feedback
- During the 5–15 second scrape: **cycling step-by-step status messages**
  - e.g. "Opening SunPitch proposal... Extracting customer info... Reading system data... Extracting monthly production..."
- Failure states appear **inline on the URL tab** (replaces the status area)
- No separate retry button — the URL field remains editable and the Import button re-enables after failure

### Claude's Discretion
- The scraper API route design (Next.js API route like `/api/scrape` vs server action — Playwright pattern from Phase 5 is available as reference)
- Exact Playwright selectors and wait strategies (DOM structure unknown until a real SunPitch URL is available for testing)
- The tab UI component styling (should feel consistent with the existing `/enter` form aesthetic)
- How to handle the satellite image: `CustomerInfo` already has `latitude`/`longitude` fields — scraper can try to extract coordinates from SunPitch, fall back to null if unavailable

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useForm` with `reset()` (`src/app/enter/page.tsx`): RHF's `reset()` accepts a full `ProposalFormValues` object — scraper output can call this directly to pre-fill all fields
- `loadFormDraft` / `saveFormDraft` (`src/lib/form/persistence.ts`): localStorage persistence exists — scraped values should probably also save to the draft so a page refresh doesn't wipe them
- `/api/pdf` route (`src/app/api/pdf/`): Playwright API route pattern — `/api/scrape` can follow the same structure
- `ProposalFormValues` Zod schema (`src/lib/form/schema.ts`): All form fields are strings. Scraper output must match this shape exactly (string numerics, string arrays for monthly values)
- `proposalFormSchema` monthly arrays: exactly 12 string entries — scraper must produce `string[]` of length 12 for `monthlyProductionKwh` and `monthlyConsumptionKwh`

### Established Patterns
- All numeric values are strings in the form layer — Decimal conversion happens at calculation boundary, not in the form
- Monthly arrays initialized with `Array(12).fill('0')` — scraper should use the same fill pattern for missing months
- Client component with `'use client'` directive — URL tab logic will live in the same client component as the form

### Integration Points
- `/enter` page: add a tab switcher at the top, URL tab renders the scrape UI, Manual Entry tab renders the existing form
- `/api/scrape` (new): POST with `{ url: string }`, returns `{ data: Partial<ProposalFormValues>, status: 'success' | 'partial' | 'error', missingFields: string[], message?: string }`
- Playwright install: already present in `package.json` (Phase 5) — no new dependency needed

</code_context>

<specifics>
## Specific Ideas

- The tab pattern on `/enter` should feel like a natural extension — not a bolt-on. The two tabs ("Paste SunPitch URL" / "Manual Entry") are the entry point to the whole data-entry experience.
- Step-by-step status messages during scraping make the wait feel like progress, not a hang.
- Green = "came from SunPitch", amber = "SunPitch couldn't find this" — the two-color system gives the user a clear mental model of what needs attention.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-sunpitch-scraping*
*Context gathered: 2026-03-03*
