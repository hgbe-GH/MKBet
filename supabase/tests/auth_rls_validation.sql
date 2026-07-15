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
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'alice@example.test', '{}'::jsonb, '{"display_name":"Alice"}'::jsonb, now(), now(), false, false),
  ('00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'bob@example.test', '{}'::jsonb, '{"display_name":"Bob"}'::jsonb, now(), now(), false, false),
  ('00000000-0000-0000-0000-0000000000c3', 'authenticated', 'authenticated', 'chloe@example.test', '{}'::jsonb, '{"display_name":"Chloe"}'::jsonb, now(), now(), false, false),
  ('00000000-0000-0000-0000-0000000000d4', 'authenticated', 'authenticated', 'margot@example.test', '{}'::jsonb, '{"display_name":"Margot"}'::jsonb, now(), now(), false, false),
  ('00000000-0000-0000-0000-0000000000e5', 'authenticated', 'authenticated', 'kevin@example.test', '{}'::jsonb, '{"display_name":"Kevin"}'::jsonb, now(), now(), false, false),
  ('00000000-0000-0000-0000-0000000000f6', 'authenticated', 'authenticated', 'david@example.test', '{}'::jsonb, '{"display_name":"David"}'::jsonb, now(), now(), false, false),
  ('00000000-0000-0000-0000-0000000000b7', 'authenticated', 'authenticated', 'emma@example.test', '{}'::jsonb, '{"display_name":"Emma"}'::jsonb, now(), now(), false, false);

insert into public.seasons (
  id,
  title,
  breakup_date,
  started_at,
  starting_balance_mkb,
  created_by
)
values
  ('10000000-0000-0000-0000-00000000000a', 'Saison A', '2026-07-01', '2026-07-12T10:00:00Z', 1000, '00000000-0000-0000-0000-0000000000a1'),
  ('10000000-0000-0000-0000-00000000000b', 'Saison B', '2026-07-02', '2026-07-12T10:00:00Z', 1000, '00000000-0000-0000-0000-0000000000b7');

insert into public.season_members (season_id, user_id, role, subject_key)
values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'ADMIN', null),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'PLAYER', null),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b2', 'PLAYER', null),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000c3', 'REPORTER', null),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d4', 'SUBJECT', 'MARGOT'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e5', 'SUBJECT', 'KEVIN'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b7', 'ADMIN', null),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b7', 'PLAYER', null);

insert into public.wallets (season_id, user_id, balance_mkb)
values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 1000),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b2', 1000);

insert into public.wallet_transactions (
  season_id,
  user_id,
  transaction_type,
  amount_mkb,
  balance_after_mkb,
  idempotency_key
)
values (
  '10000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-0000000000a1',
  'INITIAL_CREDIT',
  1000,
  1000,
  'test-alice-credit'
);

insert into public.live_sessions (
  id,
  season_id,
  title,
  live_type,
  created_by,
  host_user_id
)
values (
  '20000000-0000-0000-0000-00000000000a',
  '10000000-0000-0000-0000-00000000000a',
  'Soiree A',
  'INSTANT',
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000c3'
);

insert into public.actions (
  id,
  season_id,
  live_id,
  action_type_id,
  occurred_at,
  declared_by,
  certainty,
  public_description,
  private_note
)
select
  '30000000-0000-0000-0000-00000000000a',
  '10000000-0000-0000-0000-00000000000a',
  '20000000-0000-0000-0000-00000000000a',
  id,
  now(),
  '00000000-0000-0000-0000-0000000000c3',
  'DIRECT_WITNESS',
  'Action publique',
  null
from public.action_types
where code = 'KISS';

insert into public.actions (
  id,
  season_id,
  live_id,
  action_type_id,
  occurred_at,
  declared_by,
  certainty,
  public_description,
  private_note
)
select
  '30000000-0000-0000-0000-00000000000b',
  '10000000-0000-0000-0000-00000000000a',
  '20000000-0000-0000-0000-00000000000a',
  id,
  now(),
  '00000000-0000-0000-0000-0000000000c3',
  'DIRECT_WITNESS',
  'Action avec note',
  'note privee'
from public.action_types
where code = 'KISS';

