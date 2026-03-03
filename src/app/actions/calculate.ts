'use server';

import { getAlbertaConfig } from '@/lib/config/alberta';
import { calculateProposal } from '@/lib/engine/calculate';
import { d } from '@/lib/decimal';
import type { ProposalFormValues } from '@/lib/form/schema';
import type { ProposalInputs, MonthlyValues } from '@/lib/types';

// ---------------------------------------------------------------------------
// Serialized output types — all Decimal fields become string for safe
// JSON transport across the server/client boundary.
// ---------------------------------------------------------------------------

export type SerializedMonthlyNetMetering = {
  month: string;
  consumptionKwh: string;
  productionKwh: string;
  gridBuyKwh: string;
  surplusSoldKwh: string;
  costToBuy: string;
  revenueEarned: string;
};

export type SerializedSavingsSummary = {
  utilityAvoided: string;
  netMeteringRevenue: string;
  carbonCredits: string;
  cashBack: string;
  totalSavings: string;
  netSavingsAfterCost: string;
};

export type SerializedProposalOutputs = {
  solarOffsetPercent: string;
  twentyYearUtilityCost: string;
  twentyYearSavings: string;
  monthlyNetMetering: SerializedMonthlyNetMetering[];
  annualGridPurchaseCost: string;
  annualSellRevenue: string;
  carbonCredits: {
    annualCo2Avoided: string;
    tenYearPayoutLow: string;
    tenYearPayoutHigh: string;
    benchmarkSchedule: Array<{
      year: number;
      pricePerTonne: string;
      payoutLow: string;
      payoutHigh: string;
    }>;
  };
  cashPurchase: {
    twentyYear: SerializedSavingsSummary;
    thirtyYear: SerializedSavingsSummary;
  };
  financeOption: {
    monthlyAllInCost: string;
    totalMonthlyPayment: string;
  };
  utilityProjection20Year: string[];
  utilityProjection30Year: string[];
};

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

/**
 * Server action: accepts string-typed ProposalFormValues from the /enter form,
 * fetches the current AlbertaConfig from Supabase, converts all string fields
 * to Decimal at the calculation boundary, calls the pure calculateProposal()
 * engine, then serializes all Decimal fields to strings for JSON transport.
 *
 * Follows the pattern established by get-defaults.ts:
 *   1. 'use server' at file top
 *   2. Fetch config via getAlbertaConfig()
 *   3. Return fully typed, plain-object result (no Decimal instances)
 *
 * @param formValues - All-string ProposalFormValues from React Hook Form
 * @returns SerializedProposalOutputs — all Decimal fields as strings
 * @throws Error if Supabase is unavailable or no config found
 */
export async function runCalculation(
  formValues: ProposalFormValues,
): Promise<SerializedProposalOutputs> {
  // 1. Fetch config from Supabase (effective date filtering handled internally)
  const config = await getAlbertaConfig();

  // 2. Build ProposalInputs — convert all string values to Decimal at boundary
  //    Integer fields (financeTermMonths) use parseInt; all others use d()
  const inputs: ProposalInputs = {
    customer: {
      name: formValues.customer.name,
      address: formValues.customer.address,
      latitude: 0,
      longitude: 0,
    },
    system: {
      systemSizeKw: d(formValues.system.systemSizeKw),
      annualProductionKwh: d(formValues.system.annualProductionKwh),
      monthlyProductionKwh: formValues.system.monthlyProductionKwh.map(d) as MonthlyValues,
    },
    consumption: {
      annualConsumptionKwh: d(formValues.consumption.annualConsumptionKwh),
      monthlyConsumptionKwh: formValues.consumption.monthlyConsumptionKwh.map(d) as MonthlyValues,
      annualElectricityCost: d(formValues.consumption.annualElectricityCost),
    },
    rates: {
      allInRate: d(formValues.rates.allInRate),
      netMeteringBuyRate: d(formValues.rates.netMeteringBuyRate),
      netMeteringSellRate: d(formValues.rates.netMeteringSellRate),
      annualEscalationRate: d(formValues.rates.annualEscalationRate),
    },
    financing: {
      cashPurchasePrice: d(formValues.financing.cashPurchasePrice),
      financeMonthlyPayment: d(formValues.financing.financeMonthlyPayment),
      financeTermMonths: parseInt(formValues.financing.financeTermMonths, 10),
      financeInterestRate: d(formValues.financing.financeInterestRate),
    },
  };

  // 3. Call the pure calculation engine
  const outputs = calculateProposal(inputs, config);

  // 4. Serialize all Decimal fields to strings — explicit mapping preserves
  //    full TypeScript types on the returned object (not JSON.stringify replacer)
  const serializeSavings = (s: typeof outputs.cashPurchase.twentyYear): SerializedSavingsSummary => ({
    utilityAvoided: s.utilityAvoided.toString(),
    netMeteringRevenue: s.netMeteringRevenue.toString(),
    carbonCredits: s.carbonCredits.toString(),
    cashBack: s.cashBack.toString(),
    totalSavings: s.totalSavings.toString(),
    netSavingsAfterCost: s.netSavingsAfterCost.toString(),
  });

  return {
    solarOffsetPercent: outputs.solarOffsetPercent.toString(),
    twentyYearUtilityCost: outputs.twentyYearUtilityCost.toString(),
    twentyYearSavings: outputs.twentyYearSavings.toString(),
    monthlyNetMetering: outputs.monthlyNetMetering.map((m) => ({
      month: m.month,
      consumptionKwh: m.consumptionKwh.toString(),
      productionKwh: m.productionKwh.toString(),
      gridBuyKwh: m.gridBuyKwh.toString(),
      surplusSoldKwh: m.surplusSoldKwh.toString(),
      costToBuy: m.costToBuy.toString(),
      revenueEarned: m.revenueEarned.toString(),
    })),
    annualGridPurchaseCost: outputs.annualGridPurchaseCost.toString(),
    annualSellRevenue: outputs.annualSellRevenue.toString(),
    carbonCredits: {
      annualCo2Avoided: outputs.carbonCredits.annualCo2Avoided.toString(),
      tenYearPayoutLow: outputs.carbonCredits.tenYearPayoutLow.toString(),
      tenYearPayoutHigh: outputs.carbonCredits.tenYearPayoutHigh.toString(),
      benchmarkSchedule: outputs.carbonCredits.benchmarkSchedule.map((entry) => ({
        year: entry.year,
        pricePerTonne: entry.pricePerTonne.toString(),
        payoutLow: entry.payoutLow.toString(),
        payoutHigh: entry.payoutHigh.toString(),
      })),
    },
    cashPurchase: {
      twentyYear: serializeSavings(outputs.cashPurchase.twentyYear),
      thirtyYear: serializeSavings(outputs.cashPurchase.thirtyYear),
    },
    financeOption: {
      monthlyAllInCost: outputs.financeOption.monthlyAllInCost.toString(),
      totalMonthlyPayment: outputs.financeOption.totalMonthlyPayment.toString(),
    },
    utilityProjection20Year: outputs.utilityProjection20Year.map((v) => v.toString()),
    utilityProjection30Year: outputs.utilityProjection30Year.map((v) => v.toString()),
  };
}
