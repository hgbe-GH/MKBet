\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
values
  (
    '91000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'single-room-alice@example.test',
    '{}'::jsonb,
    '{"display_name":"Alice Direct"}'::jsonb,
    now(),
    now(),
    false,
    false
  ),
  (
    '91000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'single-room-bob@example.test',
    '{}'::jsonb,
    '{"display_name":"Bob Direct"}'::jsonb,
    now(),
    now(),
    false,
    false
  ),
  (
    '91000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'single-room-carol@example.test',
    '{}'::jsonb,
    '{"display_name":"Carol Direct"}'::jsonb,
    now(),
    now(),
    false,
    false
  );

do $$
declare
  room_id uuid := public.single_room_id();
begin
  if (select title from public.seasons where id = room_id) <> 'Margot × Kévin' then
    raise exception 'The fixed room must exist';
  end if;

  if (
    select count(*)
    from public.season_members
    where season_id = room_id
      and user_id in (
        '91000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002',
        '91000000-0000-4000-8000-000000000003'
      )
      and role = 'PLAYER'
      and is_active
  ) <> 3 then
    raise exception 'Every new profile must join as PLAYER';
  end if;

  if (
    select count(*)
    from public.wallets
    where season_id = room_id
      and user_id in (
        '91000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002',
        '91000000-0000-4000-8000-000000000003'
      )
      and balance_mkb = 1000
  ) <> 3 then
    raise exception 'Every new profile must receive a 1000 MKB wallet';
  end if;

  if (
    select count(*)
    from public.wallet_transactions
    where season_id = room_id
      and user_id in (
        '91000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002',
        '91000000-0000-4000-8000-000000000003'
      )
      and transaction_type = 'INITIAL_CREDIT'
  ) <> 3 then
    raise exception 'Initial credits must be unique';
  end if;

  if (
    select count(*)
    from public.markets
    where season_id = room_id and event_code in ('KISS', 'OFFICIAL_COUPLE')
  ) <> 2 then
    raise exception 'Only the two single-room markets must be initialized';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000001',
  true
);

select public.ensure_single_room_access();
select public.ensure_single_room_access();

reset role;

do $$
declare
  room_id uuid := public.single_room_id();
begin
  if (
    select count(*)
    from public.wallet_transactions
    where season_id = room_id
      and user_id = '91000000-0000-4000-8000-000000000001'
      and transaction_type = 'INITIAL_CREDIT'
  ) <> 1 then
    raise exception 'Repeated access must not duplicate initial credit';
  end if;

  if (
    select count(*)
    from public.markets
    where season_id = room_id and event_code in ('KISS', 'OFFICIAL_COUPLE')
  ) <> 2 then
    raise exception 'Repeated access must not duplicate markets';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000002',
  true
);

create temp table placed_kiss_quote as
select public.create_bet_quote(
  public.single_room_id(),
  100,
  array[(
    select mo.id
    from public.market_outcomes mo
    join public.markets m on m.id = mo.market_id
    where m.season_id = public.single_room_id()
      and m.event_code = 'KISS'
      and mo.code = 'YES'
  )],
  '92000000-0000-4000-8000-000000000001'
) payload;

create temp table placed_kiss_bet as
select public.place_bet(
  (select (payload ->> 'quote_id')::uuid from placed_kiss_quote),
  '92000000-0000-4000-8000-000000000002'
) payload;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000001',
  true
);

do $$
declare
  future_rejected boolean := false;
  note_rejected boolean := false;
  pair_rejected boolean := false;
  rule_rejected boolean := false;
  direct_insert_rejected boolean := false;
  kiss_market_id uuid := (
    select id from public.markets
    where season_id = public.single_room_id() and event_code = 'KISS'
  );
  kiss_yes_id uuid := (
    select outcome.id
    from public.market_outcomes outcome
    join public.markets market on market.id = outcome.market_id
    where market.season_id = public.single_room_id()
      and market.event_code = 'KISS'
      and outcome.code = 'YES'
  );
begin
  begin
    perform public.submit_event_report(
      'FRIENDLY_MEETING', now() + interval '1 minute', 'Dans le futur.',
      null, null, '[]'::jsonb, '92000000-0000-4000-8000-000000000010'
    );
  exception when others then
    future_rejected := sqlerrm like '%EVENT_OCCURRED_AT_INVALID%';
  end;

  begin
    perform public.submit_event_report(
      'FRIENDLY_MEETING', now(), repeat('x', 501),
      null, null, '[]'::jsonb, '92000000-0000-4000-8000-000000000011'
    );
  exception when others then
    note_rejected := sqlerrm like '%EVENT_NOTE_INVALID%';
  end;

  begin
    perform public.submit_event_report(
      'KISS', now(), 'Issue manquante.', kiss_market_id, null,
      '[]'::jsonb, '92000000-0000-4000-8000-000000000012'
    );
  exception when others then
    pair_rejected := sqlerrm like '%EVENT_MARKET_OUTCOME_REQUIRED%';
  end;

  begin
    perform public.submit_event_report(
      'FRIENDLY_MEETING', now(), 'Mauvais type de marché.',
      kiss_market_id, kiss_yes_id, '[]'::jsonb,
      '92000000-0000-4000-8000-000000000013'
    );
  exception when others then
    rule_rejected := sqlerrm like '%EVENT_MARKET_RULE_INVALID%';
  end;

  begin
    insert into public.event_reports (
      season_id, author_user_id, report_type, occurred_at, note, idempotency_key
    ) values (
      public.single_room_id(), auth.uid(), 'FRIENDLY_MEETING', now(),
      'Insertion directe interdite.',
      '92000000-0000-4000-8000-000000000014'
    );
  exception when insufficient_privilege then
    direct_insert_rejected := true;
  end;

  if not future_rejected or not note_rejected or not pair_rejected
    or not rule_rejected or not direct_insert_rejected then
    raise exception 'Event report validation or write boundary is incomplete';
  end if;
