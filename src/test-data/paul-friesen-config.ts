import { d } from '@/lib/decimal';
import type { AlbertaConfig } from '@/lib/types';

/**
 * Paul Friesen AlbertaConfig fixture for engine unit tests.
 * Uses Alberta carbon benchmark schedule (approximate 2024 values).
 * payoutLow = pricePerTonne * 0.45, payoutHigh = pricePerTonne * 0.65
 *
 * ALL Decimal fields constructed via d('string') -- never from float literals.
 */
export const paulFriesenConfig: AlbertaConfig = {
  id: 'test-config-2024',
  effectiveFrom: '2024-01-01',
  effectiveTo: null,
  gridEmissionFactor: d('0.55'),        // t CO2/MWh
  payoutPercentageLow: d('0.45'),
  payoutPercentageHigh: d('0.65'),
  cashBackRate: d('0.03'),
  defaultEscalationRate: d('0.05'),
  defaultNetMeteringBuyRate: d('0.1680'),
  defaultNetMeteringSellRate: d('0.3350'),
  carbonBenchmarkSchedule: [
    // Alberta carbon benchmark prices per tonne CO2, Years 1-10
    // payoutLow = pricePerTonne * 0.45, payoutHigh = pricePerTonne * 0.65
    { year: 1,  pricePerTonne: d('65'),  payoutLow: d('65').times(d('0.45')),  payoutHigh: d('65').times(d('0.65'))  },
    { year: 2,  pricePerTonne: d('80'),  payoutLow: d('80').times(d('0.45')),  payoutHigh: d('80').times(d('0.65'))  },
    { year: 3,  pricePerTonne: d('95'),  payoutLow: d('95').times(d('0.45')),  payoutHigh: d('95').times(d('0.65'))  },
    { year: 4,  pricePerTonne: d('110'), payoutLow: d('110').times(d('0.45')), payoutHigh: d('110').times(d('0.65')) },
    { year: 5,  pricePerTonne: d('130'), payoutLow: d('130').times(d('0.45')), payoutHigh: d('130').times(d('0.65')) },
    { year: 6,  pricePerTonne: d('150'), payoutLow: d('150').times(d('0.45')), payoutHigh: d('150').times(d('0.65')) },
    { year: 7,  pricePerTonne: d('170'), payoutLow: d('170').times(d('0.45')), payoutHigh: d('170').times(d('0.65')) },
    { year: 8,  pricePerTonne: d('190'), payoutLow: d('190').times(d('0.45')), payoutHigh: d('190').times(d('0.65')) },
    { year: 9,  pricePerTonne: d('210'), payoutLow: d('210').times(d('0.45')), payoutHigh: d('210').times(d('0.65')) },
    { year: 10, pricePerTonne: d('230'), payoutLow: d('230').times(d('0.45')), payoutHigh: d('230').times(d('0.65')) },
  ],
};
