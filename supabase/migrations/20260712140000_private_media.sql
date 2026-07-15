revoke insert, update, delete on table public.media_assets from authenticated;

drop policy if exists season_media_select_member on storage.objects;

create policy season_media_select_visible_media
on storage.objects for select to authenticated
using (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (
    owner = auth.uid()
    or private.has_season_role(
      split_part(name, '/', 1)::uuid,
      array['ADMIN']::public.season_member_role[]
    )
    or exists (
      select 1
      from public.media_assets as asset
      where asset.storage_path = storage.objects.name
        and asset.status = 'APPROVED'
        and private.is_season_member(asset.season_id)
    )
  )
);

create or replace function public.register_media_asset(
  p_season_id uuid,
  p_storage_path text,
  p_media_type text,
  p_caption text default null,
  p_live_id uuid default null,
  p_taken_at timestamptz default null
)
returns public.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_asset public.media_assets;
begin
  if current_user_id is null
    or not private.has_season_role(p_season_id, array['ADMIN', 'LIVE_HOST', 'REPORTER', 'SUBJECT']::public.season_member_role[]) then
    raise exception 'MEDIA_UPLOAD_FORBIDDEN' using errcode = '42501';
  end if;

  if p_storage_path !~ ('^' || p_season_id::text || '/' || current_user_id::text || '/[0-9a-f-]{36}\.webp$')
    or p_media_type <> 'image/webp'
    or not exists (
      select 1 from storage.objects
      where bucket_id = 'season-media' and name = p_storage_path and owner = current_user_id
    ) then
    raise exception 'INVALID_MEDIA_OBJECT' using errcode = '22023';
  end if;

  insert into public.media_assets (season_id, live_id, storage_path, media_type, caption, uploaded_by, status, taken_at)
  values (p_season_id, p_live_id, p_storage_path, p_media_type, nullif(btrim(p_caption), ''), current_user_id, 'PENDING', p_taken_at)
  returning * into created_asset;

  perform public.write_audit_log(p_season_id, current_user_id, 'media_asset', created_asset.id::text, 'MEDIA_ASSET_UPLOADED', null,
    jsonb_build_object('storage_path', p_storage_path, 'status', 'PENDING'), '{}'::jsonb);
  return created_asset;
end;
$$;

create or replace function public.moderate_media_asset(p_media_asset_id uuid, p_status public.media_status)
returns public.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  previous_asset public.media_assets;
  updated_asset public.media_assets;
begin
  select * into previous_asset from public.media_assets where id = p_media_asset_id for update;
  if previous_asset.id is null or current_user_id is null
    or not private.has_season_role(previous_asset.season_id, array['ADMIN']::public.season_member_role[]) then
    raise exception 'MEDIA_MODERATION_FORBIDDEN' using errcode = '42501';
  end if;
  if p_status not in ('APPROVED', 'ARCHIVED', 'REJECTED') then
    raise exception 'INVALID_MEDIA_STATUS' using errcode = '22023';
  end if;
  update public.media_assets set status = p_status where id = p_media_asset_id returning * into updated_asset;
  perform public.write_audit_log(previous_asset.season_id, current_user_id, 'media_asset', p_media_asset_id::text, 'MEDIA_ASSET_MODERATED',
    jsonb_build_object('status', previous_asset.status), jsonb_build_object('status', updated_asset.status), '{}'::jsonb);
  return updated_asset;
end;
$$;

revoke all on function public.register_media_asset(uuid, text, text, text, uuid, timestamptz) from public, anon;
grant execute on function public.register_media_asset(uuid, text, text, text, uuid, timestamptz) to authenticated;
revoke all on function public.moderate_media_asset(uuid, public.media_status) from public, anon;
grant execute on function public.moderate_media_asset(uuid, public.media_status) to authenticated;
