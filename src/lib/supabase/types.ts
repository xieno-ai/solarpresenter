/**
 * Supabase Database Types
 *
 * This is a PLACEHOLDER type stub. After applying schema.sql to your
 * Supabase project, regenerate with:
 *
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * The generated types provide full type safety for all Supabase queries.
 * Until then, this stub allows the codebase to compile.
 */

export interface Database {
  public: {
    Tables: {
      alberta_config: {
        Row: {
          id: string;
          effective_from: string;
          effective_to: string | null;
          grid_emission_factor: string;       // NUMERIC returned as string
          payout_percentage_low: string;
          payout_percentage_high: string;
          cash_back_rate: string;
          default_escalation_rate: string;
          default_net_metering_buy_rate: string;
          default_net_metering_sell_rate: string;
          created_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          effective_from: string;
          effective_to?: string | null;
          grid_emission_factor?: string;
          payout_percentage_low?: string;
          payout_percentage_high?: string;
          cash_back_rate?: string;
          default_escalation_rate?: string;
          default_net_metering_buy_rate?: string;
          default_net_metering_sell_rate?: string;
          created_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          effective_from?: string;
          effective_to?: string | null;
          grid_emission_factor?: string;
          payout_percentage_low?: string;
          payout_percentage_high?: string;
          cash_back_rate?: string;
          default_escalation_rate?: string;
          default_net_metering_buy_rate?: string;
          default_net_metering_sell_rate?: string;
          created_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      carbon_benchmark_schedule: {
        Row: {
          id: string;
          config_id: string;
          year: number;
          price_per_tonne: string;            // NUMERIC returned as string
        };
        Insert: {
          id?: string;
          config_id: string;
          year: number;
          price_per_tonne: string;
        };
        Update: {
          id?: string;
          config_id?: string;
          year?: number;
          price_per_tonne?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'carbon_benchmark_schedule_config_id_fkey';
            columns: ['config_id'];
            isOneToOne: false;
            referencedRelation: 'alberta_config';
            referencedColumns: ['id'];
          },
        ];
      };
      proposals: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          config_id: string | null;
          inputs: Record<string, unknown>;
          outputs: Record<string, unknown> | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          config_id?: string | null;
          inputs: Record<string, unknown>;
          outputs?: Record<string, unknown> | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          config_id?: string | null;
          inputs?: Record<string, unknown>;
          outputs?: Record<string, unknown> | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'proposals_config_id_fkey';
            columns: ['config_id'];
            isOneToOne: false;
            referencedRelation: 'alberta_config';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
