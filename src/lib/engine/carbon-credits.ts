import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';
import type { CarbonCreditProjection } from '@/lib/types/proposal-outputs';
import type { AlbertaConfig } from '@/lib/types/alberta-config';

/**
 * CALC-05: Carbon credit projection.
 *
 * annualCo2Avoided = annualProductionKwh / 1000 × gridEmissionFactor
 *
 * tenYearPayoutLow = sum over entries where year <= 10 of:
 *   annualCo2Avoided × entry.payoutLow
 *   (entry.payoutLow is already pricePerTonne × payoutPercentageLow)
 *
 * tenYearPayoutHigh = same with entry.payoutHigh
 *
 * benchmarkSchedule: all entries from config.carbonBenchmarkSchedule passed through as-is.
 */
export function computeCarbonCredits(
  annualProductionKwh: Decimal,
  config: AlbertaConfig,
): CarbonCreditProjection {
  // CO2 avoided: convert kWh to MWh (÷ 1000) then multiply by grid emission factor
  const annualCo2Avoided = annualProductionKwh
    .dividedBy(d('1000'))
    .times(config.gridEmissionFactor);

  // Sum 10-year payouts using pre-computed payoutLow/payoutHigh from each benchmark entry
  const tenYearEntries = config.carbonBenchmarkSchedule.filter(entry => entry.year <= 10);

  const tenYearPayoutLow = tenYearEntries.reduce(
    (sum, entry) => sum.plus(annualCo2Avoided.times(entry.payoutLow)),
    d('0'),
  );

  const tenYearPayoutHigh = tenYearEntries.reduce(
    (sum, entry) => sum.plus(annualCo2Avoided.times(entry.payoutHigh)),
    d('0'),
  );

  return {
    annualCo2Avoided,
    tenYearPayoutLow,
    tenYearPayoutHigh,
    benchmarkSchedule: config.carbonBenchmarkSchedule.map(entry => ({
      year: entry.year,
      pricePerTonne: entry.pricePerTonne,
      payoutLow: entry.payoutLow,
      payoutHigh: entry.payoutHigh,
    })),
  };
}
