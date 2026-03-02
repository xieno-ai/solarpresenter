import type Decimal from 'decimal.js';

/** Exactly 12 monthly values, January through December. */
export type MonthlyValues = [
  Decimal, Decimal, Decimal, Decimal,
  Decimal, Decimal, Decimal, Decimal,
  Decimal, Decimal, Decimal, Decimal,
];

export interface CustomerInfo {
  name: string;
  address: string;
  latitude: number;   // For satellite image, not financial
  longitude: number;  // For satellite image, not financial
}

export interface SystemInfo {
  systemSizeKw: Decimal;
  annualProductionKwh: Decimal;
  monthlyProductionKwh: MonthlyValues;
}

export interface ConsumptionInfo {
  annualConsumptionKwh: Decimal;
  monthlyConsumptionKwh: MonthlyValues;
  annualElectricityCost: Decimal;
}

export interface RateInfo {
  allInRate: Decimal;
  netMeteringBuyRate: Decimal;
  netMeteringSellRate: Decimal;
  annualEscalationRate: Decimal;
}

export interface FinancingInfo {
  cashPurchasePrice: Decimal;
  financeMonthlyPayment: Decimal;
  financeTermMonths: number;      // Integer count, not financial
  financeInterestRate: Decimal;
}

export interface ProposalInputs {
  customer: CustomerInfo;
  system: SystemInfo;
  consumption: ConsumptionInfo;
  rates: RateInfo;
  financing: FinancingInfo;
}
