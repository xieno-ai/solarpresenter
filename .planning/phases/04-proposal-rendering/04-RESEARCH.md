# Phase 4: Proposal Rendering - Research

**Researched:** 2026-03-03
**Domain:** Next.js App Router server components, CSS scroll-snap, Recharts, Google Maps Static API, PDF template pixel-matching
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `/proposal` route — separate from `/enter`
- Data handoff: URL-based with server-side recalculation. Form values encoded into URL params (or a short param string); `/proposal` server component fetches AlbertaConfig and re-runs `calculateProposal()` on the server. This keeps the page fully server-rendered and sets up Phase 9 shareable URLs naturally.
- Back button in proposal header → returns to `/enter`; form data persists in localStorage so edits can be made and regenerated
- Proposal page uses a **light theme** matching the Northern NRG PDF template — breaks from the dark app (neutral-950) intentionally
- The template PDF is the source of truth for colors, layout, and proportions
- **Pixel-accurate match** to the template — this is a customer-facing sales document, sales reps need confidence it matches what customers expect
- The researcher agent MUST analyze the PDF at `c:\Users\David\Downloads\Solar Template.pdf` to extract exact hex colors, font sizes, section backgrounds, table styles, and icon placements before planning
- Continuous scroll with **CSS scroll-snap**: each page snaps fully into view as user scrolls through
- Each "page" is a viewport-height section (`height: 100vh`) with `scroll-snap-align: start`
- Container uses `scroll-snap-type: y mandatory` and `overflow-y: scroll`
- All 11 pages rendered in the DOM at once (no lazy loading needed for 11 pages)
- **Recharts** — React-native SVG charting library. Two charts required:
  1. Utility cost projection trend line (20-year escalating costs)
  2. Production vs consumption comparison (monthly bar/area chart)
- Both charts use real `ProposalOutputs` data (from `SerializedProposalOutputs`)
- Chart colors must match the NRG template palette (greens, gold)
- **Google Maps Static API** — use the customer's address to fetch a real satellite image
- API key stored in environment variable (`GOOGLE_MAPS_API_KEY`)
- Fetched server-side in the `/proposal` server component
- If address is missing or API key not set: fall back to a styled placeholder with the address text
- **Hardcoded in React components** — static content for pages 6-11 baked into component code matching the PDF template
- Price History page (Page 6): static chart image/SVG matching the template (not a Recharts chart)

### Claude's Discretion
- Exact URL encoding scheme for passing form values to `/proposal` (query params vs base64 vs compressed JSON)
- Component file structure within `src/app/proposal/`
- Exact CSS scroll-snap implementation details (overflow container placement)
- Spacing, padding, and responsive breakpoints within each page component
- How to handle Google Maps API quota/rate limiting
- Loading states during proposal generation (skeleton vs spinner)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROP-01 | Full 11-page branded proposal rendered as a web preview (scrollable, in-browser) | CSS scroll-snap pattern; 11 page components rendered in DOM at once |
| PROP-02 | Page 1 — Cover page with customer name, address, system size, solar offset %, 20-year utility cost, 20-year savings, satellite image | Google Maps Static API + SerializedProposalOutputs data fields mapped to cover layout |
| PROP-03 | Page 2 — Table of contents / roadmap with 9 numbered sections | Static component matching PDF page 2 layout exactly |
| PROP-04 | Page 3 — Net metering table with monthly breakdown plus rate cards | SerializedProposalOutputs.monthlyNetMetering array; 12-row table pattern from PDF |
| PROP-05 | Page 4 — Carbon credits section with CO2 avoided, 10-year revenue, Alberta benchmark schedule table | SerializedProposalOutputs.carbonCredits fields; 10-row schedule table from PDF |
| PROP-06 | Page 5 — True all-in costs with cash purchase breakdown and finance option side-by-side | SerializedProposalOutputs.cashPurchase and financeOption; two-column layout from PDF |
| PROP-07 | Pages 6-11 — Static marketing sections (Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps) | Hardcoded React components matching PDF content verbatim |
| PROP-09 | Charts/graphs — utility cost projection trend, production vs consumption visualization | Recharts v3.7.0 LineChart + ComposedChart; client components with dynamic import |
| PROP-10 | Northern NRG branding throughout — green/dark green/gold color scheme, logo, specific typography matching template PDF | Full color + font extraction from PDF (see Color Palette section below) |
</phase_requirements>

---

## Summary

