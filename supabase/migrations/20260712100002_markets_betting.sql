create table public.market_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]*$'),
  title_template text not null check (btrim(title_template) <> ''),
  trash_title_template text not null check (btrim(trash_title_template) <> ''),
  market_type public.market_type not null,
  event_code text not null check (event_code ~ '^[A-Z][A-Z0-9_]*$'),
  category public.market_category not null,
  default_q numeric(8, 6) not null check (default_q between 0.02 and 0.98),
  default_half_life_days numeric(10, 4) not null
    check (default_half_life_days between 1 and 365),
  default_margin numeric(8, 6) not null default 1.08
    check (default_margin >= 1),
  settlement_rule jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settlement_rule) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  live_id uuid,
  template_id uuid references public.market_templates (id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  trash_title text not null check (btrim(trash_title) <> ''),
  description text,
  event_code text not null check (event_code ~ '^[A-Z][A-Z0-9_]*$'),
  market_type public.market_type not null,
  category public.market_category not null,
  status public.market_status not null default 'DRAFT',
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  deadline_at timestamptz,
  current_q numeric(8, 6) check (current_q between 0.02 and 0.98),
  current_half_life_days numeric(10, 4)
    check (current_half_life_days between 1 and 365),
  margin numeric(8, 6) not null default 1.08 check (margin >= 1),
  odds_version integer not null default 1 check (odds_version >= 1),
  settlement_rule jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settlement_rule) = 'object'),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, season_id),
  constraint markets_valid_close check (closes_at > opens_at),
  constraint markets_valid_deadline check (
    deadline_at is null or deadline_at >= closes_at
  ),
  constraint markets_live_season_fk foreign key (live_id, season_id)
    references public.live_sessions (id, season_id) on delete restrict
);

create table public.market_outcomes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete restrict,
  code text not null check (code ~ '^[A-Z][A-Z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  fair_probability numeric(12, 10) not null
    check (fair_probability between 0 and 1),
  displayed_odds numeric(10, 2) not null
    check (displayed_odds between 1.05 and 50),
  result_status public.outcome_result_status not null default 'PENDING',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, code),
  unique (id, market_id)
);

create table public.odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete restrict,
  outcome_id uuid not null,
  odds_version integer not null check (odds_version >= 1),
  fair_probability numeric(12, 10) not null
    check (fair_probability between 0 and 1),
  displayed_odds numeric(10, 2) not null
    check (displayed_odds between 1.05 and 50),
  reason text not null check (btrim(reason) <> ''),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  calculated_at timestamptz not null default now(),
  unique (outcome_id, odds_version),
  constraint odds_snapshots_outcome_market_fk foreign key (outcome_id, market_id)
    references public.market_outcomes (id, market_id) on delete restrict
);

create table public.market_action_rules (
  id uuid primary key default gen_random_uuid(),
  source_action_type_id uuid not null
    references public.action_types (id) on delete restrict,
  target_event_code text not null check (target_event_code ~ '^[A-Z][A-Z0-9_]*$'),
  effect_type public.market_effect_type not null,
  effect_value numeric(12, 6),
  priority integer not null default 100 check (priority >= 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (source_action_type_id, target_event_code, effect_type)
);

create table public.wallets (
  season_id uuid not null references public.seasons (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  balance_mkb integer not null check (balance_mkb >= 0),
  total_staked_mkb integer not null default 0 check (total_staked_mkb >= 0),
  total_returned_mkb integer not null default 0 check (total_returned_mkb >= 0),
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  bet_type public.bet_type not null,
  stake_mkb integer not null check (stake_mkb > 0),
  total_odds numeric(12, 4) not null check (total_odds >= 1.05),
  potential_return_mkb integer not null check (potential_return_mkb >= 0),
  status public.bet_status not null default 'PENDING',
  idempotency_key uuid not null unique,
  placed_at timestamptz not null default now(),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bets_wallet_fk foreign key (season_id, user_id)
    references public.wallets (season_id, user_id) on delete restrict
);

create table public.bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets (id) on delete restrict,
  market_id uuid not null references public.markets (id) on delete restrict,
  outcome_id uuid not null,
  odds_at_bet numeric(10, 2) not null check (odds_at_bet between 1.05 and 50),
  fair_probability_at_bet numeric(12, 10) not null
    check (fair_probability_at_bet between 0 and 1),
  odds_version_at_bet integer not null check (odds_version_at_bet >= 1),
  status public.bet_leg_status not null default 'OPEN',
  settled_at timestamptz,
  unique (bet_id, market_id),
  constraint bet_legs_outcome_market_fk foreign key (outcome_id, market_id)
    references public.market_outcomes (id, market_id) on delete restrict
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete restrict,
  official_action_id uuid references public.actions (id) on delete restrict,
  result_outcome_id uuid,
  settlement_type public.settlement_type not null,
  notes text,
  settled_by uuid not null references public.profiles (id) on delete restrict,
  settled_at timestamptz not null default now(),
  supersedes_settlement_id uuid references public.settlements (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint settlements_result_market_fk foreign key (result_outcome_id, market_id)
    references public.market_outcomes (id, market_id) on delete restrict,
  constraint settlements_not_self_superseding check (
    supersedes_settlement_id is distinct from id
  ),
  constraint settlements_correction_history check (
    (settlement_type = 'CORRECTION' and supersedes_settlement_id is not null)
    or (settlement_type <> 'CORRECTION' and supersedes_settlement_id is null)
  )
);

create trigger market_templates_set_updated_at
before update on public.market_templates
for each row execute function public.set_updated_at();

create trigger markets_set_updated_at
before update on public.markets
for each row execute function public.set_updated_at();

create trigger market_outcomes_set_updated_at
before update on public.market_outcomes
for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();
