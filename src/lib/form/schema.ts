import { z } from 'zod';

/**
 * Helper: validates a string as a numeric value within [min, max].
 * All form inputs are strings (React Hook Form pattern).
 */
function numericString(min: number, max: number, label?: string) {
  return z
    .string()
    .min(1, `${label ?? 'Value'} is required`)
    .refine((v) => !isNaN(Number(v)), `${label ?? 'Value'} must be a number`)
    .refine(
      (v) => Number(v) >= min,
      `${label ?? 'Value'} must be at least ${min}`,
    )
    .refine(
      (v) => Number(v) <= max,
      `${label ?? 'Value'} must be at most ${max}`,
    );
}

/** Monthly array: exactly 12 numericString entries in range [0, 5000] */
const monthlyArray = z
  .array(numericString(0, 5000))
  .length(12, 'Must have exactly 12 monthly values');

export const proposalFormSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    address: z.string().min(1, 'Address is required'),
  }),

  system: z.object({
    systemSizeKw: numericString(1, 100, 'System size'),
    annualProductionKwh: numericString(1, 150000, 'Annual production'),
    monthlyProductionKwh: monthlyArray,
  }),

  consumption: z.object({
    annualConsumptionKwh: numericString(1, 150000, 'Annual consumption'),
    monthlyConsumptionKwh: monthlyArray,
    annualElectricityCost: numericString(0, 500000, 'Annual electricity cost'),
  }),

  rates: z.object({
    allInRate: numericString(0.01, 2.0, 'All-in rate'),
    netMeteringBuyRate: numericString(0.01, 2.0, 'Net metering buy rate'),
    netMeteringSellRate: numericString(0.01, 2.0, 'Net metering sell rate'),
    annualEscalationRate: numericString(0, 0.30, 'Annual escalation rate'),
  }),

  financing: z.object({
    cashPurchasePrice: numericString(1000, 500000, 'Cash purchase price'),
    financeMonthlyPayment: numericString(0, 10000, 'Monthly payment'),
    financeTermMonths: numericString(1, 600, 'Finance term'),
    financeInterestRate: numericString(0, 0.50, 'Interest rate'),
  }),
});

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;
