---
task: 2
description: Audit proposal calculations and hardcoded values against Solar_Proposal_Calculations.docx
date: 2026-03-03
---

# Quick Task 2: Fix Calculation Bugs + Hardcoded Values

## Bugs Found (vs reference doc)

### BUG 1 — utility-projection.ts: off-by-one escalation
Doc: Year 1 = annualCost × (1+r)^0 = annualCost (no escalation Year 1)
Code: Year 1 = annualCost × (1+r)^1 (wrong — already escalated)
Fix: pow(i) not pow(n) where i = 0-based index

### BUG 2 — net-metering.ts computeNetMeteringProjection: off-by-one
Same issue: pow(n) should be pow(n-1)

### BUG 3 — cash-back.ts: off-by-one
Same: pow(n) should be pow(n-1)

### BUG 4 — calculate.ts cashBackYear1: extra escalation
Current: annualGridPurchaseCost × (1+r) × cashBackRate
Fix: annualGridPurchaseCost × cashBackRate (Year 1 = base, no escalation)

### BUG 5 — carbon estimate: LOW used, doc uses HIGH
Doc Section 6.1 and 8.2 both use HIGH ($1,115) for savings + monthly finance
Fix: use tenYearPayoutHigh in savings summaries and annualCarbonCredit in calculate.ts
Fix: use tenYearPayoutHigh in AllInCostsPage.tsx monthlyCarbonCredit

### HARDCODED — AllInCostsPage: escalation % and finance term in labels
"Alberta's historical 5% annual increase per year" → make rate dynamic
"0% interest for first 5 years" → make term dynamic via props

## Tasks

### Task 1: Fix engine bugs (utility-projection, net-metering, cash-back, calculate)
### Task 2: Fix AllInCostsPage (carbon HIGH + dynamic labels + new props)
### Task 3: Fix tests to match corrected formulas
