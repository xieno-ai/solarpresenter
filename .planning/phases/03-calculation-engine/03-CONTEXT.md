# Phase 3: Calculation Engine - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all financial formulas that transform `ProposalInputs → ProposalOutputs`. Pure computation layer — no new UI components, no database writes. Covers: utility cost projections (20/30-year), monthly net metering analysis, carbon credit calculations, cash back, true all-in savings (cash purchase), and monthly finance analysis. Unit tests verify all sub-calculations against Paul Friesen reference values from the calculations document.

Phase 3 also upgrades the Generate button from the Phase 2 JSON stub to display actual `ProposalOutputs` — this gives an immediate visual test surface without waiting for Phase 4's full proposal renderer.

</domain>

<decisions>
## Implementation Decisions

### Function Signature & Config Coupling
- `calculateProposal(inputs: ProposalInputs, config: AlbertaConfig): ProposalOutputs` — pure synchronous function
- AlbertaConfig is passed as a second parameter; the caller (server action or server component) is responsible for fetching it via `getAlbertaConfig()`
- This keeps the engine fully testable without Supabase — tests pass a static AlbertaConfig fixture, no async setup
- The existing stub signature `(inputs: ProposalInputs): ProposalOutputs` is updated to `(inputs, config)` — a breaking change but no callers exist yet

### Generate Button Wiring
- Phase 3 upgrades the `/enter` Generate button to call a new server action (`calculateProposal` invocation via server action)
- Server action: fetches `getAlbertaConfig()`, converts form string values to Decimal, calls `calculateProposal(inputs, config)`, returns serialized `ProposalOutputs`
- Result displayed as a formatted JSON dump or structured summary on the `/enter` page — proves correctness visually before Phase 4 builds the full renderer
- No new routes — same `/enter` page shows results inline below the form

### Test Verification Strategy
- Exact value matching against reference values from the calculations document (Paul Friesen case)
- Every sub-calculation gets its own test: utility projection, net metering per month, carbon credits, cash back, savings summaries
- Tests use the `paulFriesenInputs` fixture from `src/test-data/paul-friesen.ts`
- A static `paulFriesenConfig` fixture (AlbertaConfig-shaped object with known values) is created in test-data — no Supabase in tests
- Expected output values are baked into test expectations from the calculations doc reference spreadsheet

### Edge Case Policy
- Surplus months (production ≥ consumption): gridBuyKwh = 0, surplusSoldKwh = production − consumption. No clamping errors — this is expected summer behavior.
- Zero-production months: all surplus fields = 0, gridBuyKwh = full consumption. Handled naturally by the math.
- Negative computed values (e.g., net savings negative due to high system cost): allowed — callers display as-is. No clamping to 0.

### Module Structure
- Claude's discretion on internal file organization within `src/lib/engine/`
- Sub-calculations may be extracted as named helper functions in the same file or split by domain (utility-projection.ts, net-metering.ts, etc.) — planner decides
- All exports go through `src/lib/engine/calculate.ts` as the public API

### Claude's Discretion
- Internal file structure within `src/lib/engine/`
- How to serialize/deserialize ProposalOutputs through the server action (Decimal → string for JSON transport)
- Exact display format of ProposalOutputs on the /enter page (JSON dump is fine)
- Intermediate rounding decisions where the calculations doc is ambiguous

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `d()` from `src/lib/decimal/index.ts`: Decimal construction from string — use everywhere, never from float literals
- `toFixed()`, `toNumber()`, `toJSON()`, `fromJSON()` from `src/lib/decimal/index.ts`: display and serialization helpers
- `paulFriesenInputs` from `src/test-data/paul-friesen.ts`: reference fixture with 12-month production/consumption data ready for test assertions
- `getAlbertaConfig()` from `src/lib/config/alberta.ts`: server action will call this to get config before passing to calculateProposal
- `get-defaults.ts` server action: established pattern for server action structure to follow

### Established Patterns
- All Decimal arithmetic via `d()` — never from float literals or JS arithmetic on raw numbers
- Supabase NUMERIC returned as strings, passed directly to `d()` — already handled in getAlbertaConfig
- Vitest for tests — `src/lib/decimal/decimal.test.ts` and `src/lib/form/__tests__/form-lib.test.ts` as examples
- Dark theme color scheme: emerald-400 for positive/savings values, red-400 for costs, sky-400 for consumption data

### Integration Points
- `calculateProposal()` in `src/lib/engine/calculate.ts` — the stub to implement
- `ProposalOutputs` type in `src/lib/types/proposal-outputs.ts` — already fully defined, must match exactly
- `/enter` page (`src/app/enter/page.tsx`) — Generate button currently shows JSON stub; Phase 3 wires to real server action
- Server action pattern: new `src/app/actions/calculate.ts` following `get-defaults.ts` pattern
- `AlbertaConfig` type in `src/lib/types/alberta-config.ts` — second parameter to calculateProposal

</code_context>

<specifics>
## Specific Ideas

- The calculations document (Solar_Proposal_Calculations.docx) is the authoritative source for all formulas — 8 sections covering input verification, utility projections, net metering, carbon credits, cash back, 20-year savings, 30-year savings, and monthly finance analysis
- Paul Friesen reference case (12.24 kW system, 15,408 kWh/year production, 12,000 kWh/year consumption, $30,000 cash price) is THE validation case — test assertions should reproduce spreadsheet values exactly
- Carbon credit calculations use: CO2 avoided (tonnes) = (annual production kWh / 1000) × 0.55 grid factor; payout range uses Alberta benchmark schedule from Supabase config
- Net metering: each month independently — if production > consumption, gridBuyKwh = 0 and surplusSoldKwh = production − consumption; if production < consumption, gridBuyKwh = consumption − production and surplusSoldKwh = 0
- Utility projections use geometric series: Year N cost = Year 0 cost × (1 + escalationRate)^N

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-calculation-engine*
*Context gathered: 2026-03-02*
