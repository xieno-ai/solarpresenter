---
phase: quick-9
plan: 9
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/scraper/sunpitch.ts
autonomous: true
requirements: [QUICK-9]

must_haves:
  truths:
    - "financeMonthlyPayment is scraped from SunPitch and populated in data.financing (no longer always-missing)"
    - "financeTermMonths is scraped from SunPitch and populated in data.financing (no longer always-missing)"
    - "cashPurchasePrice continues to be scraped correctly (existing behavior preserved)"
    - "If finance values cannot be found in the DOM, they remain in missingFields (graceful degradation)"
  artifacts:
    - path: "src/lib/scraper/sunpitch.ts"
      provides: "DOM scraping of finance values after API capture"
      contains: "financeMonthlyPayment"
  key_links:
    - from: "scrapeSunPitch()"
      to: "page DOM after API response"
      via: "Playwright page.evaluate() after capturedData is set"
      pattern: "page.evaluate.*finance|monthly.*payment"
---

<objective>
Scrape `financeMonthlyPayment` and `financeTermMonths` from the SunPitch proposal page DOM.

Purpose: These values are displayed in the SunPitch UI ("MONTHS 1-60 $220/month") but were previously hardcoded as always-missing because they don't appear in the `/api/proposals/{uuid}` JSON. The Angular app renders them in the DOM — Playwright can read them after the page loads.

Output: Updated `src/lib/scraper/sunpitch.ts` that (a) intercepts a finance-specific API call if one exists, or (b) reads the finance values from the rendered DOM after the page settles.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/lib/scraper/sunpitch.ts
@src/lib/scraper/types.ts
@src/lib/form/schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Investigate SunPitch DOM and additional API calls for finance values</name>
  <files>src/lib/scraper/sunpitch.ts</files>
  <action>
Extend `scrapeSunPitch()` in `src/lib/scraper/sunpitch.ts` to capture finance values. Do this by adding a second route interceptor alongside the existing `/api/proposals/${uuid}` interceptor, then falling back to DOM scraping if no dedicated API is found.

**Strategy — two-layer capture:**

**Layer 1 (preferred): Intercept additional API endpoints.**

Add a second `page.route()` call BEFORE `page.goto()` to intercept any finance-related API calls SunPitch makes. Common patterns to try intercepting with a wildcard:

```
**/api/proposals/${uuid}/finance**
**/api/finance**
**/api/financing**
**/api/loan**
```

Use a catch-all wildcard route for `/api/proposals/**` that logs all sub-routes so you can see what endpoints fire during page load. This is diagnostic AND functional.

**Layer 2 (fallback): DOM scraping after page settles.**

After the polling loop completes (capturedData is set), if `financeMonthlyPayment` or `financeTermMonths` are still null, scrape the DOM:

1. Wait for the Angular app to finish rendering: `await page.waitForSelector('[class*="finance"], [class*="payment"], [class*="monthly"]', { timeout: 10000 }).catch(() => null)`

2. Use `page.evaluate()` to extract text from the rendered page. Look for patterns matching:
   - Monthly payment dollar amounts: text matching `/\$[\d,]+\/mo/i` or `/\$[\d,]+\s*\/\s*month/i`
   - Term in months: text matching `/(\d+)\s*months?/i` or `/MONTHS\s+1[-–]\d+/i`

3. Parse the extracted text:
   - `financeMonthlyPayment`: Extract the numeric dollar value (e.g., "220" from "$220/month")
   - `financeTermMonths`: Extract the term number (e.g., "60" from "MONTHS 1-60" or "60 months")

**DOM scraping implementation pattern:**

```typescript
// After the polling loop, attempt DOM scrape for finance values
let scrapedMonthlyPayment: string | null = null;
let scrapedTermMonths: string | null = null;

try {
  const financeText = await page.evaluate(() => document.body.innerText).catch(() => '');

  // Match patterns like "$220/mo", "$220/month", "$220 /month"
  const paymentMatch = financeText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*\/\s*mo(?:nth)?/i);
  if (paymentMatch) {
    scrapedMonthlyPayment = paymentMatch[1].replace(/,/g, '');
  }

  // Match patterns like "MONTHS 1-60", "60 months", "60-month"
  const termMatch = financeText.match(/MONTHS\s+1[-–](\d+)/i) || financeText.match(/(\d+)[- ]months?/i);
  if (termMatch) {
    scrapedTermMonths = termMatch[1];
  }

  console.log('[scraper] DOM finance scan — payment:', scrapedMonthlyPayment, '| term:', scrapedTermMonths);
} catch (e) {
  console.log('[scraper] DOM finance scan error:', e instanceof Error ? e.message : String(e));
}
```

**After DOM scrape, update parseApiResponse to accept scraped finance values:**

Add optional parameters `domFinancePayment?: string | null` and `domFinanceTerm?: string | null` to `parseApiResponse()`. When these are provided and non-null:
- Set `data.financing.financeMonthlyPayment = domFinancePayment`
- Set `data.financing.financeTermMonths = domFinanceTerm`
- Do NOT push these to `missingFields`

When still null:
- Keep the existing `missingFields.push('financing.financeMonthlyPayment')` and `missingFields.push('financing.financeTermMonths')` behavior

**Remove** the hardcoded comment block `// Financing details are not in the public proposal API` and replace with the conditional logic above.

