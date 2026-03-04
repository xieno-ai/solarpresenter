---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/scraper/sunpitch.ts
autonomous: true
requirements: [QUICK-4]

must_haves:
  truths:
    - "Annual production reported by the scraper matches 7,782 kWh (sum of zone B × 13 panels)"
    - "Monthly production values reflect panel-count-weighted zone sums, not raw zone sums × days"
    - "Zones with 0 panels contribute 0 kWh regardless of their kWh/panel/month value"
  artifacts:
    - path: "src/lib/scraper/sunpitch.ts"
      provides: "Fixed monthly production computation (kWh/panel/month × panel count per zone)"
      contains: "AllZones"
  key_links:
    - from: "config.editor (AllZones[i].TotalSolarPanel)"
      to: "config.projections (production[i][month])"
      via: "zone-weighted sum inside the monthly production block"
      pattern: "AllZones.*TotalSolarPanel"
---

<objective>
Fix the SunPitch scraper so monthly and annual production figures are computed correctly.

Purpose: The existing code treats production values as kWh/day and sums all zones equally.
The actual unit is kWh/panel/month; each zone must be multiplied by its panel count (from
`config.editor.AllZones[i].TotalSolarPanel`) before summing. Zones with 0 panels are
effectively uninstalled and must contribute 0 kWh. This causes a 5.87x overcount today.

Output: Corrected `src/lib/scraper/sunpitch.ts` — monthly array and annual total match
the SunPitch UI figures.
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
  <name>Task 1: Replace production-sum logic with zone × panel-count formula</name>
  <files>src/lib/scraper/sunpitch.ts</files>
  <action>
    In the `// --- Monthly production from config.projections ---` block (roughly lines 217-257),
    replace the current computation with the correct formula:

    CURRENT (wrong):
    ```typescript
    const proj = JSON.parse(raw.config.projections) as {
      production?: number[][];
    };
    // Sum all zone kWh/day for each month index
    const monthlyKwhPerDay = proj.production.reduce<number[]>((acc, zone) => {
      return zone.map((v, i) => (acc[i] ?? 0) + (Number(v) || 0));
    }, new Array(12).fill(0) as number[]);
    // Convert kWh/day × actual_days_in_month → kWh/month
    const monthlyKwh = monthlyKwhPerDay.map((v, i) => Math.round(v * DAYS_PER_MONTH[i]));
    ```

    NEW (correct):
    ```typescript
    // Parse projections AND editor together — panel count per zone lives in editor.AllZones
    const proj = JSON.parse(raw.config.projections) as {
      production?: number[][];
    };
    // editor may already be parsed for systemSizeKw, but parse it again here safely
    const editorForProd = raw.config?.editor
      ? (JSON.parse(raw.config.editor) as {
          TotalSolarPanel?: number;
          AllZones?: { Name?: string; TotalSolarPanel?: number }[];
        })
      : null;

    // Build per-zone panel counts aligned with production array index.
    // Falls back to TotalSolarPanel on the first (and only) zone if AllZones is absent.
    const zonePanels: number[] = proj.production!.map((_, zoneIdx) => {
      if (editorForProd?.AllZones && editorForProd.AllZones[zoneIdx] !== undefined) {
        return Number(editorForProd.AllZones[zoneIdx].TotalSolarPanel) || 0;
      }
      // Fallback: if only one zone exists and AllZones is missing, use TotalSolarPanel
      if (proj.production!.length === 1) {
        return Number(editorForProd?.TotalSolarPanel) || 0;
      }
      return 0;
    });

    // Sum: for each month, sum(zoneValues[month] × panelCount[zone])
    // Unit of production[zone][month] is kWh/panel/month — NOT kWh/day.
    const monthlyKwh = Array.from({ length: 12 }, (_, month) =>
      Math.round(
        proj.production!.reduce((sum, zone, zoneIdx) =>
          sum + (Number(zone[month]) || 0) * zonePanels[zoneIdx], 0
        )
      )
    );
    ```

    Remove the `DAYS_PER_MONTH` multiplication entirely from this path — it no longer
    applies since the unit is kWh/panel/month, not kWh/day.

    Also update the console.log to print zone panel counts for debuggability:
    ```typescript
    console.log('[scraper] zone panel counts:', zonePanels);
    console.log('[scraper] system.annualProductionKwh:', annualKwh);
    ```

    IMPORTANT: Do NOT remove the `DAYS_PER_MONTH` constant from the top of the file —
    it may be used elsewhere or for future features. Only remove its usage inside this block.

    Also IMPORTANT: Keep all the surrounding error-handling (try/catch), missing-field pushes,
    and the `data.system` assignment block exactly as they are — only the inner computation
    logic changes.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    TypeScript compiles clean. The production block uses `AllZones[i].TotalSolarPanel`
    (or the single-zone fallback) to weight each zone's kWh/panel/month values.
    DAYS_PER_MONTH is no longer referenced inside the production block.
    Console output for a 13-panel Zone B proposal would log annual ≈ 7,782 kWh.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Inspect the updated block: `DAYS_PER_MONTH` is not referenced inside the monthly production
   computation path
3. Inspect: `AllZones` is referenced and panel count is used as a multiplier
4. Manual sanity check of the formula: Zone B (13 panels), July value 76.788:
   `76.788 × 13 = 998.2` → rounded to 998 kWh. Annual sum across all months ≈ 7,782 kWh.
</verification>

<success_criteria>
- TypeScript compiles without errors
- Production block multiplies each zone's monthly value by that zone's panel count
- Zones with 0 panels contribute 0 kWh (implicit from multiplication)
- DAYS_PER_MONTH multiplication removed from this path
- All surrounding error handling preserved intact
</success_criteria>

<output>
After completion, create `.planning/quick/4-fix-sunpitch-scraper-production-total-an/4-SUMMARY.md`
with what was changed, the key formula, and the expected annual output for the test proposal.
</output>
```
