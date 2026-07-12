create type public.bet_quote_status as enum (
  'OPEN', 'CONSUMED', 'EXPIRED', 'VOID'
);

create or replace function private.is_canonical_event_codes(p_codes text[])
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select
    cardinality(p_codes) between 2 and 3
    and p_codes = (
      select array_agg(code order by code)
      from (select distinct unnest(p_codes) as code) canonical
    )
    and not exists (
      select 1 from unnest(p_codes) code
      where code !~ '^[A-Z][A-Z0-9_]*$'
    );
$$;

create table public.accumulator_correlation_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]*$'),
  event_codes text[] not null,
  correlation_adjustment numeric(10, 6) not null
    check (correlation_adjustment > 0),
  description text not null check (btrim(description) <> ''),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accumulator_correlation_rules_canonical_codes check (
    private.is_canonical_event_codes(event_codes)
  )
);

create table public.bet_quotes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  bet_type public.bet_type not null,
  stake_mkb integer not null check (stake_mkb > 0),
  total_odds numeric(12, 4) not null check (total_odds between 1.05 and 50.00),
  potential_return_mkb integer not null check (potential_return_mkb > 0),
  margin numeric(8, 6) not null check (margin >= 1),
  correlation_adjustment numeric(10, 6) check (correlation_adjustment > 0),
  status public.bet_quote_status not null default 'OPEN',
  idempotency_key uuid not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bet_quotes_valid_expiry check (expires_at > created_at),
  constraint bet_quotes_consumed_pair check (
    (status = 'CONSUMED' and consumed_at is not null)
    or (status <> 'CONSUMED' and consumed_at is null)
  ),
  unique (user_id, idempotency_key)
);

create table public.bet_quote_legs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.bet_quotes (id) on delete restrict,
  market_id uuid not null references public.markets (id) on delete restrict,
  outcome_id uuid not null,
  event_code text not null check (event_code ~ '^[A-Z][A-Z0-9_]*$'),
  fair_probability numeric(12, 10) not null check (fair_probability between 0 and 1),
  displayed_odds numeric(10, 2) not null check (displayed_odds between 1.05 and 50.00),
  odds_version integer not null check (odds_version > 0),
  created_at timestamptz not null default now(),
  unique (quote_id, market_id),
  constraint bet_quote_legs_outcome_market_fk foreign key (outcome_id, market_id)
    references public.market_outcomes (id, market_id) on delete restrict
);

alter table public.bets
  add column quote_id uuid references public.bet_quotes (id) on delete restrict;

alter table public.bets drop constraint bets_idempotency_key_key;
alter table public.bets add constraint bets_user_idempotency_unique
  unique (user_id, idempotency_key);
create unique index bets_quote_id_unique on public.bets (quote_id)
  where quote_id is not null;
alter table public.bets alter column quote_id set not null;

alter table public.markets add column suspension_reason text;

