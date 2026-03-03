import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';
import type { SavingsSummary } from '@/lib/types/proposal-outputs';

/**
 * CALC-07: True all-in savings summary (cash purchase).
 *
 * totalSavings = utilityAvoided + netMeteringRevenue + carbonCredits + cashBack
 * netSavingsAfterCost = totalSavings - cashPurchasePrice
 *
 * Negative values are allowed (no clamping) — callers display as-is.
 */
export function computeSavingsSummary(
  utilityAvoided: Decimal,
  netMeteringRevenue: Decimal,
  carbonCredits: Decimal,
  cashBack: Decimal,
  cashPurchasePrice: Decimal,
): SavingsSummary {
  const totalSavings = utilityAvoided
    .plus(netMeteringRevenue)
    .plus(carbonCredits)
    .plus(cashBack);

  const netSavingsAfterCost = totalSavings.minus(cashPurchasePrice);

  return {
    utilityAvoided,
    netMeteringRevenue,
    carbonCredits,
    cashBack,
    totalSavings,
    netSavingsAfterCost,
  };
}

/**
 * CALC-08: Monthly finance analysis.
 *
 * Uses base-year (Year 0) values — no escalation applied to the monthly snapshot.
 * This is the "current year" comparison showing monthly all-in cost with solar vs without.
 *
 * monthlyAllInCost = financeMonthlyPayment
 *   + (annualGridPurchaseCost / 12)   -- remaining grid cost after solar
 *   - (annualSellRevenue / 12)        -- monthly net metering revenue
 *   - (annualCarbonCredit / 12)       -- monthly carbon credit average
 *   - (annualCashBackYear1 / 12)      -- monthly cash-back
 *
 * totalMonthlyPayment = financeMonthlyPayment (pass-through, used on Page 5)
 */
export function computeFinanceOption(
  financeMonthlyPayment: Decimal,
  annualGridPurchaseCost: Decimal,
  annualSellRevenue: Decimal,
  annualCarbonCredit: Decimal,
  annualCashBackYear1: Decimal,
): { monthlyAllInCost: Decimal; totalMonthlyPayment: Decimal } {
  const twelve = d('12');
  const monthlyGridCost = annualGridPurchaseCost.dividedBy(twelve);
  const monthlyNetMeteringRev = annualSellRevenue.dividedBy(twelve);
  const monthlyCarbonCredit = annualCarbonCredit.dividedBy(twelve);
  const monthlyCashBack = annualCashBackYear1.dividedBy(twelve);

  const monthlyAllInCost = financeMonthlyPayment
    .plus(monthlyGridCost)
    .minus(monthlyNetMeteringRev)
    .minus(monthlyCarbonCredit)
    .minus(monthlyCashBack);

  return {
    monthlyAllInCost,
    totalMonthlyPayment: financeMonthlyPayment,
  };
}
