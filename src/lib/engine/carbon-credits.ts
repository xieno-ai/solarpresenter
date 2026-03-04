import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';
import type { CarbonCreditProjection } from '@/lib/types/proposal-outputs';

/**
 * CALC-05: Carbon credit projection using SolarOffset.ca GDF schedule.
 *
 * GDF (Grid Displacement Factor) values for Alberta, 2026–2035.
 * Prices are fixed at $57/tonne (low) and $76/tonne (high).
 * Platform fee is tiered by system size (kWp).
 *
 * annualCo2Avoided = annualProductionKwh / 1000 × Year1GDF (representative display value)
 *
 * tenYearPayoutLow = sum over all 10 years of:
 *   (annualMwh × yearGDF) × PRICE_LOW × ownerKeep
 *
 * tenYearPayoutHigh = same with PRICE_HIGH
 *
 * benchmarkSchedule entries: all 10 years (2026–2035), showing per-tonne owner rates.
 * CarbonCreditsPage.tsx payoutRange() multiplies entry.payoutLow/payoutHigh by co2Float.
 */

const SOLAROFFSET_SCHEDULE = [
  { year: 2026, gdf: '0.4588' },
  { year: 2027, gdf: '0.4271' },
  { year: 2028, gdf: '0.3952' },
  { year: 2029, gdf: '0.3633' },
  { year: 2030, gdf: '0.3108' },
  { year: 2031, gdf: '0.3046' },
  { year: 2032, gdf: '0.2985' },
  { year: 2033, gdf: '0.2925' },
  { year: 2034, gdf: '0.2867' },
  { year: 2035, gdf: '0.2752' },
] as const;

const PRICE_LOW = d('57');   // $/tonne
const PRICE_HIGH = d('76');  // $/tonne

/**
 * Platform fee tiered by system size (kWp):
 * - 3–5 kWp: 45%
 * - 5–30 kWp: 30%
 * - 30–500 kWp: 25%
 */
function platformFee(systemSizeKw: Decimal): Decimal {
  const kw = systemSizeKw.toNumber();
  if (kw >= 30) return d('0.25');
  if (kw >= 5)  return d('0.30');
  return d('0.45'); // 3–5 kWp
}

export function computeCarbonCredits(
  annualProductionKwh: Decimal,
  systemSizeKw: Decimal,
): CarbonCreditProjection {
  const fee = platformFee(systemSizeKw);
  const ownerKeep = d('1').minus(fee);
  const ownerPriceLow = PRICE_LOW.times(ownerKeep);   // per-tonne owner revenue low
  const ownerPriceHigh = PRICE_HIGH.times(ownerKeep); // per-tonne owner revenue high

  const annualMwh = annualProductionKwh.dividedBy(d('1000'));

  // Use Year 1 GDF (2026) as the representative display value for annualCo2Avoided
  const annualCo2Avoided = annualMwh.times(d(SOLAROFFSET_SCHEDULE[0].gdf));

  // Sum per-year revenues across 10-year schedule
  let tenYearPayoutLow = d('0');
  let tenYearPayoutHigh = d('0');

  for (const entry of SOLAROFFSET_SCHEDULE) {
    const yearCo2 = annualMwh.times(d(entry.gdf));
    tenYearPayoutLow = tenYearPayoutLow.plus(yearCo2.times(PRICE_LOW).times(ownerKeep));
    tenYearPayoutHigh = tenYearPayoutHigh.plus(yearCo2.times(PRICE_HIGH).times(ownerKeep));
  }

  return {
    annualCo2Avoided,
    tenYearPayoutLow,
    tenYearPayoutHigh,
    // All rows show the same per-tonne owner rates; GDF only affects yearly totals.
    // CarbonCreditsPage.payoutRange() multiplies these per-tonne rates by co2Float.
    benchmarkSchedule: SOLAROFFSET_SCHEDULE.map(entry => ({
      year: entry.year,
      pricePerTonne: PRICE_LOW,
      payoutLow: ownerPriceLow,
      payoutHigh: ownerPriceHigh,
    })),
  };
}
