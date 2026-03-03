---
phase: 04-proposal-rendering
status: complete
completed: "2026-03-03"
plans_completed: 4
---

# Phase 4: Proposal Rendering — Complete

**One-liner:** Full 11-page scroll-snap solar proposal with NRG light theme, real customer data on pages 1/3/4/5, static marketing content on pages 2/6-11, Recharts charts, and all pages pixel-verified against reference PNGs.

## What Was Built

### Infrastructure (Plan 01)

URL encoding utilities (`encodeProposalParams` / `decodeProposalParams` via `btoa(encodeURIComponent(JSON.stringify(...)))`), NRG light-theme CSS custom properties scoped to `.proposal-root`, Bebas Neue (`--font-display`) and Montserrat (`--font-montserrat`) Google fonts, async server component at `/proposal` calling `calculateProposal()` directly, scroll-snap full-viewport container pattern (`.proposal-page` + `.proposal-inner`), and `/enter` Generate button wired to navigate to `/proposal?d={encoded}`.

### Dynamic Pages (Plan 02)

Pages 1, 3, 4, and 5 built with real `SerializedProposalOutputs` data: CoverPage (customer info, system size, solar offset, 20yr savings), NetMeteringPage (4 rate cards, 12-month table with surplus highlighting), CarbonCreditsPage (dark green panel with CO₂ stats, Alberta benchmark schedule table), AllInCostsPage (cash vs finance two-column layout, derived monthly line items, gold savings banner). Two Recharts charts installed with `--legacy-peer-deps`: `ProductionConsumptionChart` (ComposedChart, bars + line) and `UtilityTrendChart` (LineChart, 20-year projection). Both use `dynamic import ssr:false` to prevent hydration mismatches.

### Static Marketing Pages (Plan 03)

Seven static NRG-branded pages completing the 11-page proposal: TableOfContentsPage (3-column numbered grid), PriceHistoryPage (inline SVG area chart, Alberta rate history 2010–2024), WhatsComingPage (two force cards: rising demand vs aging infrastructure), WhyUsPage (green banner header, 4 stat boxes, testimonial), WarrantyPage (2×2 warranty cards with green accents), FAQPage (2-column grid, 6 Q&A panels), NextStepsPage (6-step 2-column grid with CTA bar). All 11 pages assembled in `proposal/page.tsx`.

### Pixel-Perfect Review (Plan 04)

All 11 pages reviewed and redesigned iteratively against reference PNGs (`reference/page-01.png` through `reference/page-11.png`). Major changes: CoverPage layout fix (`justifyContent: flex-start` override, absolute right panel at 44% width with pill badge), TableOfContentsPage (NRG logo, correct grid), NetMeteringPage (4 rate card types with correct color coding, green surplus rows, month chips), CarbonCreditsPage (mint CO₂ number, correct benchmark table layout), AllInCostsPage (derived cashback calculation, gold banner), FAQPage and NextStepsPage fully redesigned to match reference. `ProposalFAB` speed-dial added (3 links: NAIT snow study, hail test video, solarclub.ca).

## All Files Created/Modified

### New Files Created

**Page Components:**
- `src/app/proposal/pages/CoverPage.tsx`
- `src/app/proposal/pages/TableOfContentsPage.tsx`
- `src/app/proposal/pages/NetMeteringPage.tsx`
- `src/app/proposal/pages/CarbonCreditsPage.tsx`
- `src/app/proposal/pages/AllInCostsPage.tsx`
- `src/app/proposal/pages/PriceHistoryPage.tsx`
- `src/app/proposal/pages/WhatsComingPage.tsx`
- `src/app/proposal/pages/WhyUsPage.tsx`
- `src/app/proposal/pages/WarrantyPage.tsx`
- `src/app/proposal/pages/FAQPage.tsx`
- `src/app/proposal/pages/NextStepsPage.tsx`

**Chart Components:**
- `src/app/proposal/charts/ProductionConsumptionChart.tsx`
- `src/app/proposal/charts/UtilityTrendChart.tsx`

**Utilities:**
- `src/lib/proposal/url-params.ts`

**CSS:**
- `src/app/proposal/proposal.css`

**Routes:**
- `src/app/proposal/page.tsx`

### Files Modified

- `src/app/layout.tsx` — added Bebas Neue and Montserrat font variables
- `src/app/enter/page.tsx` — wired Generate button to `/proposal?d={encoded}`

## Key Decisions (Locked for Future Phases)

