'use server';

import { getAlbertaConfig } from '@/lib/config/alberta';

/**
 * String-typed rate defaults returned by the server action.
 * All values use .toString() on Decimal to preserve full precision
 * (Supabase NUMERIC -> Decimal -> string, never through float).
 */
export interface DefaultRates {
  allInRate: string;
  netMeteringBuyRate: string;
  netMeteringSellRate: string;
  annualEscalationRate: string;
}

/**
 * Server action: fetch Alberta regulatory rate defaults from Supabase.
 *
 * allInRate and netMeteringBuyRate are both initialized from
 * defaultNetMeteringBuyRate — they represent the same rate default.
 * The user can differentiate them in the form after pre-population.
 *
 * @returns DefaultRates with string-typed values for React Hook Form
 * @throws Error if Supabase is unavailable or no config found
 */
export async function getDefaultRates(): Promise<DefaultRates> {
  const config = await getAlbertaConfig();
  return {
    allInRate: config.defaultNetMeteringBuyRate.toString(),
    netMeteringBuyRate: config.defaultNetMeteringBuyRate.toString(),
    netMeteringSellRate: config.defaultNetMeteringSellRate.toString(),
    annualEscalationRate: config.defaultEscalationRate.toString(),
  };
}
