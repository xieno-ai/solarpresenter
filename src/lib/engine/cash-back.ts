import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';

/**
 * CALC-06: Cash-back over N years.
 *
 * Grid electricity purchases escalate annually at escalationRate.
 * Cash-back = cashBackRate × escalated annual grid cost for each year, summed.
 *
 * Sum for year n = annualGridPurchaseCost × (1 + escalationRate)^n × cashBackRate
 */
export function computeCashBack(
  annualGridPurchaseCost: Decimal,
  escalationRate: Decimal,
  cashBackRate: Decimal,
  years: number,
): Decimal {
  let total = d('0');

  for (let n = 1; n <= years; n++) {
    // Year 1 = no escalation (1+r)^0; Year N = (1+r)^(N-1)
    const yearCost = annualGridPurchaseCost.times(d('1').plus(escalationRate).pow(n - 1));
    total = total.plus(yearCost.times(cashBackRate));
  }

  return total;
}
