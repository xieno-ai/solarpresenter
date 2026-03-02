# Architecture Patterns

**Domain:** Solar proposal generator web application
**Researched:** 2026-03-02
**Overall confidence:** HIGH

## Recommended Architecture

### One Sentence

A Next.js full-stack application where the React frontend handles form input and proposal preview, and Next.js API routes handle the heavy server-side work (SunPitch scraping, bill extraction via LLM, and PDF generation via Puppeteer) -- with a pure TypeScript calculation engine shared between client and server.

### Why This Shape

This application has five distinct jobs:

1. **Collect data** (scraping, AI extraction, manual entry)
2. **Calculate financials** (pure math from documented formulas)
3. **Render a proposal** (11-page branded document)
4. **Preview it** (in-browser)
5. **Export it** (downloadable PDF)

The critical insight: jobs 4 and 5 should use the **same HTML/CSS source**. The proposal is a set of React components that render identically in the browser (web preview) and in a headless Chromium instance (PDF export). This "single source of truth" pattern eliminates the drift problem where the web preview and PDF look different.

Jobs 1-3 are server-side only. Job 4 is client-side. Job 5 bridges them -- the server renders the same React components in a headless browser and calls `page.pdf()`.

```
                         +---------------------------+
                         |      Next.js Frontend      |
                         |                           |
                         |  +---------------------+  |
                         |  | Input Forms          |  |
                         |  | - SunPitch URL tab   |  |
                         |  | - Bill Upload tab    |  |
                         |  | - Manual Entry tab   |  |
                         |  +---------------------+  |
                         |            |               |
                         |            v               |
                         |  +---------------------+  |
                         |  | Calculation Engine   |  |
                         |  | (pure TypeScript)    |  |
                         |  +---------------------+  |
                         |            |               |
                         |            v               |
                         |  +---------------------+  |
                         |  | Proposal Renderer    |  |
                         |  | (React components)   |  |
                         |  | = Web Preview        |  |
                         |  +---------------------+  |
                         +---------------------------+
                                      |
                    "Generate PDF" button click
                                      |
                                      v
                         +---------------------------+
                         |   Next.js API Routes       |
                         |                           |
                         |  POST /api/scrape         |
                         |    -> Playwright scrapes   |
                         |       SunPitch SPA         |
                         |                           |
                         |  POST /api/extract-bill   |
                         |    -> OpenAI Vision API    |
                         |       extracts bill data   |
                         |                           |
                         |  POST /api/generate-pdf   |
                         |    -> Puppeteer renders    |
                         |       proposal components  |
                         |       as PDF               |
                         +---------------------------+
```

## Component Boundaries

### Component Map

| Component | Responsibility | Runs On | Communicates With |
|-----------|---------------|---------|-------------------|
| **Input Layer** | Collects data from 3 paths (URL, bill, manual) | Client (React) | API routes for scrape/extract; Calculation Engine directly |
| **SunPitch Scraper** | Navigates SunPitch SPA, extracts structured data | Server (API route) | Playwright headless browser; returns JSON to Input Layer |
| **Bill Extractor** | Sends bill image/PDF to LLM, returns structured data | Server (API route) | OpenAI API; returns JSON to Input Layer |
| **Calculation Engine** | Runs all 9 formula sections, produces proposal data | Shared (pure TS) | Receives raw inputs, outputs calculated values |
| **Proposal Renderer** | 11-page branded proposal as React components | Client (preview) + Server (PDF) | Receives calculated data, renders HTML/CSS |
| **PDF Generator** | Renders proposal HTML in headless browser, exports PDF | Server (API route) | Puppeteer; Proposal Renderer components |
| **Static Assets** | Logos, marketing page images, fonts, backgrounds | Static files | Referenced by Proposal Renderer |

### Critical Boundary: The Calculation Engine Must Be Pure

The calculation engine is the heart of the application. It MUST be:

- **Pure TypeScript functions** -- no DOM, no React, no API calls
- **Deterministic** -- same inputs always produce same outputs
- **Independently testable** -- unit tests run without browser or server
- **Shared** -- imported by both client (for live preview) and server (if needed)

This is non-negotiable. The 9 formula sections from the calculations document become pure functions:

```typescript
// calculations/index.ts -- the public API
interface ProposalInputs {
  systemSize: number;           // kW
  monthlyProduction: number[];  // 12 months, kWh
  monthlyConsumption: number[]; // 12 months, kWh
  currentRate: number;          // $/kWh
  allInRate: number;            // energy + T&D + riders
  systemCost: number;           // $
  financingTermMonths: number;
  financingRate: number;        // %
  customerName: string;
  customerAddress: string;
  satelliteImageUrl?: string;
}

interface ProposalOutputs {
  utilityCostProjection: UtilityCostProjection;  // 20yr + 30yr
  netMetering: NetMeteringResult;                 // monthly grid buy/surplus
  carbonCredits: CarbonCreditResult;             // CO2, payouts
  cashBack: CashBackResult;                      // 3% on grid purchases
  trueSavings: TrueSavingsResult;                // cash purchase analysis
  monthlyAllIn: MonthlyAllInResult;              // finance option
}

function calculateProposal(inputs: ProposalInputs): ProposalOutputs { ... }
```

Each section is its own module with its own types and tests:

```
calculations/
  index.ts                    # Public API: calculateProposal()
  types.ts                    # Shared types
  utility-cost-projection.ts  # Section 1: 20yr/30yr with 5% increase
  net-metering.ts             # Section 2: Monthly grid buy/surplus
  carbon-credits.ts           # Section 3: CO2 avoided, benchmark prices
  cash-back.ts                # Section 4: 3% on grid purchases
  true-savings.ts             # Section 5: Cash purchase analysis
  monthly-all-in.ts           # Section 6: Finance option analysis
  constants.ts                # Alberta-specific rates, factors
```

### Critical Boundary: Proposal Renderer Is "Dumb"

The proposal renderer receives fully calculated data and renders it. It does NOT calculate anything. This separation means:

- Calculations can be tested without rendering
- Rendering can be tested with mock data
- The same calculated data drives both web preview and PDF

```typescript
// proposal/ProposalDocument.tsx
interface ProposalDocumentProps {
  inputs: ProposalInputs;
  outputs: ProposalOutputs;
  staticContent: StaticContent;  // marketing pages content
}

function ProposalDocument({ inputs, outputs, staticContent }: ProposalDocumentProps) {
  return (
    <div className="proposal">
      <CoverPage customer={inputs} />
      <TableOfContents />
      <NetMeteringPage data={outputs.netMetering} />
      <CarbonCreditsPage data={outputs.carbonCredits} />
      <TrueAllInCostsPage savings={outputs.trueSavings} finance={outputs.monthlyAllIn} />
      <PriceHistoryPage />           {/* static */}
      <WhatsComingPage />            {/* static */}
      <WhyUsPage />                  {/* static */}
      <WarrantyPage />               {/* static */}
      <FAQPage />                    {/* static */}
      <NextStepsPage />              {/* static */}
    </div>
  );
}
```

## Data Flow

### Path 1: SunPitch URL Scraping

```
User pastes URL
      |
      v
POST /api/scrape { url: "https://app.sunpitch.com/facing/proposals/..." }
      |
      v
Server: Playwright launches headless Chromium
      -> navigates to URL
      -> waits for SPA to render (networkidle or specific selectors)
      -> extracts data from DOM (system size, production, consumption, etc.)
      -> extracts satellite image (screenshot or image URL)
      -> returns structured JSON
      |
      v
Client receives ProposalInputs (or partial -- may need manual supplement)
      |
      v
Calculation Engine runs calculateProposal()
      |
      v
Proposal Renderer displays web preview
```

**Key concern:** SunPitch's DOM structure may change. The scraper must be:
- Resilient to minor DOM changes (prefer data attributes, text content matching over fragile CSS selectors)
- Well-documented (map each extracted field to the DOM element it comes from)
- Easy to update (isolated module, not tangled with other logic)

### Path 2: Utility Bill Upload + AI Extraction

```
User uploads bill (PDF, photo, scan)
      |
      v
Client converts to base64 (or FormData upload)
      |
      v
POST /api/extract-bill { file: base64, mimeType: "application/pdf" }
      |
      v
Server: sends to OpenAI Vision API (GPT-4o)
      -> system prompt with extraction schema
      -> requests structured JSON output
      -> validates response against expected schema
      -> returns extracted fields:
         { monthlyKwh: [...], annualKwh: number, utilityCompany: string,
           energyRate: number, allInRate: number, accountHolder: string,
           serviceAddress: string }
      |
      v
Client receives PARTIAL data (bill has consumption, not production/system)
      -> User still needs SunPitch data or manual entry for system specs
      -> Bill data pre-fills consumption fields in manual entry form
```