create table private.market_creation_requests (
  user_id uuid not null,
  idempotency_key uuid not null,
  market_id uuid not null references public.markets (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

create index bet_quotes_user_status_expiry_idx
  on public.bet_quotes (user_id, status, expires_at);
create index bet_quotes_season_created_idx
  on public.bet_quotes (season_id, created_at desc);
create index bet_quote_legs_quote_idx on public.bet_quote_legs (quote_id);
create index bet_quote_legs_market_idx on public.bet_quote_legs (market_id);
create index accumulator_correlation_rules_event_codes_idx
  on public.accumulator_correlation_rules using gin (event_codes);

create trigger accumulator_correlation_rules_set_updated_at
before update on public.accumulator_correlation_rules
for each row execute function public.set_updated_at();

create or replace function private.clamp_numeric(
  p_value numeric,
  p_minimum numeric,
  p_maximum numeric
)
returns numeric
language sql
immutable
security definer
set search_path = ''
as $$
  select greatest(p_minimum, least(p_maximum, p_value));
$$;

create or replace function private.elapsed_days(
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns numeric
language sql
immutable
security definer
set search_path = ''
as $$
  select extract(epoch from (p_end_at - p_start_at))::numeric / 86400::numeric;
$$;

create or replace function private.cumulative_event_probability(
  p_q numeric,
  p_half_life_days numeric,
  p_elapsed_days numeric
)
returns numeric
language plpgsql
immutable
security definer
set search_path = ''
as $$
begin
  if p_q < 0.02 or p_q > 0.98 then
    raise exception 'INVALID_PROBABILITY_MODEL' using errcode = '22023';
  end if;
  if p_half_life_days < 1 or p_half_life_days > 365 then
    raise exception 'INVALID_PROBABILITY_MODEL' using errcode = '22023';
  end if;
  if p_elapsed_days <= 0 then
    return 0;
  end if;

  return private.clamp_numeric(
    p_q * (1 - power(2.0, -p_elapsed_days / p_half_life_days)),
    0,
    p_q
  );
end;
$$;

create or replace function private.conditional_event_probability(
  p_q numeric,
  p_half_life_days numeric,
  p_as_of_elapsed_days numeric,
  p_deadline_elapsed_days numeric
)
returns numeric
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  at_as_of numeric;
  at_deadline numeric;
  remaining numeric;
begin
  if p_as_of_elapsed_days < 0 then
    raise exception 'INVALID_INTERVAL' using errcode = '22023';
  end if;
  if p_deadline_elapsed_days <= p_as_of_elapsed_days then
    return 0;
  end if;

  at_as_of := private.cumulative_event_probability(
    p_q, p_half_life_days, p_as_of_elapsed_days
  );
  at_deadline := private.cumulative_event_probability(
    p_q, p_half_life_days, p_deadline_elapsed_days
  );
  remaining := 1 - at_as_of;
  if remaining <= 0.000000000001 then
    return 0;
  end if;

  return private.clamp_numeric((at_deadline - at_as_of) / remaining, 0, 1);
end;
$$;

create or replace function private.displayed_decimal_odds(
  p_fair_probability numeric,
  p_margin numeric
)
returns numeric
language plpgsql
immutable
security definer
set search_path = ''
as $$
begin
  if p_fair_probability <= 0 or p_fair_probability > 1 or p_margin < 1 then
    raise exception 'INVALID_PROBABILITY_MODEL' using errcode = '22023';
  end if;
  return round(greatest(1.05, least(50.00, 1 / (p_fair_probability * p_margin))), 2);
end;
$$;

create or replace function private.raise_betting_error(
  p_code text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  raise exception '%', p_code
    using errcode = 'P0001', detail = coalesce(p_details, '{}'::jsonb)::text;
end;
$$;

create or replace function private.quote_payload(p_quote_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'ok', true,
    'quote_id', q.id,
    'bet_type', q.bet_type,
    'stake_mkb', q.stake_mkb,
    'total_odds', q.total_odds,
    'potential_return_mkb', q.potential_return_mkb,
    'margin', q.margin,
    'correlation_adjustment', q.correlation_adjustment,
    'status', q.status,
    'expires_at', q.expires_at,
    'legs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'market_id', ql.market_id,
        'outcome_id', ql.outcome_id,
        'event_code', ql.event_code,
        'fair_probability', ql.fair_probability,
        'displayed_odds', ql.displayed_odds,
        'odds_version', ql.odds_version
      ) order by ql.market_id)
      from public.bet_quote_legs ql
      where ql.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.bet_quotes q
  where q.id = p_quote_id;
$$;

create or replace function private.market_payload(p_market_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'market_id', m.id,
    'status', m.status,
    'odds_version', m.odds_version,
    'deadline_at', m.deadline_at,
    'outcomes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mo.id,
        'code', mo.code,
        'label', mo.label,
        'fair_probability', mo.fair_probability,
        'displayed_odds', mo.displayed_odds
      ) order by mo.sort_order)
      from public.market_outcomes mo where mo.market_id = m.id
    ), '[]'::jsonb)
  )
  from public.markets m where m.id = p_market_id;
$$;

