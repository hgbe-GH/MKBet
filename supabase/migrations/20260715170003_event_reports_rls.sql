-- RLS and grants for authenticated single-room reports and private evidence.

alter table public.event_reports enable row level security;
alter table public.event_report_votes enable row level security;
alter table public.event_report_media enable row level security;
alter table public.event_market_outcome_rules enable row level security;

revoke all on table public.event_reports from anon;
revoke all on table public.event_report_votes from anon;
revoke all on table public.event_report_media from anon;
revoke all on table public.event_market_outcome_rules from anon;

revoke insert, update, delete on table public.event_reports from authenticated;
revoke insert, update, delete on table public.event_report_votes from authenticated;
revoke insert, update, delete on table public.event_report_media from authenticated;
revoke insert, update, delete on table public.event_market_outcome_rules from authenticated;

grant select on table public.event_reports to authenticated;
grant select on table public.event_report_votes to authenticated;
grant select on table public.event_report_media to authenticated;
grant select on table public.event_market_outcome_rules to authenticated;

create policy event_reports_select_single_room
on public.event_reports for select to authenticated
using (
  season_id = public.single_room_id()
  and private.is_season_member(season_id)
);

create policy event_report_votes_select_single_room
on public.event_report_votes for select to authenticated
using (
  exists (
    select 1 from public.event_reports report
    where report.id = event_report_votes.report_id
      and report.season_id = public.single_room_id()
      and private.is_season_member(report.season_id)
  )
);

create policy event_report_media_select_single_room
on public.event_report_media for select to authenticated
using (
  exists (
    select 1 from public.event_reports report
    where report.id = event_report_media.report_id
      and report.season_id = public.single_room_id()
      and private.is_season_member(report.season_id)
  )
);

create policy event_market_outcome_rules_select_authenticated
on public.event_market_outcome_rules for select to authenticated
using (true);

drop policy if exists media_assets_select_visible on public.media_assets;
create policy media_assets_select_visible
on public.media_assets for select to authenticated
using (
  uploaded_by = auth.uid()
  or private.has_season_role(
    season_id,
    array['ADMIN', 'LIVE_HOST']::public.season_member_role[]
  )
  or (status = 'APPROVED' and private.is_season_member(season_id))
  or exists (
    select 1
    from public.event_report_media link
    join public.event_reports report on report.id = link.report_id
    where link.media_asset_id = media_assets.id
      and report.status in ('PENDING', 'CONFIRMED')
      and private.is_season_member(report.season_id)
  )
);

drop policy if exists season_media_select_visible_media on storage.objects;
create policy season_media_select_visible_media
on storage.objects for select to authenticated
using (
  bucket_id = 'season-media'
  and (
    exists (
      select 1
      from public.media_assets asset
      where asset.storage_path = storage.objects.name
        and (
          (asset.status = 'APPROVED' and private.is_season_member(asset.season_id))
          or exists (
            select 1
            from public.event_report_media link
            join public.event_reports report on report.id = link.report_id
            where link.media_asset_id = asset.id
              and report.status in ('PENDING', 'CONFIRMED')
              and private.is_season_member(report.season_id)
          )
        )
    )
    or owner = auth.uid()
    or (
      split_part(name, '/', 1) ~
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and private.has_season_role(
        split_part(name, '/', 1)::uuid,
        array['ADMIN']::public.season_member_role[]
      )
    )
  )
);

drop policy if exists season_media_insert_authorized on storage.objects;
create policy season_media_insert_authorized
on storage.objects for insert to authenticated
with check (
  bucket_id = 'season-media'
  and split_part(name, '/', 1) = public.single_room_id()::text
  and split_part(name, '/', 2) = auth.uid()::text
  and private.has_season_role(
    public.single_room_id(),
    array['PLAYER']::public.season_member_role[]
  )
);

drop policy if exists season_media_delete_admin on storage.objects;
create policy season_media_delete_orphan_or_admin
on storage.objects for delete to authenticated
using (
  bucket_id = 'season-media'
  and (
    (
      split_part(name, '/', 1) ~
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and private.has_season_role(
        split_part(name, '/', 1)::uuid,
        array['ADMIN']::public.season_member_role[]
      )
    )
    or (
      owner = auth.uid()
      and not exists (
        select 1 from public.media_assets asset
        where asset.storage_path = storage.objects.name
      )
    )
  )
);

revoke all on function public.submit_event_report(
  public.event_report_type, timestamptz, text, uuid, uuid, jsonb, uuid
) from public, anon;
grant execute on function public.submit_event_report(
  public.event_report_type, timestamptz, text, uuid, uuid, jsonb, uuid
) to authenticated;

revoke all on function public.vote_event_report(
  uuid, public.event_vote_decision
) from public, anon;
grant execute on function public.vote_event_report(
  uuid, public.event_vote_decision
) to authenticated;