**Important:** Bill extraction is a HELPER, not a complete input path. A utility bill gives you consumption and rates, but NOT system size, production, or costs. The bill extractor feeds INTO the manual entry form, pre-filling what it can.

### Path 3: Manual Entry

```
User fills form manually:
  - System size (kW)
  - Monthly production (12 values)
  - Monthly consumption (12 values)  <-- may be pre-filled from bill extraction
  - Current rate
  - All-in rate                       <-- may be pre-filled from bill extraction
  - System cost
  - Financing terms
  - Customer name/address
      |
      v
Calculation Engine runs calculateProposal() (client-side, instant)
      |
      v
Proposal Renderer displays web preview (live updates as user types)
```

### Path 4: PDF Generation

```
User clicks "Download PDF"
      |
      v
POST /api/generate-pdf { inputs: ProposalInputs, outputs: ProposalOutputs }
      |
      v
Server:
  1. Renders proposal React components to static HTML string
     (using ReactDOMServer.renderToString or similar)
  2. Wraps HTML in full document with <link> to print stylesheet
  3. Launches Puppeteer headless Chromium
  4. Sets page content to the rendered HTML (page.setContent)
  5. Applies print media type (page.emulateMediaType('print'))
  6. Calls page.pdf({ format: 'Letter', printBackground: true })
  7. Returns PDF buffer as downloadable file
      |
      v
Client receives PDF blob -> triggers browser download
```

**Alternative approach for PDF (simpler):** Instead of rendering React on the server, the API route could navigate Puppeteer to a special `/proposal/print/[id]` route on the same Next.js app. This route renders the proposal in "print mode" (no navigation, no chrome, just the 11 pages). Puppeteer visits this URL and calls `page.pdf()`. This is simpler because you don't need to duplicate the rendering logic -- Puppeteer just visits the same app.

**Recommended:** Use the "visit a URL" approach. Simpler, fewer moving parts, and guarantees visual parity between preview and PDF.

```
POST /api/generate-pdf { inputs, outputs }
      |
      v
Server stores data in a short-lived token/cache (e.g., in-memory Map with TTL)
      -> generates a temporary URL: /proposal/render/{token}
      -> Puppeteer navigates to that URL
      -> The page renders the ProposalDocument component with the cached data
      -> Puppeteer waits for rendering, calls page.pdf()
      -> Returns PDF, clears the cached data
```

## Recommended Project Structure

```
solar-presenter/
  src/
    app/                          # Next.js App Router
      page.tsx                    # Main input form page
      proposal/
        render/
          [token]/
            page.tsx              # Server-rendered proposal for PDF generation
      api/
        scrape/
          route.ts                # SunPitch scraping endpoint
        extract-bill/
          route.ts                # Bill extraction endpoint
        generate-pdf/
          route.ts                # PDF generation endpoint

    components/
      input/                      # Input form components
        SunPitchTab.tsx
        BillUploadTab.tsx
        ManualEntryTab.tsx
        InputTabs.tsx             # Tab container
      proposal/                   # Proposal page components
        ProposalDocument.tsx      # Full 11-page document
        pages/
          CoverPage.tsx
          TableOfContents.tsx
          NetMeteringPage.tsx
          CarbonCreditsPage.tsx
          TrueAllInCostsPage.tsx
          PriceHistoryPage.tsx    # Static
          WhatsComingPage.tsx     # Static
          WhyUsPage.tsx           # Static
          WarrantyPage.tsx        # Static
          FAQPage.tsx             # Static
          NextStepsPage.tsx       # Static
        shared/                   # Reusable proposal sub-components
          DataTable.tsx
          RateCard.tsx
          PageHeader.tsx
          PageFooter.tsx

    calculations/                 # Pure TypeScript -- NO React, NO DOM
      index.ts
      types.ts
      constants.ts                # Alberta rates, carbon benchmarks, etc.
      utility-cost-projection.ts
      net-metering.ts
      carbon-credits.ts
      cash-back.ts
      true-savings.ts
      monthly-all-in.ts

    lib/
      scraper/
        sunpitch.ts               # Playwright scraping logic
        selectors.ts              # DOM selectors (isolated for easy updates)
      pdf/
        generator.ts              # Puppeteer PDF generation
      ai/
        bill-extractor.ts         # OpenAI Vision API integration
        prompts.ts                # Extraction prompt templates
      types/
        proposal.ts               # Shared TypeScript types

    styles/
      proposal.css                # Proposal styling (shared web + print)
      proposal-print.css          # Print-specific overrides (@media print)
      globals.css                 # App-level styles

    public/
      images/
        logo.png                  # Northern NRG logo
        marketing/                # Static page images, icons
      fonts/                      # Brand fonts
```

