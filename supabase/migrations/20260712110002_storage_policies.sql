insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'season-media',
  'season-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy season_media_select_member
on storage.objects for select to authenticated
using (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.is_season_member(split_part(name, '/', 1)::uuid)
);

create policy season_media_insert_authorized
on storage.objects for insert to authenticated
with check (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and split_part(name, '/', 2) = auth.uid()::text
  and private.has_season_role(
    split_part(name, '/', 1)::uuid,
    array['ADMIN', 'LIVE_HOST', 'REPORTER', 'SUBJECT']::public.season_member_role[]
  )
);

create policy season_media_update_author_or_admin
on storage.objects for update to authenticated
using (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or private.has_season_role(
      split_part(name, '/', 1)::uuid,
      array['ADMIN']::public.season_member_role[]
    )
  )
)
with check (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (
    split_part(name, '/', 2) = auth.uid()::text
    or private.has_season_role(
      split_part(name, '/', 1)::uuid,
      array['ADMIN']::public.season_member_role[]
    )
  )
);

create policy season_media_delete_admin
on storage.objects for delete to authenticated
using (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.has_season_role(
    split_part(name, '/', 1)::uuid,
    array['ADMIN']::public.season_member_role[]
  )
);
