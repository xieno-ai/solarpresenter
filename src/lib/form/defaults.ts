import type { ProposalFormValues } from './schema';

/**
 * Alberta solar irradiance distribution curve — 12 normalized monthly fractions
 * that sum to 1.0. Derived from Paul Friesen fixture data.
 *
 * Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
 */
export const ALBERTA_SOLAR_CURVE: readonly number[] = [
  0.045388, // January
  0.058206, // February
  0.083211, // March
  0.103383, // April
  0.115991, // May
  0.123555, // June
  0.123555, // July
  0.108426, // August
  0.088254, // September
  0.065560, // October
  0.046648, // November
  0.037823, // December
] as const;

/**
 * Returns a ProposalFormValues object with sensible empty-state defaults.
 * All numeric fields default to empty string ('') except monthly arrays
 * which are initialized to '0' for all 12 months.
 *
 * React Hook Form requires all registered fields to have default values.
 */
export function getEmptyDefaults(): ProposalFormValues {
  return {
    customer: {
      name: '',
      address: '',
    },
    system: {
      systemSizeKw: '',
      annualProductionKwh: '',
      monthlyProductionKwh: Array(12).fill('0') as [
        string, string, string, string,
        string, string, string, string,
        string, string, string, string,
      ],
    },
    consumption: {
      annualConsumptionKwh: '',
      monthlyConsumptionKwh: Array(12).fill('0') as [
        string, string, string, string,
        string, string, string, string,
        string, string, string, string,
      ],
      annualElectricityCost: '',
    },
    rates: {
      allInRate: '',
      netMeteringBuyRate: '',
      netMeteringSellRate: '',
      annualEscalationRate: '',
    },
    financing: {
      cashPurchasePrice: '',
      financeMonthlyPayment: '',
      financeTermMonths: '',
      financeInterestRate: '',
    },
  };
}
