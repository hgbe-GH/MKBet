-- Bootstrap the single Margot x Kevin room for every authenticated profile.

create or replace function public.single_room_id()
returns uuid
language sql
immutable
set search_path = ''
as $$
  select '6d6b0000-0000-4000-8000-000000000001'::uuid;
$$;

create or replace function private.initialize_single_room_markets(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_id constant uuid := public.single_room_id();
  template_row public.market_templates%rowtype;
  created_market_id uuid;
  yes_outcome_id uuid;
  no_outcome_id uuid;
  current_days numeric;
  deadline_days numeric;
  yes_probability numeric;
  no_probability numeric;
  yes_odds numeric;
  no_odds numeric;
  calculated_at timestamptz := now();
  closes_at constant timestamptz := '2030-12-30T23:59:59Z';
  deadline_at constant timestamptz := '2030-12-31T23:59:59Z';
  template_code text;
begin
  if p_user_id is null or not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(room_id::text || ':markets', 0)
  );

  foreach template_code in array array['KISS', 'OFFICIAL_COUPLE'] loop
    if exists (
      select 1
      from public.markets m
      join public.market_templates mt on mt.id = m.template_id
      where m.season_id = room_id and mt.code = template_code
    ) then
      continue;
    end if;

    select * into template_row
    from public.market_templates
    where code = template_code and is_active and market_type = 'BINARY';

    if template_row.id is null then
      continue;
    end if;

    current_days := greatest(
      0,
      private.elapsed_days('2026-07-01T00:00:00Z', calculated_at)
    );
    deadline_days := private.elapsed_days(
      '2026-07-01T00:00:00Z',
      deadline_at
    );
    yes_probability := private.conditional_event_probability(
      template_row.default_q,
      template_row.default_half_life_days,
      current_days,
      deadline_days
    );
    no_probability := 1 - yes_probability;
    yes_odds := private.displayed_decimal_odds(
      yes_probability,
      template_row.default_margin
    );
    no_odds := private.displayed_decimal_odds(
      no_probability,
      template_row.default_margin
    );

    insert into public.markets (
      season_id,
      template_id,
      title,
      trash_title,
      description,
      event_code,
      market_type,
      category,
      status,
      opens_at,
      closes_at,
      deadline_at,
      current_q,
      current_half_life_days,
      margin,
      odds_version,
      settlement_rule,
      created_by
    )
    values (
      room_id,
      template_row.id,
      template_row.title_template,
      template_row.trash_title_template,
      'Marché permanent de la salle Margot × Kévin.',
      template_row.event_code,
      template_row.market_type,
      template_row.category,
      'OPEN',
      calculated_at,
      closes_at,
      deadline_at,
      template_row.default_q,
      template_row.default_half_life_days,
      template_row.default_margin,
      1,
      template_row.settlement_rule,
      p_user_id
    )
    returning id into created_market_id;

    insert into public.market_outcomes (
      market_id,
      code,
      label,
      fair_probability,
      displayed_odds,
      sort_order
    )
    values
      (created_market_id, 'YES', 'Oui', yes_probability, yes_odds, 0),
      (created_market_id, 'NO', 'Non', no_probability, no_odds, 1);

    select id into yes_outcome_id
    from public.market_outcomes
    where market_id = created_market_id and code = 'YES';

    select id into no_outcome_id
    from public.market_outcomes
    where market_id = created_market_id and code = 'NO';

    insert into public.odds_snapshots (
      market_id,
      outcome_id,
      odds_version,
      fair_probability,
      displayed_odds,
      reason,
      input_snapshot,
      calculated_at
    )
    values
      (
        created_market_id,
        yes_outcome_id,
        1,
        yes_probability,
        yes_odds,
        'SINGLE_ROOM_BOOTSTRAP',
        jsonb_build_object(
          'template_code', template_code,
          'season_start_at', '2026-07-01T00:00:00Z',
          'as_of', calculated_at,
          'deadline_at', deadline_at,
          'q', template_row.default_q,
          'half_life_days', template_row.default_half_life_days,
          'margin', template_row.default_margin
        ),
        calculated_at
      ),
      (
        created_market_id,
        no_outcome_id,
        1,
        no_probability,
        no_odds,
        'SINGLE_ROOM_BOOTSTRAP',
        jsonb_build_object(
          'template_code', template_code,
          'season_start_at', '2026-07-01T00:00:00Z',
          'as_of', calculated_at,
          'deadline_at', deadline_at,
          'q', template_row.default_q,
          'half_life_days', template_row.default_half_life_days,
          'margin', template_row.default_margin
        ),
        calculated_at
      );

    perform public.write_audit_log(
      room_id,
      p_user_id,
      'market',
      created_market_id::text,
      'BOOTSTRAP_SINGLE_ROOM_MARKET',
      null,
      jsonb_build_object('status', 'OPEN', 'template_code', template_code),
      jsonb_build_object('odds_version', 1)
    );
  end loop;