## Patterns to Follow

### Pattern 1: Single Source of Truth for Proposal Rendering

**What:** The same React components and CSS render the proposal in both web preview and PDF export. CSS `@media print` rules handle print-specific adjustments (page breaks, margins, background printing).

**Why:** Eliminates visual drift between preview and PDF. When you fix a layout issue in preview, the PDF is automatically fixed too.

**How:**

```css
/* proposal.css -- shared styles */
.proposal-page {
  width: 8.5in;
  min-height: 11in;
  padding: 0.75in;
  box-sizing: border-box;
  background: white;
}

/* proposal-print.css -- print overrides */
@media print {
  .proposal-page {
    page-break-after: always;
    margin: 0;
    padding: 0.5in;
  }

  @page {
    size: Letter;
    margin: 0;
  }
}

/* Web preview adds visual separation between pages */
@media screen {
  .proposal-page {
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 4px;
  }
}
```

**Confidence:** HIGH -- this is a well-established pattern. Puppeteer's `page.pdf()` respects print CSS, and `page.emulateMediaType('print')` activates `@media print` rules.

### Pattern 2: Calculation Engine as Pure Functions

**What:** All financial calculations live in a standalone TypeScript module with zero dependencies on React, DOM, or external APIs.

**Why:**
- Testable: unit test every formula with known inputs/outputs from the calculations document
- Portable: could be used in a CLI, a different frontend, or a spreadsheet validator
- Debuggable: when numbers are wrong, you test the calculation module in isolation

**How:**

```typescript
// calculations/utility-cost-projection.ts
export interface UtilityCostProjectionInput {
  annualConsumptionKwh: number;
  currentRatePerKwh: number;
  annualRateIncrease: number;  // 0.05 for 5%
}

export interface UtilityCostProjectionResult {
  yearlyProjections: Array<{
    year: number;
    rate: number;
    annualCost: number;
    cumulativeCost: number;
  }>;
  total20Year: number;
  total30Year: number;
}

export function calculateUtilityCostProjection(
  input: UtilityCostProjectionInput
): UtilityCostProjectionResult {
  const yearlyProjections = [];
  let cumulativeCost = 0;

  for (let year = 1; year <= 30; year++) {
    const rate = input.currentRatePerKwh * Math.pow(1 + input.annualRateIncrease, year - 1);
    const annualCost = input.annualConsumptionKwh * rate;
    cumulativeCost += annualCost;
    yearlyProjections.push({ year, rate, annualCost, cumulativeCost });
  }

  return {
    yearlyProjections,
    total20Year: yearlyProjections[19].cumulativeCost,
    total30Year: yearlyProjections[29].cumulativeCost,
  };
}
```

**Confidence:** HIGH -- standard separation of concerns, universally recommended.

### Pattern 3: Scraper Isolation with Selector Mapping

**What:** The SunPitch scraper isolates its DOM selectors into a separate file, mapping each selector to the data field it extracts.

**Why:** SunPitch's DOM will change. When it does, you update one file (`selectors.ts`) rather than hunting through scraping logic.

**How:**

```typescript
// lib/scraper/selectors.ts
export const SUNPITCH_SELECTORS = {
  systemSize: {
    selector: '[data-testid="system-size"], .system-size-value',
    fallback: 'text matching /\\d+\\.?\\d*\\s*kW/',
    description: 'System size in kW from the proposal header',
  },
  monthlyProduction: {
    selector: '.monthly-production-chart, [data-chart="production"]',
    extractionType: 'chart-data' as const,
    description: 'Monthly kWh production values (12 months)',
  },
  // ... etc for each field
} as const;

// lib/scraper/sunpitch.ts
import { SUNPITCH_SELECTORS } from './selectors';

export async function scrapeSunPitch(url: string): Promise<Partial<ProposalInputs>> {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Extract each field using its selector
  const systemSize = await extractField(page, SUNPITCH_SELECTORS.systemSize);
  // ...

  await browser.close();
  return { systemSize, /* ... */ };
}
```

