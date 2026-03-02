import type Decimal from 'decimal.js';

export interface CarbonBenchmarkEntry {
  year: number;
  pricePerTonne: Decimal;
  payoutLow: Decimal;
  payoutHigh: Decimal;
}

export interface AlbertaConfig {
  id: string;
  effectiveFrom: string;              // ISO date (YYYY-MM-DD)
  effectiveTo: string | null;         // null means "currently active"
  gridEmissionFactor: Decimal;        // t CO2/MWh
  payoutPercentageLow: Decimal;       // e.g., 0.45
  payoutPercentageHigh: Decimal;      // e.g., 0.65
  cashBackRate: Decimal;              // e.g., 0.03
  defaultEscalationRate: Decimal;     // e.g., 0.05
  defaultNetMeteringBuyRate: Decimal; // $/kWh
  defaultNetMeteringSellRate: Decimal;// $/kWh
  carbonBenchmarkSchedule: CarbonBenchmarkEntry[];
}
