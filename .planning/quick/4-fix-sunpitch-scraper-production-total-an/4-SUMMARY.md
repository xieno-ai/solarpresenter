---
phase: quick-4
plan: 01
subsystem: scraper
tags: [scraper, sunpitch, production, bug-fix]
dependency_graph:
  requires: []
  provides: [correct-monthly-production-kwh, correct-annual-production-kwh]
  affects: [proposal-calculations, net-metering-page, all-in-costs-page]
tech_stack:
  added: []
  patterns: [zone-weighted-sum, AllZones-panel-count]
key_files:
  modified:
    - src/lib/scraper/sunpitch.ts
decisions:
  - "production[zone][month] unit is kWh/panel/month, not kWh/day — DAYS_PER_MONTH multiplication removed from production block"
  - "AllZones[i].TotalSolarPanel provides per-zone panel count; fallback to root TotalSolarPanel for single-zone proposals"
metrics:
  duration: 5
  completed: 2026-03-04
---

# Quick Task 4: Fix SunPitch Scraper Production Total (Annual) Summary

**One-liner:** Fixed 5.87x annual production overcount by replacing kWh/day × days formula with kWh/panel/month × AllZones[i].TotalSolarPanel zone-weighted sum.

## What Was Changed

### Root Cause

The SunPitch API `config.projections.production` array contains values in **kWh/panel/month**, not kWh/day. The previous code treated them as kWh/day and multiplied by `DAYS_PER_MONTH[i]`, producing a 5.87x overcount for a 13-panel single-zone proposal (45,710 kWh reported vs 7,782 kWh actual).

Additionally, the previous code summed all zones equally, ignoring that zones with 0 panels (uninstalled zones) must contribute 0 kWh.

### The Fix (src/lib/scraper/sunpitch.ts, lines ~217-282)

**Old formula (wrong):**
```typescript
// Sum all zone kWh/day for each month index
const monthlyKwhPerDay = proj.production.reduce<number[]>((acc, zone) => {
  return zone.map((v, i) => (acc[i] ?? 0) + (Number(v) || 0));
}, new Array(12).fill(0) as number[]);
// Convert kWh/day × actual_days_in_month → kWh/month
const monthlyKwh = monthlyKwhPerDay.map((v, i) => Math.round(v * DAYS_PER_MONTH[i]));
```

**New formula (correct):**
```typescript
// Parse editor.AllZones for per-zone panel counts
const editorForProd = raw.config?.editor
  ? (JSON.parse(raw.config.editor) as {
      TotalSolarPanel?: number;
      AllZones?: { Name?: string; TotalSolarPanel?: number }[];
    })
  : null;

const zonePanels: number[] = proj.production.map((_, zoneIdx) => {
  if (editorForProd?.AllZones && editorForProd.AllZones[zoneIdx] !== undefined) {
    return Number(editorForProd.AllZones[zoneIdx].TotalSolarPanel) || 0;
  }
  if (proj.production!.length === 1) {
    return Number(editorForProd?.TotalSolarPanel) || 0;
  }
  return 0;
});

// Sum: for each month, sum(zone[month] × panelCount[zone])
// Unit is kWh/panel/month — NOT kWh/day.
const monthlyKwh = Array.from({ length: 12 }, (_, month) =>
  Math.round(
    proj.production!.reduce((sum, zone, zoneIdx) =>
      sum + (Number(zone[month]) || 0) * zonePanels[zoneIdx], 0
    )
  )
);
```

### Verification

Manual sanity check for the confirmed test case:
- Zone A: 0 panels → contributes 0 kWh
- Zone B: 13 panels, July = 76.788 kWh/panel → 76.788 × 13 = 998.2 → rounded 998 kWh
- Zone C: 0 panels → contributes 0 kWh
- Annual total across all months: **7,782 kWh** (matches SunPitch UI)

`npx tsc --noEmit` passes with no errors.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/lib/scraper/sunpitch.ts` exists and contains `AllZones`
- Commit `11069db` exists: "fix(scraper): compute monthly production as kWh/panel/month × zone panel count"
- `DAYS_PER_MONTH` is NOT referenced inside the production block (constant retained at top of file)
- All surrounding error handling (try/catch, missingFields pushes, data.system assignment) preserved intact
