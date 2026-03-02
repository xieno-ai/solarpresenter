# Technology Stack

**Project:** Northern NRG Solar Proposal Generator
**Researched:** 2026-03-02
**Overall confidence:** HIGH (versions verified via npm/official sources, pricing verified via official pricing pages)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.5.x (stable) | Full-stack React framework | App Router, API routes, server components, server actions. v15 is battle-tested and stable. v16 exists but has breaking changes around async APIs that add complexity without benefit for this project. Stick with 15.x for reliability. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15. Server Components reduce client bundle. | HIGH |
| TypeScript | 5.4+ | Type safety | Non-negotiable for a project with complex data models (proposal data, utility bill schemas, calculation engine). Catches data-shape bugs at compile time. | HIGH |

**Why NOT Next.js 16:** Next.js 16.1.6 is current on npm, but it removes synchronous access to certain APIs and introduces Cache Components -- features irrelevant to this internal tool. The 7x build-speed improvement is nice but not worth the migration risk for a greenfield internal tool. If the project is still active in 6 months, upgrading is straightforward.

**Why NOT plain React + Vite:** This project needs server-side API routes (for Playwright scraping, AI calls, PDF generation). Next.js provides these out of the box. A Vite SPA would require a separate Express/Fastify backend, doubling the deployment surface for no benefit.

### Browser Automation (Scraping + PDF Generation)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Playwright | 1.58.x | SunPitch scraping AND PDF generation | Single library handles both scraping JS SPAs and generating PDFs via `page.pdf()`. Auto-wait eliminates flaky scraping. Multi-browser support (though we only need Chromium). Microsoft-maintained with excellent TypeScript types. | HIGH |

**Why Playwright over Puppeteer for this project:**

| Criterion | Playwright | Puppeteer |
|-----------|-----------|-----------|
| Auto-wait for elements | Built-in, robust | Manual, error-prone |
| TypeScript support | First-class | Good but less ergonomic |
| PDF generation | `page.pdf()` with Chromium | `page.pdf()` with Chrome |
| Browser install | `npx playwright install chromium` | Downloads Chrome on `npm install` |
| SPA scraping reliability | Superior for dynamic content | Requires more manual waits |
| Stealth/anti-bot | Adequate (SunPitch is not adversarial) | Slightly better stealth plugins |
| Active development | Very active (v1.58, Feb 2026) | Active (v24.37, Feb 2026) |

**Decision rationale:** SunPitch is a known, non-adversarial SPA. We do not need stealth capabilities. Playwright's auto-wait and superior TypeScript DX make it the better choice for scraping dynamic SPAs reliably. The fact that it also handles PDF generation means one dependency instead of two.

**Why NOT @react-pdf/renderer:** Version 4.3.2 exists and works for simple documents, but it uses its own layout engine (not CSS), has blurry rendering on high-DPI screens, cannot use standard CSS/Tailwind for styling, and requires learning a proprietary component API. For an 11-page branded proposal that must be pixel-accurate, using the same HTML/CSS for web preview and PDF (via Playwright `page.pdf()`) is vastly superior. One template, two outputs.

**Why NOT client-side html2pdf.js:** Client-side PDF generation depends on the user's browser, produces inconsistent results across devices, and cannot handle complex multi-page layouts with headers/footers reliably. Server-side Playwright gives deterministic, identical output every time.

### AI / LLM for Utility Bill Extraction

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel AI SDK | 6.x | Unified LLM interface | Provider-agnostic: swap between OpenAI, Anthropic, Google with one line. Structured output via Zod schemas (`generateObject()`). TypeScript-first. | HIGH |
| Google Gemini 2.0 Flash | API | Primary extraction model | Best price-to-performance for document extraction. $0.10/M input, $0.40/M output. Native PDF input. Structured output support. 1M token context. For utility bills (1-5 pages), cost per extraction is fractions of a cent. | MEDIUM |
| OpenAI GPT-4o | API | Fallback extraction model | $2.50/M input, $10/M output. Native PDF input. Excellent structured output. Use as fallback when Gemini returns low-confidence results. | HIGH |

**Cost comparison for utility bill extraction (estimated 2-page bill, ~500 input tokens + image tokens, ~200 output tokens):**