end;
$$;

create temp table submitted_kiss_report as
select public.submit_event_report(
  'KISS',
  now() - interval '1 hour',
  'Baiser observé et soumis au vote.',
  (
    select id from public.markets
    where season_id = public.single_room_id() and event_code = 'KISS'
  ),
  (
    select mo.id
    from public.market_outcomes mo
    join public.markets m on m.id = mo.market_id
    where m.season_id = public.single_room_id()
      and m.event_code = 'KISS'
      and mo.code = 'YES'
  ),
  '[]'::jsonb,
  '92000000-0000-4000-8000-000000000003'
) payload;

do $$
declare
  first_report_id uuid := (
    select (payload ->> 'report_id')::uuid from submitted_kiss_report
  );
  repeated_report_id uuid;
begin
  repeated_report_id := (
    select (public.submit_event_report(
      'KISS',
      now() - interval '1 hour',
      'Baiser observé et soumis au vote.',
      (
        select id from public.markets
        where season_id = public.single_room_id() and event_code = 'KISS'
      ),
      (
        select outcome.id
        from public.market_outcomes outcome
        join public.markets market on market.id = outcome.market_id
        where market.season_id = public.single_room_id()
          and market.event_code = 'KISS'
          and outcome.code = 'YES'
      ),
      '[]'::jsonb,
      '92000000-0000-4000-8000-000000000003'
    ) ->> 'report_id')::uuid
  );
  if repeated_report_id <> first_report_id then
    raise exception 'Report submission must be idempotent';
  end if;
end;
$$;

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.vote_event_report(
      (select (payload ->> 'report_id')::uuid from submitted_kiss_report),
      'CONFIRM'
    );
  exception when others then
    rejected := sqlerrm like '%EVENT_SELF_VOTE_FORBIDDEN%';
  end;
  if not rejected then
    raise exception 'The report author must not vote';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000002',
  true
);

select public.vote_event_report(
  (select (payload ->> 'report_id')::uuid from submitted_kiss_report),
  'CONFIRM'
);

select public.vote_event_report(
  (select (payload ->> 'report_id')::uuid from submitted_kiss_report),
  'CONFIRM'
);

do $$
declare
  immutable_rejected boolean := false;
begin
  begin
    perform public.vote_event_report(
      (select (payload ->> 'report_id')::uuid from submitted_kiss_report),
      'REJECT'
    );
  exception when others then
    immutable_rejected := sqlerrm like '%EVENT_VOTE_IMMUTABLE%';
  end;
  if not immutable_rejected then
    raise exception 'A vote decision must be immutable';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000003',
  true
);

select public.vote_event_report(
  (select (payload ->> 'report_id')::uuid from submitted_kiss_report),
  'CONFIRM'
);

reset role;

do $$
declare
  report_id uuid := (
    select (payload ->> 'report_id')::uuid from submitted_kiss_report
  );
  created_bet_id uuid := (
    select (payload ->> 'bet_id')::uuid from placed_kiss_bet
  );
begin
  if (select status from public.event_reports where id = report_id) <> 'CONFIRMED' then
    raise exception 'Two confirmations must confirm the report';
  end if;
  if (select status from public.markets where event_code = 'KISS' and season_id = public.single_room_id()) <> 'SETTLED' then
    raise exception 'Confirmed report must settle its market';
  end if;
  if (select status from public.bets where id = created_bet_id) <> 'WON' then
    raise exception 'The matching bet must win';
  end if;
  if (
    select count(*)
    from public.wallet_transactions transaction
    where transaction.bet_id = created_bet_id
      and transaction.transaction_type = 'BET_WIN'
  ) <> 1 then
    raise exception 'Winning credit must be unique';
  end if;
  if (select count(*) from public.settlements where market_id = (
    select id from public.markets where event_code = 'KISS' and season_id = public.single_room_id()
  )) <> 1 then
    raise exception 'Market settlement must be unique';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000001',
  true
);

create temp table submitted_rejected_report as
select public.submit_event_report(
  'OFFICIAL_RELATIONSHIP',
  now() - interval '30 minutes',
  'Retour officiel à vérifier.',
  (
    select id from public.markets
    where season_id = public.single_room_id() and event_code = 'OFFICIAL_COUPLE'
  ),
  (
    select mo.id
    from public.market_outcomes mo
    join public.markets m on m.id = mo.market_id
    where m.season_id = public.single_room_id()
      and m.event_code = 'OFFICIAL_COUPLE'
      and mo.code = 'YES'
  ),
  '[]'::jsonb,
  '92000000-0000-4000-8000-000000000004'
) payload;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000002', true);
select public.vote_event_report(
  (select (payload ->> 'report_id')::uuid from submitted_rejected_report),
  'REJECT'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000003', true);
select public.vote_event_report(
  (select (payload ->> 'report_id')::uuid from submitted_rejected_report),
  'REJECT'
);

reset role;

do $$
declare
  report_id uuid := (
    select (payload ->> 'report_id')::uuid from submitted_rejected_report
  );
begin
  if (select status from public.event_reports where id = report_id) <> 'REJECTED' then
    raise exception 'Two rejections must reject the report';
  end if;
  if (select status from public.markets where event_code = 'OFFICIAL_COUPLE' and season_id = public.single_room_id()) <> 'OPEN' then
    raise exception 'Rejected report must reopen its market';
  end if;
end;
$$;

rollback;
