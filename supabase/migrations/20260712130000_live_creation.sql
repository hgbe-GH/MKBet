create table private.live_creation_requests (
  user_id uuid not null references public.profiles (id) on delete restrict,
  idempotency_key uuid not null,
  live_id uuid not null references public.live_sessions (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

create index live_creation_requests_live_id_idx
  on private.live_creation_requests (live_id);

create or replace function private.is_live_host(
  p_live_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from public.live_sessions ls
    where ls.id = p_live_id
      and ls.host_user_id = p_user_id
  );
$$;

create or replace function private.live_payload(p_live_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', ls.id,
    'season_id', ls.season_id,
    'status', ls.status,
    'live_type', ls.live_type
  )
  from public.live_sessions ls
  where ls.id = p_live_id;
$$;

create or replace function public.create_live_session(
  p_season_id uuid,
  p_title text,
  p_description text,
  p_location_label text,
  p_live_type public.live_type,
  p_host_user_id uuid,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_attendees jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  season_row public.seasons%rowtype;
  existing_live_id uuid;
  created_live_id uuid;
  initial_status public.live_status;
begin
  if current_user_id is null then
    perform private.raise_betting_error('AUTH_REQUIRED');
  end if;
  if p_idempotency_key is null then
    perform private.raise_betting_error('IDEMPOTENCY_CONFLICT');
  end if;
  if p_live_type is null then
    perform private.raise_betting_error('LIVE_TYPE_INVALID');
  end if;

  select * into season_row
  from public.seasons
  where id = p_season_id
  for share;
  if season_row.id is null then
    perform private.raise_betting_error('SEASON_NOT_FOUND');
  end if;
  if season_row.status = 'ARCHIVED' then
    perform private.raise_betting_error('SEASON_NOT_ACTIVE');
  end if;

  if not (
    private.has_season_role(
      p_season_id,
      array['ADMIN', 'LIVE_HOST']::public.season_member_role[],
      current_user_id
    )
  ) then
    perform private.raise_betting_error('SEASON_ACCESS_DENIED');
  end if;

  if p_title is null or nullif(btrim(p_title), '') is null
    or length(btrim(p_title)) > 160 then
    perform private.raise_betting_error('LIVE_TITLE_INVALID');
  end if;
  if p_description is not null and length(btrim(p_description)) > 1000 then
    perform private.raise_betting_error('LIVE_DESCRIPTION_INVALID');
  end if;
  if p_location_label is not null and length(btrim(p_location_label)) > 160 then
    perform private.raise_betting_error('LIVE_LOCATION_INVALID');
  end if;

  if p_live_type in ('PROGRAMMED', 'TIME_WINDOW')
    and (p_scheduled_start is null or p_scheduled_end is null) then
    perform private.raise_betting_error('LIVE_SCHEDULE_INVALID');
  end if;
  if (p_scheduled_start is null) <> (p_scheduled_end is null)
    or (
      p_scheduled_start is not null
      and p_scheduled_end is not null
      and p_scheduled_end <= p_scheduled_start
    ) then
    perform private.raise_betting_error('LIVE_SCHEDULE_INVALID');
  end if;

  if not private.has_season_role(
    p_season_id,
    array['LIVE_HOST']::public.season_member_role[],
    p_host_user_id
  ) then
    perform private.raise_betting_error('LIVE_HOST_REQUIRED');
  end if;
  if not private.has_season_role(
    p_season_id,
    array['ADMIN']::public.season_member_role[],
    current_user_id
  ) and p_host_user_id <> current_user_id then
    perform private.raise_betting_error('LIVE_HOST_ASSIGNMENT_DENIED');
  end if;

  if p_attendees is null or jsonb_typeof(p_attendees) <> 'array'
    or jsonb_array_length(p_attendees) > 100
    or exists (
      select 1
      from jsonb_array_elements(p_attendees) attendee(value)
      where jsonb_typeof(attendee.value) <> 'object'
        or not (attendee.value ? 'user_id' and attendee.value ? 'live_role')
        or coalesce(attendee.value ->> 'user_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        or attendee.value ->> 'live_role' not in ('REPORTER', 'VIEWER')
    ) then
    perform private.raise_betting_error('LIVE_PARTICIPANT_INVALID');
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_attendees) attendee(value)
    group by attendee.value ->> 'user_id'
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_array_elements(p_attendees) attendee(value)
    where (attendee.value ->> 'user_id')::uuid = p_host_user_id
  ) or exists (
    select 1
    from jsonb_array_elements(p_attendees) attendee(value)
    where not exists (
      select 1
      from public.season_members sm
      where sm.season_id = p_season_id
        and sm.user_id = (attendee.value ->> 'user_id')::uuid
        and sm.is_active
    )
  ) then
    perform private.raise_betting_error('LIVE_PARTICIPANT_INVALID');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || p_idempotency_key::text, 0)
  );
  select live_id into existing_live_id
  from private.live_creation_requests
  where user_id = current_user_id and idempotency_key = p_idempotency_key;
  if existing_live_id is not null then
    return private.live_payload(existing_live_id);
  end if;

  initial_status := case
    when p_live_type in ('PROGRAMMED', 'TIME_WINDOW') then 'SCHEDULED'::public.live_status
    else 'PROPOSED'::public.live_status
  end;

  insert into public.live_sessions (
    season_id,
    title,
    description,
    live_type,
    status,
    location_label,
    scheduled_start,
    scheduled_end,
    created_by,
    host_user_id
  ) values (
    p_season_id,
    btrim(p_title),
    nullif(btrim(p_description), ''),
    p_live_type,
    initial_status,
    nullif(btrim(p_location_label), ''),
    p_scheduled_start,
    p_scheduled_end,
    current_user_id,
    p_host_user_id
  ) returning id into created_live_id;

  insert into public.live_attendees (live_id, user_id, attendance_status, live_role)
  values (created_live_id, p_host_user_id, 'EXPECTED', 'HOST');

  insert into public.live_attendees (live_id, user_id, attendance_status, live_role)
  select
    created_live_id,
    (attendee.value ->> 'user_id')::uuid,
    'EXPECTED'::public.attendance_status,
    (attendee.value ->> 'live_role')::public.live_member_role
  from jsonb_array_elements(p_attendees) attendee(value);

  insert into private.live_creation_requests (user_id, idempotency_key, live_id)
  values (current_user_id, p_idempotency_key, created_live_id);

  perform public.write_audit_log(
    p_season_id,
    current_user_id,
    'live_session',
    created_live_id::text,
    'CREATE_LIVE',
    null,
    jsonb_build_object(
      'status', initial_status,
      'live_type', p_live_type,
      'host_user_id', p_host_user_id,
      'attendee_count', jsonb_array_length(p_attendees)
    ),
    jsonb_build_object('idempotency_key', p_idempotency_key)
  );

  return private.live_payload(created_live_id);
end;
$$;

revoke all on function private.live_payload(uuid) from public, anon, authenticated;
revoke all on function private.is_live_host(uuid, uuid) from public, anon;
grant execute on function private.is_live_host(uuid, uuid) to authenticated;

revoke all on function public.create_live_session(
  uuid, text, text, text, public.live_type, uuid, timestamptz, timestamptz, jsonb, uuid
) from public, anon;
grant execute on function public.create_live_session(
  uuid, text, text, text, public.live_type, uuid, timestamptz, timestamptz, jsonb, uuid
) to authenticated;