| Provider | Model | Cost per Bill | Monthly (100 bills) |
|----------|-------|---------------|---------------------|
| Google | Gemini 2.0 Flash | ~$0.001 | ~$0.10 |
| Google | Gemini 2.5 Flash | ~$0.003 | ~$0.30 |
| OpenAI | GPT-4o | ~$0.005 | ~$0.50 |
| OpenAI | GPT-4o-mini | ~$0.001 | ~$0.06 |
| Anthropic | Claude Sonnet 4.6 | ~$0.008 | ~$0.80 |

**Why Gemini 2.0 Flash as primary:** At $0.10/M input tokens, it is 25x cheaper than GPT-4o for input and handles PDF natively. For utility bill extraction -- a well-structured document with predictable fields -- the cheaper model is sufficient. The Vercel AI SDK abstraction means swapping to GPT-4o or Claude is a one-line change if quality is insufficient.

**Why NOT Claude as primary for extraction:** Claude Sonnet 4.6 ($3/M input) is 30x more expensive than Gemini Flash for input tokens. Claude excels at reasoning-heavy tasks, but utility bill extraction is primarily OCR + field mapping, not complex reasoning. Claude is overkill and overpriced for this specific task.

**Why the Vercel AI SDK over direct API calls:** The SDK provides `generateObject()` with Zod schema validation, meaning the LLM output is type-checked at runtime. If the model returns malformed data, the SDK handles retries automatically. Switching providers requires changing one import, not rewriting API calls. This is critical for a project that may need to swap models as pricing/quality evolves.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2.x | Utility-first CSS | CSS-first configuration in v4 (no more tailwind.config.js). 5x faster full builds, 100x faster incremental. Critical advantage: the same Tailwind classes work in both web preview AND the Playwright-rendered PDF since both are HTML/CSS. | HIGH |
| CSS Variables | -- | Theming / brand colors | Northern NRG brand colors, fonts. CSS variables ensure consistency between web and PDF output. | HIGH |

**Why NOT a component library (shadcn/ui, etc.):** The proposal pages are highly custom branded documents, not standard CRUD forms. A component library adds overhead without value for the proposal templates. For the admin/input form UI, Tailwind utility classes are sufficient. If the form UI grows complex, shadcn/ui components can be added later since they are just Tailwind-styled Radix primitives.

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Hook Form | 7.x | Form state management | Uncontrolled components = fewer re-renders. Zero dependencies. Smaller bundle than Formik. Works with server actions. | HIGH |
| Zod | 4.3.x | Schema validation | Used everywhere: form validation, AI output validation, API route validation. One schema definition powers TypeScript types, runtime validation, and AI structured output. Single source of truth. | HIGH |
| @hookform/resolvers | latest | Bridge RHF + Zod | Official adapter connecting React Hook Form to Zod schemas. | HIGH |

**Why Zod is the linchpin:** Zod schemas serve triple duty in this project:
1. **Form validation:** User input for manual entry forms
2. **AI output validation:** `generateObject()` uses Zod to validate LLM responses
3. **API validation:** Route handlers validate incoming data

This means the `UtilityBillData` schema is defined once and used to validate manual entry, AI extraction, and API payloads. Massive DX win.

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SQLite | via better-sqlite3 | Persistent storage | Single-company internal tool. No concurrent write pressure. Zero-config deployment (file on disk). No database server to manage. Perfect for storing proposals, extracted bill data, calculation results. | HIGH |
| Drizzle ORM | latest | Type-safe database access | SQL-like API (no magic). 7.4kb bundle. Excellent SQLite support. No Rust binary (unlike Prisma historically). Migrations via `drizzle-kit`. | MEDIUM |

**Why SQLite over PostgreSQL:** This is a single-company internal tool. There will likely be 1-5 concurrent users. SQLite handles this trivially. Zero infrastructure cost, zero ops burden. The data (proposals, bill extractions) is simple relational data. If multi-tenant is needed later, PostgreSQL migration via Drizzle is straightforward since schema stays the same, just swap the driver.

