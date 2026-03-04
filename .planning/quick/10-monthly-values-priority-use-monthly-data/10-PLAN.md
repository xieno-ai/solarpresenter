---
phase: quick-10
plan: 10
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/form/MonthlyGrid.tsx
  - src/lib/scraper/sunpitch.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "When SunPitch provides monthly consumption values, those values appear in the monthly grid after import"
    - "When only an annual total is available and monthly values are all zero, annual distributes into monthly using the curve"
    - "When monthly values are non-zero, typing a new annual total does NOT overwrite the existing monthly values"
  artifacts:
    - path: "src/components/form/MonthlyGrid.tsx"
      provides: "Monthly-first sync logic"
    - path: "src/lib/scraper/sunpitch.ts"
      provides: "Monthly-first consumption parsing"
  key_links:
    - from: "MonthlyGrid.tsx annual→monthly effect"
      to: "existing monthly values"
      via: "non-zero check before distributing"
      pattern: "syncSource.current === 'monthly'"
    - from: "sunpitch.ts parseApiResponse"
      to: "infoData.monthlyUsage"
      via: "try monthlyUsage regardless of infoType"
      pattern: "Array.isArray(info.monthlyUsage)"
---

<objective>
Fix two gaps in the monthly values priority system so that scraped monthly data always appears in the form.

Purpose: SunPitch proposals sometimes provide monthly consumption values without a matching annual total, or provide monthly data under an unexpected `infoType`. In both cases the monthly values should be used directly. Additionally, the `MonthlyGrid` annual→monthly distribution should not overwrite already-populated monthly values.

Output:
- `MonthlyGrid.tsx`: annual→monthly distribution skipped when monthly values are already non-zero
- `sunpitch.ts`: consumption parser tries `infoData.monthlyUsage` array regardless of `infoType` before falling back to generic annual keys
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Key context inline below:

**MonthlyGrid sync logic (src/components/form/MonthlyGrid.tsx)**

Two `useEffect` hooks sync annual ↔ monthly:
- `annual → monthly`: fires when `annualPath` field changes; distributes using Alberta curve or even split. Guard: `if (syncSource.current === 'monthly') return`. Bail: `if (isNaN(annual) || annual <= 0) return`.
- `monthly → annual`: fires when any `monthlyBasePath.*` field changes; sums all 12 months into annual. Guard: `if (syncSource.current === 'annual') return`.

**SunPitch consumption parsing (src/lib/scraper/sunpitch.ts `parseApiResponse`)**

Current flow:
1. If `infoType === 'AvgYearlyUsage'` → use `avgYearlyUsage` + Alberta curve, push `monthlyConsumptionKwh` to missingFields (estimated)
2. Else if `infoType === 'MonthlyUsage'` && `info.monthlyUsage` is array → use monthly directly, sum to annual
3. Else try generic keys (`annualUsage`, `yearlyUsage`, `avgYearlyUsage`) → use + Alberta curve, push to missingFields
4. Else push both to missingFields

The bug: step 3/4 only look for annual keys. If `infoData` has a `monthlyUsage` array under an unexpected `infoType` (e.g., infoType is `MonthlyAvgUsage` or similar), the monthly values are ignored.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Monthly-first priority in MonthlyGrid annual→monthly distribution</name>
  <files>src/components/form/MonthlyGrid.tsx</files>
  <action>
In the `annual → monthly distribution` `useEffect` (lines ~50-70), add a check BEFORE distributing: if the current monthly values are already non-zero (i.e., their sum > 0), skip the distribution and return early. This preserves scraped/manually entered monthly values when the user also sets or changes the annual field.

Specific change: after the `if (isNaN(annual) || annual <= 0) return;` guard (line ~57), read the current monthly values for this section and check their sum. If sum > 0, return early without distributing.

Read current monthly values from the watched values object: `const sectionVals = (values as Record<string, unknown>)?.[section] as Record<string, unknown> | undefined; const months = (sectionVals?.[monthlyFieldName] ?? []) as string[]; const monthlySum = months.reduce((acc, v) => acc + (Number(v) || 0), 0); if (monthlySum > 0) return;`

Place this check AFTER the annual validity guard and BEFORE `syncSource.current = 'annual'`.