create or replace function public.open_template_binary_market(
  p_season_id uuid,
  p_template_code text,
  p_deadline_at timestamptz,
  p_opens_at timestamptz,
  p_closes_at timestamptz,
  p_title_override text,
  p_trash_title_override text,
  p_description text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  v_now timestamptz := now();
  season_row public.seasons%rowtype;
  template_row public.market_templates%rowtype;
  existing_market_id uuid;
  created_market_id uuid;
  yes_outcome_id uuid;
  no_outcome_id uuid;
  current_days numeric;
  deadline_days numeric;
  yes_probability numeric;
  no_probability numeric;
  yes_odds numeric;
  no_odds numeric;
  initial_status public.market_status;
begin
  if current_user_id is null then
    perform private.raise_betting_error('AUTH_REQUIRED');
  end if;
  if not private.has_season_role(
    p_season_id,
    array['ADMIN']::public.season_member_role[],
    current_user_id
  ) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || p_idempotency_key::text, 0)
  );
  select market_id into existing_market_id
  from private.market_creation_requests
  where user_id = current_user_id and idempotency_key = p_idempotency_key;
  if existing_market_id is not null then
    return private.market_payload(existing_market_id);
  end if;

  select * into season_row from public.seasons where id = p_season_id for share;
  if season_row.id is null then
    perform private.raise_betting_error('SEASON_NOT_FOUND');
  end if;
  if season_row.status = 'ARCHIVED' then
    perform private.raise_betting_error('SEASON_NOT_ACTIVE');
  end if;

  select * into template_row
  from public.market_templates
  where code = p_template_code and is_active
  for share;
  if template_row.id is null then
    perform private.raise_betting_error('OUTCOME_NOT_FOUND', jsonb_build_object('template_code', p_template_code));
  end if;
  if template_row.market_type <> 'BINARY' then
    perform private.raise_betting_error('DATABASE_OPERATION_FAILED', jsonb_build_object('reason', 'BINARY_TEMPLATE_REQUIRED'));
  end if;
  if p_opens_at is null or p_closes_at is null or p_deadline_at is null
    or p_closes_at <= p_opens_at or p_deadline_at <= p_closes_at
    or p_deadline_at <= v_now then
    perform private.raise_betting_error('MARKET_ALREADY_CLOSED', jsonb_build_object('reason', 'INVALID_MARKET_DATES'));
  end if;

  current_days := greatest(0, private.elapsed_days(season_row.started_at, v_now));
  deadline_days := private.elapsed_days(season_row.started_at, p_deadline_at);
  yes_probability := private.conditional_event_probability(
    template_row.default_q,
    template_row.default_half_life_days,
    current_days,
    deadline_days
  );
  no_probability := 1 - yes_probability;
  yes_odds := private.displayed_decimal_odds(yes_probability, template_row.default_margin);
  no_odds := private.displayed_decimal_odds(no_probability, template_row.default_margin);
  initial_status := case
    when p_opens_at <= v_now and p_closes_at > v_now then 'OPEN'::public.market_status
    else 'DRAFT'::public.market_status
  end;

  insert into public.markets (
    season_id, template_id, title, trash_title, description, event_code,
    market_type, category, status, opens_at, closes_at, deadline_at,
    current_q, current_half_life_days, margin, odds_version, settlement_rule,
    created_by
  ) values (
    p_season_id,
    template_row.id,
    coalesce(nullif(btrim(p_title_override), ''), template_row.title_template),
    coalesce(nullif(btrim(p_trash_title_override), ''), template_row.trash_title_template),
    nullif(btrim(p_description), ''),
    template_row.event_code,
    template_row.market_type,
    template_row.category,
    initial_status,
    p_opens_at,
    p_closes_at,
    p_deadline_at,
    template_row.default_q,
    template_row.default_half_life_days,
    template_row.default_margin,
    1,
    template_row.settlement_rule,
    current_user_id
  ) returning id into created_market_id;

  insert into public.market_outcomes (
    market_id, code, label, fair_probability, displayed_odds, sort_order
  ) values
    (created_market_id, 'YES', 'Oui', yes_probability, yes_odds, 0),
    (created_market_id, 'NO', 'Non', no_probability, no_odds, 1);

  select id into yes_outcome_id from public.market_outcomes
  where market_id = created_market_id and code = 'YES';
  select id into no_outcome_id from public.market_outcomes
  where market_id = created_market_id and code = 'NO';

  insert into public.odds_snapshots (
    market_id, outcome_id, odds_version, fair_probability, displayed_odds,
    reason, input_snapshot, calculated_at
  ) values
    (
      created_market_id, yes_outcome_id, 1, yes_probability, yes_odds,
      'MARKET_OPENED',
      jsonb_build_object(
        'template_code', template_row.code,
        'season_start_at', season_row.started_at,
        'as_of', v_now,
        'deadline_at', p_deadline_at,
        'q', template_row.default_q,
        'half_life_days', template_row.default_half_life_days,
        'margin', template_row.default_margin
      ),
      v_now
    ),
    (
      created_market_id, no_outcome_id, 1, no_probability, no_odds,
      'MARKET_OPENED',
      jsonb_build_object(
        'template_code', template_row.code,
        'season_start_at', season_row.started_at,
        'as_of', v_now,
        'deadline_at', p_deadline_at,
        'q', template_row.default_q,
        'half_life_days', template_row.default_half_life_days,
        'margin', template_row.default_margin
      ),
      v_now
    );

  insert into private.market_creation_requests (user_id, idempotency_key, market_id)
  values (current_user_id, p_idempotency_key, created_market_id);

  perform public.write_audit_log(
    p_season_id,
    current_user_id,
    'market',
    created_market_id::text,
    'CREATE_MARKET',
    null,
    jsonb_build_object('status', initial_status, 'template_code', template_row.code),
    jsonb_build_object('deadline_at', p_deadline_at, 'odds_version', 1)
  );

  return private.market_payload(created_market_id);
end;
$$;

