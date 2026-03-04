---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/enter/page.tsx
  - src/lib/scraper/sunpitch.ts
autonomous: true
requirements: [QUICK-11]

must_haves:
  truths:
    - "After SunPitch import, annualConsumptionKwh field shows the scraped value (not blank with 'required' error)"
    - "After SunPitch import, monthly consumption fields show non-zero values"
    - "Scraper logs data.consumption before returning so failed imports can be diagnosed"
  artifacts:
    - path: "src/app/enter/page.tsx"
      provides: "handleImportSuccess with setValue force-writes after reset+tab switch"
    - path: "src/lib/scraper/sunpitch.ts"
      provides: "parseApiResponse logs data.consumption before returning"
  key_links:
    - from: "handleImportSuccess"
      to: "RHF fields (consumption.annualConsumptionKwh, consumption.monthlyConsumptionKwh)"
      via: "setValue calls after setActiveTab('manual')"
      pattern: "setValue.*consumption"
---

<objective>
Fix form not populating after SunPitch scrape: annual consumption shows "required" error and monthly fields show 0 despite scraper returning valid data.

Purpose: The scraper returns correct consumption data but the form fields don't reflect it because reset() is called while the manual-entry fields are unmounted (still on 'sunpitch' tab). Adding explicit setValue calls after the tab switch forces RHF to write values to mounted fields.

Output: Modified enter/page.tsx and sunpitch.ts
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/app/enter/page.tsx
@src/lib/scraper/sunpitch.ts
@src/components/form/MonthlyGrid.tsx
@src/lib/form/defaults.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Force-write consumption fields after tab switch in handleImportSuccess</name>
  <files>src/app/enter/page.tsx</files>
  <action>
In `handleImportSuccess` (lines 104-160), make two targeted changes:

**Change 1 — Move setActiveTab before reset:**
Currently the order is: reset(merged) → trigger() → saveFormDraft → setHighlights → setActiveTab('manual').
Change to: setActiveTab('manual') → reset(merged) → trigger() → saveFormDraft → setHighlights.

This ensures fields are mounted when reset() runs. BUT reset() in React batches with setState so it may still race. Therefore also apply Change 2.

**Change 2 — Add explicit setValue calls after reset for all consumption and monthly fields:**
After `reset(merged)` and before `void trigger()`, add individual setValue calls for the fields most likely to silently drop during unmounted-field reset:

```typescript
// Force-write scraped values to RHF after reset — fields may have been unmounted
// (on 'sunpitch' tab) when reset() was called, causing values to be dropped.
setValue('consumption.annualConsumptionKwh', consumption.annualConsumptionKwh, { shouldDirty: true, shouldValidate: false });
setValue('consumption.annualElectricityCost', consumption.annualElectricityCost, { shouldDirty: false, shouldValidate: false });
if (Array.isArray(consumption.monthlyConsumptionKwh)) {
  consumption.monthlyConsumptionKwh.forEach((val, i) => {
    setValue(`consumption.monthlyConsumptionKwh.${i}` as Parameters<typeof setValue>[0], val as never, { shouldDirty: true, shouldValidate: false });
  });
}
// Also force-write monthly production in case it was dropped
if (Array.isArray(merged.system?.monthlyProductionKwh)) {
  merged.system.monthlyProductionKwh.forEach((val: string, i: number) => {
    setValue(`system.monthlyProductionKwh.${i}` as Parameters<typeof setValue>[0], val as never, { shouldDirty: true, shouldValidate: false });
  });
}
```

**Change 3 — Annual from monthly fallback:**
In the existing consumption merge block (lines 111-119), after building `consumption`, add a guard: if `consumption.annualConsumptionKwh` is empty or '0' but the monthly array has a non-zero sum, compute annual from the monthly sum:

```typescript
// Fallback: if annual is missing but monthly values are present, derive annual from monthly sum
const monthlyArr = consumption.monthlyConsumptionKwh ?? [];
const monthlySum = (Array.isArray(monthlyArr) ? monthlyArr : []).reduce(
  (acc: number, v: string) => acc + (Number(v) || 0), 0
);
if ((!consumption.annualConsumptionKwh || consumption.annualConsumptionKwh === '0') && monthlySum > 0) {
  consumption.annualConsumptionKwh = String(monthlySum);
  console.log('[handleImportSuccess] derived annualConsumptionKwh from monthly sum:', monthlySum);
}
```
Place this block BEFORE the existing kwh/rate annualElectricityCost computation so the derived annual feeds into it correctly.
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
- TypeScript compiles without errors in enter/page.tsx
- handleImportSuccess calls setActiveTab('manual') before reset(merged)
- setValue force-writes exist for consumption.annualConsumptionKwh, annualElectricityCost, and all 12 monthly consumption indices
- Monthly-sum fallback guard exists before the annualElectricityCost computation
  </done>
</task>

<task type="auto">
  <name>Task 2: Add data.consumption debug log in parseApiResponse</name>
  <files>src/lib/scraper/sunpitch.ts</files>
  <action>
In `parseApiResponse` (line 514), immediately before the `return buildResult(data, missingFields)` line, add:

```typescript
console.log('[scraper] data.consumption before return:', JSON.stringify(data.consumption));
```

This surfaces whether the scraper is producing consumption data at all, which distinguishes a scraper bug from a form-population bug.
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
- TypeScript compiles without errors
- Line `console.log('[scraper] data.consumption before return:', JSON.stringify(data.consumption))` exists immediately before the return statement in parseApiResponse
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `npx tsc --noEmit` passes with no errors
2. Manually test: paste a SunPitch URL, click Import — after redirect to manual tab, annual consumption field should show a non-zero value and monthly consumption grid should show non-zero values
3. Check browser console for `[scraper] data.consumption before return:` log to confirm what the scraper returned
</verification>

<success_criteria>
- Annual consumption field populated after import (no "required" error on a successfully scraped proposal)
- Monthly consumption grid shows 12 non-zero values after import
- Console log confirms scraper data.consumption shape for debugging the df4f0350 URL
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/11-fix-form-not-populating-from-scrape-resu/11-SUMMARY.md`
</output>
