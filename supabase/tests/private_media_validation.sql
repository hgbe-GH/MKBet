\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
)
values
  ('a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'media-admin@example.test', '{}'::jsonb, '{"display_name":"Admin Média"}'::jsonb, now(), now(), false, false),
  ('a1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'media-reporter@example.test', '{}'::jsonb, '{"display_name":"Reporter Média"}'::jsonb, now(), now(), false, false),
  ('a1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'media-player@example.test', '{}'::jsonb, '{"display_name":"Joueur Média"}'::jsonb, now(), now(), false, false);

insert into public.seasons (
  id, title, breakup_date, started_at, status, starting_balance_mkb, created_by
)
values (
  'a2000000-0000-4000-8000-000000000001', 'Saison médias', '2026-07-01',
  '2026-07-12T10:00:00Z', 'ACTIVE', 1000, 'a1000000-0000-4000-8000-000000000001'
);

insert into public.season_members (season_id, user_id, role)
values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'ADMIN'),
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'REPORTER'),
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'PLAYER');

insert into storage.objects (bucket_id, name, owner, metadata)
values (
  'season-media',
  'a2000000-0000-4000-8000-000000000001/a1000000-0000-4000-8000-000000000002/b1000000-0000-4000-8000-000000000001.webp',
  'a1000000-0000-4000-8000-000000000002',
  '{"mimetype":"image/webp","size":12}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);

create temp table media_registration as
select (public.register_media_asset(
  'a2000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000001/a1000000-0000-4000-8000-000000000002/b1000000-0000-4000-8000-000000000001.webp',
  'image/webp',
  'Souvenir privé'
)).id as id;

do $$
declare
  rejected boolean := false;
begin
  begin
    insert into public.media_assets (season_id, storage_path, media_type, uploaded_by)
    values (
      'a2000000-0000-4000-8000-000000000001',
      'a2000000-0000-4000-8000-000000000001/a1000000-0000-4000-8000-000000000002/b1000000-0000-4000-8000-000000000001.webp',
      'image/webp',
      'a1000000-0000-4000-8000-000000000002'
    );
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Direct media metadata insertion must be rejected'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);

do $$
begin
  if (select count(*) from public.media_assets) <> 0 then
    raise exception 'A player must not see PENDING media metadata';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'season-media') <> 0 then
    raise exception 'A player must not read a PENDING Storage blob';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);

do $$
declare
  rejected boolean := false;
begin
  begin
    perform public.moderate_media_asset((select id from media_registration), 'APPROVED');
  exception when others then rejected := sqlerrm like '%MEDIA_MODERATION_FORBIDDEN%';
  end;
  if not rejected then raise exception 'A reporter must not moderate media'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select public.moderate_media_asset((select id from media_registration), 'APPROVED');

do $$
begin
  if (select count(*) from public.audit_logs where action = 'MEDIA_ASSET_UPLOADED') <> 1
    or (select count(*) from public.audit_logs where action = 'MEDIA_ASSET_MODERATED') <> 1 then
    raise exception 'Media creation and moderation must be audited once';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);

do $$
begin
  if (select count(*) from public.media_assets) <> 1 then
    raise exception 'An approved media asset must be visible to a member';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'season-media') <> 1 then
    raise exception 'An approved Storage blob must be visible to a member';
  end if;
end;
$$;

rollback;
