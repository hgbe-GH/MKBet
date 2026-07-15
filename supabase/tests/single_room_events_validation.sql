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
        '91000000-0000-4000-8000-000000000002'
      )
      and role = 'PLAYER'
      and is_active
  ) <> 2 then
    raise exception 'Every new profile must join as PLAYER';
  end if;

  if (
    select count(*)
    from public.wallets
    where season_id = room_id
      and user_id in (
        '91000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002'
      )
      and balance_mkb = 1000
  ) <> 2 then
    raise exception 'Every new profile must receive a 1000 MKB wallet';
  end if;

  if (
    select count(*)
    from public.wallet_transactions
    where season_id = room_id
      and user_id in (
        '91000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002'
      )
      and transaction_type = 'INITIAL_CREDIT'
  ) <> 2 then
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

rollback;

