import { createClient } from '@/lib/supabase/server';
import { d } from '@/lib/decimal';
import type { AlbertaConfig, CarbonBenchmarkEntry } from '@/lib/types';
import type { Database } from '@/lib/supabase/types';

/** Row type for the alberta_config table */
type ConfigRow = Database['public']['Tables']['alberta_config']['Row'];

/** Row type for the carbon_benchmark_schedule table */
type BenchmarkRow = Database['public']['Tables']['carbon_benchmark_schedule']['Row'];

/**
 * Fetch the Alberta regulatory configuration effective as of a given date.
 *
 * Queries the `alberta_config` table with effective date filtering:
 * - effective_from <= asOfDate
 * - effective_to IS NULL OR effective_to >= asOfDate
 * - Ordered by effective_from DESC (most recent applicable config)
 *
 * Also fetches the related carbon_benchmark_schedule rows.
 *
 * All NUMERIC database values are converted to Decimal instances via d().
 * Supabase returns NUMERIC columns as strings -- this is intentional and
 * prevents IEEE 754 precision loss. We pass them directly to d().
 *
 * @param asOfDate - Date to filter config by (defaults to today)
 * @returns AlbertaConfig with Decimal-typed values
 * @throws Error if no config found or Supabase query fails
 */
export async function getAlbertaConfig(asOfDate?: Date): Promise<AlbertaConfig> {
  const supabase = await createClient();
  const date = asOfDate ?? new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch the most recent applicable config
  const { data, error: configError } = await supabase
    .from('alberta_config')
    .select('*')
    .lte('effective_from', dateStr)
    .or(`effective_to.is.null,effective_to.gte.${dateStr}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  if (configError || !data) {
    throw new Error(`Failed to load Alberta config: ${configError?.message ?? 'No config found'}`);
  }

  // Cast to our known row type (Supabase generic inference can be incomplete
  // with placeholder Database types -- the generated types fix this)
  const configRow = data as unknown as ConfigRow;

  // Fetch carbon benchmark schedule for this config
  const { data: rawBenchmarks, error: benchmarkError } = await supabase
    .from('carbon_benchmark_schedule')
    .select('*')
    .eq('config_id', configRow.id)
    .order('year', { ascending: true });

  if (benchmarkError) {
    throw new Error(`Failed to load carbon benchmark schedule: ${benchmarkError.message}`);
  }

  const benchmarkRows = (rawBenchmarks ?? []) as unknown as BenchmarkRow[];

  // Convert NUMERIC strings to Decimal instances
  const payoutLow = d(configRow.payout_percentage_low);
  const payoutHigh = d(configRow.payout_percentage_high);

  const carbonBenchmarkSchedule: CarbonBenchmarkEntry[] = benchmarkRows.map((row) => {
    const price = d(row.price_per_tonne);
    return {
      year: row.year,
      pricePerTonne: price,
      payoutLow: price.times(payoutLow),
      payoutHigh: price.times(payoutHigh),
    };
  });

  return {
    id: configRow.id,
    effectiveFrom: configRow.effective_from,
    effectiveTo: configRow.effective_to,
    gridEmissionFactor: d(configRow.grid_emission_factor),
    payoutPercentageLow: payoutLow,
    payoutPercentageHigh: payoutHigh,
    cashBackRate: d(configRow.cash_back_rate),
    defaultEscalationRate: d(configRow.default_escalation_rate),
    defaultNetMeteringBuyRate: d(configRow.default_net_metering_buy_rate),
    defaultNetMeteringSellRate: d(configRow.default_net_metering_sell_rate),
    carbonBenchmarkSchedule,
  };
}
