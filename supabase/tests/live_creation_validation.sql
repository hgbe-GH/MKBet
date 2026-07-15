\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
)
values
  ('81000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'live-admin@example.test', '{}'::jsonb, '{"display_name":"Admin Live"}'::jsonb, now(), now(), false, false),
  ('81000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'live-host@example.test', '{}'::jsonb, '{"display_name":"Host Live"}'::jsonb, now(), now(), false, false),
  ('81000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'live-host-two@example.test', '{}'::jsonb, '{"display_name":"Host Deux"}'::jsonb, now(), now(), false, false),
  ('81000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'live-player@example.test', '{}'::jsonb, '{"display_name":"Joueur Live"}'::jsonb, now(), now(), false, false),
  ('81000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'live-reporter@example.test', '{}'::jsonb, '{"display_name":"Reporter Live"}'::jsonb, now(), now(), false, false),
  ('81000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'live-outsider@example.test', '{}'::jsonb, '{"display_name":"Externe Live"}'::jsonb, now(), now(), false, false);

insert into public.seasons (
  id, title, breakup_date, started_at, status, starting_balance_mkb, created_by
)
values
  ('82000000-0000-4000-8000-000000000001', 'Saison lives', '2026-07-01', '2026-07-12T10:00:00Z', 'ACTIVE', 1000, '81000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000002', 'Saison extérieure', '2026-07-01', '2026-07-12T10:00:00Z', 'ACTIVE', 1000, '81000000-0000-4000-8000-000000000006');

insert into public.season_members (season_id, user_id, role)
values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', 'ADMIN'),
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000002', 'LIVE_HOST'),
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000003', 'LIVE_HOST'),
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000004', 'PLAYER'),
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000005', 'REPORTER'),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000006', 'LIVE_HOST');

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000001', true);

create temp table created_scheduled_live as
select public.create_live_session(
  '82000000-0000-4000-8000-000000000001',
  'Soirée planifiée',
  'Une description',
  'Appartement',
  'PROGRAMMED',
  '81000000-0000-4000-8000-000000000002',
  '2026-07-20T18:00:00Z',
  '2026-07-20T22:00:00Z',
  '[
    {"user_id":"81000000-0000-4000-8000-000000000004","live_role":"VIEWER"},
    {"user_id":"81000000-0000-4000-8000-000000000005","live_role":"REPORTER"}
  ]'::jsonb,
  '83000000-0000-4000-8000-000000000001'
) payload;

select public.create_live_session(
  '82000000-0000-4000-8000-000000000001',
  'Soirée planifiée changée',
  null,
  null,
  'PROGRAMMED',
  '81000000-0000-4000-8000-000000000002',
  '2026-07-20T18:00:00Z',
  '2026-07-20T22:00:00Z',
  '[
    {"user_id":"81000000-0000-4000-8000-000000000004","live_role":"VIEWER"}
  ]'::jsonb,
  '83000000-0000-4000-8000-000000000001'
);

do $$
declare
  created_live_id uuid := (select (payload ->> 'id')::uuid from created_scheduled_live);
begin
  if (select status from public.live_sessions where id = created_live_id) <> 'SCHEDULED' then
    raise exception 'Programmed live must start SCHEDULED';
  end if;
  if (select count(*) from public.live_attendees la where la.live_id = created_live_id) <> 3 then
    raise exception 'Host and requested attendees must be created atomically';
  end if;
  if (select count(*) from public.live_sessions where season_id = '82000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'Live idempotency must avoid a duplicate live';
  end if;
  if (select count(*) from public.audit_logs where action = 'CREATE_LIVE' and entity_id = created_live_id::text) <> 1 then
    raise exception 'Live creation must write one audit record';
  end if;
end;
$$;

select public.create_live_session(
  '82000000-0000-4000-8000-000000000001',
  'Live de l’autre hôte',
  null,
  null,
  'INSTANT',
  '81000000-0000-4000-8000-000000000003',
  null,
  null,
  '[]'::jsonb,
  '83000000-0000-4000-8000-000000000007'
);

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.create_live_session(
      '82000000-0000-4000-8000-000000000001', 'Hôte joueur', null, null,
      'INSTANT', '81000000-0000-4000-8000-000000000004', null, null,
      '[]'::jsonb, '83000000-0000-4000-8000-000000000002'
    );
  exception when others then rejected := sqlerrm like '%LIVE_HOST_REQUIRED%';
  end;
  if not rejected then raise exception 'Admin must select an active LIVE_HOST'; end if;

  rejected := false;
  begin
    perform public.create_live_session(
      '82000000-0000-4000-8000-000000000001', 'Participant externe', null, null,
      'INSTANT', '81000000-0000-4000-8000-000000000002', null, null,
      '[{"user_id":"81000000-0000-4000-8000-000000000006","live_role":"VIEWER"}]'::jsonb,
      '83000000-0000-4000-8000-000000000003'
    );
  exception when others then rejected := sqlerrm like '%LIVE_PARTICIPANT_INVALID%';
  end;
  if not rejected then raise exception 'Cross-season attendee must be rejected'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000002', true);

create temp table created_instant_live as
select public.create_live_session(
  '82000000-0000-4000-8000-000000000001',
  'Live spontané',
  null,
  null,
  'INSTANT',
  '81000000-0000-4000-8000-000000000002',
  null,
  null,
  '[]'::jsonb,
  '83000000-0000-4000-8000-000000000004'
) payload;

do $$
declare
  rejected boolean := false;
begin
  if (select status from public.live_sessions where id = (select (payload ->> 'id')::uuid from created_instant_live)) <> 'PROPOSED' then
    raise exception 'Instant live must start PROPOSED';
  end if;
  begin
    perform public.create_live_session(
      '82000000-0000-4000-8000-000000000001', 'Hôte changé', null, null,
      'INSTANT', '81000000-0000-4000-8000-000000000003', null, null,
      '[]'::jsonb, '83000000-0000-4000-8000-000000000005'
    );
  exception when others then rejected := sqlerrm like '%LIVE_HOST_ASSIGNMENT_DENIED%';
  end;
  if not rejected then raise exception 'A LIVE_HOST must create only their own live'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000004', true);

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.create_live_session(
      '82000000-0000-4000-8000-000000000001', 'Live joueur', null, null,
      'INSTANT', '81000000-0000-4000-8000-000000000002', null, null,
      '[]'::jsonb, '83000000-0000-4000-8000-000000000006'
    );
  exception when others then rejected := sqlerrm like '%SEASON_ACCESS_DENIED%';
  end;
  if not rejected then raise exception 'A PLAYER cannot create a live'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000002', true);

update public.live_sessions
set title = 'Tentative interdite'
where id = (
  select id from public.live_sessions
  where host_user_id = '81000000-0000-4000-8000-000000000003'
  limit 1
);

do $$
begin
  if exists (
    select 1 from public.live_sessions where title = 'Tentative interdite'
  ) then
    raise exception 'A LIVE_HOST must not edit another host live';
  end if;
end;
$$;

rollback;