insert into public.audit_logs (
  season_id,
  actor_user_id,
  entity_type,
  entity_id,
  action
)
values (
  '10000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-0000000000a1',
  'test',
  'test',
  'TEST_AUDIT'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
begin
  if (select count(*) from public.profiles where id in (
    '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000b7'
  )) <> 2 then
    raise exception 'Single-room members should read each other profiles';
  end if;
  if (select count(*) from public.audit_logs) <> 1 then
    raise exception 'Alice should read season A audit';
  end if;
end;
$$;

create temp table invitation_result as
select * from public.create_season_invitation(
  '10000000-0000-0000-0000-00000000000a',
  'PLAYER',
  null,
  null,
  now() + interval '7 days',
  1
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);

update public.profiles
set display_name = 'Bob Modifie'
where id = '00000000-0000-0000-0000-0000000000b2';

update public.profiles
set display_name = 'Alice Piratee'
where id = '00000000-0000-0000-0000-0000000000a1';

do $$
begin
  if (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'Alice Piratee' then
    raise exception 'Bob should not update Alice profile';
  end if;
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_action_feed'
      and column_name = 'private_note'
  ) then
    raise exception 'member_action_feed must not expose private_note column';
  end if;
  if (select count(*) from public.actions where private_note is not null) <> 0 then
    raise exception 'Bob should not read actions with private_note';
  end if;
  if (select count(*) from public.wallet_transactions where user_id = '00000000-0000-0000-0000-0000000000a1') <> 0 then
    raise exception 'Bob should not read Alice transactions';
  end if;
  if (select count(*) from public.audit_logs) <> 0 then
    raise exception 'Bob should not read audit logs';
  end if;
end;
$$;

do $$
declare
  failed boolean := false;
begin
  begin
    update public.wallets
    set balance_mkb = 1
    where season_id = '10000000-0000-0000-0000-00000000000a'
      and user_id = '00000000-0000-0000-0000-0000000000b2';
  exception when others then
    failed := true;
  end;

  if not failed then
    raise exception 'Bob should not have update privileges on wallets';
  end if;
  if (
    select balance_mkb
    from public.wallets
    where season_id = '10000000-0000-0000-0000-00000000000a'
      and user_id = '00000000-0000-0000-0000-0000000000b2'
  ) = 1 then
    raise exception 'Bob should not update wallet balance directly';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f6', true);

do $$
begin
  if (select count(*) from public.seasons where id = '10000000-0000-0000-0000-00000000000a') <> 0 then
    raise exception 'David should not read season A before invitation';
  end if;
end;
$$;

create temp table accept_result as
select * from public.accept_season_invitation((select token from invitation_result));

do $$
begin
  if (select count(*) from public.wallets where season_id = '10000000-0000-0000-0000-00000000000a' and user_id = '00000000-0000-0000-0000-0000000000f6') <> 1 then
    raise exception 'Invitation should create one wallet';
  end if;
  if (select count(*) from public.wallet_transactions where season_id = '10000000-0000-0000-0000-00000000000a' and user_id = '00000000-0000-0000-0000-0000000000f6') <> 1 then
    raise exception 'Invitation should create one initial credit';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d4', true);

insert into public.action_confirmations (
  action_id,
  user_id,
  subject_key,
  decision
)
values (
  '30000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-0000000000d4',
  'MARGOT',
  'CONFIRM'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e5', true);

do $$
declare
  failed boolean := false;
begin
  begin
    insert into public.action_confirmations (
      action_id,
      user_id,
      subject_key,
      decision
    )
    values (
      '30000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-0000000000e5',
      'MARGOT',
      'CONFIRM'
    );
  exception when others then
    failed := true;
  end;

  if not failed then
    raise exception 'Kevin should not confirm as Margot';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', true);

insert into storage.objects (id, bucket_id, name, owner, metadata)
values (
  extensions.gen_random_uuid(),
  'season-media',
  '6d6b0000-0000-4000-8000-000000000001/00000000-0000-0000-0000-0000000000c3/proof.png',
  '00000000-0000-0000-0000-0000000000c3',
  '{}'::jsonb
);

do $$
declare
  failed boolean := false;
begin
  begin
    insert into storage.objects (id, bucket_id, name, owner, metadata)
    values (
      extensions.gen_random_uuid(),
      'season-media',
      '6d6b0000-0000-4000-8000-000000000001/00000000-0000-0000-0000-0000000000b2/proof.png',
      '00000000-0000-0000-0000-0000000000c3',
      '{}'::jsonb
    );
  exception when others then
    failed := true;
  end;

  if not failed then
    raise exception 'Chloe should not upload under Bob user id';
  end if;
end;
$$;

reset role;
rollback;
