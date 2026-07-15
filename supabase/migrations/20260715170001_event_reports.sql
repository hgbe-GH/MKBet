-- Private event reports, immutable votes and evidence links.

create type public.event_report_status as enum (
  'PENDING', 'CONFIRMED', 'REJECTED'
);

create type public.event_report_type as enum (
  'FRIENDLY_MEETING',
  'AFFECTIONATE_GESTURE',
  'KISS',
  'DIPLOMATIC_INCIDENT',
  'OFFICIAL_RELATIONSHIP'
);

create type public.event_vote_decision as enum ('CONFIRM', 'REJECT');

create table public.event_reports (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  author_user_id uuid not null references public.profiles (id) on delete restrict,
  report_type public.event_report_type not null,
  occurred_at timestamptz not null,
  declared_at timestamptz not null default now(),
  note text not null check (char_length(note) between 1 and 500),
  status public.event_report_status not null default 'PENDING',
  market_id uuid,
  outcome_id uuid,
  idempotency_key uuid not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_user_id, idempotency_key),
  unique (id, season_id),
  constraint event_reports_resolution_pair check (
    (status = 'PENDING' and resolved_at is null)
    or (status <> 'PENDING' and resolved_at is not null)
  ),
  constraint event_reports_market_outcome_pair check (
    (market_id is null and outcome_id is null)
    or (market_id is not null and outcome_id is not null)
  ),
  constraint event_reports_market_season_fk foreign key (market_id, season_id)
    references public.markets (id, season_id) on delete restrict,
  constraint event_reports_outcome_market_fk foreign key (outcome_id, market_id)
    references public.market_outcomes (id, market_id) on delete restrict
);

