import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';
import type { MonthlyNetMetering } from '@/lib/types/proposal-outputs';
import type { ProposalInputs } from '@/lib/types/proposal-inputs';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * CALC-02 + CALC-03: Monthly net metering analysis and annual totals.
 *
 * For each of 12 months:
 * - If production >= consumption: surplus month (gridBuyKwh = 0, surplusSoldKwh = production - consumption)
 * - If production < consumption: deficit month (gridBuyKwh = consumption - production, surplusSoldKwh = 0)
 *
 * Returns MonthlyNetMetering[] of length 12.
 * Annual totals (CALC-03) are derived by summing costToBuy and revenueEarned across all months.
 */
export function computeMonthlyNetMetering(inputs: ProposalInputs): MonthlyNetMetering[] {
  return inputs.system.monthlyProductionKwh.map((production, i) => {
    const consumption = inputs.consumption.monthlyConsumptionKwh[i];
    // Locked decision: production >= consumption → surplus (greaterThanOrEqualTo)
    const surplus = production.greaterThanOrEqualTo(consumption);
    const gridBuyKwh = surplus ? d('0') : consumption.minus(production);
    const surplusSoldKwh = surplus ? production.minus(consumption) : d('0');

    return {
      month: MONTH_NAMES[i],
      consumptionKwh: consumption,
      productionKwh: production,
      gridBuyKwh,
      surplusSoldKwh,
      costToBuy: gridBuyKwh.times(inputs.rates.netMeteringBuyRate),
      revenueEarned: surplusSoldKwh.times(inputs.rates.netMeteringSellRate),
    };
  });
}

/**
 * CALC-04: Multi-year net metering projection.
 *
 * Escalates annualSellRevenue and annualGridPurchaseCost by escalationRate
 * each year and sums over N years.
 *
 * Returns { totalSellRevenue, totalGridPurchaseCost } as Decimal.
 */
export function computeNetMeteringProjection(
  annualSellRevenue: Decimal,
  annualGridPurchaseCost: Decimal,
  escalationRate: Decimal,
  years: number,
): { totalSellRevenue: Decimal; totalGridPurchaseCost: Decimal } {
  let totalSellRevenue = d('0');
  let totalGridPurchaseCost = d('0');

  for (let n = 1; n <= years; n++) {
    const factor = d('1').plus(escalationRate).pow(n);
    totalSellRevenue = totalSellRevenue.plus(annualSellRevenue.times(factor));
    totalGridPurchaseCost = totalGridPurchaseCost.plus(annualGridPurchaseCost.times(factor));
  }

  return { totalSellRevenue, totalGridPurchaseCost };
}
