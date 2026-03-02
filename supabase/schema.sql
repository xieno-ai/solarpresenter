-- =============================================================================
-- Solar Presenter: Supabase Schema
-- =============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- after creating your project.
-- =============================================================================

-- Alberta regulatory configuration with version history
-- Each row represents a configuration effective for a date range.
-- effective_to = NULL means "currently active"
CREATE TABLE alberta_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  effective_from DATE NOT NULL,
  effective_to DATE,  -- NULL means "currently active"

  -- Carbon credit parameters
  grid_emission_factor NUMERIC NOT NULL DEFAULT 0.55,         -- t CO2/MWh
  payout_percentage_low NUMERIC NOT NULL DEFAULT 0.45,        -- 45%
  payout_percentage_high NUMERIC NOT NULL DEFAULT 0.65,       -- 65%
  cash_back_rate NUMERIC NOT NULL DEFAULT 0.03,               -- 3%

  -- Default rates (overridable per proposal)
  default_escalation_rate NUMERIC NOT NULL DEFAULT 0.05,           -- 5%
  default_net_metering_buy_rate NUMERIC NOT NULL DEFAULT 0.168,    -- $/kWh
  default_net_metering_sell_rate NUMERIC NOT NULL DEFAULT 0.335,   -- $/kWh

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT
);

-- Carbon benchmark schedule (separate table, one row per year)
-- Linked to a config version via config_id FK
CREATE TABLE carbon_benchmark_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES alberta_config(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  price_per_tonne NUMERIC NOT NULL,  -- $/tonne CO2e

  UNIQUE(config_id, year)
);

-- Proposals table (minimal for Phase 1, expanded in Phase 9)
-- Stores serialized ProposalInputs and ProposalOutputs as JSONB
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  config_id UUID REFERENCES alberta_config(id),  -- Lock to config version used
  inputs JSONB NOT NULL,     -- Serialized ProposalInputs
  outputs JSONB,             -- Serialized ProposalOutputs (NULL until calculated)
  status TEXT DEFAULT 'draft' NOT NULL
);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE alberta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_benchmark_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Alberta config: public SELECT (no auth needed in v1)
CREATE POLICY "Public read config" ON alberta_config
  FOR SELECT USING (true);

-- Carbon benchmark schedule: public SELECT
CREATE POLICY "Public read benchmarks" ON carbon_benchmark_schedule
  FOR SELECT USING (true);

-- Proposals: public read (for shareable URLs in Phase 9),
-- insert/update allowed via anon key (no auth in v1)
CREATE POLICY "Public read proposals" ON proposals
  FOR SELECT USING (true);

CREATE POLICY "Public insert proposals" ON proposals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update proposals" ON proposals
  FOR UPDATE USING (true);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for effective date queries (most recent first)
CREATE INDEX idx_alberta_config_effective
  ON alberta_config (effective_from DESC);