create table public.event_report_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.event_reports (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  decision public.event_vote_decision not null,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

create table public.event_report_media (
  report_id uuid not null references public.event_reports (id) on delete restrict,
  media_asset_id uuid not null unique references public.media_assets (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (report_id, media_asset_id)
);

create table public.event_market_outcome_rules (
  report_type public.event_report_type not null,
  template_code text not null references public.market_templates (code) on delete restrict,
  outcome_code text not null check (outcome_code ~ '^[A-Z][A-Z0-9_]*$'),
  created_at timestamptz not null default now(),
  primary key (report_type, template_code, outcome_code)
);

create index event_reports_status_declared_idx
  on public.event_reports (status, declared_at desc);
create index event_reports_market_idx
  on public.event_reports (market_id) where market_id is not null;
create index event_report_votes_report_idx
  on public.event_report_votes (report_id, decision);

create trigger event_reports_set_updated_at
before update on public.event_reports
for each row execute function public.set_updated_at();

create trigger event_report_votes_prevent_mutation
before update or delete on public.event_report_votes
for each row execute function public.prevent_immutable_table_mutation();

create or replace function private.prevent_event_report_self_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.event_reports report
    where report.id = new.report_id
      and report.author_user_id = new.user_id
  ) then
    raise exception 'EVENT_SELF_VOTE_FORBIDDEN' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger event_report_votes_prevent_self_vote
before insert on public.event_report_votes
for each row execute function private.prevent_event_report_self_vote();

create or replace function private.event_report_payload(p_report_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'report_id', report.id,
    'status', report.status,
    'report_type', report.report_type,
    'occurred_at', report.occurred_at,
    'declared_at', report.declared_at,
    'note', report.note,
    'market_id', report.market_id,
    'outcome_id', report.outcome_id,
    'confirm_count', (
      select count(*) from public.event_report_votes vote
      where vote.report_id = report.id and vote.decision = 'CONFIRM'
    ),
    'reject_count', (
      select count(*) from public.event_report_votes vote
      where vote.report_id = report.id and vote.decision = 'REJECT'
    ),
    'media_ids', coalesce((
      select jsonb_agg(link.media_asset_id order by link.created_at)
      from public.event_report_media link
      where link.report_id = report.id
    ), '[]'::jsonb)
  )
  from public.event_reports report
  where report.id = p_report_id;
$$;

create or replace function public.submit_event_report(
  p_report_type public.event_report_type,
  p_occurred_at timestamptz,
  p_note text,
  p_market_id uuid,
  p_outcome_id uuid,
  p_media jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  room_id uuid;
  existing_report public.event_reports%rowtype;
  created_report_id uuid;
  market_row public.markets%rowtype;
  selected_template_code text;
  selected_outcome_code text;
  media_item jsonb;
  media_path text;
  media_caption text;
  media_taken_at timestamptz;
  created_media_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  room_id := public.ensure_single_room_access();

  if p_occurred_at is null or p_occurred_at > now() then
    raise exception 'EVENT_OCCURRED_AT_INVALID' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) not between 1 and 500 then
    raise exception 'EVENT_NOTE_INVALID' using errcode = '22023';
  end if;
  if (p_market_id is null) <> (p_outcome_id is null) then
    raise exception 'EVENT_MARKET_OUTCOME_REQUIRED' using errcode = '22023';
  end if;
  if p_idempotency_key is null then
    raise exception 'EVENT_IDEMPOTENCY_REQUIRED' using errcode = '22023';
  end if;
  if p_media is null or jsonb_typeof(p_media) <> 'array'
    or jsonb_array_length(p_media) > 5 then
    raise exception 'EVENT_MEDIA_INVALID' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::text || ':' || p_idempotency_key::text,
      0
    )
  );

  select * into existing_report
  from public.event_reports
  where author_user_id = current_user_id
    and idempotency_key = p_idempotency_key;

  if existing_report.id is not null then
    if existing_report.report_type <> p_report_type
      or existing_report.occurred_at <> p_occurred_at
      or existing_report.note <> btrim(p_note)
      or existing_report.market_id is distinct from p_market_id
      or existing_report.outcome_id is distinct from p_outcome_id then
      raise exception 'EVENT_IDEMPOTENCY_CONFLICT' using errcode = '22023';
    end if;
    return private.event_report_payload(existing_report.id);
  end if;

  if p_market_id is not null then
    select * into market_row
    from public.markets
    where id = p_market_id
    for update;

    if market_row.id is null
      or market_row.season_id <> room_id
      or market_row.status <> 'OPEN' then
      raise exception 'EVENT_MARKET_NOT_OPEN' using errcode = '22023';
    end if;

    select template.code, outcome.code
    into selected_template_code, selected_outcome_code
    from public.market_templates template
    join public.market_outcomes outcome
      on outcome.market_id = market_row.id
    where template.id = market_row.template_id
      and outcome.id = p_outcome_id;

    if selected_template_code is null or not exists (
      select 1
      from public.event_market_outcome_rules rule
      where rule.report_type = p_report_type
        and rule.template_code = selected_template_code
        and rule.outcome_code = selected_outcome_code
    ) then
      raise exception 'EVENT_MARKET_RULE_INVALID' using errcode = '22023';
    end if;
  end if;

  insert into public.event_reports (
    season_id,
    author_user_id,
    report_type,
    occurred_at,
    note,
    market_id,
    outcome_id,
    idempotency_key
  )
  values (
    room_id,
    current_user_id,
    p_report_type,
    p_occurred_at,
    btrim(p_note),
    p_market_id,
    p_outcome_id,
    p_idempotency_key
  )
  returning id into created_report_id;

  for media_item in select value from jsonb_array_elements(p_media) loop
    media_path := media_item ->> 'storage_path';
    media_caption := nullif(btrim(media_item ->> 'caption'), '');
    media_taken_at := nullif(media_item ->> 'taken_at', '')::timestamptz;

    if media_path is null
      or media_path !~ (
        '^' || room_id::text || '/' || current_user_id::text ||
        '/[0-9a-f-]{36}\.webp$'
      )
      or not exists (
        select 1
        from storage.objects object
        where object.bucket_id = 'season-media'
          and object.name = media_path
          and object.owner = current_user_id
      ) then
      raise exception 'EVENT_MEDIA_INVALID' using errcode = '22023';
    end if;

    insert into public.media_assets (
      season_id,
      storage_path,
      media_type,
      caption,
      uploaded_by,
      status,
      taken_at
    )
    values (
      room_id,
      media_path,
      'image/webp',
      media_caption,
      current_user_id,
      'PENDING',
      media_taken_at
    )
    returning id into created_media_id;

    insert into public.event_report_media (report_id, media_asset_id)
    values (created_report_id, created_media_id);
  end loop;

  if p_market_id is not null then
    update public.markets
    set
      status = 'SUSPENDED',
      suspension_reason = 'Événement en cours de validation'
    where id = p_market_id;
  end if;

  perform public.write_audit_log(
    room_id,
    current_user_id,
    'event_report',
    created_report_id::text,
    'SUBMIT_EVENT_REPORT',
    null,
    jsonb_build_object(
      'report_type', p_report_type,
      'status', 'PENDING',
      'market_id', p_market_id,
      'outcome_id', p_outcome_id
    ),
    jsonb_build_object(
      'idempotency_key', p_idempotency_key,
      'media_count', jsonb_array_length(p_media)
    )
  );

  return private.event_report_payload(created_report_id);
end;
$$;

revoke all on function private.prevent_event_report_self_vote()
  from public, anon, authenticated;
revoke all on function private.event_report_payload(uuid)
  from public, anon, authenticated;
