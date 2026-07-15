\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
)
values
  ('90000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin-betting@example.test', '{}'::jsonb, '{"display_name":"Admin Betting"}'::jsonb, now(), now(), false, false),
  ('90000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'player-betting@example.test', '{}'::jsonb, '{"display_name":"Player Betting"}'::jsonb, now(), now(), false, false),
  ('90000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'outsider-betting@example.test', '{}'::jsonb, '{"display_name":"Outsider Betting"}'::jsonb, now(), now(), false, false);

insert into public.seasons (
  id, title, breakup_date, started_at, status, starting_balance_mkb, created_by
)
values (
  '91000000-0000-0000-0000-000000000001',
  'Saison transactionnelle',
  current_date - 10,
  now() - interval '10 days',
  'ACTIVE',
  1000,
  '90000000-0000-0000-0000-000000000001'
);

insert into public.season_members (season_id, user_id, role)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'ADMIN'),
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'PLAYER'),
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'PLAYER');

insert into public.wallets (season_id, user_id, balance_mkb)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 1000),
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 1000);

insert into public.wallet_transactions (
  season_id, user_id, transaction_type, amount_mkb, balance_after_mkb,
  idempotency_key
)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'INITIAL_CREDIT', 1000, 1000, 'betting-test-admin-credit'),
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'INITIAL_CREDIT', 1000, 1000, 'betting-test-player-credit');

do $$
declare
  kiss_sql numeric;
  kiss_expected numeric;
begin
  kiss_sql := private.conditional_event_probability(0.88, 14, 10, 30);
  kiss_expected := (
    (0.88 * (1 - power(2.0, -30.0 / 14.0)))
    - (0.88 * (1 - power(2.0, -10.0 / 14.0)))
  ) / (1 - (0.88 * (1 - power(2.0, -10.0 / 14.0))));
  if abs(kiss_sql - kiss_expected) > 0.0000000001 then
    raise exception 'SQL and TypeScript probability formulas diverge';
  end if;
  if private.displayed_decimal_odds(0.0001, 1.08) <> 50.00
    or private.displayed_decimal_odds(0.98, 1.08) <> 1.05 then
    raise exception 'Displayed odds bounds are invalid';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);

create temp table opened_markets (template_code text primary key, payload jsonb);
insert into opened_markets
select template_code, public.open_template_binary_market(
  '91000000-0000-0000-0000-000000000001',
  template_code,
  case when template_code in ('SEX_FRIENDS', 'OFFICIAL_COUPLE')
    then now() + interval '90 days'
    else now() + interval '30 days'
  end,
  now() - interval '1 minute',
  now() + interval '29 days',
  null,
  null,
  null,
  idempotency_key
)
from (values
  ('KISS', '92000000-0000-4000-8000-000000000001'::uuid),
  ('SLEEP_SAME_BED', '92000000-0000-4000-8000-000000000002'::uuid),
  ('SEX', '92000000-0000-4000-8000-000000000003'::uuid)
) input(template_code, idempotency_key);

do $$
begin
  if (select count(*) from public.markets where season_id = '91000000-0000-0000-0000-000000000001') <> 3 then
    raise exception 'Admin should create three markets';
  end if;
  if (select count(*) from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.season_id = '91000000-0000-0000-0000-000000000001') <> 6 then
    raise exception 'Binary markets should have two outcomes each';
  end if;
  if (select count(*) from public.odds_snapshots os join public.markets m on m.id = os.market_id where m.season_id = '91000000-0000-0000-0000-000000000001') <> 6 then
    raise exception 'Initial odds snapshots are missing';
  end if;
end;
$$;

select public.open_template_binary_market(
  '91000000-0000-0000-0000-000000000001', 'KISS',
  now() + interval '30 days', now(), now() + interval '29 days',
  null, null, null, '92000000-0000-4000-8000-000000000001'
);

do $$
begin
  if (select count(*) from public.markets where season_id = '91000000-0000-0000-0000-000000000001') <> 3 then
    raise exception 'Market idempotency failed';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);

do $$
declare
  denied boolean := false;
begin
  begin
    perform public.open_template_binary_market(
      '91000000-0000-0000-0000-000000000001', 'KISS',
      now() + interval '30 days', now(), now() + interval '29 days',
      null, null, null, '92000000-0000-4000-8000-000000000099'
    );
  exception when others then
    denied := sqlerrm like '%SEASON_ACCESS_DENIED%';
  end;
  if not denied then raise exception 'Player should not create markets'; end if;
end;
$$;

