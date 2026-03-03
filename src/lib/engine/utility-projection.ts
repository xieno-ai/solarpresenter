import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';

/**
 * CALC-01: Utility cost projection using geometric series.
 *
 * Returns an array of yearly utility costs of length `years`.
 * Index 0 = Year 1, index N-1 = Year N (no Year 0 stored).
 * Year N cost = annualCost × (1 + escalationRate)^N
 */
export function projectUtilityCosts(
  annualCost: Decimal,
  escalationRate: Decimal,
  years: number,
): Decimal[] {
  return Array.from({ length: years }, (_, i) => {
    const n = i + 1; // Year 1 through Year N
    return annualCost.times(d('1').plus(escalationRate).pow(n));
  });
}