create or replace function private.change_market_status(
  p_market_id uuid,
  p_target_status public.market_status,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  market_row public.markets%rowtype;
  previous_status public.market_status;
  audit_action text;
begin
  if current_user_id is null then
    perform private.raise_betting_error('AUTH_REQUIRED');
  end if;
  select * into market_row from public.markets where id = p_market_id for update;
  if market_row.id is null then
    perform private.raise_betting_error('OUTCOME_NOT_FOUND');
  end if;
  if not (
    private.has_season_role(
      market_row.season_id,
      array['ADMIN']::public.season_member_role[],
      current_user_id
    )
    or (market_row.live_id is not null and private.is_live_host(market_row.live_id, current_user_id))
  ) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;

  previous_status := market_row.status;
  if p_target_status = 'SUSPENDED' and market_row.status <> 'OPEN' then
    perform private.raise_betting_error('MARKET_NOT_OPEN');
  elsif p_target_status = 'OPEN' then
    if market_row.status <> 'SUSPENDED' then
      perform private.raise_betting_error('MARKET_NOT_OPEN');
    end if;
    if market_row.closes_at <= now() then
      perform private.raise_betting_error('MARKET_ALREADY_CLOSED');
    end if;
  elsif p_target_status = 'CLOSED' and market_row.status not in ('OPEN', 'SUSPENDED', 'DRAFT') then
    perform private.raise_betting_error('MARKET_ALREADY_CLOSED');
  end if;

  update public.markets
  set status = p_target_status,
      suspension_reason = case when p_target_status = 'SUSPENDED' then nullif(btrim(p_reason), '') else null end
  where id = p_market_id;

  audit_action := case p_target_status
    when 'SUSPENDED' then 'SUSPEND_MARKET'
    when 'OPEN' then 'REOPEN_MARKET'
    else 'CLOSE_MARKET'
  end;
  perform public.write_audit_log(
    market_row.season_id,
    current_user_id,
    'market',
    p_market_id::text,
    audit_action,
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', p_target_status),
    jsonb_build_object('reason', nullif(btrim(p_reason), ''))
  );
  return private.market_payload(p_market_id);
end;
$$;

create or replace function public.suspend_market(p_market_id uuid, p_reason text)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select private.change_market_status(p_market_id, 'SUSPENDED', p_reason); $$;

create or replace function public.reopen_market(p_market_id uuid)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select private.change_market_status(p_market_id, 'OPEN', null); $$;

create or replace function public.close_market(p_market_id uuid, p_reason text default null)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select private.change_market_status(p_market_id, 'CLOSED', p_reason); $$;

create or replace function public.initialize_default_season_markets(
  p_season_id uuid,
  p_physical_deadline_at timestamptz,
  p_relationship_deadline_at timestamptz,
  p_closes_at timestamptz,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  template_code text;
  selected_deadline timestamptz;
  created_market jsonb;
  markets_payload jsonb := '[]'::jsonb;
  existing_market_id uuid;
  derived_key uuid;
begin
  if current_user_id is null then
    perform private.raise_betting_error('AUTH_REQUIRED');
  end if;
  if not private.has_season_role(
    p_season_id,
    array['ADMIN']::public.season_member_role[],
    current_user_id
  ) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;
  if p_physical_deadline_at <= p_closes_at
    or p_relationship_deadline_at <= p_closes_at
    or p_closes_at <= now() then
    perform private.raise_betting_error('MARKET_ALREADY_CLOSED', jsonb_build_object('reason', 'INVALID_MARKET_DATES'));
  end if;

  foreach template_code in array array[
    'KISS', 'SLEEP_SAME_BED', 'SEX', 'BLOWJOB', 'CUNNILINGUS',
    'SEX_FRIENDS', 'OFFICIAL_COUPLE'
  ] loop
    selected_deadline := case
      when template_code in ('SEX_FRIENDS', 'OFFICIAL_COUPLE') then p_relationship_deadline_at
      else p_physical_deadline_at
    end;

    select m.id into existing_market_id
    from public.markets m
    join public.market_templates mt on mt.id = m.template_id
    where m.season_id = p_season_id
      and mt.code = template_code
      and m.deadline_at = selected_deadline
      and m.status in ('DRAFT', 'OPEN', 'SUSPENDED', 'CLOSED')
    order by m.created_at
    limit 1;

    if existing_market_id is not null then
      created_market := private.market_payload(existing_market_id);
    else
      derived_key := (
        substr(md5(p_idempotency_key::text || ':' || template_code), 1, 8) || '-' ||
        substr(md5(p_idempotency_key::text || ':' || template_code), 9, 4) || '-4' ||
        substr(md5(p_idempotency_key::text || ':' || template_code), 14, 3) || '-8' ||
        substr(md5(p_idempotency_key::text || ':' || template_code), 18, 3) || '-' ||
        substr(md5(p_idempotency_key::text || ':' || template_code), 21, 12)
      )::uuid;
      created_market := public.open_template_binary_market(
        p_season_id,
        template_code,
        selected_deadline,
        now(),
        p_closes_at,
        null,
        null,
        null,
        derived_key
      );
    end if;
    markets_payload := markets_payload || jsonb_build_array(created_market);
    existing_market_id := null;
  end loop;

  return jsonb_build_object('ok', true, 'markets', markets_payload);
end;
$$;

create or replace function public.create_bet_quote(
  p_season_id uuid,
  p_stake_mkb integer,
  p_outcome_ids uuid[],
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  v_now timestamptz := now();
  existing_quote_id uuid;
  created_quote_id uuid;
  selection_count integer;
  distinct_market_count integer;
  wallet_balance integer;
  season_status_value public.season_status;
  selected_margin numeric;
  total_odds_value numeric;
  potential_return_value integer;
  independent_probability numeric;
  combined_probability numeric;
  correlation_value numeric;
  canonical_codes text[];
  quote_type public.bet_type;
begin
  if current_user_id is null then
    perform private.raise_betting_error('AUTH_REQUIRED');
  end if;
  if not exists (select 1 from public.profiles where id = current_user_id) then
    perform private.raise_betting_error('PROFILE_NOT_FOUND');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || p_idempotency_key::text, 0)
  );
  select id into existing_quote_id
  from public.bet_quotes
  where user_id = current_user_id and idempotency_key = p_idempotency_key;
  if existing_quote_id is not null then
    if exists (
      select 1 from public.bet_quotes q
      where q.id = existing_quote_id
        and (q.season_id <> p_season_id or q.stake_mkb <> p_stake_mkb)
    ) or (
      select count(*) from public.bet_quote_legs ql
      where ql.quote_id = existing_quote_id
        and ql.outcome_id = any(p_outcome_ids)
    ) <> cardinality(p_outcome_ids) then
      perform private.raise_betting_error('IDEMPOTENCY_CONFLICT');
    end if;
    return private.quote_payload(existing_quote_id);
  end if;

  select status into season_status_value from public.seasons where id = p_season_id;
  if season_status_value is null then
    perform private.raise_betting_error('SEASON_NOT_FOUND');
  end if;
  if season_status_value <> 'ACTIVE' then
    perform private.raise_betting_error('SEASON_NOT_ACTIVE');
  end if;
  if not private.is_season_member(p_season_id, current_user_id) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;
  if not private.has_season_role(
    p_season_id,
    array['PLAYER']::public.season_member_role[],
    current_user_id
  ) then
    perform private.raise_betting_error('PLAYER_ROLE_REQUIRED');
  end if;
  if p_stake_mkb is null or p_stake_mkb < 5 then
    perform private.raise_betting_error('INVALID_STAKE');
  end if;
  if p_outcome_ids is null or cardinality(p_outcome_ids) not between 1 and 3
    or cardinality(p_outcome_ids) <> cardinality(array(select distinct unnest(p_outcome_ids))) then
    perform private.raise_betting_error('INVALID_SELECTION_COUNT');
  end if;

  select balance_mkb into wallet_balance
  from public.wallets
  where season_id = p_season_id and user_id = current_user_id
  for share;
  if wallet_balance is null then
    perform private.raise_betting_error('WALLET_NOT_FOUND');
  end if;
  if p_stake_mkb > wallet_balance then
    perform private.raise_betting_error('INSUFFICIENT_BALANCE');
  end if;

  perform 1
  from public.market_outcomes mo
  join public.markets m on m.id = mo.market_id
  where mo.id = any(p_outcome_ids)
  order by m.id, mo.id
  for share of mo, m;

  select
    count(*),
    count(distinct m.id),
    max(m.margin),
    exp(sum(ln(mo.fair_probability))),
    array_agg(m.event_code order by m.event_code)
  into
    selection_count,
    distinct_market_count,
    selected_margin,
    independent_probability,
    canonical_codes
  from public.market_outcomes mo
  join public.markets m on m.id = mo.market_id
  where mo.id = any(p_outcome_ids)
    and m.season_id = p_season_id
    and m.status = 'OPEN'
    and m.opens_at <= v_now
    and m.closes_at > v_now
    and mo.result_status = 'PENDING'
    and mo.fair_probability > 0
    and mo.displayed_odds between 1.05 and 50.00;

  if selection_count <> cardinality(p_outcome_ids) then
    if exists (
      select 1 from public.market_outcomes mo
      where mo.id = any(p_outcome_ids)
    ) then
      perform private.raise_betting_error('MARKET_NOT_OPEN');
    end if;
    perform private.raise_betting_error('OUTCOME_NOT_FOUND');
  end if;
  if distinct_market_count <> selection_count then
    perform private.raise_betting_error('DUPLICATE_MARKET_SELECTION');
  end if;

  if selection_count = 1 then
    quote_type := 'SINGLE';
    select mo.displayed_odds into total_odds_value
    from public.market_outcomes mo where mo.id = p_outcome_ids[1];
    correlation_value := null;
  else
    quote_type := 'ACCUMULATOR';
    select correlation_adjustment into correlation_value
    from public.accumulator_correlation_rules
    where event_codes = canonical_codes and is_active
    for share;
    if correlation_value is null then
      perform private.raise_betting_error(
        'MISSING_CORRELATION_RULE',
        jsonb_build_object('event_codes', canonical_codes)
      );
    end if;
    combined_probability := private.clamp_numeric(
      independent_probability * correlation_value,
      0.001,
      0.95
    );
    total_odds_value := private.displayed_decimal_odds(
      combined_probability,
      selected_margin
    );
  end if;

  potential_return_value := floor(p_stake_mkb * total_odds_value)::integer;
  insert into public.bet_quotes (
    season_id, user_id, bet_type, stake_mkb, total_odds,
    potential_return_mkb, margin, correlation_adjustment, idempotency_key,
    expires_at
  ) values (
    p_season_id, current_user_id, quote_type, p_stake_mkb, total_odds_value,
    potential_return_value, selected_margin, correlation_value,
    p_idempotency_key, v_now + interval '60 seconds'
  ) returning id into created_quote_id;

  insert into public.bet_quote_legs (
    quote_id, market_id, outcome_id, event_code, fair_probability,
    displayed_odds, odds_version
  )
  select
    created_quote_id, m.id, mo.id, m.event_code, mo.fair_probability,
    mo.displayed_odds, m.odds_version
  from public.market_outcomes mo
  join public.markets m on m.id = mo.market_id
  where mo.id = any(p_outcome_ids)
  order by m.id;

  perform public.write_audit_log(
    p_season_id,
    current_user_id,
    'bet_quote',
    created_quote_id::text,
    'CREATE_BET_QUOTE',
    null,
    jsonb_build_object(
      'bet_type', quote_type,
      'stake_mkb', p_stake_mkb,
      'selection_count', selection_count,
      'expires_at', v_now + interval '60 seconds'
    ),
    '{}'::jsonb
  );
  return private.quote_payload(created_quote_id);
end;
$$;

create or replace function public.get_bet_ticket(p_bet_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when b.user_id = auth.uid() or private.has_season_role(
      b.season_id, array['ADMIN']::public.season_member_role[]
    ) then jsonb_build_object(
      'ok', true,
      'bet_id', b.id,
      'ticket_number', upper(substr(replace(b.id::text, '-', ''), 1, 8)),
      'season_id', b.season_id,
      'bet_type', b.bet_type,
      'stake_mkb', b.stake_mkb,
      'total_odds', b.total_odds,
      'potential_return_mkb', b.potential_return_mkb,
      'status', b.status,
      'placed_at', b.placed_at,
      'balance_mkb', w.balance_mkb,
      'legs', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', bl.id,
          'market_id', bl.market_id,
          'market_title', m.title,
          'outcome_id', bl.outcome_id,
          'outcome_label', mo.label,
          'odds_at_bet', bl.odds_at_bet,
          'fair_probability_at_bet', bl.fair_probability_at_bet,
          'odds_version_at_bet', bl.odds_version_at_bet,
          'status', bl.status
        ) order by bl.id)
        from public.bet_legs bl
        join public.markets m on m.id = bl.market_id
        join public.market_outcomes mo on mo.id = bl.outcome_id
        where bl.bet_id = b.id
      ), '[]'::jsonb)
    )
    else null
  end
  from public.bets b
  join public.wallets w on w.season_id = b.season_id and w.user_id = b.user_id
  where b.id = p_bet_id;