**Confidence:** MEDIUM -- the isolation pattern is solid, but the specific selectors will need discovery during implementation by inspecting the actual SunPitch page.

### Pattern 4: Temporary Data Cache for PDF Generation

**What:** When generating a PDF, store the proposal data in a short-lived in-memory cache so Puppeteer can navigate to a URL that renders it.

**Why:** Avoids the complexity of server-side React rendering. Puppeteer just visits a page, and that page fetches its data from the cache.

**How:**

```typescript
// lib/pdf/cache.ts
const proposalCache = new Map<string, { data: ProposalData; createdAt: number }>();
const TTL_MS = 60_000; // 1 minute

export function storeProposalData(data: ProposalData): string {
  const token = crypto.randomUUID();
  proposalCache.set(token, { data, createdAt: Date.now() });
  return token;
}

export function getProposalData(token: string): ProposalData | null {
  const entry = proposalCache.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    proposalCache.delete(token);
    return null;
  }
  proposalCache.delete(token); // one-time use
  return entry.data;
}
```

**Confidence:** HIGH -- simple, effective, no database needed. Fine for single-user v1.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate PDF Template

**What:** Building a separate template system for PDF (e.g., Handlebars templates, or a completely different React-PDF component tree) that duplicates the web preview layout.

**Why bad:** Two sources of truth for the same visual output. Every layout change must be made twice. Drift is inevitable -- the PDF and preview will diverge, causing confusion.

**Instead:** Use the same React components for both. CSS `@media print` handles the differences (page breaks, margins, hiding UI chrome). Puppeteer renders the same components.

### Anti-Pattern 2: Calculations Inside Components

**What:** Putting financial formulas directly inside React components (e.g., computing the 20-year projection inside `<NetMeteringPage>`).

**Why bad:** Untestable without rendering. Impossible to validate calculations without a browser. Changes to display break calculations or vice versa.

**Instead:** All calculations happen in the pure TypeScript engine. Components receive pre-calculated values as props.

### Anti-Pattern 3: Fat API Route for Scraping

**What:** Putting all scraping logic -- browser launch, navigation, data extraction, data validation, transformation -- into a single API route handler.

**Why bad:** Untestable, unmaintainable. When SunPitch changes their DOM, you're debugging a 200-line route handler.

**Instead:** The API route is thin (receives request, calls scraper, returns response). The scraper module is independently testable. Selectors are in their own file.

### Anti-Pattern 4: Client-Side Scraping or Bill Extraction

**What:** Trying to scrape SunPitch or call OpenAI from the browser.

**Why bad:** CORS blocks browser-to-SunPitch requests. OpenAI API keys would be exposed in client-side code. Headless browsers cannot run inside a browser.

**Instead:** All scraping and AI extraction happens in API routes on the server. The client sends a URL or file, the server does the work and returns JSON.

### Anti-Pattern 5: Over-Engineering for Multi-Tenant

**What:** Building a database, user auth, company profiles, and white-labeling system for v1 when only Northern NRG will use it.

**Why bad:** Massive scope increase for zero immediate value. Multi-tenant is explicitly out of scope for v1.

**Instead:** Hardcode Northern NRG branding. Use constants for company-specific values. Structure code so these could LATER be extracted into configuration, but don't build the configuration system now.

## Key Architecture Decisions

### Decision 1: Next.js (Full-Stack) vs Separate Frontend + Backend

**Recommendation:** Next.js full-stack (App Router).