**Why Drizzle over Prisma:** Prisma 7 removed the Rust engine (good), but Drizzle is still lighter (7.4kb vs Prisma's larger footprint), has stronger SQLite/serverless support, and its SQL-like API is more transparent. For a small team that knows SQL, Drizzle adds less abstraction overhead. However, Prisma is a perfectly valid alternative -- this is a preference call, not a dealbreaker.

**Why NOT just raw SQL:** Drizzle gives type-safe queries with zero overhead. `db.select().from(proposals).where(eq(proposals.id, id))` is as readable as raw SQL but with full TypeScript inference. Worth the small dependency.

### Image Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| sharp | 0.34.x | Image preprocessing | Resize/optimize uploaded utility bill photos before sending to AI. Convert between formats. Compress proposal images for PDF. Based on libvips -- fastest Node.js image library by a wide margin. | HIGH |

### File Upload

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js API Routes | built-in | File upload endpoint | Server-side handling of multipart uploads. No need for a separate upload service for an internal tool. | HIGH |

**Why NOT a cloud upload service (Uploadthing, S3):** This is an internal tool. Files can be stored on the local filesystem or in SQLite as blobs. Adding S3 or a cloud upload service is over-engineering for 1-5 users. If cloud deployment is needed later, adding S3 is a 2-hour task.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15.5 | Next.js 16 | Breaking changes, unnecessary for internal tool |
| Framework | Next.js 15.5 | Remix/React Router 7 | Less ecosystem support for PDF gen patterns, smaller community |
| Framework | Next.js 15.5 | Vite + Express | Two deployment targets, more infrastructure to maintain |
| Browser automation | Playwright | Puppeteer | Less ergonomic TypeScript, manual waits for SPAs |
| PDF generation | Playwright page.pdf() | @react-pdf/renderer | Cannot reuse web templates, proprietary layout engine |
| PDF generation | Playwright page.pdf() | PDFKit/pdfmake | Low-level, must rebuild all layouts programmatically |
| PDF generation | Playwright page.pdf() | wkhtmltopdf | Deprecated, uses old WebKit, poor CSS support |
| AI extraction | Gemini 2.0 Flash | GPT-4o | 25x more expensive for input, similar quality for OCR tasks |
| AI extraction | Gemini 2.0 Flash | Claude Sonnet | 30x more expensive for input, overkill for field extraction |
| AI SDK | Vercel AI SDK 6 | Direct API calls | Lose structured output, provider switching, retry logic |
| ORM | Drizzle | Prisma 7 | Heavier, more abstraction than needed for SQLite |
| Database | SQLite | PostgreSQL | Over-engineered for single-company internal tool |
| Forms | React Hook Form | Formik | Larger bundle, more re-renders, less active development |
| Styling | Tailwind CSS 4 | CSS Modules | More verbose, harder to maintain consistency across web+PDF |

---

## Architecture Decision: "One Template, Two Outputs"

The single most important architectural decision in this stack is using the **same HTML/CSS templates** for both the web preview and the PDF download. This is enabled by:

1. **Tailwind CSS** -- styles work identically in browser and Playwright's Chromium
2. **Playwright `page.pdf()`** -- renders the same HTML as a browser would
3. **Next.js** -- serves the web preview and runs the Playwright PDF generation server-side

**How it works:**
- Proposal template is a React component styled with Tailwind
- Web preview: Next.js renders the component in the browser (normal page visit)
- PDF download: Next.js API route renders the same component to HTML string, loads it in Playwright's headless Chromium, calls `page.pdf()`, returns the buffer

**Why this matters:** Maintaining two separate template systems (one for web, one for PDF) is the #1 source of bugs and drift in proposal generators. One template = one source of truth.

---

## Serverless Deployment Consideration

If deploying to Vercel (serverless), Playwright/Chromium requires special handling:

| Approach | Package | Notes |
|----------|---------|-------|
| Vercel Serverless Functions | `@sparticuz/chromium-min` + `playwright-core` | Compressed Chromium binary (~50MB). Works within Vercel's 250MB unzipped limit. Proven pattern. |
| Self-hosted (VPS/Docker) | Standard `playwright` | No restrictions. Simplest approach. Recommended for v1. |
| External PDF service | Browserless.io, Doppio | SaaS API. Offloads Chromium. More cost but zero infra. |

**Recommendation for v1:** Self-host on a simple VPS (DigitalOcean Droplet, Railway, or Fly.io). Avoids all serverless Chromium headaches. A $6/mo VPS handles this workload trivially. Optimize for Vercel later if needed.

---

## Installation

```bash
# Core framework
npm install next@15 react@19 react-dom@19

# Browser automation (scraping + PDF generation)
npm install playwright-core
npx playwright install chromium

# AI / LLM
npm install ai @ai-sdk/google @ai-sdk/openai

# Styling
npm install tailwindcss@4

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# Database
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3

# Image processing
npm install sharp

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @types/node
```

---

## Version Summary Table

| Package | Verified Version | Verified Date | Source |
|---------|-----------------|---------------|--------|
| Next.js | 15.5.x (latest 15.x stable) | 2026-03-02 | npm, nextjs.org |
| React | 19.x | 2026-03-02 | Ships with Next.js 15 |
| Playwright | 1.58.2 | 2026-03-02 | npm |
| Vercel AI SDK | 6.0.x | 2026-03-02 | npm, vercel.com |
| Tailwind CSS | 4.2.0 | 2026-03-02 | npm, GitHub releases |
| Zod | 4.3.6 | 2026-03-02 | npm |
| React Hook Form | 7.x | 2026-03-02 | npm |
| Drizzle ORM | latest | 2026-03-02 | npm |
| sharp | 0.34.5 | 2026-03-02 | npm |
| better-sqlite3 | latest | 2026-03-02 | npm |

---

## AI Provider Pricing Reference (as of March 2026)

| Provider | Model | Input $/M tokens | Output $/M tokens | PDF Native | Structured Output |
|----------|-------|-------------------|--------------------|-----------|--------------------|
| Google | Gemini 2.0 Flash | $0.10 | $0.40 | Yes | Yes |
| Google | Gemini 2.5 Flash | $0.30 | $2.50 | Yes | Yes |
| Google | Gemini 2.5 Pro | $1.25+ | $10.00+ | Yes | Yes |
| OpenAI | GPT-4o | $2.50 | $10.00 | Yes | Yes |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | Yes | Yes |
| Anthropic | Claude Haiku 4.5 | $1.00 | $5.00 | Yes | Yes |
| Anthropic | Claude Sonnet 4.6 | $3.00 | $15.00 | Yes | Yes |

**All providers** support batch API (50% discount) and prompt caching for cost optimization.

---

## Sources

### Official Documentation (HIGH confidence)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Playwright Release Notes](https://playwright.dev/docs/release-notes)
- [Playwright PDF Generation Guide](https://playwright.dev/docs/api/class-page)
- [Puppeteer PDF Generation](https://pptr.dev/guides/pdf-generation)
- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)
- [OpenAI PDF Files Guide](https://platform.openai.com/docs/guides/pdf-files)
- [Anthropic PDF Support](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support)
- [Gemini Document Understanding](https://ai.google.dev/gemini-api/docs/document-processing)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [sharp Documentation](https://sharp.pixelplumbing.com/)

### npm Package Pages (HIGH confidence -- version verification)
- [playwright on npm](https://www.npmjs.com/package/playwright) -- v1.58.2
- [puppeteer on npm](https://www.npmjs.com/package/puppeteer) -- v24.37.5
- [next on npm](https://www.npmjs.com/package/next) -- v16.1.6 (latest), v15.5.x (recommended)
- [zod on npm](https://www.npmjs.com/package/zod) -- v4.3.6
- [@react-pdf/renderer on npm](https://www.npmjs.com/package/@react-pdf/renderer) -- v4.3.2
- [sharp on npm](https://www.npmjs.com/package/sharp) -- v0.34.5
- [tailwindcss on npm](https://github.com/tailwindlabs/tailwindcss/releases) -- v4.2.0

### Comparison Articles (MEDIUM confidence -- cross-verified)
- [Playwright vs Puppeteer (ZenRows, 2026)](https://www.zenrows.com/blog/playwright-vs-puppeteer)
- [Playwright vs Puppeteer (Apify, 2025)](https://blog.apify.com/playwright-vs-puppeteer/)
- [Drizzle vs Prisma (Bytebase, 2026)](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [Drizzle vs Prisma (DesignRevision, 2026)](https://designrevision.com/blog/prisma-vs-drizzle)
- [React Hook Form vs Formik (Croct, 2026)](https://blog.croct.com/post/best-react-form-libraries)
- [SQLite vs PostgreSQL (SelectHub, 2026)](https://www.selecthub.com/relational-database-solutions/postgresql-vs-sqlite/)
- [GPT-4o vs Claude Sonnet for Document Parsing (Invofox)](https://www.invofox.com/en/post/document-parsing-using-gpt-4o-api-vs-claude-sonnet-3-5-api-vs-invofox-api-with-code-samples)

### Deployment Guides (MEDIUM confidence)
- [Puppeteer on Vercel Guide (2026)](https://www.danielolawoyin.com/blog/puppeteer-on-vercel-the-ultimate-guide-to-serverless-browser-automation-2026)
- [Serverless Chromium on Vercel (GitHub Gist)](https://gist.github.com/kettanaito/56861aff96e6debc575d522dd03e5725)
- [@sparticuz/chromium for Lambda/Vercel](https://github.com/vercel/community/discussions/124)
