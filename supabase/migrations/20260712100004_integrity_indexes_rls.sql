create or replace function public.validate_bet_leg_season()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  bet_season_id uuid;
  market_season_id uuid;
begin
  select season_id into bet_season_id from public.bets where id = new.bet_id;
  select season_id into market_season_id from public.markets where id = new.market_id;

  if bet_season_id is distinct from market_season_id then
    raise exception 'A bet leg market must belong to the bet season'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validate_subject_confirmation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  action_season_id uuid;
begin
  if new.subject_key is null then
    return new;
  end if;

  select season_id into action_season_id from public.actions where id = new.action_id;

  if not exists (
    select 1
    from public.season_members
    where season_id = action_season_id
      and user_id = new.user_id
      and role = 'SUBJECT'
      and subject_key = new.subject_key
      and is_active
  ) then
    raise exception 'Subject confirmation does not match the active season subject'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validate_action_supersession()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_season_id uuid;
begin
  if new.supersedes_action_id is null then
    return new;
  end if;

  select season_id into previous_season_id
  from public.actions
  where id = new.supersedes_action_id;

  if previous_season_id is distinct from new.season_id then
    raise exception 'A corrected action must supersede an action from the same season'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validate_settlement_references()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  market_season_id uuid;
  action_season_id uuid;
  previous_market_id uuid;
begin
  select season_id into market_season_id from public.markets where id = new.market_id;

  if new.official_action_id is not null then
    select season_id into action_season_id
    from public.actions
    where id = new.official_action_id;

    if action_season_id is distinct from market_season_id then
      raise exception 'A settlement action must belong to the market season'
        using errcode = '23514';
    end if;
  end if;

  if new.supersedes_settlement_id is not null then
    select market_id into previous_market_id
    from public.settlements
    where id = new.supersedes_settlement_id;

    if previous_market_id is distinct from new.market_id then
      raise exception 'A correction must supersede a settlement for the same market'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_wallet_transaction_references()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  referenced_season_id uuid;
begin
  if new.bet_id is not null then
    select season_id into referenced_season_id from public.bets where id = new.bet_id;
    if referenced_season_id is distinct from new.season_id then
      raise exception 'A wallet transaction bet must belong to the wallet season'
        using errcode = '23514';
    end if;
  end if;

  if new.settlement_id is not null then
    select m.season_id into referenced_season_id
    from public.settlements s
    join public.markets m on m.id = s.market_id
    where s.id = new.settlement_id;
    if referenced_season_id is distinct from new.season_id then
      raise exception 'A wallet transaction settlement must belong to the wallet season'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_rechute_snapshot_action()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  action_season_id uuid;
begin
  if new.action_id is null then
    return new;
  end if;

  select season_id into action_season_id from public.actions where id = new.action_id;
  if action_season_id is distinct from new.season_id then
    raise exception 'A Rechutometre snapshot action must belong to the snapshot season'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_bet_leg_season() from public, anon, authenticated;
revoke all on function public.validate_subject_confirmation() from public, anon, authenticated;
revoke all on function public.validate_action_supersession() from public, anon, authenticated;
revoke all on function public.validate_settlement_references() from public, anon, authenticated;
revoke all on function public.validate_wallet_transaction_references() from public, anon, authenticated;
revoke all on function public.validate_rechute_snapshot_action() from public, anon, authenticated;

create trigger bet_legs_validate_season
before insert or update on public.bet_legs
for each row execute function public.validate_bet_leg_season();

create trigger action_confirmations_validate_subject
before insert or update on public.action_confirmations
for each row execute function public.validate_subject_confirmation();

create trigger actions_validate_supersession
before insert or update on public.actions
for each row execute function public.validate_action_supersession();

create trigger settlements_validate_references
before insert or update on public.settlements
for each row execute function public.validate_settlement_references();

create trigger wallet_transactions_validate_references
before insert on public.wallet_transactions
for each row execute function public.validate_wallet_transaction_references();

create trigger rechute_snapshots_validate_action
before insert or update on public.rechute_snapshots
for each row execute function public.validate_rechute_snapshot_action();

create unique index season_members_unique_active_subject
  on public.season_members (season_id, subject_key)
  where role = 'SUBJECT' and is_active;
create index season_members_user_season_idx
  on public.season_members (user_id, season_id);
create index season_invitations_token_hash_idx
  on public.season_invitations (token_hash);
create index season_invitations_status_expiry_idx
  on public.season_invitations (status, expires_at);
create index live_sessions_season_status_start_idx
  on public.live_sessions (season_id, status, scheduled_start);
create index live_attendees_live_status_idx
  on public.live_attendees (live_id, attendance_status);
create index actions_season_occurred_idx
  on public.actions (season_id, occurred_at desc);
create index actions_live_status_occurred_idx
  on public.actions (live_id, status, occurred_at desc);
create index actions_type_official_time_idx
  on public.actions (action_type_id, official_occurred_at);
create index action_reports_action_idx on public.action_reports (action_id);
create index action_confirmations_action_idx on public.action_confirmations (action_id);
create index action_type_confirmation_rules_type_idx
  on public.action_type_confirmation_rules (action_type_id, priority);
create index markets_season_status_close_idx
  on public.markets (season_id, status, closes_at);
create index markets_live_status_idx on public.markets (live_id, status);
create index markets_event_status_idx on public.markets (event_code, status);
create index market_outcomes_market_result_idx
  on public.market_outcomes (market_id, result_status);
create index odds_snapshots_market_version_idx
  on public.odds_snapshots (market_id, odds_version desc);
create index market_action_rules_source_target_idx
  on public.market_action_rules (source_action_type_id, target_event_code);
create index bets_user_season_status_placed_idx
  on public.bets (user_id, season_id, status, placed_at desc);
create index bets_season_status_idx on public.bets (season_id, status);
create index bet_legs_market_status_idx on public.bet_legs (market_id, status);
create index bet_legs_bet_idx on public.bet_legs (bet_id);
create index wallet_transactions_user_season_created_idx
  on public.wallet_transactions (user_id, season_id, created_at desc);
create index settlements_market_settled_idx
  on public.settlements (market_id, settled_at desc);
create index notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);
create index audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_season_created_idx
  on public.audit_logs (season_id, created_at desc);
create index rechute_snapshots_season_calculated_idx
  on public.rechute_snapshots (season_id, calculated_at desc);

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.season_members enable row level security;
alter table public.season_invitations enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_attendees enable row level security;
alter table public.action_types enable row level security;
alter table public.action_type_confirmation_rules enable row level security;
alter table public.actions enable row level security;
alter table public.action_reports enable row level security;
alter table public.action_confirmations enable row level security;
alter table public.media_assets enable row level security;
alter table public.market_templates enable row level security;
alter table public.markets enable row level security;
alter table public.market_outcomes enable row level security;
alter table public.odds_snapshots enable row level security;
alter table public.market_action_rules enable row level security;
alter table public.wallets enable row level security;
alter table public.bets enable row level security;
alter table public.bet_legs enable row level security;
alter table public.settlements enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rechute_snapshots enable row level security;
