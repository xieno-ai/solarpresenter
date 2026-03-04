---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/scraper/sunpitch.ts
autonomous: true
requirements: [QUICK-12]
must_haves:
  truths:
    - "Finance monthly payment is scraped from span.mb-1.text span.float-right in the DOM"
    - "Cash price is NOT scraped from the DOM — it remains a manual input"
    - "Finance term is always hardcoded to 240 months regardless of what DOM or API returns"
  artifacts:
    - path: "src/lib/scraper/sunpitch.ts"
      provides: "Updated scraper with new payment selector, no cash DOM scrape, hardcoded 240-month term"
  key_links:
    - from: "scrapeSunPitch DOM block"
      to: "parseApiResponse"
      via: "finalMonthlyPayment passed as domMonthlyPayment arg"
      pattern: "parseApiResponse\\(capturedData, finalMonthlyPayment"
---

<objective>
Update the SunPitch scraper to use the correct DOM selector for finance monthly payment, remove the cash price DOM scrape, and hardcode the finance term to 240 months.

Purpose: The current scraper uses a broad innerText regex for payment (unreliable) and scrapes cash price from the DOM (incorrect — cash is manual input). The proposal always uses a 240-month finance term.
Output: Updated src/lib/scraper/sunpitch.ts with targeted payment selector, no cash DOM scrape, term hardcoded to 240.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix DOM payment selector, remove cash price scrape, hardcode term to 240</name>
  <files>src/lib/scraper/sunpitch.ts</files>
  <action>
Make three targeted changes to src/lib/scraper/sunpitch.ts:

**Change 1 — Remove domCashPrice parameter from parseApiResponse.**
- Remove the `domCashPrice?: string | null` parameter from the function signature.
- Remove the `domCashPrice` branch in the system cost section (lines ~374-427). The branch currently checks `if (domCashPrice)` and sets `financing.cashPurchasePrice` from it. DELETE that entire `if (domCashPrice)` block, keeping only the `else` branch body (the adder calculation logic). Unwrap the `else` so the adder calculation runs unconditionally (no `else` wrapper needed — just the try/catch block for adders).
- Update the JSDoc comment above parseApiResponse to remove the `domCashPrice` parameter documentation line.

**Change 2 — Remove cash price DOM scrape in scrapeSunPitch.**
- Remove the `scrapedCashPrice` variable declaration: `let scrapedCashPrice: string | null = null;`
- Remove the entire DOM scrape block for cash price (the `rawCashText` evaluate + cashMatch + console.log block, approximately lines ~779-789).
- Remove `scrapedCashPrice` from the `parseApiResponse(...)` call at the end (last positional argument).

**Change 3 — Hardcode finance term to 240 months.**
- Remove `let scrapedTermMonths: string | null = null;` declaration.
- Remove the term regex match block (`const termMatch = financeText.match(...)` + `if (termMatch)` + console.log, approximately lines ~792-798).
- Remove `scrapedTermMonths` from the `finalTermMonths` computation. Replace:
  ```ts
  const finalTermMonths = capturedFinanceData?.termMonths != null
    ? String(capturedFinanceData.termMonths)
    : scrapedTermMonths;
  ```
  with just:
  ```ts
  const finalTermMonths = '240';
  ```
- Also remove `configTermMonths` usage for term resolution. In the `parseApiResponse` resolution block (around line ~501):
  ```ts
  const resolvedTermMonths = configTermMonths ?? domTermMonths;
  ```
  Replace with:
  ```ts
  const resolvedTermMonths = '240';
  ```
  And remove the `domTermMonths?: string | null` parameter from parseApiResponse signature.
- In the config.finance parsing block, remove the lines that set `configTermMonths` (the `termMonths` / `configTermMonths = String(termMonths)` lines) since term is now always 240. Keep the rest of the finance block intact (rate_1 payment extraction still needed). Also remove the `let configTermMonths: string | null = null;` declaration.

**Change 4 — Update payment DOM scrape selector.**
- Replace the existing broad innerText + regex approach for payment:
  ```ts
  const financeText = await page.evaluate(() => document.body.innerText).catch(() => '');
  const paymentMatch = financeText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*\/\s*mo(?:nth)?/i);
  if (paymentMatch) {
    scrapedMonthlyPayment = paymentMatch[1].replace(/,/g, '');
    ...
  }
  ```
  with a targeted DOM query:
  ```ts
  const rawPaymentText = await page.evaluate(() => {
    const el = document.querySelector('span.mb-1.text span.float-right');
    return el ? el.textContent ?? '' : '';
  }).catch(() => '');
  const paymentMatch = rawPaymentText.match(/\$([\d,]+(?:\.\d+)?)/);
  if (paymentMatch) {
    scrapedMonthlyPayment = String(Math.round(Number(paymentMatch[1].replace(/,/g, ''))));
    console.log('[scraper] DOM payment (span.mb-1.text span.float-right):', rawPaymentText.trim(), '→', scrapedMonthlyPayment);
  } else {
    console.log('[scraper] DOM payment: span.mb-1.text span.float-right not found or empty');
  }
  ```
  Remove the old `financeText` variable entirely — it is no longer used after removing the term regex.

**After all changes, the DOM scrape block should:**
- Declare only `let scrapedMonthlyPayment: string | null = null;`
- Wait for Angular selector (unchanged)
- Execute the targeted `span.mb-1.text span.float-right` payment query
- No cash price scrape
- No term scrape

**The parseApiResponse call should become:**
```ts
return parseApiResponse(capturedData, finalMonthlyPayment, finalTermMonths);
```
where `finalTermMonths = '240'` (always).

**The finalMonthlyPayment resolution stays the same:**
```ts
const finalMonthlyPayment = capturedFinanceData?.monthlyPayment != null
  ? String(Math.round(capturedFinanceData.monthlyPayment))
  : scrapedMonthlyPayment;
```

Note: The `capturedFinanceData` sub-route interceptor and its finance API capture logic can remain as-is — it may still capture monthly payment from sub-APIs which is fine to use as priority over DOM.
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - parseApiResponse has no domCashPrice parameter
    - scrapeSunPitch has no scrapedCashPrice variable or DOM cash price query
    - scrapeSunPitch uses span.mb-1.text span.float-right for payment
    - financeTermMonths is always '240' (hardcoded in both resolvedTermMonths and finalTermMonths)
    - TypeScript compiles with no errors
  </done>
</task>

</tasks>

<verification>
Run `npx tsc --noEmit` from the project root — must pass with zero errors.
Grep confirms: `grep -n "domCashPrice\|scrapedCashPrice\|d-inline ml-auto\|scrapedTermMonths\|configTermMonths" src/lib/scraper/sunpitch.ts` returns no matches.
Grep confirms: `grep -n "mb-1.text" src/lib/scraper/sunpitch.ts` shows the new payment selector.
Grep confirms: `grep -n "'240'" src/lib/scraper/sunpitch.ts` shows at least two matches (resolvedTermMonths and finalTermMonths).
</verification>

<success_criteria>
- DOM payment scrape uses span.mb-1.text span.float-right (not innerText regex)
- No cash price DOM scrape exists anywhere in the file
- Finance term is hardcoded to 240 in both the DOM block and parseApiResponse resolution
- TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/12-scrape-finance-payment-from-dom-remove-c/12-SUMMARY.md`
</output>