| Decision | Detail |
|----------|--------|
| CSS scoped to `.proposal-root` | NRG light-theme variables do NOT use `:root` — prevents bleed into `/enter` dark theme |
| URL param key `d` | Single base64 blob: `btoa(encodeURIComponent(JSON.stringify(values)))` — Unicode-safe, lossless |
| Server component engine call | `proposal/page.tsx` calls `calculateProposal()` directly — no server action boundary needed |
| No hard Maps API dependency | `buildSatelliteImageUrl` returns `null` if `GOOGLE_MAPS_API_KEY` absent |
| recharts with `--legacy-peer-deps` | vitest peer conflict does not affect runtime; both toolchains work independently |
| Recharts `dynamic import ssr:false` | Applied to both chart components — prevents Next.js hydration mismatches |
| PriceHistoryPage uses inline SVG | No charting library — hardcoded path data avoids Recharts dynamic import complexity for static page |
| FAQPage 2-column grid | Not a vertical accordion — fits `proposal-page` height constraint without scrolling |
| NextStepsPage 2-column step cards | Not a vertical timeline — better space utilization in fixed viewport |
| ProposalFAB speed-dial | Fixed-position FAB with 3 links: NAIT snow study, hail test video, solarclub.ca |
| All 11 pages human-verified | Reviewed pixel-for-pixel against `reference/page-01.png` through `reference/page-11.png` |
| CoverPage layout override | `justifyContent: flex-start` on `.proposal-page` wrapper — overrides CSS center for absolute right panel |
| AllInCostsPage cashback derived | `monthlyCashBack = finance + gridCost - nmRev - carbon - monthlyAllIn` — avoids needing `cashBackRate` prop |
| Carbon credit monthly proxy | `carbonCredit = tenYearPayoutLow / 120` (10yr average ÷ 12 months) |

## Architecture Patterns Established

### `.proposal-page` + `.proposal-inner` Container Pattern

```
.proposal-page          scroll-snap target, 100vh, flex center
  └─ .proposal-inner    max-width: 1600px, centered
       └─ page content
```

- **Full-height pages** (Page 1 CoverPage): `.proposal-inner` default `height: 100%`
- **Compact/centered pages** (Pages 2–11): `.proposal-inner` with `style={{ height: 'auto' }}` — content auto-sizes and centers within viewport
- **CoverPage exception**: `justifyContent: flex-start` on `.proposal-page` wrapper (overrides CSS center) due to absolute-positioned right panel

### CSS Variable Naming (all scoped to `.proposal-root`)

| Variable | Value | Usage |
|----------|-------|-------|
| `--nrg-green` | `#00793f` | Primary green, accents |
| `--nrg-gold` | `#f5a623` | Gold/amber highlights |
| `--nrg-red-badge` | `#df584d` | TOC number badges |
| `--nrg-page-bg` | `#ecf7ff` | Light blue page background |
| `--nrg-text-heading` | `#0d1b2a` | Dark headings |
| `--nrg-text-secondary` | `#6b8299` | Secondary text |
| `--nrg-surplus-green` | `#1aad5e` | Net metering surplus rows |
| `--nrg-card-bg` | `white` | Card/panel backgrounds |
| `--font-display` | Bebas Neue | Large display headings |
| `--font-montserrat` | Montserrat | Stat numbers |
| `--font-sans` | DM Sans | Body text |

### Component Prop Shape

All dynamic page components receive props directly from `SerializedProposalOutputs` fields serialized in `src/app/proposal/page.tsx`. Key prop conventions:

- All numeric values are `string` (Decimal serialized to string — never converted through `float`)
- Monthly arrays are `string[]` length 12 (indexed 0–11)
- Page-specific computed props (e.g., `annualGridBuyKwh`, `annualSurplusKwh`) are derived in `page.tsx` via `.reduce()` on monthly arrays before being passed as props

### Chart Pattern

Both Recharts charts use:
```tsx
const Chart = dynamic(() => import('./charts/ChartName'), { ssr: false });
```
Formatter types use `number | undefined` with null guard to satisfy Recharts 3.x strict types.

## Phase Success Criteria — Verified

| Criterion | Result |
|-----------|--------|
| 11-page scrollable proposal renders after data entry | PASS |
| Pages 1-5 display correct customer-specific data | PASS |
| Pages 6-11 render static marketing content | PASS |
| Charts render correctly (no hydration errors) | PASS |
| Northern NRG branding applied throughout | PASS |

## What Phase 5 Needs to Know

Phase 5 (PDF Generation) renders the `/proposal` route via Playwright. Critical notes:

1. **`emulateMedia('screen')` before `page.goto()`** — Must be called first to ensure screen CSS is active from page load start. `@media print` would strip `--nrg-page-bg` backgrounds otherwise.

2. **Scroll-snap must be disabled for PDF** — The `/proposal/pdf` render target (added in Phase 5 Plan 01) disables scroll-snap CSS. The standard `/proposal` route should NOT be used as the PDF source.

3. **Recharts charts use `dynamic import ssr:false`** — Playwright must wait for chart render before capturing PDF. Both `ProductionConsumptionChart` and `UtilityTrendChart` are client-side only.

4. **CoverPage `justifyContent: flex-start` override** — Applied on `.proposal-page` wrapper element. The absolute right panel is 44% wide with `borderTopLeftRadius`/`borderBottomLeftRadius: 140px`. Verify this renders correctly at PDF viewport dimensions.

5. **Background preservation** — Pages alternate between `--nrg-page-bg` (`#ecf7ff`) and `--nrg-card-bg` (white). Both use CSS variables, not hardcoded colors. `emulateMedia('screen')` is required (not `print`).

6. **Viewport for PDF** — 16:9 viewport (1600×900 or similar) matches the `100vh` scroll-snap layout. Letter-size (816×1056) was used in Phase 5 but pages are designed for landscape/widescreen.
