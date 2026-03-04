---
phase: quick-13
plan: 13
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/proposal/page.tsx
autonomous: true
requirements: [QUICK-13]
must_haves:
  truths:
    - "When netMeteringBuyRate > 0, all engine calculations (costToBuy, annualGridPurchaseCost, cashBack, savings, 30-year) use 2× the entered rate"
    - "The displayed LO Rate cents on NetMeteringPage show the doubled rate"
    - "The displayed grid purchase cost sub-label on AllInCostsPage reflects the doubled rate"
    - "When netMeteringBuyRate is 0, the rate stays 0 (no doubling)"
  artifacts:
    - path: "src/app/proposal/page.tsx"
      provides: "Doubled netMeteringBuyRate fed into engine inputs and display props"
  key_links:
    - from: "buildProposalInputs()"
      to: "src/lib/engine/net-metering.ts"
      via: "inputs.rates.netMeteringBuyRate (2× value flows into costToBuy calculation)"
    - from: "gridBuyRate JSX props"
      to: "NetMeteringPage and AllInCostsPage"
      via: "Doubled string value for display as cents"
---

<objective>
Double the netMeteringBuyRate in the engine inputs when the rate is > 0, so all downstream calculations and displays automatically reflect transmission-fee-adjusted buy costs.

Purpose: The raw SunPitch/entered buy rate (e.g. 0.084 $/kWh) understates actual grid purchase cost because transmission fees roughly double the effective rate. All calculations and displayed "LO Rate" cents must reflect the true cost.

Output: Modified src/app/proposal/page.tsx with two targeted changes — engine input doubling and display prop doubling.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@D:/Cursor/Solar Presenter/.planning/STATE.md

Key architecture facts:
- `buildProposalInputs()` in `src/app/proposal/page.tsx` (line 61) is the single point where `netMeteringBuyRate` enters the calculation engine
- The engine in `src/lib/engine/net-metering.ts` computes `costToBuy = gridBuyKwh × inputs.rates.netMeteringBuyRate` — changing the input automatically propagates through all downstream calculations
- `gridBuyRate` is passed as a raw form-value string prop to NetMeteringPage (line 180) and AllInCostsPage (line 204) purely for display
- The ×2 multiplier must only apply when the rate is > 0 to avoid artificially inflating a zero-rate scenario
</context>

<tasks>

<task type="auto">
  <name>Task 1: Double netMeteringBuyRate at engine input boundary and display props</name>
  <files>src/app/proposal/page.tsx</files>
  <action>
In `buildProposalInputs()` (around line 61), change the `netMeteringBuyRate` line from:

```ts
netMeteringBuyRate: d(formValues.rates.netMeteringBuyRate),
```

to:

```ts
netMeteringBuyRate: d(formValues.rates.netMeteringBuyRate).greaterThan(0)
  ? d(formValues.rates.netMeteringBuyRate).times(2)
  : d(formValues.rates.netMeteringBuyRate),
```

This is the ONLY engine change needed. All downstream calculations (costToBuy, annualGridPurchaseCost, cashBack, savings, 30-year projections) automatically receive the doubled rate.

Then update the two JSX `gridBuyRate` props that display the rate as cents in the page return statement:

NetMeteringPage prop (currently line 180):
```ts
gridBuyRate={formValues.rates.netMeteringBuyRate}
```
Change to:
```ts
gridBuyRate={parseFloat(formValues.rates.netMeteringBuyRate) > 0
  ? String(parseFloat(formValues.rates.netMeteringBuyRate) * 2)
  : formValues.rates.netMeteringBuyRate}
```

AllInCostsPage prop (currently line 204):
```ts
gridBuyRate={formValues.rates.netMeteringBuyRate}
```
Change to:
```ts
gridBuyRate={parseFloat(formValues.rates.netMeteringBuyRate) > 0
  ? String(parseFloat(formValues.rates.netMeteringBuyRate) * 2)
  : formValues.rates.netMeteringBuyRate}
```

No changes needed in any engine files (net-metering.ts, calculate.ts, cash-back.ts, savings.ts) or in any page components (NetMeteringPage.tsx, AllInCostsPage.tsx).
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
TypeScript compiles clean. When netMeteringBuyRate is e.g. 0.084, the engine receives 0.168 and the LO Rate displays as ~16.8¢. When netMeteringBuyRate is 0, engine and display both remain 0.
  </done>
</task>

</tasks>

<verification>
After the change, load the proposal with a known netMeteringBuyRate (e.g. 0.084). Confirm:
- NetMeteringPage "LO Rate" card shows approximately 16.8¢ (doubled from 8.4¢)
- AllInCostsPage grid purchase cost sub-label reflects the doubled rate
- TypeScript reports no type errors
</verification>

<success_criteria>
- `npx tsc --noEmit` exits 0 with no errors
- `buildProposalInputs()` passes 2× rate to engine when rate > 0
- Both `gridBuyRate` display props show the doubled value
- Zero-rate case is unaffected (0 × 2 guard returns 0 as-is)
</success_criteria>

<output>
After completion, update `.planning/STATE.md` quick tasks table with entry for task 13.
</output>