Phase 4 builds the complete 11-page in-browser proposal renderer. The architecture is: a Next.js App Router server component at `/proposal/page.tsx` that receives `ProposalFormValues` encoded in URL search params, re-runs `calculateProposal()` server-side, fetches a satellite image from Google Maps Static API, and passes `SerializedProposalOutputs` to 11 page components rendered in a CSS scroll-snap container. Charts (Recharts) must be `'use client'` components, isolated from the server-rendered outer structure.

The Northern NRG template PDF was analyzed directly (1440×810px landscape pages). The exact color palette, fonts, and per-page background structure are documented below with verified hex values from PyMuPDF extraction. This is the canonical reference — every pixel decision should trace back to the PDF data in this document.

The primary technical risk is that Recharts (client component, browser-only) must be dynamically imported with `ssr: false` to avoid hydration mismatches in Next.js. The secondary risk is URL encoding: the full `ProposalFormValues` object (including 24 monthly values) must survive a `router.push()` call without exceeding URL length limits — base64-encoded JSON is the safest approach given the payload size.

**Primary recommendation:** Build the `/proposal` route as a server component that decodes URL params, runs calculation, then passes data down to 11 pure presentational components. Charts are isolated client islands with dynamic import. All proposal CSS variables defined in a dedicated `proposal.css` layer separate from the dark app theme.

---

## Template PDF Analysis

**Source:** `C:\Users\David\Downloads\Solar Template.pdf` (analyzed directly with PyMuPDF)
**Page dimensions:** 1440×810px (landscape 16:9) — each web page should render at this aspect ratio or fill 100vh
**Total pages:** 11

### Color Palette (extracted hex values)

