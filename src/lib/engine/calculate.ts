import type { ProposalInputs } from '@/lib/types/proposal-inputs';
import type { ProposalOutputs } from '@/lib/types/proposal-outputs';
import type { AlbertaConfig } from '@/lib/types/alberta-config';
import { d } from '@/lib/decimal';
import { projectUtilityCosts } from './utility-projection';
import { computeMonthlyNetMetering, computeNetMeteringProjection } from './net-metering';
import { computeCarbonCredits } from './carbon-credits';
import { computeCashBack } from './cash-back';
import { computeSavingsSummary, computeFinanceOption } from './savings';

/**
 * CALC-01 through CALC-08: Full proposal financial calculation engine.
 *
 * Assembles all domain sub-modules into a single ProposalOutputs result.
 * Pure synchronous function — caller is responsible for fetching AlbertaConfig.
 *
 * @param inputs - Validated ProposalInputs (all Decimal fields)
 * @param config - AlbertaConfig with carbon benchmark schedule and rates
 * @returns ProposalOutputs with all financial projections computed
 */
export function calculateProposal(inputs: ProposalInputs, config: AlbertaConfig): ProposalOutputs {
  // CALC-01: Utility cost projections (geometric series over 20 and 30 years)
  const utilityProjection20Year = projectUtilityCosts(
    inputs.consumption.annualElectricityCost,
    inputs.rates.annualEscalationRate,
    20,
  );
  const utilityProjection30Year = projectUtilityCosts(
    inputs.consumption.annualElectricityCost,
    inputs.rates.annualEscalationRate,
    30,
  );

  // Cover page values derived from utility projections
  const twentyYearUtilityCost = utilityProjection20Year.reduce(
    (sum, v) => sum.plus(v),
    d('0'),
  );

  // Solar offset: production ÷ consumption × 100
  const solarOffsetPercent = inputs.system.annualProductionKwh
    .dividedBy(inputs.consumption.annualConsumptionKwh)
    .times(d('100'));

  // CALC-02, CALC-03: Monthly net metering and annual totals
  const monthlyNetMetering = computeMonthlyNetMetering(inputs);
  const annualGridPurchaseCost = monthlyNetMetering.reduce(
    (sum, m) => sum.plus(m.costToBuy),
    d('0'),
  );
  const annualSellRevenue = monthlyNetMetering.reduce(
    (sum, m) => sum.plus(m.revenueEarned),
    d('0'),
  );

  // CALC-04: 20-year and 30-year net metering projections with escalation
  const nmProjection20 = computeNetMeteringProjection(
    annualSellRevenue,
    annualGridPurchaseCost,
    inputs.rates.annualEscalationRate,
    20,
  );
  const nmProjection30 = computeNetMeteringProjection(
    annualSellRevenue,
    annualGridPurchaseCost,
    inputs.rates.annualEscalationRate,
    30,
  );

  // CALC-05: Carbon credits (SolarOffset.ca GDF schedule, tiered platform fee)
  const carbonCredits = computeCarbonCredits(
    inputs.system.annualProductionKwh,
    inputs.system.systemSizeKw,
  );

  // Annual carbon credit = tenYearPayoutHigh / 10 (matches doc Section 8.2)
  const annualCarbonCredit = carbonCredits.tenYearPayoutHigh.dividedBy(d('10'));

  // CALC-06: Cash back over 20 and 30 years
  const cashBack20 = computeCashBack(
    annualGridPurchaseCost,
    inputs.rates.annualEscalationRate,
    config.cashBackRate,
    20,
  );
  const cashBack30 = computeCashBack(
    annualGridPurchaseCost,
    inputs.rates.annualEscalationRate,
    config.cashBackRate,
    30,
  );

  // Year 1 cash back for the finance option snapshot — no escalation in Year 1
  const cashBackYear1 = annualGridPurchaseCost.times(config.cashBackRate);

  // Utility avoided = sum of projection arrays (all years of avoided utility bills)
  const utilityAvoided20 = twentyYearUtilityCost;
  const utilityAvoided30 = utilityProjection30Year.reduce(
    (sum, v) => sum.plus(v),
    d('0'),
  );

  // CALC-07: True all-in savings summaries (cash purchase, 20 and 30 year)
  // Doc Section 6.1 + 7.2 both use HIGH carbon estimate for savings
  const cashPurchase20 = computeSavingsSummary(
    utilityAvoided20,
    nmProjection20.totalSellRevenue,
    carbonCredits.tenYearPayoutHigh,
    cashBack20,
    inputs.financing.cashPurchasePrice,
  );
  const cashPurchase30 = computeSavingsSummary(
    utilityAvoided30,
    nmProjection30.totalSellRevenue,
    carbonCredits.tenYearPayoutHigh,
    cashBack30,
    inputs.financing.cashPurchasePrice,
  );

  // CALC-08: Monthly finance analysis (base-year snapshot, no escalation)
  const financeOption = computeFinanceOption(
    inputs.financing.financeMonthlyPayment,
    annualGridPurchaseCost,
    annualSellRevenue,
    annualCarbonCredit,
    cashBackYear1,
  );

  return {
    solarOffsetPercent,
    twentyYearUtilityCost,
    twentyYearSavings: cashPurchase20.netSavingsAfterCost,
    monthlyNetMetering,
    annualGridPurchaseCost,
    annualSellRevenue,
    carbonCredits,
    cashPurchase: {
      twentyYear: cashPurchase20,
      thirtyYear: cashPurchase30,
    },
    financeOption,
    utilityProjection20Year,
    utilityProjection30Year,
  };
}
