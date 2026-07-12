\set ON_ERROR_STOP on

do $$
declare
  expected_tables text[] := array[
    'profiles', 'seasons', 'season_members', 'season_invitations',
    'live_sessions', 'live_attendees', 'action_types',
    'action_type_confirmation_rules', 'actions', 'action_reports',
    'action_confirmations', 'media_assets', 'market_templates', 'markets',
    'market_outcomes', 'odds_snapshots', 'market_action_rules', 'wallets',
    'bets', 'bet_legs', 'settlements', 'wallet_transactions', 'notifications',
    'audit_logs', 'rechute_snapshots'
  ];
  table_count integer;
  rls_count integer;
begin
  select count(*) into table_count
  from pg_catalog.pg_tables
  where schemaname = 'public' and tablename = any(expected_tables);
  if table_count <> 25 then
    raise exception 'Expected 25 MK Bet tables, found %', table_count;
  end if;

  select count(*) into rls_count
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(expected_tables)
    and c.relrowsecurity;
  if rls_count <> 25 then
    raise exception 'Expected RLS on 25 tables, found %', rls_count;
  end if;

  if (select count(*) from public.action_types) <> 19 then
    raise exception 'Expected 19 action types';
  end if;
  if (select count(distinct code) from public.action_types) <> 19 then
    raise exception 'Action type codes are not unique';
  end if;
  if (select count(*) from public.action_type_confirmation_rules) <> 13 then
    raise exception 'Expected 13 alternative confirmation rules';
  end if;
  if (select count(*) from public.market_templates) <> 7 then
    raise exception 'Expected 7 market templates';
  end if;
  if exists (
    select 1 from public.market_templates
    where default_q not between 0.02 and 0.98
      or default_half_life_days not between 1 and 365
      or default_margin < 1
  ) then
    raise exception 'Invalid market template probability parameters';
  end if;
  if exists (
    select 1 from public.market_templates
    where not (
      settlement_rule ? 'trigger_action_code'
      and settlement_rule ? 'reference_time_order'
      and settlement_rule ? 'contested_action_policy'
      and settlement_rule ? 'indeterminate_time_policy'
      and settlement_rule ? 'refund_policy'
    )
  ) then
    raise exception 'Incomplete settlement rule JSON';
  end if;
  if (select count(*) from public.market_action_rules) <> 15 then
    raise exception 'Expected 15 market action rules';
  end if;
  if (select count(*) from pg_catalog.pg_policies where schemaname = 'public') <> 0 then
    raise exception 'No permissive RLS policy should exist yet';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_trigger
    where tgname = 'wallet_transactions_prevent_mutation' and not tgisinternal
  ) or not exists (
    select 1 from pg_catalog.pg_trigger
    where tgname = 'audit_logs_prevent_mutation' and not tgisinternal
  ) then
    raise exception 'Immutable ledger triggers are missing';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'market_outcomes_displayed_odds_check'
  ) then
    raise exception 'Minimum displayed odds constraint is missing';
  end if;
end;
$$;

select 'MK Bet schema validation passed' as result;
