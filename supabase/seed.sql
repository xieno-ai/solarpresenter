-- =============================================================================
-- Solar Presenter: Seed Data
-- =============================================================================
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- Seeds the initial Alberta configuration and carbon benchmark schedule
-- based on values from the Solar Proposal Calculations document.
-- =============================================================================

-- Insert initial Alberta config (currently active: effective_to = NULL)
INSERT INTO alberta_config (
  effective_from,
  effective_to,
  grid_emission_factor,
  payout_percentage_low,
  payout_percentage_high,
  cash_back_rate,
  default_escalation_rate,
  default_net_metering_buy_rate,
  default_net_metering_sell_rate,
  notes
) VALUES (
  '2025-01-01',
  NULL,
  0.55,     -- t CO2/MWh
  0.45,     -- 45%
  0.65,     -- 65%
  0.03,     -- 3%
  0.05,     -- 5%
  0.168,    -- $/kWh
  0.335,    -- $/kWh
  'Initial Alberta config based on calculations document'
);

-- Insert carbon benchmark schedule for the initial config
-- Uses a CTE to reference the config_id from the INSERT above
INSERT INTO carbon_benchmark_schedule (config_id, year, price_per_tonne)
SELECT ac.id, schedule.year, schedule.price
FROM alberta_config ac
CROSS JOIN (VALUES
  (2025, 80),
  (2026, 95),
  (2027, 110),
  (2028, 125),
  (2029, 140),
  (2030, 170)
) AS schedule(year, price)
WHERE ac.effective_to IS NULL;