**Rationale:**
- The API routes (scraping, bill extraction, PDF generation) are infrequent, short-lived operations -- not a high-throughput backend
- Having frontend and backend in one codebase simplifies deployment and development
- API routes in Next.js can run Playwright and Puppeteer when self-hosted (NOT on Vercel's serverless -- see deployment note)
- React components for the proposal are shared between the web preview (client) and the PDF generation path (server renders the same page)

**Deployment constraint:** This app MUST be self-hosted (Docker, VPS, or similar) rather than deployed on Vercel. Reason: Vercel's serverless functions have a 250MB bundle limit and 10-60 second timeouts, which are too restrictive for Playwright/Puppeteer operations (launching browsers, scraping SPAs, generating PDFs). Self-hosting on a VPS or Docker container has none of these limitations.

### Decision 2: Playwright (Scraping) + Puppeteer (PDF) vs One Tool for Both

**Recommendation:** Use Playwright for scraping AND PDF generation. One headless browser tool, not two.

**Rationale:**
- Playwright handles both use cases well -- SPA scraping (its primary strength) and PDF generation (`page.pdf()` works identically to Puppeteer)
- Maintaining one browser automation dependency is simpler than two
- Playwright has better auto-wait, browser context isolation, and stability under load than Puppeteer
- Playwright is actively maintained by Microsoft with broader browser support

**Confidence:** HIGH -- Playwright is the consensus recommendation for new projects in 2025-2026 (verified across multiple comparison sources).

### Decision 3: OpenAI Vision API for Bill Extraction

**Recommendation:** Use OpenAI's GPT-4o (or latest model) with vision capabilities.

**Rationale:**
- GPT-4o can accept PDF files directly (base64 or file upload) and extract structured data
- No need to train a custom model -- the pre-trained model handles utility bill formats well
- Structured JSON output can be requested and validated against a schema
- Alberta-specific utility providers (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy) can be specified in the system prompt

**Pattern:**
```typescript
// lib/ai/bill-extractor.ts
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: BILL_EXTRACTION_PROMPT,  // detailed prompt from project docs
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Data}` }
        }
      ]
    }
  ],
  response_format: { type: "json_object" },
});
```

**Confidence:** HIGH -- Microsoft's Azure sample and OpenAI's documentation confirm this pattern for invoice/bill extraction.

### Decision 4: How Proposal Data Reaches PDF Generation

**Recommendation:** "Puppeteer visits a URL" pattern (not server-side React rendering).

**Rationale:**
- Simpler: no need to set up server-side React rendering with all CSS, fonts, and images
- Guaranteed visual fidelity: Puppeteer renders the exact same page the user sees in preview
- The flow: store data in memory cache -> generate temp URL -> Puppeteer visits URL -> renders -> calls page.pdf() -> returns buffer

**Confidence:** HIGH -- well-established pattern documented in multiple production guides.

## Scalability Considerations

This is a single-user internal tool for v1. Scalability is NOT a primary concern. However, the architecture naturally supports growth:

| Concern | v1 (1 user) | Future (multi-user) | Future (multi-tenant) |
|---------|-------------|--------------------|-----------------------|
| **Concurrent PDFs** | One at a time is fine | Browser pool (reuse contexts) | Browser pool + queue |
| **Data storage** | In-memory cache, no DB | Add SQLite/Postgres for proposal history | Multi-tenant DB schema |
| **Scraping** | On-demand per request | Same, maybe add caching for recent URLs | Same |
| **Bill extraction** | Direct OpenAI API call | Same, maybe add result caching | Same + per-tenant API keys |
| **Branding** | Hardcoded Northern NRG | Still hardcoded | Configuration-driven themes |
| **Auth** | None | Basic auth or session | Full auth + RBAC |

**The key "future-proofing" is structural, not functional:** Keep calculation engine pure. Keep proposal renderer data-driven. Keep branding values in constants (not scattered). These structural decisions cost nothing extra now but make future extension straightforward.

## Suggested Build Order

The build order follows dependency chains. You cannot build downstream components without upstream ones being at least stubbed.

### Phase 1: Foundation + Calculation Engine

**Build first because everything else depends on it.**

1. Next.js project setup, TypeScript config, project structure
2. Shared types (`ProposalInputs`, `ProposalOutputs`)
3. Calculation engine -- all 9 formula sections with unit tests
4. Manual entry form (simplest input path, no server dependency)

**Why first:** The calculation engine is the core intellectual property. It must be correct. Building it first with comprehensive tests means every subsequent phase can trust the numbers. Manual entry is the simplest input path and lets you exercise the calculation engine immediately.

**Exit criteria:** Given known inputs (from the calculations document), the engine produces the expected outputs. Manual form feeds into calculations and returns results.

### Phase 2: Proposal Rendering (Web Preview)

**Build second because it makes the product visually real.**

1. Page-level React components (11 pages)
2. Shared proposal styling (CSS with page-size constraints)
3. Print CSS rules (@media print, page breaks)
4. Connect manual entry form -> calculation engine -> proposal preview
5. Northern NRG branding (colors, logo, typography, layouts)

**Why second:** Once you can enter data manually and see a branded proposal, you have a working product (even without scraping or bill extraction). This is the MVP checkpoint.

**Exit criteria:** Enter numbers manually, see a complete 11-page branded proposal in the browser that matches the template design.

### Phase 3: PDF Generation

**Build third because it completes the core workflow.**

1. Playwright setup for PDF generation
2. Temporary data cache for the "visit a URL" pattern
3. Print-mode proposal route (`/proposal/render/[token]`)
4. PDF generation API route
5. Download button in UI

**Why third:** PDF is the primary deliverable -- sales reps need to download and send PDFs. But it depends on the proposal renderer being complete first.

**Exit criteria:** Click "Download PDF" and get an 11-page PDF that matches the web preview.

### Phase 4: SunPitch Scraping

**Build fourth because it requires exploring an external SPA.**

1. Investigate SunPitch DOM structure (manual inspection)
2. Playwright scraping module with selector mapping
3. Data extraction and transformation to `ProposalInputs`
4. Scraping API route
5. SunPitch URL tab in the input form
6. Error handling (URL validation, timeout, DOM changes)

**Why fourth:** Scraping depends on understanding SunPitch's DOM, which requires investigation. The core app should work with manual entry before adding scraping. If SunPitch changes their DOM, the rest of the app still works.

**Exit criteria:** Paste a SunPitch URL, get proposal inputs extracted, see them flow into calculation + preview.

### Phase 5: Bill Extraction

**Build last because it's a helper function, not a critical path.**

1. OpenAI Vision API integration
2. Bill extraction prompt (from project docs)
3. Response validation and structured output parsing
4. Bill upload API route
5. Bill upload tab in UI
6. Pre-fill manual entry form with extracted data

**Why last:** Bill extraction is the least critical path. It's a convenience feature that pre-fills some fields. The app is fully functional without it (manual entry covers all cases). It also has the most external dependency risk (OpenAI API changes, extraction accuracy).

**Exit criteria:** Upload a utility bill, see extracted data pre-fill the manual entry form fields.

## Sources

- [How to Generate PDFs in 2025](https://dev.to/michal_szymanowski/how-to-generate-pdfs-in-2025-26gi) - PDF generation approaches comparison
- [Playwright vs Puppeteer 2026](https://www.browserstack.com/guide/playwright-vs-puppeteer) - Browser automation tool comparison
- [Deploying Puppeteer with Next.js on Vercel](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel) - Serverless limitations for headless browsers
- [Self-Hosting Next.js: What You Gain vs Vercel](https://dev.to/rbobr/self-hosting-nextjs-what-you-gain-and-lose-vs-vercel-4g8c) - Deployment strategy
- [OpenAI Vision API Guide](https://platform.openai.com/docs/guides/vision) - Vision capabilities for document extraction
- [Azure OpenAI GPT-4o PDF Extraction Sample](https://github.com/Azure-Samples/azure-openai-gpt-4-vision-pdf-extraction-sample) - PDF data extraction pattern
- [HTML/CSS to PDF: Page Break Solutions](https://dev.to/resumemind/htmlcss-to-pdf-how-i-solved-the-page-break-nightmare-mdg) - Print CSS page break patterns
- [Turning React Apps into PDFs with Next.js and Puppeteer](https://dev.to/jordykoppen/turning-react-apps-into-pdfs-with-nextjs-nodejs-and-puppeteer-mfi) - React + Puppeteer PDF pattern
- [Multi-Page PDF with Distinct Layout Using Puppeteer](https://codestax.medium.com/multi-page-pdf-with-distinct-layout-using-puppeteer-ee8d45c7594b) - Multi-page PDF techniques
- [OpenAI File Inputs Documentation](https://platform.openai.com/docs/guides/pdf-files) - PDF input to GPT-4o
- [The Complete Guide to Deploying Next.js Apps in 2026](https://dev.to/zahg_81752b307f5df5d56035/the-complete-guide-to-deploying-nextjs-apps-in-2026-vercel-self-hosted-and-everything-in-between-48ia) - Deployment options
- [Web Scraping With Playwright and Node.JS in 2026](https://brightdata.com/blog/how-tos/playwright-web-scraping) - Playwright SPA scraping patterns