This means: monthly→annual still works (summing when user edits individual months), but annual→monthly only distributes when the monthly grid is completely empty (all zeros).
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    The `annual → monthly` distribution effect returns early when monthly values sum to &gt; 0. TypeScript compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Try monthlyUsage array regardless of infoType in scraper</name>
  <files>src/lib/scraper/sunpitch.ts</files>
  <action>
In `parseApiResponse`, in the consumption parsing block (lines ~170-227), update the fallback path (the `else` branch that currently tries generic annual keys) to FIRST check if `info.monthlyUsage` is a non-empty array before looking for annual keys.

Current else branch (step 3 in the flow above):
```
const yearlyVal = (info.annualUsage ?? info.yearlyUsage ?? info.avgYearlyUsage) as ...
```

Change it to:
```
// Try monthlyUsage array first — may exist under an unexpected infoType
if (Array.isArray(info.monthlyUsage) && info.monthlyUsage.length > 0) {
  const normalized = normalizeMonthlyArray(info.monthlyUsage as (string | number)[]);
  const annual = normalized.reduce((sum, v) => sum + Number(v), 0);
  data.consumption = {
    ...(data.consumption ?? {}),
    annualConsumptionKwh: String(annual),
    monthlyConsumptionKwh: normalized,
    annualElectricityCost: data.consumption?.annualElectricityCost ?? '0',
  } as typeof data.consumption;
  console.log('[scraper] consumption from monthlyUsage (infoType:', infoType, '):', normalized);
} else {
  // Fall back to annual keys + Alberta curve
  const yearlyVal = (info.annualUsage ?? info.yearlyUsage ?? info.avgYearlyUsage) as string | number | undefined;
  if (yearlyVal != null) {
    const annualNum = Number(yearlyVal);
    const monthly = distributeByAlbertaCurve(annualNum);
    data.consumption = { ... } // same as current
    missingFields.push('consumption.monthlyConsumptionKwh');
  } else {
    missingFields.push('consumption.annualConsumptionKwh');
    missingFields.push('consumption.monthlyConsumptionKwh');
  }
}
```

Also: when `infoType === 'AvgYearlyUsage'` but the `infoData` ALSO contains a `monthlyUsage` array, prefer the monthly array over the annual+curve approach. Add a check at the top of the `if (infoType === 'AvgYearlyUsage' ...)` branch:

```
if (infoType === 'AvgYearlyUsage' && info.avgYearlyUsage) {
  // If monthly values are also present, prefer them (more accurate)
  if (Array.isArray(info.monthlyUsage) && info.monthlyUsage.length > 0) {
    const normalized = normalizeMonthlyArray(info.monthlyUsage as (string | number)[]);
    const annual = normalized.reduce((sum, v) => sum + Number(v), 0);
    data.consumption = { annualConsumptionKwh: String(annual), monthlyConsumptionKwh: normalized, annualElectricityCost: '0' } as ...
    console.log('[scraper] consumption: AvgYearlyUsage path but monthlyUsage array present — using monthly:', normalized);
  } else {
    // existing path: annual + Alberta curve
    const annualNum = Number(info.avgYearlyUsage);
    const monthly = distributeByAlbertaCurve(annualNum);
    data.consumption = { annualConsumptionKwh: String(annualNum), monthlyConsumptionKwh: monthly, annualElectricityCost: '0' } as ...
    missingFields.push('consumption.monthlyConsumptionKwh');
  }
}
```

TypeScript types: use the same cast pattern already in the file (`as typeof data.consumption`).
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    Scraper tries monthlyUsage array first in all branches before falling back to annual+curve distribution. TypeScript compiles without errors.
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `npx tsc --noEmit` passes with no errors
2. Review `MonthlyGrid.tsx` — confirm `monthlySum > 0` guard is present in the annual→monthly effect
3. Review `sunpitch.ts` — confirm `Array.isArray(info.monthlyUsage)` check appears in both `AvgYearlyUsage` and `else` branches
</verification>

<success_criteria>
- Monthly values from SunPitch scrape are preserved in the form grid after import
- Annual field changing does NOT overwrite existing non-zero monthly values
- TypeScript build passes clean
- No runtime errors in browser on the /enter page
</success_criteria>

<output>
After completion, create `.planning/quick/10-monthly-values-priority-use-monthly-data/10-SUMMARY.md`
</output>
```