| Role | Hex | Where Used |
|------|-----|------------|
| NRG Green (primary) | `#00793f` | Section labels (BebasNeue), table borders, icon accents |
| NRG Green (display) | `#007a3f` | Font rendering variation (same green, 1-value rounding) |
| Dark Green (background) | `#17573a` | Page 4 carbon credits dark panel |
| Light Green (tint) | `#1aad5e` | Surplus sold values in net metering table (positive green text) |
| Green tint bg (light) | `#e7faf0` | Page 4 right panel bg; page 5 finance column bg |
| Green tint bg (pale) | `#f5fff7` | Page 4 left panel bg; page 6 chart area |
| Net metering row green | `#f4fffa` | Page 3 surplus-month row background (the "green rows") |
| Gold accent | `#f5a623` | Page 5 bottom banner background; key stat highlights |
| Gold banner bg | `#fff7eb` | Page 5 gold banner inner (overlaid on #f5a623 outer) |
| Blue column | `#f0f9ff` | Page 5 cash purchase column bg |
| Blue header | `#4194d8` | Page 5 "CASH PURCHASE" label badge |
| Finance header | `#11834b` | Page 5 "FINANCE OPTION" label badge |
| Page background | `#ecf7ff` | Global page background (very light blue-white) |
| Dark text | `#1a2b3c` | Primary table text |
| Medium text | `#0d1b2a` | Table section headers |
| Muted text | `#6b8299` | Table column headers, caption text |
| Body text | `#171717` | Page 5 line-item text |
| Near-black text | `#182645` | Heading text on dark |
| Accent red | `#df584d` | Page 2 numbered badge backgrounds |
| Mint highlight | `#7effd4` | Page 4 large numeric display (annual CO2 tons) |
| White | `#ffffff` | Card backgrounds, inner containers |
| Chart red gradient | `#ed6b52`, `#fb8365`, `#fb7256` | Price history chart area fills |

### Font Inventory (verified from PDF)

| Font | Sizes Used | Role | Next.js Import |
|------|-----------|------|----------------|
| **BebasNeue** | 32px | Section sub-labels (e.g. "MONTH BY MONTH") | `Bebas_Neue` from `next/font/google` |
| **DM Sans Bold** | 50px, 31px, 21px, 19px | Main page headings | Already in layout.tsx as `--font-sans` |
| **DM Sans Regular** | 21px, 19px | Body paragraph text | Already in layout.tsx |
| **LiberationSans Bold** | 33px, 23px, 18px, 15px, 13px | Table headers, numbered items, sub-headers | Web equivalent: no exact match — use DM Sans Bold at same weights |
| **LiberationSans Regular** | 18px, 15px, 14px, 13px, 11px, 10px | Table body text, captions, footnotes | Web equivalent: DM Sans Regular |
| **Montserrat Regular/Medium** | 31px, 16px, 12px, 11px | Month labels in table, stat highlights | `Montserrat` from `next/font/google` |
| **IBM Plex Sans Bold** | 12-13px | Badge/label text | `IBM_Plex_Sans` from `next/font/google` OR use DM Sans Bold |
| **DejaVu Sans** | 12-13px | Miscellaneous labels | Standard web fallback acceptable |

**Key insight:** The PDF uses LiberationSans (a metric-compatible Arial/Helvetica replacement), which is not a web font. For the web version, DM Sans (already in the project) is the correct substitute — it shares similar proportions. Bebas Neue and Montserrat are available from `next/font/google`.

### Per-Page Structure

| Page | Background | Left Panel / Header | Right Panel | Notes |
|------|-----------|--------------------|-----------|----|
| 1 Cover | #ecf7ff full bleed | White card (559×331) with stats; satellite image top-right | Green (#00793f) accent strip | "ENERGY SAVINGS REPORT" in BebasNeue |
| 2 TOC | #ecf7ff + white | Two columns of 9 sections | Red (#df584d) right-side accent | Section numbers in large #007a3f |
| 3 Net Metering | #ecf7ff | White table card (858×648) with green border | Rate cards below table | Green rows (#f4fffa) for surplus months |
| 4 Carbon Credits | White + dark green | Dark green panel (#17573a) 604×331 with mint stats | Light green panel (#f5fff7) 633×331 | Green header band (#00793f) 1278×105 |
| 5 All-In Costs | White | Blue column (#f0f9ff) 621×420 — cash purchase | Green column (#e7faf0) 621×420 — finance | Gold banner (#f5a623) at bottom |
| 6 Price History | #ecf7ff | Large dark chart area (#f5fff7 surrounds it) | Stats overlay on chart | Static SVG/image chart |
| 7 What's Coming | #ecf7ff | Left card (#fff7eb) | Right card (#efecf0) | Two force cards side-by-side |
| 8 Why Us | #ecf7ff | Green banner (#4194d8 and #00793f) full width | Stat grid | Quote callout |
| 9 Warranty | #ecf7ff | White warranty cards grid | | 4 warranty types |
| 10 FAQ | #ecf7ff | White FAQ panels | | Two FAQ items shown |
| 11 Next Steps | #ecf7ff | 6-step timeline | | Step numbers, week indicators |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | ^16.1.6 (in use) | Server component at `/proposal/page.tsx`; async searchParams | Already installed; searchParams-as-Promise required |
| Recharts | 3.7.0 | SVG charts (LineChart, ComposedChart) | Locked decision; React 19 compatible in 3.x |
| TailwindCSS v4 | ^4.2.1 (in use) | Utility classes for proposal layout | Already in project |
| DM Sans | In use via `next/font/google` | Body text throughout proposal | Already loaded in layout.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Bebas Neue | via `next/font/google` | Section sub-labels ("MONTH BY MONTH", "TRUE ALL IN COSTS") | All 11 pages — key to template match |
| Montserrat | via `next/font/google` | Month labels, stat callouts | Pages 3, 4, 5 specifically |
| Google Maps Static API | (HTTP URL, no SDK) | Satellite image for cover page | Server-side fetch in page.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js, Victory, Nivo | Recharts is locked decision; also React-native SVG = no canvas issues with PDF generation in Phase 5 |
| Google Maps Static API | Mapbox Static, OpenStreetMap | Google Maps is locked decision |
| URL search params | localStorage, sessionStorage | URL approach enables Phase 9 shareable links; sessionStorage wouldn't survive tab close |

**Installation:**
```bash
npm install recharts
```

Bebas Neue and Montserrat load via `next/font/google` — no npm install needed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── enter/
│   │   └── page.tsx                    # MODIFY: router.push to /proposal on generate
│   └── proposal/
│       ├── page.tsx                    # Server component: decode params, run calc, fetch satellite
│       ├── proposal.css                # Proposal-specific CSS variables (light theme)
│       ├── ProposalViewer.tsx          # 'use client' scroll-snap container wrapper
│       ├── charts/
│       │   ├── UtilityTrendChart.tsx   # 'use client' — LineChart
│       │   └── ProductionChart.tsx    # 'use client' — ComposedChart
│       └── pages/
│           ├── CoverPage.tsx           # Page 1 — dynamic
│           ├── TableOfContentsPage.tsx # Page 2 — static
│           ├── NetMeteringPage.tsx     # Page 3 — dynamic
│           ├── CarbonCreditsPage.tsx   # Page 4 — dynamic
│           ├── AllInCostsPage.tsx      # Page 5 — dynamic
│           ├── PriceHistoryPage.tsx    # Page 6 — static
│           ├── WhatsComingPage.tsx     # Page 7 — static
│           ├── WhyUsPage.tsx           # Page 8 — static
│           ├── WarrantyPage.tsx        # Page 9 — static
│           ├── FAQPage.tsx             # Page 10 — static
│           └── NextStepsPage.tsx       # Page 11 — static
└── lib/
    └── proposal/
        └── url-params.ts              # encode/decode ProposalFormValues ↔ URL string
```

### Pattern 1: Server Component Proposal Page with Async SearchParams

**What:** `/proposal/page.tsx` is an async server component that receives `searchParams` as a Promise (Next.js 16 requirement), decodes form values, re-runs calculation, fetches satellite image, then renders all 11 page components.

**When to use:** Any data that comes from URL params in Next.js 16 App Router.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page (v16.1.6)
// src/app/proposal/page.tsx

import { calculateProposal } from '@/lib/engine/calculate';
import { getAlbertaConfig } from '@/lib/config/alberta';
import { decodeProposalParams } from '@/lib/proposal/url-params';
import { CoverPage } from './pages/CoverPage';
// ... other page imports

export default async function ProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const formValues = decodeProposalParams(params.d as string);

  const config = await getAlbertaConfig();
  const outputs = calculateProposal(buildInputs(formValues), config);
  const serialized = serializeOutputs(outputs);

  // Fetch satellite image server-side
  const satelliteUrl = formValues.customer.address && process.env.GOOGLE_MAPS_API_KEY
    ? buildSatelliteUrl(formValues.customer.address)
    : null;

  return (
    <div className="proposal-snap-container h-screen overflow-y-scroll snap-y snap-mandatory">
      <CoverPage
        customerName={formValues.customer.name}
        address={formValues.customer.address}
        outputs={serialized}
        satelliteUrl={satelliteUrl}
      />
      {/* ... remaining 10 page components */}
    </div>
  );
}
```

### Pattern 2: CSS Scroll-Snap Full-Page Layout

**What:** Each proposal page is a 100vh section. The container has `scroll-snap-type: y mandatory`. Each section has `scroll-snap-align: start`. The container must be the element with `overflow-y: scroll`, not the `html`/`body`.

**When to use:** In-browser presentation with slide-like scrolling behavior.

```css
/* src/app/proposal/proposal.css */
.proposal-snap-container {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}

.proposal-page {
  height: 100vh;
  min-height: 100vh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background: #ecf7ff;  /* NRG template page background */
  position: relative;
}
```

**Critical:** `scroll-snap-stop: always` prevents fast-scroll from jumping multiple pages. `overflow-y: scroll` (not `auto`) on the container ensures snapping works reliably across browsers.

### Pattern 3: Recharts as Client Island (Dynamic Import)

**What:** Recharts requires DOM access — it cannot server-render. Isolate each chart in a `'use client'` component and load it with `next/dynamic` + `ssr: false` from the parent server component (or RSC).

**When to use:** Any library that touches `window`, `document`, or browser layout APIs.

```typescript
// Source: https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html
// Verified: recharts GitHub issues #2918, community patterns

// src/app/proposal/charts/UtilityTrendChart.tsx
'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Props {
  projection20Year: string[]; // from SerializedProposalOutputs
}

export function UtilityTrendChart({ projection20Year }: Props) {
  const data = projection20Year.map((value, index) => ({
    year: `Year ${index + 1}`,
    cost: parseFloat(value),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7faf0" />
        <XAxis dataKey="year" tick={{ fill: '#6b8299', fontSize: 11 }} />
        <YAxis tick={{ fill: '#6b8299', fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="#00793f"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// --- Dynamic import in parent page component ---
// src/app/proposal/pages/AllInCostsPage.tsx (or wherever charts appear)
import dynamic from 'next/dynamic';

const UtilityTrendChart = dynamic(
  () => import('../charts/UtilityTrendChart').then(m => m.UtilityTrendChart),
  { ssr: false, loading: () => <div className="h-[280px] bg-neutral-100 animate-pulse rounded" /> }
);
```

### Pattern 4: URL Encoding for ProposalFormValues

**What:** The full `ProposalFormValues` including 24 monthly arrays is ~1KB of JSON. URL query strings work fine at this size (well under the 16KB Maps Static API limit for reference). Base64-encoded JSON passed as a single `d` param is the safest approach: avoids special character escaping issues and is easily decodable server-side.

**When to use:** Passing complex structured data between client and server via URL.

```typescript
// src/lib/proposal/url-params.ts
import type { ProposalFormValues } from '@/lib/form/schema';

export function encodeProposalParams(values: ProposalFormValues): string {
  return btoa(encodeURIComponent(JSON.stringify(values)));
}

export function decodeProposalParams(encoded: string): ProposalFormValues {
  return JSON.parse(decodeURIComponent(atob(encoded))) as ProposalFormValues;
}

// In /enter page submit handler:
// router.push(`/proposal?d=${encodeProposalParams(values)}`);
```

**Alternative (simpler):** Standard `URLSearchParams` with individual flat keys (e.g. `name`, `address`, `systemSize`, `monthlyProduction0`...`monthlyProduction11`). More readable URL but ~30 params. Base64 JSON is cleaner.

### Pattern 5: Google Maps Static API — Server-Side Fetch

**What:** The cover page satellite image is fetched server-side in the proposal page component. No client-side Maps SDK needed — just construct a URL and pass the image URL as a prop.

```typescript
// Source: https://developers.google.com/maps/documentation/maps-static/start
// In src/app/proposal/page.tsx (server component)

function buildSatelliteUrl(address: string): string {
  const params = new URLSearchParams({
    center: address,
    zoom: '19',           // Close enough to see roofline
    size: '600x400',      // Width × Height in pixels
    maptype: 'satellite',
    scale: '2',           // Retina quality
    key: process.env.GOOGLE_MAPS_API_KEY!,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params}`;
}

// Pass as: <CoverPage satelliteUrl={satelliteUrl} ... />
// In CoverPage: <img src={satelliteUrl} alt="Property satellite view" />
// With fallback:
// {satelliteUrl
//   ? <img src={satelliteUrl} ... />
//   : <div className="satellite-placeholder">{address}</div>}
```

### Pattern 6: Proposal Light Theme CSS Variables

**What:** The proposal uses a completely separate light theme from the dark app. Define all proposal colors as CSS custom properties scoped to the `.proposal-root` class, not the global `:root`. This ensures zero bleed between the app and proposal themes.

```css
/* src/app/proposal/proposal.css */
.proposal-root {
  /* Core brand colors — extracted from Solar Template.pdf */
  --nrg-green: #00793f;
  --nrg-dark-green: #17573a;
  --nrg-gold: #f5a623;
  --nrg-page-bg: #ecf7ff;
  --nrg-card-bg: #ffffff;

  /* Text */
  --nrg-text-primary: #1a2b3c;
  --nrg-text-secondary: #6b8299;
  --nrg-text-heading: #0d1b2a;

  /* Page-specific accents */
  --nrg-surplus-green: #1aad5e;       /* surplus sold text */
  --nrg-row-green: #f4fffa;           /* net metering surplus rows */
  --nrg-carbon-dark: #17573a;         /* carbon credits dark panel */
  --nrg-carbon-mint: #7effd4;         /* carbon stats display number */
  --nrg-cash-col-bg: #f0f9ff;         /* cash purchase column */
  --nrg-finance-col-bg: #e7faf0;      /* finance column */
  --nrg-cash-header: #4194d8;         /* cash purchase badge */
  --nrg-finance-header: #11834b;      /* finance badge */
  --nrg-gold-banner: #f5a623;         /* bottom summary banner */
  --nrg-gold-banner-inner: #fff7eb;   /* gold banner inner bg */
}
```

### Pattern 7: Fonts — Adding Bebas Neue and Montserrat

**What:** Layout already loads DM Sans and JetBrains Mono. The proposal needs Bebas Neue (section labels) and Montserrat (table month names). Add both to `layout.tsx` and expose as CSS variables.

```typescript
// Source: https://fonts.google.com/specimen/Bebas+Neue confirmed in next/font/google
// Modify src/app/layout.tsx:

import { DM_Sans, JetBrains_Mono, Bebas_Neue, Montserrat } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',           // Only one weight available
  variable: '--font-display',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-montserrat',
  display: 'swap',
});

