import { d } from '@/lib/decimal';
import type { ProposalInputs } from '@/lib/types';

/**
 * Paul Friesen reference case from the calculations document.
 * Used as the verified smoke test fixture in Phase 1
 * and the reference validation case in Phase 3.
 *
 * ALL monetary/energy values constructed via d('string') -- never from float literals.
 */
export const paulFriesenInputs: ProposalInputs = {
  customer: {
    name: 'Paul Friesen',
    address: '123 Example Street, Edmonton, AB',
    latitude: 53.5461,
    longitude: -113.4937,
  },
  system: {
    systemSizeKw: d('12.24'),
    annualProductionKwh: d('15408'),
    monthlyProductionKwh: [
      d('648'),   // Jan
      d('831'),   // Feb
      d('1188'),  // Mar
      d('1476'),  // Apr
      d('1656'),  // May
      d('1764'),  // Jun
      d('1764'),  // Jul
      d('1548'),  // Aug
      d('1260'),  // Sep
      d('936'),   // Oct
      d('666'),   // Nov
      d('540'),   // Dec
    ],
  },
  consumption: {
    annualConsumptionKwh: d('12000'),
    monthlyConsumptionKwh: [
      d('1100'),  // Jan
      d('1050'),  // Feb
      d('1000'),  // Mar
      d('950'),   // Apr
      d('900'),   // May
      d('850'),   // Jun
      d('900'),   // Jul
      d('950'),   // Aug
      d('1000'),  // Sep
      d('1050'),  // Oct
      d('1100'),  // Nov
      d('1150'),  // Dec
    ],
    annualElectricityCost: d('4212'),
  },
  rates: {
    allInRate: d('0.3510'),
    netMeteringBuyRate: d('0.1680'),
    netMeteringSellRate: d('0.3350'),
    annualEscalationRate: d('0.05'),
  },
  financing: {
    cashPurchasePrice: d('30000'),
    financeMonthlyPayment: d('189'),
    financeTermMonths: 240,
    financeInterestRate: d('0.0699'),
  },
};
