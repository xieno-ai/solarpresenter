# Phase 2: Manual Entry - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

A validated input form for all proposal fields (system size, 12-month production, 12-month consumption, current rate, system cost, financing terms, customer name/address). This form serves as the always-works fallback and defines the data schema every other input path (SunPitch scraping, bill extraction) must conform to. No calculations beyond validation — the calculation engine is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Form Structure
- Single scrollable page with all fields visible, grouped into labeled sections
- Each data group (Customer, System, Consumption, Rates, Financing) in its own Card component — reuses the existing rounded-xl, border, bg-neutral-900/50 pattern from Phase 1
- Two-column responsive grid layout for section cards — mirrors the smoke test page layout
- No progress indicator or sidebar — validation errors guide the user through required fields

### Monthly Values Input
- Always show 12 monthly fields for both production and consumption
- An "annual total" field at the top of each group auto-distributes into the 12 monthly fields using the Alberta solar curve when entered
- Monthly fields remain editable after auto-fill — user can tweak individual months
- Annual total field stays in sync: updates to reflect the sum of all 12 months if any individual month is changed
- Compact 4x3 grid layout (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec) for each set of monthly fields
- Production and consumption monthly grids displayed side-by-side in one wide card for easy month-by-month comparison

### Validation Behavior
- Field-level validation triggers on blur (when user leaves a field)
- Required field errors: red border around the field with a short inline message below (e.g., "Required" or "Must be 1-100 kW")
- Range checks on all numeric inputs (e.g., system size 1-100 kW, monthly kWh 0-5000)
- Cross-field validation warnings (e.g., system size vs total production mismatch): amber non-blocking banner at the top of the relevant section — user CAN still generate the proposal
- Blocking errors (missing required fields, out-of-range values) prevent generation — separate from amber warnings
- Rate fields (all-in rate, buy rate, sell rate, escalation) pre-filled from Alberta config defaults via Supabase — user can override any value

### Generate Action
- Sticky footer bar always visible at bottom of viewport
- Footer shows validation status (e.g., "3 fields remaining") and the Generate Proposal button
- Generate button disabled until all required fields are valid (blocking errors resolved)
- No confirmation step — clicking Generate goes straight to proposal generation
- For Phase 2 stub: Generate shows the validated ProposalInputs as formatted JSON (proves the form correctly builds the data contract)

### Data Persistence
- Auto-save form state to localStorage on every change
- If user refreshes or closes tab, form data persists
- Future phases (SunPitch scraping, bill extraction) can write to the same localStorage store to pre-fill the form

### Claude's Discretion
- Specific field ordering within each section card
- Input component styling details (border radius, focus ring color, etc.)
- How the annual-to-monthly distribution animation/transition works
- Exact validation messages and error copy
- localStorage key naming and serialization approach
- Mobile responsive breakpoints and single-column fallback

</decisions>

<specifics>
## Specific Ideas

- The smoke test page already shows the Paul Friesen reference data in the Card/DataRow pattern — the form should feel like the "editable version" of that same layout
- The ProposalInputs TypeScript type (5 nested groups: CustomerInfo, SystemInfo, ConsumptionInfo, RateInfo, FinancingInfo) is already defined — the form maps 1:1 to this contract
- MonthlyValues type is a 12-element Decimal tuple — form needs to construct this from user input
- Alberta config defaults are already in Supabase with effective date filtering — pre-fill rates from the active config

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component (src/app/page.tsx): rounded-xl, border neutral-800, bg-neutral-900/50 — can be extracted and reused
- `DataRow` component (src/app/page.tsx): label-value display with mono and highlight variants
- `SectionLabel` component (src/app/page.tsx): amber uppercase monospace label for section headers
- `Divider` component (src/app/page.tsx): border-t separator within cards
- `d()` and `toFixed()` from src/lib/decimal: Decimal.js construction and formatting utilities
- Paul Friesen test fixture (src/test-data/paul-friesen.ts): reference data for form pre-population testing

### Established Patterns
- DM Sans (--font-sans) for body text, JetBrains Mono (--font-mono) for data/labels
- Dark theme: neutral-950 bg, neutral-100 text, amber-400 accents, emerald-400 for positive values, sky-400 for consumption
- Tailwind CSS with no component library — hand-rolled components
- Next.js App Router with server components (page.tsx is async server component)
- Supabase clients: server.ts (server components) and client.ts (client components)

### Integration Points
- Form page will be a new route (client component — needs useState, event handlers)
- Form output must construct a valid ProposalInputs object matching src/lib/types/proposal-inputs.ts
- Rate defaults fetched from getAlbertaConfig() in src/lib/config/alberta.ts
- Generate action will eventually call calculateProposal() from src/lib/engine/calculate.ts (Phase 3)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-manual-entry*
*Context gathered: 2026-03-02*