$$;

create or replace function public.place_bet(
  p_quote_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  v_now timestamptz := now();
  quote_row public.bet_quotes%rowtype;
  wallet_row public.wallets%rowtype;
  existing_bet_id uuid;
  created_bet_id uuid;
  mismatch_payload jsonb;
  balance_before integer;
  balance_after integer;
begin
  if current_user_id is null then
    perform private.raise_betting_error('AUTH_REQUIRED');
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || p_idempotency_key::text, 0)
  );

  select id into existing_bet_id
  from public.bets
  where user_id = current_user_id and idempotency_key = p_idempotency_key;
  if existing_bet_id is not null then
    if exists (
      select 1 from public.bets
      where id = existing_bet_id and quote_id <> p_quote_id
    ) then
      perform private.raise_betting_error('IDEMPOTENCY_CONFLICT');
    end if;
    return public.get_bet_ticket(existing_bet_id);
  end if;

  select * into quote_row from public.bet_quotes where id = p_quote_id for update;
  if quote_row.id is null then
    perform private.raise_betting_error('QUOTE_NOT_FOUND');
  end if;
  if quote_row.user_id <> current_user_id then
    perform private.raise_betting_error('QUOTE_ACCESS_DENIED');
  end if;
  if quote_row.status = 'CONSUMED' then
    select id into existing_bet_id from public.bets where quote_id = quote_row.id;
    if existing_bet_id is not null then
      return public.get_bet_ticket(existing_bet_id);
    end if;
    perform private.raise_betting_error('QUOTE_ALREADY_CONSUMED');
  end if;
  if quote_row.status <> 'OPEN' then
    perform private.raise_betting_error('QUOTE_ALREADY_CONSUMED');
  end if;
  if quote_row.expires_at <= v_now then
    update public.bet_quotes set status = 'EXPIRED' where id = quote_row.id;
    return jsonb_build_object('ok', false, 'code', 'QUOTE_EXPIRED');
  end if;
  if not private.is_season_member(quote_row.season_id, current_user_id) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;
  if not private.has_season_role(
    quote_row.season_id,
    array['PLAYER']::public.season_member_role[],
    current_user_id
  ) then
    perform private.raise_betting_error('PLAYER_ROLE_REQUIRED');
  end if;
  if not exists (
    select 1 from public.seasons
    where id = quote_row.season_id and status = 'ACTIVE'
  ) then
    perform private.raise_betting_error('SEASON_NOT_ACTIVE');
  end if;

  select * into wallet_row
  from public.wallets
  where season_id = quote_row.season_id and user_id = current_user_id
  for update;
  if wallet_row.user_id is null then
    perform private.raise_betting_error('WALLET_NOT_FOUND');
  end if;
  if wallet_row.balance_mkb < quote_row.stake_mkb then
    perform private.raise_betting_error('INSUFFICIENT_BALANCE');
  end if;

  perform 1
  from public.markets m
  join public.market_outcomes mo on mo.market_id = m.id
  join public.bet_quote_legs ql
    on ql.market_id = m.id and ql.outcome_id = mo.id
  where ql.quote_id = quote_row.id
  order by m.id
  for update of m, mo;

  select jsonb_agg(jsonb_build_object(
    'market_id', m.id,
    'outcome_id', mo.id,
    'old_odds', ql.displayed_odds,
    'new_odds', mo.displayed_odds,
    'old_probability', ql.fair_probability,
    'new_probability', mo.fair_probability,
    'old_version', ql.odds_version,
    'new_version', m.odds_version
  ) order by m.id)
  into mismatch_payload
  from public.bet_quote_legs ql
  join public.markets m on m.id = ql.market_id
  join public.market_outcomes mo on mo.id = ql.outcome_id and mo.market_id = m.id
  where ql.quote_id = quote_row.id
    and (
      m.status <> 'OPEN'
      or m.opens_at > v_now
      or m.closes_at <= v_now
      or mo.result_status <> 'PENDING'
      or m.odds_version <> ql.odds_version
      or mo.displayed_odds <> ql.displayed_odds
      or mo.fair_probability <> ql.fair_probability
    );

  if mismatch_payload is not null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ODDS_CHANGED',
      'current_legs', mismatch_payload
    );
  end if;

  insert into public.bets (
    season_id, user_id, bet_type, stake_mkb, total_odds,
    potential_return_mkb, status, idempotency_key, quote_id, placed_at
  ) values (
    quote_row.season_id,
    current_user_id,
    quote_row.bet_type,
    quote_row.stake_mkb,
    quote_row.total_odds,
    quote_row.potential_return_mkb,
    'OPEN',
    p_idempotency_key,
    quote_row.id,
    v_now
  ) returning id into created_bet_id;

  insert into public.bet_legs (
    bet_id, market_id, outcome_id, odds_at_bet,
    fair_probability_at_bet, odds_version_at_bet, status
  )
  select
    created_bet_id, market_id, outcome_id, displayed_odds,
    fair_probability, odds_version, 'OPEN'
  from public.bet_quote_legs
  where quote_id = quote_row.id
  order by market_id;

  balance_before := wallet_row.balance_mkb;
  balance_after := balance_before - quote_row.stake_mkb;
  update public.wallets
  set
    balance_mkb = balance_after,
    total_staked_mkb = total_staked_mkb + quote_row.stake_mkb,
    version = version + 1
  where season_id = quote_row.season_id and user_id = current_user_id;

  insert into public.wallet_transactions (
    season_id, user_id, transaction_type, amount_mkb, balance_after_mkb,
    bet_id, idempotency_key, metadata
  ) values (
    quote_row.season_id,
    current_user_id,
    'BET_STAKE',
    -quote_row.stake_mkb,
    balance_after,
    created_bet_id,
    'bet-stake:' || created_bet_id::text,
    jsonb_build_object('quote_id', quote_row.id)
  );

  update public.bet_quotes
  set status = 'CONSUMED', consumed_at = v_now
  where id = quote_row.id;

  perform public.write_audit_log(
    quote_row.season_id,
    current_user_id,
    'bet',
    created_bet_id::text,
    'PLACE_BET',
    null,
    jsonb_build_object(
      'quote_id', quote_row.id,
      'stake_mkb', quote_row.stake_mkb,
      'total_odds', quote_row.total_odds,
      'balance_before', balance_before,
      'balance_after', balance_after
    ),
    jsonb_build_object('idempotency_key', p_idempotency_key)
  );
  perform public.write_audit_log(
    quote_row.season_id,
    current_user_id,
    'wallet',
    current_user_id::text,
    'DEBIT_BET_STAKE',
    jsonb_build_object('balance_mkb', balance_before),
    jsonb_build_object('balance_mkb', balance_after),
    jsonb_build_object('bet_id', created_bet_id, 'quote_id', quote_row.id)
  );

  return public.get_bet_ticket(created_bet_id);