// Add both variables to the html className
```

### Anti-Patterns to Avoid
- **Recharts without `ssr: false`:** Will cause hydration mismatches — SVG IDs generated server-side differ from client. Always dynamic import with `ssr: false`.
- **Scroll-snap on `body` or `html`:** Unreliable cross-browser. The snap container must be a `div` with explicit `height: 100vh` and `overflow-y: scroll`.
- **Fetching satellite image client-side:** Exposes `GOOGLE_MAPS_API_KEY` in client bundle. Always fetch server-side and pass `src` as prop.
- **Using `min-height: 100vh` for page sections:** Use `height: 100vh` (exact) for reliable snap alignment. `min-height` causes partial snap on short content.
- **Passing Decimal instances across server/client boundary:** Already solved via `SerializedProposalOutputs` — always use string serialized values in proposal components.
- **Synchronous `searchParams` access:** Next.js 16 requires `await searchParams` — accessing synchronously will throw a build error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG line charts | Custom SVG path calculations | Recharts LineChart | D3-based animation, responsive container, tooltip, correct SVG viewBox management |
| Responsive chart sizing | Manual window resize listeners | `ResponsiveContainer` from Recharts | Handles ResizeObserver, unmount cleanup, SSR width fallback |
| URL state serialization | Custom base64 scheme with custom escaping | `btoa(encodeURIComponent(JSON.stringify()))` pattern | Browser standard — handles all Unicode edge cases in customer names/addresses |
| Font loading | Manual `<link>` tags, `@font-face` | `next/font/google` | Zero layout shift, self-hosted at build time, no CORS issues |
| CSS custom scroll behavior | Intersection Observer + JS | CSS `scroll-snap-type: y mandatory` | Native browser — zero JS, works for Phase 5 PDF print context too |

**Key insight:** Charts are the highest-complexity item in this phase. Recharts already handles responsive sizing, animation, tooltip positioning, and SVG export compatibility (relevant for Phase 5 PDF). Don't replicate any of this.

---

## Common Pitfalls

### Pitfall 1: Recharts Hydration Mismatch
**What goes wrong:** Recharts generates unique IDs for gradient fills and clip paths during render. If server-rendered, these IDs differ from the client render, causing React hydration errors and broken chart styles.
**Why it happens:** Recharts uses incremental ID counters that reset between server and client renders.
**How to avoid:** Always use `dynamic(() => import('...'), { ssr: false })` for Recharts components. The chart renders only client-side; no SSR.
**Warning signs:** "Hydration failed" console errors; broken chart gradients; React warning about prop mismatch on `id`.

### Pitfall 2: Scroll-Snap Container Sizing
**What goes wrong:** Scroll snap doesn't work — pages don't snap, or content is cut off.
**Why it happens:** The snap container must have a fixed height (`100vh`) and `overflow-y: scroll`. If the `body` or a parent has `overflow: hidden`, scroll is blocked. If a page section uses `min-height` instead of `height`, snapping alignment is unreliable.
**How to avoid:** Structure as `<body style="margin:0; overflow:hidden"> → <div.snap-container style="height:100vh; overflow-y:scroll; scroll-snap-type:y mandatory"> → <div.page style="height:100vh; scroll-snap-align:start">`.
**Warning signs:** Scrolling feels free instead of snapping; pages partially visible; content overflows.

### Pitfall 3: searchParams Type in Next.js 16
**What goes wrong:** TypeScript error or runtime crash accessing searchParams synchronously.
**Why it happens:** Next.js 15 made `searchParams` a Promise; Next.js 16 (in use at `^16.1.6`) enforces async access and removes the backwards-compat synchronous path.
**How to avoid:** Always `const params = await searchParams` in async page components. Type the prop as `Promise<{ [key: string]: string | string[] | undefined }>`.
**Warning signs:** TypeScript error "Type '{ ... }' is not assignable to type 'Promise<...>'"; runtime error about sync dynamic API access.

### Pitfall 4: Satellite Image Leaking API Key
**What goes wrong:** `GOOGLE_MAPS_API_KEY` appears in client-side JavaScript bundle or network requests visible in browser DevTools.
**Why it happens:** If the satellite URL construction happens in a client component, the env var must be prefixed `NEXT_PUBLIC_` to be accessible — which exposes it to all users.
**How to avoid:** Build the Maps URL only in server components or server actions. Pass the complete URL string (not the API key) to client components. The API key stays server-side.
**Warning signs:** Network tab shows request to Maps Static API from browser; `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in code.