**Pass the scraped values through:**

In `scrapeSunPitch()`, change the `parseApiResponse(capturedData)` call to:
```typescript
return parseApiResponse(capturedData, scrapedMonthlyPayment, scrapedTermMonths);
```

Update the `parseApiResponse` function signature accordingly:
```typescript
function parseApiResponse(
  raw: SunPitchProposalApiResponse,
  domMonthlyPayment?: string | null,
  domTermMonths?: string | null,
): ScrapeResult
```

**Important: Do the DOM scrape ONLY if capturedData is not null.** If the API never responded (timeout), skip DOM scraping — the page may not have loaded properly anyway.

**Log verbosely** so we can diagnose in Vercel logs: include the raw finance text segments that matched and what was extracted.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
TypeScript compiles without errors. `parseApiResponse` accepts two optional DOM-scraped parameters. Finance values are populated when found in DOM text; remain in missingFields when not found. The hardcoded always-missing block is removed and replaced with conditional logic.
  </done>
</task>

<task type="auto">
  <name>Task 2: Also intercept the SunPitch finance-option API endpoint (if it exists)</name>
  <files>src/lib/scraper/sunpitch.ts</files>
  <action>
In addition to the DOM scraping from Task 1, add a route interceptor to capture any finance API response that SunPitch fires when the user views a proposal with a financing option selected.

Add a second route interceptor BEFORE `page.goto()`:

```typescript
let capturedFinanceData: { monthlyPayment?: number; termMonths?: number; totalCost?: number } | null = null;

await page.route(`**/api/proposals/${uuid}/**`, async (route) => {
  const reqUrl = route.request().url();
  console.log('[scraper] sub-route intercepted:', reqUrl);
  try {
    const response = await route.fetch({ timeout: 60000 });
    if (response.status() === 200) {
      const body = await response.body();
      const text = body.toString('utf8');
      if (text.length > 0 && text.startsWith('{')) {
        try {
          const json = JSON.parse(text) as Record<string, unknown>;
          console.log('[scraper] sub-route JSON keys:', Object.keys(json).join(', '));
          // Look for finance-shaped keys: monthlyPayment, loanAmount, termMonths, months, payment
          const payment = json.monthlyPayment ?? json.payment ?? json.monthly_payment;
          const term = json.termMonths ?? json.term_months ?? json.months ?? json.loanTermMonths;
          if (payment != null || term != null) {
            capturedFinanceData = {
              monthlyPayment: payment != null ? Number(payment) : undefined,
              termMonths: term != null ? Number(term) : undefined,
            };
            console.log('[scraper] finance API data captured:', capturedFinanceData);
          }
        } catch { /* not JSON */ }
      }
    }
    await route.fulfill({ response });
  } catch (e) {
    console.log('[scraper] sub-route error:', e instanceof Error ? e.message : String(e));
    await route.continue();
  }
});
```

After the polling loop, if `capturedFinanceData` has values, prefer them over DOM-scraped values:

```typescript
const finalMonthlyPayment = capturedFinanceData?.monthlyPayment != null
  ? String(Math.round(capturedFinanceData.monthlyPayment))
  : scrapedMonthlyPayment;
const finalTermMonths = capturedFinanceData?.termMonths != null
  ? String(capturedFinanceData.termMonths)
  : scrapedTermMonths;

return parseApiResponse(capturedData, finalMonthlyPayment, finalTermMonths);
```

This gives us: API intercept (best) > DOM scrape (fallback) > missingFields (graceful degradation).

Note: The `**/api/proposals/${uuid}/**` pattern must NOT conflict with the existing `**/api/proposals/${uuid}**` interceptor. Make the existing interceptor match exactly: `**/api/proposals/${uuid}` (no trailing slash or wildcard) and add the new sub-route interceptor with `/**` suffix. Test that both interceptors register without Playwright routing conflicts.

TypeScript: Ensure no implicit `any` types — annotate the `json` variable as `Record<string, unknown>` and use type narrowing.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
Two route interceptors exist: exact UUID match for the main proposal API, and a sub-route wildcard for finance sub-endpoints. Finance values flow through: API intercept → DOM fallback → missingFields. TypeScript compiles clean.
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `npx tsc --noEmit` passes with no errors
2. Review `src/lib/scraper/sunpitch.ts` to confirm:
   - `parseApiResponse` has 3 parameters (raw, domMonthlyPayment, domTermMonths)
   - The always-missing hardcoded block is replaced with conditional logic
   - Two `page.route()` calls exist (main API + sub-routes)
   - `page.evaluate()` DOM scrape for finance text is present
   - All console.log entries include `[scraper]` prefix for Vercel log filtering
</verification>

<success_criteria>
- `financing.financeMonthlyPayment` and `financing.financeTermMonths` are populated when SunPitch renders finance values in the DOM or returns them from a sub-API
- When finance values cannot be found, they gracefully fall through to `missingFields` (no regression)
- Existing cash price scraping (`cashPurchasePrice` from adders) is unchanged
- TypeScript compiles clean
</success_criteria>

<output>
After completion, create `.planning/quick/9-scrape-cash-and-finance-values-from-sunp/9-SUMMARY.md` with what was implemented, what DOM selectors/patterns worked, and what finance fields are now captured vs still missing.
</output>
