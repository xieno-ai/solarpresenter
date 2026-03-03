# Phase 4: Proposal Rendering - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete 11-page in-browser solar proposal renderer. Users navigate to a `/proposal` route after clicking Generate, see all 11 pages as a scroll-snapping continuous document, and can return to `/enter` to edit. Pages 1-5 are dynamic (customer-specific calculated data), Pages 6-11 are static marketing content. PDF generation is Phase 5 — this phase delivers the web view only.

</domain>

<decisions>
## Implementation Decisions

### Route & Data Handoff
- New `/proposal` route — separate from `/enter`
- Data handoff: URL-based with server-side recalculation. Form values encoded into URL params (or a short param string); `/proposal` server component fetches AlbertaConfig and re-runs `calculateProposal()` on the server. This keeps the page fully server-rendered and sets up Phase 9 shareable URLs naturally.
- Back button in proposal header → returns to `/enter`; form data persists in localStorage so edits can be made and regenerated

### Visual Theme
- Proposal page uses a **light theme** matching the Northern NRG PDF template — breaks from the dark app (neutral-950) intentionally
- The template PDF is the source of truth for colors, layout, and proportions
- **Pixel-accurate match** to the template — this is a customer-facing sales document, sales reps need confidence it matches what customers expect
- The researcher agent MUST analyze the PDF at `c:\Users\David\Downloads\Solar Template.pdf` to extract exact hex colors, font sizes, section backgrounds, table styles, and icon placements before planning

### Page Layout
- Continuous scroll with **CSS scroll-snap**: each page snaps fully into view as user scrolls through
- Each "page" is a viewport-height section (`height: 100vh`) with `scroll-snap-align: start`
- Container uses `scroll-snap-type: y mandatory` and `overflow-y: scroll`
- All 11 pages rendered in the DOM at once (no lazy loading needed for 11 pages)

### Charts (PROP-09)
- **Recharts** — React-native SVG charting library. Two charts required:
  1. Utility cost projection trend line (20-year escalating costs)
  2. Production vs consumption comparison (monthly bar/area chart)
- Both charts use real `ProposalOutputs` data (from `SerializedProposalOutputs`)
- Chart colors must match the NRG template palette (greens, gold)

### Satellite Image (Page 1 Cover)
- **Google Maps Static API** — use the customer's address to fetch a real satellite image
- API key stored in environment variable (`GOOGLE_MAPS_API_KEY`)
- Fetched server-side in the `/proposal` server component
- If address is missing or API key not set: fall back to a styled placeholder with the address text

### Static Content Pages (Pages 6-11)
- **Hardcoded in React components** — content baked into the component code matching the PDF template
- Pages: Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps
- Price History page (Page 6): static chart image/SVG matching the template (not a Recharts chart — historical rate data doesn't change proposal-to-proposal)

### Edit Flow
- Header on `/proposal` page contains a "← Edit" button
- Clicking returns to `/enter` — localStorage draft preserves all form values
- No state needs to be explicitly passed back; localStorage handles persistence

### Claude's Discretion
- Exact URL encoding scheme for passing form values to `/proposal` (query params vs base64 vs compressed JSON)
- Component file structure within `src/app/proposal/`
- Exact CSS scroll-snap implementation details (overflow container placement)
- Spacing, padding, and responsive breakpoints within each page component
- How to handle Google Maps API quota/rate limiting
- Loading states during proposal generation (skeleton vs spinner)

</decisions>

<specifics>
## Specific Ideas

- The template PDF is at `c:\Users\David\Downloads\Solar Template.pdf` — researcher MUST read and extract: exact background colors per section, font sizes for headings/body/labels, table border styles, the green/dark-green/gold color palette values, logo placement, icon styles
- Scroll-snap behavior: feels like swiping through presentation slides, but via scroll. Each page fills the viewport completely — no partial page peeking
- The proposal is a sales document; it should feel polished and final, not like an app UI
- The `/enter` page already shows calculation output (the Phase 3 debug view) — the Generate button should navigate to `/proposal` instead of showing inline results

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SectionCard`, `FormInput`, `MonthlyGrid`, `GenerateFooter` components in `src/components/form/` — not directly reusable for proposal pages (different design) but show component patterns
- `runCalculation` server action in `src/app/actions/calculate.ts` — re-use or create a parallel version for the proposal server component
- `getAlbertaConfig()` from `src/lib/config/alberta.ts` — needed by proposal server component
- `SerializedProposalOutputs` type from `src/app/actions/calculate.ts` — the data contract for proposal components
- `d()`, `toFixed()` from `src/lib/decimal` — for any Decimal formatting in proposal components

### Established Patterns
- DM Sans (`--font-sans`) for body, JetBrains Mono (`--font-mono`) for data/labels — these carry forward even in the light-themed proposal
- Next.js App Router: new route at `src/app/proposal/page.tsx` as a server component
- Supabase server client via `src/lib/supabase/server.ts`
- Dark theme color tokens (neutral-*, amber-400, emerald-400) are app UI — proposal will define its own light theme tokens

### Integration Points
- `/enter` page (`src/app/enter/page.tsx`): `onSubmit` currently shows inline results — change to `router.push('/proposal?...')` with encoded form values
- `calculateProposal()` from `src/lib/engine/calculate.ts` — called server-side in `/proposal/page.tsx`
- `ProposalFormValues` schema from `src/lib/form/schema.ts` — used to decode URL params back to typed form values
- Google Maps Static API: `https://maps.googleapis.com/maps/api/staticmap?...` — new external dependency, needs API key in `.env.local`

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-proposal-rendering*
*Context gathered: 2026-03-03*