### Pitfall 5: URL Encoding Breaks on Special Characters
**What goes wrong:** Customer name or address with special characters (apostrophes, commas, #, %) breaks URL parsing on the proposal page.
**Why it happens:** Raw JSON stringified into query params without encoding causes `URLSearchParams` to misparse values.
**How to avoid:** Use `btoa(encodeURIComponent(JSON.stringify(values)))` on encode and `JSON.parse(decodeURIComponent(atob(encoded)))` on decode. This double-encodes safely.
**Warning signs:** Decoded form values have truncated names or missing address fields; JSON parse errors in proposal page.

### Pitfall 6: Light Theme Bleeding into Dark App
**What goes wrong:** Proposal page CSS variables override the app's dark theme for the `/enter` page.
**Why it happens:** If proposal CSS variables are defined on `:root`, they apply globally.
**How to avoid:** Scope all proposal CSS variables under `.proposal-root` class, only applied to the proposal page wrapper. Never set proposal vars on `:root`.
**Warning signs:** `/enter` page background turns light; dark theme tokens disappear.

---

## Code Examples

### ComposedChart — Production vs Consumption (Page 3 or 5)
```typescript
// Source: https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html
// Verified pattern for monthly production/consumption comparison
'use client';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  monthlyNetMetering: SerializedMonthlyNetMetering[];
}

export function ProductionConsumptionChart({ monthlyNetMetering }: Props) {
  const data = monthlyNetMetering.map((m, i) => ({
    month: MONTHS[i],
    consumption: parseFloat(m.consumptionKwh),
    production: parseFloat(m.productionKwh),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7faf0" />
        <XAxis dataKey="month" tick={{ fill: '#6b8299', fontSize: 10 }} />
        <YAxis tick={{ fill: '#6b8299', fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="consumption" fill="#ecf7ff" stroke="#6b8299" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="production"
          stroke="#00793f"
          strokeWidth={2}
          dot={{ fill: '#00793f', r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

### Google Maps Static API URL Construction
```typescript
// Source: https://developers.google.com/maps/documentation/maps-static/start
// Server-side only — GOOGLE_MAPS_API_KEY is a server-only env var

export function buildSatelliteImageUrl(address: string): string | null {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address.trim()) return null;

  const params = new URLSearchParams({
    center: address,
    zoom: '19',
    size: '640x400',
    scale: '2',
    maptype: 'satellite',
    key: apiKey,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
```

### Net Metering Table Row (Page 3 — surplus row detection)
```typescript
// Surplus months = months where surplusSoldKwh > 0
// Apply green row background (#f4fffa) and green text (#1aad5e) for revenue

function NetMeteringRow({ row }: { row: SerializedMonthlyNetMetering }) {
  const isSurplus = parseFloat(row.surplusSoldKwh) > 0;

  return (
    <tr
      style={{ backgroundColor: isSurplus ? '#f4fffa' : 'transparent' }}
    >
      <td style={{ color: '#1a2b3c', fontFamily: 'var(--font-montserrat)' }}>
        {row.month.toUpperCase().slice(0, 3)}
      </td>
      <td style={{ color: '#1a2b3c' }}>{row.consumptionKwh}</td>
      <td style={{ color: '#1a2b3c' }}>{row.productionKwh}</td>
      <td style={{ color: '#1a2b3c' }}>
        {parseFloat(row.gridBuyKwh) > 0 ? `${row.gridBuyKwh} kWh` : '—'}
      </td>
      <td style={{ color: isSurplus ? '#1aad5e' : '#1a2b3c', fontWeight: isSurplus ? 700 : 400 }}>
        {isSurplus ? `+${row.surplusSoldKwh} kWh` : '—'}
      </td>
      <td style={{ color: '#1a2b3c' }}>
        {parseFloat(row.costToBuy) > 0 ? `$${row.costToBuy}` : '—'}
      </td>
      <td style={{ color: isSurplus ? '#1aad5e' : '#1a2b3c', fontWeight: isSurplus ? 700 : 400 }}>
        {parseFloat(row.revenueEarned) > 0 ? `+$${row.revenueEarned}` : '—'}
      </td>
    </tr>
  );
}
```

### Navigate to Proposal from /enter Page
```typescript
// Modify src/app/enter/page.tsx — replace the onSubmit inline display with navigation
// router must come from 'next/navigation' in a 'use client' component
import { useRouter } from 'next/navigation';
import { encodeProposalParams } from '@/lib/proposal/url-params';

// In the submit handler:
const onSubmit = async (values: ProposalFormValues) => {
  const encoded = encodeProposalParams(values);
  router.push(`/proposal?d=${encoded}`);
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as synchronous prop | `searchParams` as `Promise<...>` requiring `await` | Next.js 15 (breaking), enforced in 16 | Must use `async function Page` and `await searchParams` |
| `next/router` | `next/navigation` (useRouter) | Next.js 13 App Router | `next/router` deprecated; always use `next/navigation` |
| Recharts 2.x + React 18 | Recharts 3.x + React 19 | Recharts 3.0 (2024) | React 19 fully supported in 3.x; no peer dep warnings |
| `params`/`searchParams` synchronous | Both now async Promises | Next.js 15-16 | All page components must be `async` or use React `use()` |

**Deprecated/outdated:**
- `next/router`: Use `next/navigation` instead
- `recharts@2.x` with `--legacy-peer-deps`: Install recharts 3.x which has native React 19 support

---

## Open Questions

1. **Proposal page viewport responsiveness**
   - What we know: PDF is 1440×810px (landscape 16:9); each web page is `100vh`
   - What's unclear: The proposal is designed for desktop viewing; on smaller screens, content at PDF-proportional sizes may overflow or become unreadable
   - Recommendation: For v1, target desktop viewport (1200px+). Add a minimum-width notice below 900px. Responsive layout is a v2 concern (MOBILE-01 is out of scope).

2. **Google Maps quota per proposal view**
   - What we know: Google Maps Static API has a free tier of $200/month credit (~100,000 static map requests/month at $2/1000). Each proposal view loads 1 image.
   - What's unclear: Whether to cache the satellite URL server-side per address to avoid repeated API calls
   - Recommendation: For v1 with low proposal volume, cache in memory or skip caching. Add a TODO comment. Phase 5 (PDF) will load the same URL — ensure it still works server-side there.

3. **Price History chart (Page 6) — static SVG vs recreation**
   - What we know: The CONTEXT.md says "static chart image/SVG matching the template (not a Recharts chart)"
   - What's unclear: Whether to embed the exact chart as a static SVG drawn by hand, or use a rasterized PNG of the template chart
   - Recommendation: Recreate as an inline SVG or a static Recharts-rendered output hardcoded with the historical values. Static SVG is Phase 5 PDF-safe. Do not use `<img>` with an external PNG.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs `https://nextjs.org/docs/app/api-reference/file-conventions/page` (v16.1.6, updated 2026-02-27) — searchParams async type signatures, verified
- Recharts GitHub releases `https://github.com/recharts/recharts/releases` — v3.7.0 confirmed latest stable (Jan 21, 2025)
- Google Maps Static API docs `https://developers.google.com/maps/documentation/maps-static/start` — URL format, parameters, satellite maptype confirmed
- Solar Template.pdf — analyzed directly with PyMuPDF: all hex colors, font names, sizes, page dimensions extracted and verified
- `D:/Cursor/Solar Presenter/src/app/layout.tsx` — confirmed DM Sans and JetBrains Mono already loaded
- `D:/Cursor/Solar Presenter/package.json` — confirmed Next.js ^16.1.6, React ^19.2.4, no recharts yet

### Secondary (MEDIUM confidence)
- `https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html` — Recharts + Next.js pattern with `'use client'` and `ResponsiveContainer`; verified against recharts GitHub issues
- `https://fonts.google.com/specimen/Bebas+Neue` — confirmed Bebas Neue on Google Fonts; available via `next/font/google` as `Bebas_Neue`
- MDN CSS scroll-snap documentation — `scroll-snap-type: y mandatory` and `scroll-snap-align: start` behavior verified

### Tertiary (LOW confidence)
- Satellite image zoom level 19 for rooftop visibility — community pattern; exact zoom may need tuning per address

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — PDF analyzed directly; recharts version confirmed from GitHub; Next.js version confirmed from package.json
- Architecture: HIGH — Next.js 16 searchParams pattern from official docs; scroll-snap from MDN; recharts SSR from GitHub issues
- PDF color palette: HIGH — extracted programmatically from PDF with PyMuPDF, exact hex values
- Pitfalls: HIGH — recharts hydration confirmed from GitHub issues; searchParams async from official docs
- Google Maps integration: MEDIUM — URL pattern confirmed from official docs; quota/caching details LOW

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — Next.js, Recharts APIs are stable; Google Maps Static API rarely changes)
