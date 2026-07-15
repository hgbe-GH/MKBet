-- Atomic event voting, market resolution and fictitious wallet settlement.

create unique index settlements_initial_market_unique
  on public.settlements (market_id)
  where supersedes_settlement_id is null;

create or replace function private.settle_event_market(
  p_report_id uuid,
  p_market_id uuid,
  p_winning_outcome_id uuid,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  market_row public.markets%rowtype;
  settlement_id uuid;
  bet_row public.bets%rowtype;
  payout integer;
  wallet_balance integer;
  next_bet_status public.bet_status;
  has_lost_leg boolean;
  has_open_leg boolean;
  all_void boolean;
begin
  select * into market_row
  from public.markets
  where id = p_market_id
  for update;

  if market_row.id is null
    or market_row.season_id <> public.single_room_id()
    or market_row.status <> 'SUSPENDED' then
    raise exception 'EVENT_MARKET_NOT_SUSPENDED' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.market_outcomes
    where id = p_winning_outcome_id and market_id = p_market_id
  ) then
    raise exception 'EVENT_OUTCOME_INVALID' using errcode = '22023';
  end if;

  select id into settlement_id
  from public.settlements
  where market_id = p_market_id and supersedes_settlement_id is null;
  if settlement_id is not null then
    return settlement_id;
  end if;

  insert into public.settlements (
    market_id,
    result_outcome_id,
    settlement_type,
    notes,
    settled_by
  )
  values (
    p_market_id,
    p_winning_outcome_id,
    'STANDARD',
    'Décision collective du rapport ' || p_report_id::text,
    p_actor_user_id
  )
  returning id into settlement_id;

  update public.market_outcomes
  set result_status = case
    when id = p_winning_outcome_id then 'WINNER'::public.outcome_result_status
    else 'LOSER'::public.outcome_result_status
  end
  where market_id = p_market_id;

  update public.bet_legs
  set
    status = case
      when outcome_id = p_winning_outcome_id then 'WON'::public.bet_leg_status
      else 'LOST'::public.bet_leg_status
    end,
    settled_at = now()
  where market_id = p_market_id and status = 'OPEN';

  for bet_row in
    select bet.*
    from public.bets bet
    where exists (
      select 1 from public.bet_legs leg
      where leg.bet_id = bet.id and leg.market_id = p_market_id
    )
      and bet.status in ('OPEN', 'PARTIALLY_SETTLED')
    order by bet.user_id, bet.id
    for update
  loop
    select
      bool_or(leg.status = 'LOST'),
      bool_or(leg.status = 'OPEN'),
      bool_and(leg.status = 'VOID')
    into has_lost_leg, has_open_leg, all_void
    from public.bet_legs leg
    where leg.bet_id = bet_row.id;

    payout := 0;
    next_bet_status := case
      when has_lost_leg then 'LOST'::public.bet_status
      when has_open_leg then 'PARTIALLY_SETTLED'::public.bet_status
      when all_void then 'REFUNDED'::public.bet_status
      else 'WON'::public.bet_status
    end;

    if next_bet_status = 'WON' then
      payout := bet_row.potential_return_mkb;
    elsif next_bet_status = 'REFUNDED' then
      payout := bet_row.stake_mkb;
    end if;

    update public.bets
    set
      status = next_bet_status,
      settled_at = case
        when next_bet_status = 'PARTIALLY_SETTLED' then null
        else now()
      end
    where id = bet_row.id;

    if payout > 0 then
      select balance_mkb into wallet_balance
      from public.wallets
      where season_id = bet_row.season_id and user_id = bet_row.user_id
      for update;

      update public.wallets
      set
        balance_mkb = balance_mkb + payout,
        total_returned_mkb = total_returned_mkb + payout,
        version = version + 1
      where season_id = bet_row.season_id and user_id = bet_row.user_id;

      insert into public.wallet_transactions (
        season_id,
        user_id,
        transaction_type,
        amount_mkb,
        balance_after_mkb,
        bet_id,
        settlement_id,
        idempotency_key,
        metadata
      )
      values (
        bet_row.season_id,
        bet_row.user_id,
        case
          when next_bet_status = 'WON' then 'BET_WIN'::public.wallet_transaction_type
          else 'BET_REFUND'::public.wallet_transaction_type
        end,
        payout,
        wallet_balance + payout,
        bet_row.id,
        settlement_id,
        case
          when next_bet_status = 'WON' then 'bet-win:'
          else 'bet-refund:'
        end || bet_row.id::text,
        jsonb_build_object('event_report_id', p_report_id)
      )
      on conflict (idempotency_key) do nothing;
    end if;
  end loop;

  update public.markets
  set status = 'SETTLED', suspension_reason = null
  where id = p_market_id;

  perform public.write_audit_log(
    market_row.season_id,
    p_actor_user_id,
    'market',
    p_market_id::text,
    'SETTLE_MARKET_FROM_EVENT',
    jsonb_build_object('status', market_row.status),
    jsonb_build_object(
      'status', 'SETTLED',
      'winning_outcome_id', p_winning_outcome_id,
      'settlement_id', settlement_id
    ),
    jsonb_build_object('event_report_id', p_report_id)
  );

  return settlement_id;