end;
$$;

create or replace function private.ensure_single_room_membership(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_id constant uuid := public.single_room_id();
begin
  if p_user_id is null or not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    raise exception 'PROFILE_NOT_FOUND' using errcode = '22023';
  end if;

  insert into public.seasons (
    id,
    title,
    description,
    breakup_date,
    started_at,
    status,
    starting_balance_mkb,
    secret_bets_until_close,
    created_by
  )
  values (
    room_id,
    'Margot × Kévin',
    'Salle unique de pronostics fictifs entre amis.',
    '2026-07-01',
    '2026-07-01T00:00:00Z',
    'ACTIVE',
    1000,
    false,
    null
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    status = 'ACTIVE',
    starting_balance_mkb = 1000,
    secret_bets_until_close = false;

  insert into public.season_members (season_id, user_id, role, is_active)
  values (room_id, p_user_id, 'PLAYER', true)
  on conflict (season_id, user_id, role) do update set is_active = true;

  insert into public.wallets (season_id, user_id, balance_mkb)
  values (room_id, p_user_id, 1000)
  on conflict (season_id, user_id) do nothing;

  insert into public.wallet_transactions (
    season_id,
    user_id,
    transaction_type,
    amount_mkb,
    balance_after_mkb,
    idempotency_key,
    metadata
  )
  values (
    room_id,
    p_user_id,
    'INITIAL_CREDIT',
    1000,
    1000,
    'single-room-initial-credit:' || p_user_id::text,
    jsonb_build_object('source', 'single_room_bootstrap')
  )
  on conflict (idempotency_key) do nothing;

  perform private.initialize_single_room_markets(p_user_id);
  return room_id;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    private.profile_display_name(
      new.email,
      coalesce(new.raw_user_meta_data, '{}'::jsonb)
    )
  )
  on conflict (id) do nothing;

  perform private.ensure_single_room_membership(new.id);
  return new;
end;
$$;

create or replace function public.ensure_current_profile()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  current_metadata jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select email, raw_user_meta_data
  into current_email, current_metadata
  from auth.users
  where id = current_user_id;

  insert into public.profiles (id, display_name)
  values (
    current_user_id,
    private.profile_display_name(
      current_email,
      coalesce(current_metadata, '{}'::jsonb)
    )
  )
  on conflict (id) do nothing;

  perform private.ensure_single_room_membership(current_user_id);
  return current_user_id;
end;
$$;

create or replace function public.ensure_single_room_access()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform public.ensure_current_profile();
  return public.single_room_id();
end;
$$;

do $$
declare
  profile_id uuid;
begin
  for profile_id in select id from public.profiles loop
    perform private.ensure_single_room_membership(profile_id);
  end loop;
end;
$$;

revoke all on function public.single_room_id() from public, anon;
grant execute on function public.single_room_id() to authenticated;

revoke all on function public.ensure_single_room_access() from public, anon;
grant execute on function public.ensure_single_room_access() to authenticated;

revoke all on function private.initialize_single_room_markets(uuid)
  from public, anon, authenticated;
revoke all on function private.ensure_single_room_membership(uuid)
  from public, anon, authenticated;
revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated;