do $$
declare
  rejected boolean;
  kiss_yes uuid := (select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'KISS' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001');
  kiss_no uuid := (select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'KISS' and mo.code = 'NO' and m.season_id = '91000000-0000-0000-0000-000000000001');
  sex_yes uuid := (select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'SEX' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001');
begin
  rejected := false;
  begin
    perform public.create_bet_quote('91000000-0000-0000-0000-000000000001', 4, array[kiss_yes], '93000000-0000-4000-8000-000000000091');
  exception when others then rejected := sqlerrm like '%INVALID_STAKE%'; end;
  if not rejected then raise exception 'Invalid stake should be rejected'; end if;

  rejected := false;
  begin
    perform public.create_bet_quote('91000000-0000-0000-0000-000000000001', 10, array[kiss_yes, kiss_no], '93000000-0000-4000-8000-000000000092');
  exception when others then rejected := sqlerrm like '%DUPLICATE_MARKET_SELECTION%'; end;
  if not rejected then raise exception 'Same-market accumulator should be rejected'; end if;

  rejected := false;
  begin
    perform public.create_bet_quote('91000000-0000-0000-0000-000000000001', 10, array[kiss_yes, sex_yes], '93000000-0000-4000-8000-000000000093');
  exception when others then rejected := sqlerrm like '%MISSING_CORRELATION_RULE%'; end;
  if not rejected then raise exception 'Accumulator without an exact rule should be rejected'; end if;

  rejected := false;
  begin
    perform public.create_bet_quote('91000000-0000-0000-0000-000000000001', 1001, array[kiss_yes], '93000000-0000-4000-8000-000000000094');
  exception when others then rejected := sqlerrm like '%INSUFFICIENT_BALANCE%'; end;
  if not rejected then raise exception 'Insufficient balance should be rejected'; end if;
end;
$$;

create temp table simple_quote as
select public.create_bet_quote(
  '91000000-0000-0000-0000-000000000001',
  25,
  array[(select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'KISS' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001')],
  '93000000-0000-4000-8000-000000000001'
) payload;

select public.create_bet_quote(
  '91000000-0000-0000-0000-000000000001',
  25,
  array[(select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'KISS' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001')],
  '93000000-0000-4000-8000-000000000001'
);

do $$
begin
  if (select count(*) from public.bet_quotes where user_id = '90000000-0000-0000-0000-000000000002') <> 1 then
    raise exception 'Quote idempotency failed';
  end if;
  if (select (payload->>'potential_return_mkb')::integer from simple_quote)
    <> floor(25 * (select (payload->>'total_odds')::numeric from simple_quote)) then
    raise exception 'Potential return formula is invalid';
  end if;
  if (select (payload->>'expires_at')::timestamptz - now() from simple_quote)
    not between interval '55 seconds' and interval '61 seconds' then
    raise exception 'Quote expiry is not approximately sixty seconds';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000003', true);
do $$
begin
  if (select count(*) from public.bet_quotes) <> 0 then
    raise exception 'Outsider must not read another user quote';
  end if;
  if (select count(*) from public.accumulator_correlation_rules) <> 5 then
    raise exception 'Automatic single-room member should read correlation rules';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
do $$
begin
  if (select count(*) from public.bet_quotes where user_id = '90000000-0000-0000-0000-000000000002') <> 1 then
    raise exception 'Season admin should read member quotes for audit';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);

create temp table placed_bet as
select public.place_bet(
  (select (payload->>'quote_id')::uuid from simple_quote),
  '94000000-0000-4000-8000-000000000001'
) payload;

select public.place_bet(
  (select (payload->>'quote_id')::uuid from simple_quote),
  '94000000-0000-4000-8000-000000000001'
);

do $$
begin
  if (select count(*) from public.bets where user_id = '90000000-0000-0000-0000-000000000002') <> 1 then
    raise exception 'Placement idempotency created duplicate bets';
  end if;
  if (select count(*) from public.wallet_transactions where user_id = '90000000-0000-0000-0000-000000000002' and transaction_type = 'BET_STAKE') <> 1 then
    raise exception 'Placement idempotency created duplicate debits';
  end if;
  if (select balance_mkb from public.wallets where season_id = '91000000-0000-0000-0000-000000000001' and user_id = '90000000-0000-0000-0000-000000000002') <> 975 then
    raise exception 'Wallet debit is incorrect';
  end if;
  if (select amount_mkb from public.wallet_transactions where user_id = '90000000-0000-0000-0000-000000000002' and transaction_type = 'BET_STAKE') <> -25 then
    raise exception 'BET_STAKE must be negative';
  end if;
  if (select status from public.bet_quotes where id = (select (payload->>'quote_id')::uuid from simple_quote)) <> 'CONSUMED' then
    raise exception 'Quote should be consumed';
  end if;
end;
$$;

create temp table accumulator_quote as
select public.create_bet_quote(
  '91000000-0000-0000-0000-000000000001',
  10,
  array[
    (select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'KISS' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001'),
    (select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'SLEEP_SAME_BED' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001')
  ],
  '93000000-0000-4000-8000-000000000002'
) payload;

do $$
begin
  if (select payload->>'bet_type' from accumulator_quote) <> 'ACCUMULATOR'
    or (select (payload->>'correlation_adjustment')::numeric from accumulator_quote) <> 1.30 then
    raise exception 'Exact accumulator correlation was not applied';
  end if;
end;
$$;

create temp table changed_quote as
select public.create_bet_quote(
  '91000000-0000-0000-0000-000000000001',
  10,
  array[(select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'SEX' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001')],
  '93000000-0000-4000-8000-000000000003'
) payload;

reset role;
update public.market_outcomes set displayed_odds = displayed_odds + 0.01
where id = (select mo.id from public.market_outcomes mo join public.markets m on m.id = mo.market_id where m.event_code = 'SEX' and mo.code = 'YES' and m.season_id = '91000000-0000-0000-0000-000000000001');
update public.markets set odds_version = odds_version + 1
where id = (select id from public.markets where event_code = 'SEX' and season_id = '91000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
create temp table changed_result as
select public.place_bet(
  (select (payload->>'quote_id')::uuid from changed_quote),
  '94000000-0000-4000-8000-000000000003'
) payload;

do $$
begin
  if (select payload->>'code' from changed_result) <> 'ODDS_CHANGED' then
    raise exception 'Changed odds should be rejected';
  end if;
  if (select balance_mkb from public.wallets where season_id = '91000000-0000-0000-0000-000000000001' and user_id = '90000000-0000-0000-0000-000000000002') <> 975 then
    raise exception 'ODDS_CHANGED must not debit wallet';
  end if;
  if (select count(*) from public.get_season_leaderboard('91000000-0000-0000-0000-000000000001')) <> 2 then
    raise exception 'Leaderboard should expose active players only';
  end if;
end;
$$;

rollback;

select 'MK Bet transactional betting validation passed' as result;