end;
$$;

create or replace function public.vote_event_report(
  p_report_id uuid,
  p_decision public.event_vote_decision
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  report_row public.event_reports%rowtype;
  existing_vote public.event_report_votes%rowtype;
  confirm_count integer;
  reject_count integer;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  perform public.ensure_single_room_access();

  select * into report_row
  from public.event_reports
  where id = p_report_id
  for update;

  if report_row.id is null or report_row.season_id <> public.single_room_id() then
    raise exception 'EVENT_REPORT_NOT_FOUND' using errcode = '22023';
  end if;

  select * into existing_vote
  from public.event_report_votes
  where report_id = p_report_id and user_id = current_user_id;

  if existing_vote.id is not null then
    if existing_vote.decision <> p_decision then
      raise exception 'EVENT_VOTE_IMMUTABLE' using errcode = '55000';
    end if;
    return private.event_report_payload(p_report_id);
  end if;

  if report_row.status <> 'PENDING' then
    raise exception 'EVENT_REPORT_ALREADY_RESOLVED' using errcode = '55000';
  end if;
  if report_row.author_user_id = current_user_id then
    raise exception 'EVENT_SELF_VOTE_FORBIDDEN' using errcode = '42501';
  end if;

  insert into public.event_report_votes (report_id, user_id, decision)
  values (p_report_id, current_user_id, p_decision);

  select
    count(*) filter (where decision = 'CONFIRM'),
    count(*) filter (where decision = 'REJECT')
  into confirm_count, reject_count
  from public.event_report_votes
  where report_id = p_report_id;

  perform public.write_audit_log(
    report_row.season_id,
    current_user_id,
    'event_report_vote',
    p_report_id::text || ':' || current_user_id::text,
    'VOTE_EVENT_REPORT',
    null,
    jsonb_build_object('decision', p_decision),
    '{}'::jsonb
  );

  if confirm_count >= 2 then
    update public.event_reports
    set status = 'CONFIRMED', resolved_at = now()
    where id = p_report_id;

    update public.media_assets asset
    set status = 'APPROVED'
    where exists (
      select 1 from public.event_report_media link
      where link.report_id = p_report_id and link.media_asset_id = asset.id
    );

    if report_row.market_id is not null then
      perform private.settle_event_market(
        p_report_id,
        report_row.market_id,
        report_row.outcome_id,
        current_user_id
      );
    end if;

    perform public.write_audit_log(
      report_row.season_id,
      current_user_id,
      'event_report',
      p_report_id::text,
      'CONFIRM_EVENT_REPORT',
      jsonb_build_object('status', 'PENDING'),
      jsonb_build_object('status', 'CONFIRMED'),
      jsonb_build_object('confirm_count', confirm_count)
    );
  elsif reject_count >= 2 then
    update public.event_reports
    set status = 'REJECTED', resolved_at = now()
    where id = p_report_id;

    update public.media_assets asset
    set status = 'REJECTED'
    where exists (
      select 1 from public.event_report_media link
      where link.report_id = p_report_id and link.media_asset_id = asset.id
    );

    if report_row.market_id is not null then
      update public.markets
      set status = 'OPEN', suspension_reason = null
      where id = report_row.market_id and status = 'SUSPENDED';
    end if;

    perform public.write_audit_log(
      report_row.season_id,
      current_user_id,
      'event_report',
      p_report_id::text,
      'REJECT_EVENT_REPORT',
      jsonb_build_object('status', 'PENDING'),
      jsonb_build_object('status', 'REJECTED'),
      jsonb_build_object('reject_count', reject_count)
    );
  end if;

  return private.event_report_payload(p_report_id);
end;
$$;

revoke all on function private.settle_event_market(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
