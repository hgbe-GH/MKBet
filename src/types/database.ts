export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accumulator_correlation_rules: {
        Row: {
          code: string;
          correlation_adjustment: number;
          created_at: string;
          description: string;
          event_codes: string[];
          id: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          code: string;
          correlation_adjustment: number;
          created_at?: string;
          description: string;
          event_codes: string[];
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          code?: string;
          correlation_adjustment?: number;
          created_at?: string;
          description?: string;
          event_codes?: string[];
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      action_confirmations: {
        Row: {
          action_id: string;
          comment: string | null;
          corrected_occurred_at: string | null;
          created_at: string;
          decision: Database["public"]["Enums"]["confirmation_decision"];
          id: string;
          subject_key: Database["public"]["Enums"]["subject_key"] | null;
          user_id: string;
        };
        Insert: {
          action_id: string;
          comment?: string | null;
          corrected_occurred_at?: string | null;
          created_at?: string;
          decision: Database["public"]["Enums"]["confirmation_decision"];
          id?: string;
          subject_key?: Database["public"]["Enums"]["subject_key"] | null;
          user_id: string;
        };
        Update: {
          action_id?: string;
          comment?: string | null;
          corrected_occurred_at?: string | null;
          created_at?: string;
          decision?: Database["public"]["Enums"]["confirmation_decision"];
          id?: string;
          subject_key?: Database["public"]["Enums"]["subject_key"] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_confirmations_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_confirmations_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "member_action_feed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_confirmations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      action_reports: {
        Row: {
          action_id: string;
          certainty: Database["public"]["Enums"]["action_certainty"];
          comment: string | null;
          id: string;
          reported_at: string;
          reporter_id: string;
          source_type: Database["public"]["Enums"]["action_certainty"];
        };
        Insert: {
          action_id: string;
          certainty: Database["public"]["Enums"]["action_certainty"];
          comment?: string | null;
          id?: string;
          reported_at?: string;
          reporter_id: string;
          source_type: Database["public"]["Enums"]["action_certainty"];
        };
        Update: {
          action_id?: string;
          certainty?: Database["public"]["Enums"]["action_certainty"];
          comment?: string | null;
          id?: string;
          reported_at?: string;
          reporter_id?: string;
          source_type?: Database["public"]["Enums"]["action_certainty"];
        };
        Relationships: [
          {
            foreignKeyName: "action_reports_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_reports_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "member_action_feed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      action_type_confirmation_rules: {
        Row: {
          action_type_id: string;
          created_at: string;
          id: string;
          is_active: boolean;
          policy: Database["public"]["Enums"]["confirmation_policy"];
          priority: number;
        };
        Insert: {
          action_type_id: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          policy: Database["public"]["Enums"]["confirmation_policy"];
          priority?: number;
        };
        Update: {
          action_type_id?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          policy?: Database["public"]["Enums"]["confirmation_policy"];
          priority?: number;
        };
        Relationships: [
          {
            foreignKeyName: "action_type_confirmation_rules_action_type_id_fkey";
            columns: ["action_type_id"];
            isOneToOne: false;
            referencedRelation: "action_types";
            referencedColumns: ["id"];
          },
        ];
      };
      action_types: {
        Row: {
          category: Database["public"]["Enums"]["market_category"];
          code: string;
          confirmation_policy: Database["public"]["Enums"]["confirmation_policy"];
          created_at: string;
          deduplication_window_minutes: number;
          id: string;
          is_active: boolean;
          privacy_level: Database["public"]["Enums"]["privacy_level"];
          public_label: string;
          rechute_commitment_delta: number;
          rechute_physical_delta: number;
          rechute_proximity_delta: number;
          rechute_regularity_delta: number;
          trash_label: string;
          updated_at: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["market_category"];
          code: string;
          confirmation_policy: Database["public"]["Enums"]["confirmation_policy"];
          created_at?: string;
          deduplication_window_minutes?: number;
          id?: string;
          is_active?: boolean;
          privacy_level: Database["public"]["Enums"]["privacy_level"];
          public_label: string;
          rechute_commitment_delta?: number;
          rechute_physical_delta?: number;
          rechute_proximity_delta?: number;
          rechute_regularity_delta?: number;
          trash_label: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["market_category"];
          code?: string;
          confirmation_policy?: Database["public"]["Enums"]["confirmation_policy"];
          created_at?: string;
          deduplication_window_minutes?: number;
          id?: string;
          is_active?: boolean;
          privacy_level?: Database["public"]["Enums"]["privacy_level"];
          public_label?: string;
          rechute_commitment_delta?: number;
          rechute_physical_delta?: number;
          rechute_proximity_delta?: number;
          rechute_regularity_delta?: number;
          trash_label?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      actions: {
        Row: {
          action_type_id: string;
          certainty: Database["public"]["Enums"]["action_certainty"];
          classified: boolean;
          created_at: string;
          declared_at: string;
          declared_by: string;
          id: string;
          live_id: string | null;
          occurred_at: string;
          official_occurred_at: string | null;
          private_note: string | null;
          public_description: string | null;
          season_id: string;
          status: Database["public"]["Enums"]["action_status"];
          supersedes_action_id: string | null;
          updated_at: string;
        };
        Insert: {
          action_type_id: string;
          certainty: Database["public"]["Enums"]["action_certainty"];
          classified?: boolean;
          created_at?: string;
          declared_at?: string;
          declared_by: string;
          id?: string;
          live_id?: string | null;
          occurred_at: string;
          official_occurred_at?: string | null;
          private_note?: string | null;
          public_description?: string | null;
          season_id: string;
          status?: Database["public"]["Enums"]["action_status"];
          supersedes_action_id?: string | null;
          updated_at?: string;
        };
        Update: {
          action_type_id?: string;
          certainty?: Database["public"]["Enums"]["action_certainty"];
          classified?: boolean;
          created_at?: string;
          declared_at?: string;
          declared_by?: string;
          id?: string;
          live_id?: string | null;
          occurred_at?: string;
          official_occurred_at?: string | null;
          private_note?: string | null;
          public_description?: string | null;
          season_id?: string;
          status?: Database["public"]["Enums"]["action_status"];
          supersedes_action_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "actions_action_type_id_fkey";
            columns: ["action_type_id"];
            isOneToOne: false;
            referencedRelation: "action_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actions_declared_by_fkey";
            columns: ["declared_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actions_live_season_fk";
            columns: ["live_id", "season_id"];
            isOneToOne: false;
            referencedRelation: "live_sessions";
            referencedColumns: ["id", "season_id"];
          },
          {
            foreignKeyName: "actions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actions_supersedes_action_id_fkey";
            columns: ["supersedes_action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actions_supersedes_action_id_fkey";
            columns: ["supersedes_action_id"];
            isOneToOne: false;
            referencedRelation: "member_action_feed";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: number;
          metadata: Json;
          season_id: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: never;
          metadata?: Json;
          season_id?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: never;
          metadata?: Json;
          season_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      bet_legs: {
        Row: {
          bet_id: string;
          fair_probability_at_bet: number;
          id: string;
          market_id: string;
          odds_at_bet: number;
          odds_version_at_bet: number;
          outcome_id: string;
          settled_at: string | null;
          status: Database["public"]["Enums"]["bet_leg_status"];
        };
        Insert: {
          bet_id: string;
          fair_probability_at_bet: number;
          id?: string;
          market_id: string;
          odds_at_bet: number;
          odds_version_at_bet: number;
          outcome_id: string;
          settled_at?: string | null;
          status?: Database["public"]["Enums"]["bet_leg_status"];
        };
        Update: {
          bet_id?: string;
          fair_probability_at_bet?: number;
          id?: string;
          market_id?: string;
          odds_at_bet?: number;
          odds_version_at_bet?: number;
          outcome_id?: string;
          settled_at?: string | null;
          status?: Database["public"]["Enums"]["bet_leg_status"];
        };
        Relationships: [
          {
            foreignKeyName: "bet_legs_bet_id_fkey";
            columns: ["bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bet_legs_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bet_legs_outcome_market_fk";
            columns: ["outcome_id", "market_id"];
            isOneToOne: false;
            referencedRelation: "market_outcomes";
            referencedColumns: ["id", "market_id"];
          },
        ];
      };
      bet_quote_legs: {
        Row: {
          created_at: string;
          displayed_odds: number;
          event_code: string;
          fair_probability: number;
          id: string;
          market_id: string;
          odds_version: number;
          outcome_id: string;
          quote_id: string;
        };
        Insert: {
          created_at?: string;
          displayed_odds: number;
          event_code: string;
          fair_probability: number;
          id?: string;
          market_id: string;
          odds_version: number;
          outcome_id: string;
          quote_id: string;
        };
        Update: {
          created_at?: string;
          displayed_odds?: number;
          event_code?: string;
          fair_probability?: number;
          id?: string;
          market_id?: string;
          odds_version?: number;
          outcome_id?: string;
          quote_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bet_quote_legs_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bet_quote_legs_outcome_market_fk";
            columns: ["outcome_id", "market_id"];
            isOneToOne: false;
            referencedRelation: "market_outcomes";
            referencedColumns: ["id", "market_id"];
          },
          {
            foreignKeyName: "bet_quote_legs_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "bet_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      bet_quotes: {
        Row: {
          bet_type: Database["public"]["Enums"]["bet_type"];
          consumed_at: string | null;
          correlation_adjustment: number | null;
          created_at: string;
          expires_at: string;
          id: string;
          idempotency_key: string;
          margin: number;
          potential_return_mkb: number;
          season_id: string;
          stake_mkb: number;
          status: Database["public"]["Enums"]["bet_quote_status"];
          total_odds: number;
          user_id: string;
        };
        Insert: {
          bet_type: Database["public"]["Enums"]["bet_type"];
          consumed_at?: string | null;
          correlation_adjustment?: number | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          idempotency_key: string;
          margin: number;
          potential_return_mkb: number;
          season_id: string;
          stake_mkb: number;
          status?: Database["public"]["Enums"]["bet_quote_status"];
          total_odds: number;
          user_id: string;
        };
        Update: {
          bet_type?: Database["public"]["Enums"]["bet_type"];
          consumed_at?: string | null;
          correlation_adjustment?: number | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          idempotency_key?: string;
          margin?: number;
          potential_return_mkb?: number;
          season_id?: string;
          stake_mkb?: number;
          status?: Database["public"]["Enums"]["bet_quote_status"];
          total_odds?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bet_quotes_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bet_quotes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bets: {
        Row: {
          bet_type: Database["public"]["Enums"]["bet_type"];
          created_at: string;
          id: string;
          idempotency_key: string;
          placed_at: string;
          potential_return_mkb: number;
          quote_id: string;
          season_id: string;
          settled_at: string | null;
          stake_mkb: number;
          status: Database["public"]["Enums"]["bet_status"];
          total_odds: number;
          user_id: string;
        };
        Insert: {
          bet_type: Database["public"]["Enums"]["bet_type"];
          created_at?: string;
          id?: string;
          idempotency_key: string;
          placed_at?: string;
          potential_return_mkb: number;
          quote_id: string;
          season_id: string;
          settled_at?: string | null;
          stake_mkb: number;
          status?: Database["public"]["Enums"]["bet_status"];
          total_odds: number;
          user_id: string;
        };
        Update: {
          bet_type?: Database["public"]["Enums"]["bet_type"];
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          placed_at?: string;
          potential_return_mkb?: number;
          quote_id?: string;
          season_id?: string;
          settled_at?: string | null;
          stake_mkb?: number;
          status?: Database["public"]["Enums"]["bet_status"];
          total_odds?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bets_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "bet_quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bets_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bets_wallet_fk";
            columns: ["season_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["season_id", "user_id"];
          },
        ];
      };
      live_attendees: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendance_status"];
          checked_in_at: string | null;
          checked_out_at: string | null;
          live_id: string;
          live_role: Database["public"]["Enums"]["live_member_role"];
          user_id: string;
        };
        Insert: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"];
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          live_id: string;
          live_role?: Database["public"]["Enums"]["live_member_role"];
          user_id: string;
        };
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"];
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          live_id?: string;
          live_role?: Database["public"]["Enums"]["live_member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "live_attendees_live_id_fkey";
            columns: ["live_id"];
            isOneToOne: false;
            referencedRelation: "live_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "live_attendees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      live_sessions: {
        Row: {
          actual_end: string | null;
          actual_start: string | null;
          context_physical_multiplier: number;
          context_sentimental_multiplier: number;
          created_at: string;
          created_by: string;
          description: string | null;
          host_user_id: string | null;
          id: string;
          live_type: Database["public"]["Enums"]["live_type"];
          location_label: string | null;
          pre_match_betting_closes_at: string | null;
          scheduled_end: string | null;
          scheduled_start: string | null;
          season_id: string;
          status: Database["public"]["Enums"]["live_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          actual_end?: string | null;
          actual_start?: string | null;
          context_physical_multiplier?: number;
          context_sentimental_multiplier?: number;
          created_at?: string;
          created_by: string;
          description?: string | null;
          host_user_id?: string | null;
          id?: string;
          live_type: Database["public"]["Enums"]["live_type"];
          location_label?: string | null;
          pre_match_betting_closes_at?: string | null;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          season_id: string;
          status?: Database["public"]["Enums"]["live_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          actual_end?: string | null;
          actual_start?: string | null;
          context_physical_multiplier?: number;
          context_sentimental_multiplier?: number;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          host_user_id?: string | null;
          id?: string;
          live_type?: Database["public"]["Enums"]["live_type"];
          location_label?: string | null;
          pre_match_betting_closes_at?: string | null;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          season_id?: string;
          status?: Database["public"]["Enums"]["live_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "live_sessions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "live_sessions_host_user_id_fkey";
            columns: ["host_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "live_sessions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      market_action_rules: {
        Row: {
          created_at: string;
          effect_type: Database["public"]["Enums"]["market_effect_type"];
          effect_value: number | null;
          id: string;
          is_active: boolean;
          metadata: Json;
          priority: number;
          source_action_type_id: string;
          target_event_code: string;
        };
        Insert: {
          created_at?: string;
          effect_type: Database["public"]["Enums"]["market_effect_type"];
          effect_value?: number | null;
          id?: string;
          is_active?: boolean;
          metadata?: Json;
          priority?: number;
          source_action_type_id: string;
          target_event_code: string;
        };
        Update: {
          created_at?: string;
          effect_type?: Database["public"]["Enums"]["market_effect_type"];
          effect_value?: number | null;
          id?: string;
          is_active?: boolean;
          metadata?: Json;
          priority?: number;
          source_action_type_id?: string;
          target_event_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_action_rules_source_action_type_id_fkey";
            columns: ["source_action_type_id"];
            isOneToOne: false;
            referencedRelation: "action_types";
            referencedColumns: ["id"];
          },
        ];
      };
      market_outcomes: {
        Row: {
          code: string;
          created_at: string;
          displayed_odds: number;
          fair_probability: number;
          id: string;
          label: string;
          market_id: string;
          result_status: Database["public"]["Enums"]["outcome_result_status"];
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          displayed_odds: number;
          fair_probability: number;
          id?: string;
          label: string;
          market_id: string;
          result_status?: Database["public"]["Enums"]["outcome_result_status"];
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          displayed_odds?: number;
          fair_probability?: number;
          id?: string;
          label?: string;
          market_id?: string;
          result_status?: Database["public"]["Enums"]["outcome_result_status"];
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_outcomes_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
        ];
      };
      market_templates: {
        Row: {
          category: Database["public"]["Enums"]["market_category"];
          code: string;
          created_at: string;
          default_half_life_days: number;
          default_margin: number;
          default_q: number;
          event_code: string;
          id: string;
          is_active: boolean;
          market_type: Database["public"]["Enums"]["market_type"];
          settlement_rule: Json;
          title_template: string;
          trash_title_template: string;
          updated_at: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["market_category"];
          code: string;
          created_at?: string;
          default_half_life_days: number;
          default_margin?: number;
          default_q: number;
          event_code: string;
          id?: string;
          is_active?: boolean;
          market_type: Database["public"]["Enums"]["market_type"];
          settlement_rule?: Json;
          title_template: string;
          trash_title_template: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["market_category"];
          code?: string;
          created_at?: string;
          default_half_life_days?: number;
          default_margin?: number;
          default_q?: number;
          event_code?: string;
          id?: string;
          is_active?: boolean;
          market_type?: Database["public"]["Enums"]["market_type"];
          settlement_rule?: Json;
          title_template?: string;
          trash_title_template?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      markets: {
        Row: {
          category: Database["public"]["Enums"]["market_category"];
          closes_at: string;
          created_at: string;
          created_by: string;
          current_half_life_days: number | null;
          current_q: number | null;
          deadline_at: string | null;
          description: string | null;
          event_code: string;
          id: string;
          live_id: string | null;
          margin: number;
          market_type: Database["public"]["Enums"]["market_type"];
          odds_version: number;
          opens_at: string;
          season_id: string;
          settlement_rule: Json;
          status: Database["public"]["Enums"]["market_status"];
          suspension_reason: string | null;
          template_id: string | null;
          title: string;
          trash_title: string;
          updated_at: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["market_category"];
          closes_at: string;
          created_at?: string;
          created_by: string;
          current_half_life_days?: number | null;
          current_q?: number | null;
          deadline_at?: string | null;
          description?: string | null;
          event_code: string;
          id?: string;
          live_id?: string | null;
          margin?: number;
          market_type: Database["public"]["Enums"]["market_type"];
          odds_version?: number;
          opens_at: string;
          season_id: string;
          settlement_rule?: Json;
          status?: Database["public"]["Enums"]["market_status"];
          suspension_reason?: string | null;
          template_id?: string | null;
          title: string;
          trash_title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["market_category"];
          closes_at?: string;
          created_at?: string;
          created_by?: string;
          current_half_life_days?: number | null;
          current_q?: number | null;
          deadline_at?: string | null;
          description?: string | null;
          event_code?: string;
          id?: string;
          live_id?: string | null;
          margin?: number;
          market_type?: Database["public"]["Enums"]["market_type"];
          odds_version?: number;
          opens_at?: string;
          season_id?: string;
          settlement_rule?: Json;
          status?: Database["public"]["Enums"]["market_status"];
          suspension_reason?: string | null;
          template_id?: string | null;
          title?: string;
          trash_title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "markets_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "markets_live_season_fk";
            columns: ["live_id", "season_id"];
            isOneToOne: false;
            referencedRelation: "live_sessions";
            referencedColumns: ["id", "season_id"];
          },
          {
            foreignKeyName: "markets_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "markets_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "market_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          action_id: string | null;
          caption: string | null;
          created_at: string;
          id: string;
          live_id: string | null;
          media_type: string;
          season_id: string;
          status: Database["public"]["Enums"]["media_status"];
          storage_path: string;
          taken_at: string | null;
          uploaded_by: string;
        };
        Insert: {
          action_id?: string | null;
          caption?: string | null;
          created_at?: string;
          id?: string;
          live_id?: string | null;
          media_type: string;
          season_id: string;
          status?: Database["public"]["Enums"]["media_status"];
          storage_path: string;
          taken_at?: string | null;
          uploaded_by: string;
        };
        Update: {
          action_id?: string | null;
          caption?: string | null;
          created_at?: string;
          id?: string;
          live_id?: string | null;
          media_type?: string;
          season_id?: string;
          status?: Database["public"]["Enums"]["media_status"];
          storage_path?: string;
          taken_at?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_action_season_fk";
            columns: ["action_id", "season_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id", "season_id"];
          },
          {
            foreignKeyName: "media_assets_action_season_fk";
            columns: ["action_id", "season_id"];
            isOneToOne: false;
            referencedRelation: "member_action_feed";
            referencedColumns: ["id", "season_id"];
          },
          {
            foreignKeyName: "media_assets_live_season_fk";
            columns: ["live_id", "season_id"];
            isOneToOne: false;
            referencedRelation: "live_sessions";
            referencedColumns: ["id", "season_id"];
          },
          {
            foreignKeyName: "media_assets_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_assets_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          metadata: Json;
          notification_type: string;
          read_at: string | null;
          season_id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          notification_type: string;
          read_at?: string | null;
          season_id: string;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          notification_type?: string;
          read_at?: string | null;
          season_id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      odds_snapshots: {
        Row: {
          calculated_at: string;
          displayed_odds: number;
          fair_probability: number;
          id: string;
          input_snapshot: Json;
          market_id: string;
          odds_version: number;
          outcome_id: string;
          reason: string;
        };
        Insert: {
          calculated_at?: string;
          displayed_odds: number;
          fair_probability: number;
          id?: string;
          input_snapshot: Json;
          market_id: string;
          odds_version: number;
          outcome_id: string;
          reason: string;
        };
        Update: {
          calculated_at?: string;
          displayed_odds?: number;
          fair_probability?: number;
          id?: string;
          input_snapshot?: Json;
          market_id?: string;
          odds_version?: number;
          outcome_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "odds_snapshots_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "odds_snapshots_outcome_market_fk";
            columns: ["outcome_id", "market_id"];
            isOneToOne: false;
            referencedRelation: "market_outcomes";
            referencedColumns: ["id", "market_id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rechute_snapshots: {
        Row: {
          action_id: string | null;
          calculated_at: string;
          commitment_score: number;
          id: string;
          physical_score: number;
          proximity_score: number;
          reason: string;
          regularity_score: number;
          season_id: string;
          total_score: number;
        };
        Insert: {
          action_id?: string | null;
          calculated_at?: string;
          commitment_score: number;
          id?: string;
          physical_score: number;
          proximity_score: number;
          reason: string;
          regularity_score: number;
          season_id: string;
          total_score: number;
        };
        Update: {
          action_id?: string | null;
          calculated_at?: string;
          commitment_score?: number;
          id?: string;
          physical_score?: number;
          proximity_score?: number;
          reason?: string;
          regularity_score?: number;
          season_id?: string;
          total_score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "rechute_snapshots_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rechute_snapshots_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "member_action_feed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rechute_snapshots_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      season_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          created_by: string;
          email: string | null;
          expires_at: string;
          id: string;
          max_uses: number;
          proposed_role: Database["public"]["Enums"]["season_member_role"];
          proposed_subject_key:
            Database["public"]["Enums"]["subject_key"] | null;
          season_id: string;
          status: Database["public"]["Enums"]["invitation_status"];
          token_hash: string;
          use_count: number;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          created_by: string;
          email?: string | null;
          expires_at: string;
          id?: string;
          max_uses?: number;
          proposed_role: Database["public"]["Enums"]["season_member_role"];
          proposed_subject_key?:
            Database["public"]["Enums"]["subject_key"] | null;
          season_id: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          token_hash: string;
          use_count?: number;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          created_by?: string;
          email?: string | null;
          expires_at?: string;
          id?: string;
          max_uses?: number;
          proposed_role?: Database["public"]["Enums"]["season_member_role"];
          proposed_subject_key?:
            Database["public"]["Enums"]["subject_key"] | null;
          season_id?: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          token_hash?: string;
          use_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "season_invitations_accepted_by_fkey";
            columns: ["accepted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_invitations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_invitations_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      season_members: {
        Row: {
          is_active: boolean;
          joined_at: string;
          role: Database["public"]["Enums"]["season_member_role"];
          season_id: string;
          subject_key: Database["public"]["Enums"]["subject_key"] | null;
          user_id: string;
        };
        Insert: {
          is_active?: boolean;
          joined_at?: string;
          role: Database["public"]["Enums"]["season_member_role"];
          season_id: string;
          subject_key?: Database["public"]["Enums"]["subject_key"] | null;
          user_id: string;
        };
        Update: {
          is_active?: boolean;
          joined_at?: string;
          role?: Database["public"]["Enums"]["season_member_role"];
          season_id?: string;
          subject_key?: Database["public"]["Enums"]["subject_key"] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "season_members_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      seasons: {
        Row: {
          breakup_date: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ended_at: string | null;
          id: string;
          secret_bets_until_close: boolean;
          started_at: string;
          starting_balance_mkb: number;
          status: Database["public"]["Enums"]["season_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          breakup_date: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ended_at?: string | null;
          id?: string;
          secret_bets_until_close?: boolean;
          started_at: string;
          starting_balance_mkb?: number;
          status?: Database["public"]["Enums"]["season_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          breakup_date?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ended_at?: string | null;
          id?: string;
          secret_bets_until_close?: boolean;
          started_at?: string;
          starting_balance_mkb?: number;
          status?: Database["public"]["Enums"]["season_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seasons_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          created_at: string;
          id: string;
          market_id: string;
          notes: string | null;
          official_action_id: string | null;
          result_outcome_id: string | null;
          settled_at: string;
          settled_by: string;
          settlement_type: Database["public"]["Enums"]["settlement_type"];
          supersedes_settlement_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          market_id: string;
          notes?: string | null;
          official_action_id?: string | null;
          result_outcome_id?: string | null;
          settled_at?: string;
          settled_by: string;
          settlement_type: Database["public"]["Enums"]["settlement_type"];
          supersedes_settlement_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          market_id?: string;
          notes?: string | null;
          official_action_id?: string | null;
          result_outcome_id?: string | null;
          settled_at?: string;
          settled_by?: string;
          settlement_type?: Database["public"]["Enums"]["settlement_type"];
          supersedes_settlement_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_market_id_fkey";
            columns: ["market_id"];
            isOneToOne: false;
            referencedRelation: "markets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_official_action_id_fkey";
            columns: ["official_action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_official_action_id_fkey";
            columns: ["official_action_id"];
            isOneToOne: false;
            referencedRelation: "member_action_feed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_result_market_fk";
            columns: ["result_outcome_id", "market_id"];
            isOneToOne: false;
            referencedRelation: "market_outcomes";
            referencedColumns: ["id", "market_id"];
          },
          {
            foreignKeyName: "settlements_settled_by_fkey";
            columns: ["settled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_supersedes_settlement_id_fkey";
            columns: ["supersedes_settlement_id"];
            isOneToOne: false;
            referencedRelation: "settlements";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_transactions: {
        Row: {
          amount_mkb: number;
          balance_after_mkb: number;
          bet_id: string | null;
          created_at: string;
          id: string;
          idempotency_key: string;
          metadata: Json;
          season_id: string;
          settlement_id: string | null;
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"];
          user_id: string;
        };
        Insert: {
          amount_mkb: number;
          balance_after_mkb: number;
          bet_id?: string | null;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          metadata?: Json;
          season_id: string;
          settlement_id?: string | null;
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"];
          user_id: string;
        };
        Update: {
          amount_mkb?: number;
          balance_after_mkb?: number;
          bet_id?: string | null;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          metadata?: Json;
          season_id?: string;
          settlement_id?: string | null;
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_bet_id_fkey";
            columns: ["bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transactions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transactions_settlement_id_fkey";
            columns: ["settlement_id"];
            isOneToOne: false;
            referencedRelation: "settlements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transactions_wallet_fk";
            columns: ["season_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["season_id", "user_id"];
          },
        ];
      };
      wallets: {
        Row: {
          balance_mkb: number;
          season_id: string;
          total_returned_mkb: number;
          total_staked_mkb: number;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          balance_mkb: number;
          season_id: string;
          total_returned_mkb?: number;
          total_staked_mkb?: number;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          balance_mkb?: number;
          season_id?: string;
          total_returned_mkb?: number;
          total_staked_mkb?: number;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "wallets_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      member_action_feed: {
        Row: {
          action_type_code: string | null;
          action_type_id: string | null;
          certainty: Database["public"]["Enums"]["action_certainty"] | null;
          classified: boolean | null;
          created_at: string | null;
          declared_at: string | null;
          declared_by: string | null;
          id: string | null;
          live_id: string | null;
          occurred_at: string | null;
          official_occurred_at: string | null;
          privacy_level: Database["public"]["Enums"]["privacy_level"] | null;
          public_description: string | null;
          public_label: string | null;
          season_id: string | null;
          status: Database["public"]["Enums"]["action_status"] | null;
          trash_label: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "actions_action_type_id_fkey";
            columns: ["action_type_id"];
            isOneToOne: false;
            referencedRelation: "action_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actions_declared_by_fkey";
            columns: ["declared_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "actions_live_season_fk";
            columns: ["live_id", "season_id"];
            isOneToOne: false;
            referencedRelation: "live_sessions";
            referencedColumns: ["id", "season_id"];
          },
          {
            foreignKeyName: "actions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_season_invitation: {
        Args: { p_token: string };
        Returns: {
          roles: Database["public"]["Enums"]["season_member_role"][];
          season_id: string;
        }[];
      };
      close_market: {
        Args: { p_market_id: string; p_reason?: string };
        Returns: Json;
      };
      create_bet_quote: {
        Args: {
          p_idempotency_key: string;
          p_outcome_ids: string[];
          p_season_id: string;
          p_stake_mkb: number;
        };
        Returns: Json;
      };
      create_live_session: {
        Args: {
          p_attendees: Json;
          p_description: string;
          p_host_user_id: string;
          p_idempotency_key: string;
          p_live_type: Database["public"]["Enums"]["live_type"];
          p_location_label: string;
          p_scheduled_end: string;
          p_scheduled_start: string;
          p_season_id: string;
          p_title: string;
        };
        Returns: Json;
      };
      create_season: {
        Args: {
          p_breakup_date: string;
          p_description: string;
          p_idempotency_key: string;
          p_secret_bets_until_close: boolean;
          p_started_at: string;
          p_starting_balance_mkb: number;
          p_title: string;
        };
        Returns: {
          season_id: string;
        }[];
      };
      create_season_invitation: {
        Args: {
          p_email: string;
          p_expires_at: string;
          p_max_uses?: number;
          p_proposed_role: Database["public"]["Enums"]["season_member_role"];
          p_proposed_subject_key: Database["public"]["Enums"]["subject_key"];
          p_season_id: string;
        };
        Returns: {
          invitation_id: string;
          token: string;
        }[];
      };
      ensure_current_profile: { Args: never; Returns: string };
      get_bet_ticket: { Args: { p_bet_id: string }; Returns: Json };
      get_dashboard_season: {
        Args: { p_season_id?: string };
        Returns: {
          balanceMkb: number;
          breakupDate: string;
          id: string;
          roles: Database["public"]["Enums"]["season_member_role"][];
          title: string;
        }[];
      };
      get_default_market_schedule: {
        Args: { p_season_id: string };
        Returns: {
          closes_at: string;
          physical_deadline_at: string;
          relationship_deadline_at: string;
        }[];
      };
      get_invitation_preview: {
        Args: { p_token: string };
        Returns: {
          expiresAt: string;
          isValid: boolean;
          maskedEmail: string;
          proposedRole: Database["public"]["Enums"]["season_member_role"];
          proposedSubjectKey: Database["public"]["Enums"]["subject_key"];
          reason: string;
          seasonTitle: string;
        }[];
      };
      get_season_leaderboard: {
        Args: { p_season_id: string };
        Returns: {
          avatar_url: string;
          balance_mkb: number;
          display_name: string;
          net_profit_mkb: number;
          rank: number;
          total_returned_mkb: number;
          total_staked_mkb: number;
          user_id: string;
        }[];
      };
      grant_season_member_role: {
        Args: {
          p_role: Database["public"]["Enums"]["season_member_role"];
          p_season_id: string;
          p_subject_key?: Database["public"]["Enums"]["subject_key"];
          p_user_id: string;
        };
        Returns: undefined;
      };
      initialize_default_season_markets: {
        Args: {
          p_closes_at: string;
          p_idempotency_key: string;
          p_physical_deadline_at: string;
          p_relationship_deadline_at: string;
          p_season_id: string;
        };
        Returns: Json;
      };
      list_my_seasons: {
        Args: never;
        Returns: {
          balanceMkb: number;
          id: string;
          roles: Database["public"]["Enums"]["season_member_role"][];
          status: string;
          title: string;
        }[];
      };
      list_season_invitations: {
        Args: { p_season_id: string };
        Returns: {
          created_at: string;
          expires_at: string;
          id: string;
          masked_email: string;
          max_uses: number;
          proposed_role: Database["public"]["Enums"]["season_member_role"];
          proposed_subject_key: Database["public"]["Enums"]["subject_key"];
          status: Database["public"]["Enums"]["invitation_status"];
          use_count: number;
        }[];
      };
      moderate_media_asset: {
        Args: {
          p_media_asset_id: string;
          p_status: Database["public"]["Enums"]["media_status"];
        };
        Returns: {
          action_id: string | null;
          caption: string | null;
          created_at: string;
          id: string;
          live_id: string | null;
          media_type: string;
          season_id: string;
          status: Database["public"]["Enums"]["media_status"];
          storage_path: string;
          taken_at: string | null;
          uploaded_by: string;
        };
        SetofOptions: {
          from: "*";
          to: "media_assets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      open_template_binary_market: {
        Args: {
          p_closes_at: string;
          p_deadline_at: string;
          p_description: string;
          p_idempotency_key: string;
          p_opens_at: string;
          p_season_id: string;
          p_template_code: string;
          p_title_override: string;
          p_trash_title_override: string;
        };
        Returns: Json;
      };
      place_bet: {
        Args: { p_idempotency_key: string; p_quote_id: string };
        Returns: Json;
      };
      register_media_asset: {
        Args: {
          p_caption?: string;
          p_live_id?: string;
          p_media_type: string;
          p_season_id: string;
          p_storage_path: string;
          p_taken_at?: string;
        };
        Returns: {
          action_id: string | null;
          caption: string | null;
          created_at: string;
          id: string;
          live_id: string | null;
          media_type: string;
          season_id: string;
          status: Database["public"]["Enums"]["media_status"];
          storage_path: string;
          taken_at: string | null;
          uploaded_by: string;
        };
        SetofOptions: {
          from: "*";
          to: "media_assets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      reopen_market: { Args: { p_market_id: string }; Returns: Json };
      revoke_season_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      revoke_season_member_role: {
        Args: {
          p_role: Database["public"]["Enums"]["season_member_role"];
          p_season_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      set_season_member_active: {
        Args: { p_is_active: boolean; p_season_id: string; p_user_id: string };
        Returns: undefined;
      };
      suspend_market: {
        Args: { p_market_id: string; p_reason: string };
        Returns: Json;
      };
      write_audit_log: {
        Args: {
          p_action: string;
          p_actor_user_id: string;
          p_after_data: Json;
          p_before_data: Json;
          p_entity_id: string;
          p_entity_type: string;
          p_metadata: Json;
          p_season_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      action_certainty:
        | "RUMOR"
        | "PROBABLE"
        | "DIRECT_WITNESS"
        | "DIRECT_INFORMATION"
        | "CONFIRMED_BY_MARGOT"
        | "CONFIRMED_BY_KEVIN"
        | "CONFIRMED_BY_BOTH";
      action_status:
        | "DECLARED"
        | "PENDING_CONFIRMATION"
        | "CORROBORATED"
        | "CONFIRMED"
        | "CONTESTED"
        | "REJECTED"
        | "CLASSIFIED"
        | "CORRECTED";
      attendance_status: "EXPECTED" | "PRESENT" | "ABSENT" | "LEFT" | "UNKNOWN";
      bet_leg_status: "OPEN" | "WON" | "LOST" | "VOID";
      bet_quote_status: "OPEN" | "CONSUMED" | "EXPIRED" | "VOID";
      bet_status:
        | "PENDING"
        | "OPEN"
        | "WON"
        | "LOST"
        | "VOID"
        | "REFUNDED"
        | "PARTIALLY_SETTLED";
      bet_type: "SINGLE" | "ACCUMULATOR";
      confirmation_decision:
        "CONFIRM" | "REJECT" | "CORRECT_TIME" | "CLASSIFY" | "NO_COMMENT";
      confirmation_policy:
        | "ONE_REPORTER"
        | "TWO_REPORTERS"
        | "HOST_CONFIRMATION"
        | "ONE_SUBJECT"
        | "BOTH_SUBJECTS"
        | "ADMIN_DECISION";
      invitation_status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
      live_member_role: "HOST" | "REPORTER" | "VIEWER";
      live_status:
        | "PROPOSED"
        | "SCHEDULED"
        | "BETTING_OPEN"
        | "ARMED"
        | "LIVE"
        | "SUSPENDED"
        | "ENDED"
        | "VERIFYING"
        | "SETTLED"
        | "ARCHIVED"
        | "CANCELLED";
      live_type: "PROGRAMMED" | "INSTANT" | "TIME_WINDOW";
      market_category:
        | "CONTACT"
        | "PHYSICAL"
        | "SEXUAL"
        | "RELATIONSHIP"
        | "STATUS"
        | "CONFLICT"
        | "LONG_TERM"
        | "LIVE_SPECIAL";
      market_effect_type:
        | "Q_SHIFT"
        | "SPEED_MULTIPLIER"
        | "SUSPEND"
        | "CLOSE"
        | "SETTLE"
        | "OPEN_RELATED"
        | "REPRICE";
      market_status:
        | "DRAFT"
        | "OPEN"
        | "SUSPENDED"
        | "CLOSED"
        | "PENDING_RESULT"
        | "RESULT_DETERMINED"
        | "SETTLED"
        | "VOID"
        | "REFUNDED";
      market_type:
        | "BINARY"
        | "MULTI_OUTCOME"
        | "DATE_RANGE"
        | "EXACT_DATE"
        | "NEXT_ACTION"
        | "OVER_UNDER"
        | "ACCUMULATOR";
      media_status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
      outcome_result_status: "PENDING" | "WINNER" | "LOSER" | "VOID";
      privacy_level:
        "PUBLIC" | "MEMBERS_ONLY" | "SUBJECTS_AND_ADMINS" | "CLASSIFIED";
      season_member_role:
        "ADMIN" | "LIVE_HOST" | "REPORTER" | "PLAYER" | "SUBJECT";
      season_status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
      settlement_type:
        "STANDARD" | "MANUAL" | "VOID" | "REFUND" | "PARTIAL" | "CORRECTION";
      subject_key: "MARGOT" | "KEVIN";
      wallet_transaction_type:
        | "INITIAL_CREDIT"
        | "BET_STAKE"
        | "BET_WIN"
        | "BET_REFUND"
        | "ADMIN_CREDIT"
        | "ADMIN_DEBIT"
        | "SURVIVAL_BONUS"
        | "CORRECTION";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      action_certainty: [
        "RUMOR",
        "PROBABLE",
        "DIRECT_WITNESS",
        "DIRECT_INFORMATION",
        "CONFIRMED_BY_MARGOT",
        "CONFIRMED_BY_KEVIN",
        "CONFIRMED_BY_BOTH",
      ],
      action_status: [
        "DECLARED",
        "PENDING_CONFIRMATION",
        "CORROBORATED",
        "CONFIRMED",
        "CONTESTED",
        "REJECTED",
        "CLASSIFIED",
        "CORRECTED",
      ],
      attendance_status: ["EXPECTED", "PRESENT", "ABSENT", "LEFT", "UNKNOWN"],
      bet_leg_status: ["OPEN", "WON", "LOST", "VOID"],
      bet_quote_status: ["OPEN", "CONSUMED", "EXPIRED", "VOID"],
      bet_status: [
        "PENDING",
        "OPEN",
        "WON",
        "LOST",
        "VOID",
        "REFUNDED",
        "PARTIALLY_SETTLED",
      ],
      bet_type: ["SINGLE", "ACCUMULATOR"],
      confirmation_decision: [
        "CONFIRM",
        "REJECT",
        "CORRECT_TIME",
        "CLASSIFY",
        "NO_COMMENT",
      ],
      confirmation_policy: [
        "ONE_REPORTER",
        "TWO_REPORTERS",
        "HOST_CONFIRMATION",
        "ONE_SUBJECT",
        "BOTH_SUBJECTS",
        "ADMIN_DECISION",
      ],
      invitation_status: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
      live_member_role: ["HOST", "REPORTER", "VIEWER"],
      live_status: [
        "PROPOSED",
        "SCHEDULED",
        "BETTING_OPEN",
        "ARMED",
        "LIVE",
        "SUSPENDED",
        "ENDED",
        "VERIFYING",
        "SETTLED",
        "ARCHIVED",
        "CANCELLED",
      ],
      live_type: ["PROGRAMMED", "INSTANT", "TIME_WINDOW"],
      market_category: [
        "CONTACT",
        "PHYSICAL",
        "SEXUAL",
        "RELATIONSHIP",
        "STATUS",
        "CONFLICT",
        "LONG_TERM",
        "LIVE_SPECIAL",
      ],
      market_effect_type: [
        "Q_SHIFT",
        "SPEED_MULTIPLIER",
        "SUSPEND",
        "CLOSE",
        "SETTLE",
        "OPEN_RELATED",
        "REPRICE",
      ],
      market_status: [
        "DRAFT",
        "OPEN",
        "SUSPENDED",
        "CLOSED",
        "PENDING_RESULT",
        "RESULT_DETERMINED",
        "SETTLED",
        "VOID",
        "REFUNDED",
      ],
      market_type: [
        "BINARY",
        "MULTI_OUTCOME",
        "DATE_RANGE",
        "EXACT_DATE",
        "NEXT_ACTION",
        "OVER_UNDER",
        "ACCUMULATOR",
      ],
      media_status: ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"],
      outcome_result_status: ["PENDING", "WINNER", "LOSER", "VOID"],
      privacy_level: [
        "PUBLIC",
        "MEMBERS_ONLY",
        "SUBJECTS_AND_ADMINS",
        "CLASSIFIED",
      ],
      season_member_role: [
        "ADMIN",
        "LIVE_HOST",
        "REPORTER",
        "PLAYER",
        "SUBJECT",
      ],
      season_status: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
      settlement_type: [
        "STANDARD",
        "MANUAL",
        "VOID",
        "REFUND",
        "PARTIAL",
        "CORRECTION",
      ],
      subject_key: ["MARGOT", "KEVIN"],
      wallet_transaction_type: [
        "INITIAL_CREDIT",
        "BET_STAKE",
        "BET_WIN",
        "BET_REFUND",
        "ADMIN_CREDIT",
        "ADMIN_DEBIT",
        "SURVIVAL_BONUS",
        "CORRECTION",
      ],
    },
  },
} as const;