end;
$$;

create or replace function public.get_season_leaderboard(p_season_id uuid)
returns table(
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  balance_mkb integer,
  total_staked_mkb integer,
  total_returned_mkb integer,
  net_profit_mkb integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    row_number() over (
      order by w.balance_mkb desc, w.total_returned_mkb desc, p.display_name, p.id
    ),
    p.id,
    p.display_name,
    p.avatar_url,
    w.balance_mkb,
    w.total_staked_mkb,
    w.total_returned_mkb,
    w.total_returned_mkb - w.total_staked_mkb
  from public.wallets w
  join public.profiles p on p.id = w.user_id
  where w.season_id = p_season_id
    and private.is_season_member(p_season_id)
    and exists (
      select 1 from public.season_members sm
      where sm.season_id = p_season_id
        and sm.user_id = w.user_id
        and sm.is_active
        and sm.role = 'PLAYER'
    )
  order by 1;
$$;

create or replace function public.get_default_market_schedule(p_season_id uuid)
returns table(
  physical_deadline_at timestamptz,
  relationship_deadline_at timestamptz,
  closes_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.has_season_role(
    p_season_id,
    array['ADMIN']::public.season_member_role[]
  ) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;
  physical_deadline_at := now() + interval '30 days';
  relationship_deadline_at := now() + interval '90 days';
  closes_at := now() + interval '29 days';
  return next;
end;
$$;

alter table public.accumulator_correlation_rules enable row level security;
alter table public.bet_quotes enable row level security;
alter table public.bet_quote_legs enable row level security;

create policy accumulator_correlation_rules_select_members
on public.accumulator_correlation_rules for select to authenticated
using (
  exists (
    select 1 from public.season_members sm
    where sm.user_id = auth.uid() and sm.is_active
  )
);

create policy accumulator_correlation_rules_insert_never
on public.accumulator_correlation_rules for insert to authenticated
with check (false);
create policy accumulator_correlation_rules_update_never
on public.accumulator_correlation_rules for update to authenticated
using (false) with check (false);
create policy accumulator_correlation_rules_delete_never
on public.accumulator_correlation_rules for delete to authenticated
using (false);

create policy bet_quotes_select_owner_or_admin
on public.bet_quotes for select to authenticated
using (
  user_id = auth.uid()
  or private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
);
create policy bet_quotes_insert_never
on public.bet_quotes for insert to authenticated with check (false);
create policy bet_quotes_update_never
on public.bet_quotes for update to authenticated using (false) with check (false);
create policy bet_quotes_delete_never
on public.bet_quotes for delete to authenticated using (false);

create policy bet_quote_legs_select_parent_quote
on public.bet_quote_legs for select to authenticated
using (
  exists (
    select 1 from public.bet_quotes q
    where q.id = quote_id
      and (
        q.user_id = auth.uid()
        or private.has_season_role(q.season_id, array['ADMIN']::public.season_member_role[])
      )
  )
);
create policy bet_quote_legs_insert_never
on public.bet_quote_legs for insert to authenticated with check (false);
create policy bet_quote_legs_update_never
on public.bet_quote_legs for update to authenticated using (false) with check (false);
create policy bet_quote_legs_delete_never
on public.bet_quote_legs for delete to authenticated using (false);

grant select on public.accumulator_correlation_rules, public.bet_quotes,
  public.bet_quote_legs to authenticated;

revoke all on function private.is_canonical_event_codes(text[]) from public, anon, authenticated;
revoke all on function private.clamp_numeric(numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function private.elapsed_days(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.cumulative_event_probability(numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function private.conditional_event_probability(numeric, numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function private.displayed_decimal_odds(numeric, numeric) from public, anon, authenticated;
revoke all on function private.raise_betting_error(text, jsonb) from public, anon, authenticated;
revoke all on function private.quote_payload(uuid) from public, anon, authenticated;
revoke all on function private.market_payload(uuid) from public, anon, authenticated;
revoke all on function private.change_market_status(uuid, public.market_status, text) from public, anon, authenticated;

revoke all on function public.open_template_binary_market(uuid, text, timestamptz, timestamptz, timestamptz, text, text, text, uuid) from public, anon;
revoke all on function public.suspend_market(uuid, text) from public, anon;
revoke all on function public.reopen_market(uuid) from public, anon;
revoke all on function public.close_market(uuid, text) from public, anon;
revoke all on function public.initialize_default_season_markets(uuid, timestamptz, timestamptz, timestamptz, uuid) from public, anon;
revoke all on function public.create_bet_quote(uuid, integer, uuid[], uuid) from public, anon;
revoke all on function public.place_bet(uuid, uuid) from public, anon;
revoke all on function public.get_bet_ticket(uuid) from public, anon;
revoke all on function public.get_season_leaderboard(uuid) from public, anon;
revoke all on function public.get_default_market_schedule(uuid) from public, anon;

grant execute on function public.open_template_binary_market(uuid, text, timestamptz, timestamptz, timestamptz, text, text, text, uuid) to authenticated;
grant execute on function public.suspend_market(uuid, text) to authenticated;
grant execute on function public.reopen_market(uuid) to authenticated;
grant execute on function public.close_market(uuid, text) to authenticated;
grant execute on function public.initialize_default_season_markets(uuid, timestamptz, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.create_bet_quote(uuid, integer, uuid[], uuid) to authenticated;
grant execute on function public.place_bet(uuid, uuid) to authenticated;
grant execute on function public.get_bet_ticket(uuid) to authenticated;
grant execute on function public.get_season_leaderboard(uuid) to authenticated;
grant execute on function public.get_default_market_schedule(uuid) to authenticated;
