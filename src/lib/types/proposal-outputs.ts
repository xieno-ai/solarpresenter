import type Decimal from 'decimal.js';

export interface MonthlyNetMetering {
  month: string;
  consumptionKwh: Decimal;
  productionKwh: Decimal;
  gridBuyKwh: Decimal;
  surplusSoldKwh: Decimal;
  costToBuy: Decimal;
  revenueEarned: Decimal;
}

export interface CarbonCreditProjection {
  annualCo2Avoided: Decimal;
  tenYearPayoutLow: Decimal;
  tenYearPayoutHigh: Decimal;
  benchmarkSchedule: Array<{
    year: number;
    pricePerTonne: Decimal;
    payoutLow: Decimal;
    payoutHigh: Decimal;
  }>;
}

export interface SavingsSummary {
  utilityAvoided: Decimal;
  netMeteringRevenue: Decimal;
  carbonCredits: Decimal;
  cashBack: Decimal;
  totalSavings: Decimal;
  netSavingsAfterCost: Decimal;
}

export interface ProposalOutputs {
  // Page 1: Cover
  solarOffsetPercent: Decimal;
  twentyYearUtilityCost: Decimal;
  twentyYearSavings: Decimal;

  // Page 3: Net Metering
  monthlyNetMetering: MonthlyNetMetering[];
  annualGridPurchaseCost: Decimal;
  annualSellRevenue: Decimal;

  // Page 4: Carbon Credits
  carbonCredits: CarbonCreditProjection;

  // Page 5: True All-In Costs
  cashPurchase: {
    twentyYear: SavingsSummary;
    thirtyYear: SavingsSummary;
  };
  financeOption: {
    monthlyAllInCost: Decimal;
    totalMonthlyPayment: Decimal;
  };

  // Utility projections (for charts)
  utilityProjection20Year: Decimal[];
  utilityProjection30Year: Decimal[];
}
