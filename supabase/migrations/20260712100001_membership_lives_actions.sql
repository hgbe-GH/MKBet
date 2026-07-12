create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  description text,
  breakup_date date not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  status public.season_status not null default 'DRAFT',
  starting_balance_mkb integer not null default 1000
    check (starting_balance_mkb >= 0),
  secret_bets_until_close boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_valid_dates check (
    ended_at is null or ended_at > started_at
  )
);

create table public.season_members (
  season_id uuid not null references public.seasons (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role public.season_member_role not null,
  subject_key public.subject_key,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (season_id, user_id, role),
  constraint season_members_subject_role check (
    (role = 'SUBJECT' and subject_key is not null)
    or (role <> 'SUBJECT' and subject_key is null)
  )
);

create table public.season_invitations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  token_hash text not null unique check (btrim(token_hash) <> ''),
  email text,
  proposed_role public.season_member_role not null,
  proposed_subject_key public.subject_key,
  status public.invitation_status not null default 'PENDING',
  max_uses integer not null default 1 check (max_uses >= 1),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  accepted_by uuid references public.profiles (id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint season_invitations_use_limit check (use_count <= max_uses),
  constraint season_invitations_subject_role check (
    (proposed_role = 'SUBJECT' and proposed_subject_key is not null)
    or (proposed_role <> 'SUBJECT' and proposed_subject_key is null)
  ),
  constraint season_invitations_acceptance_pair check (
    (accepted_by is null and accepted_at is null)
    or (accepted_by is not null and accepted_at is not null)
  )
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  description text,
  live_type public.live_type not null,
  status public.live_status not null default 'PROPOSED',
  location_label text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  pre_match_betting_closes_at timestamptz,
  context_physical_multiplier numeric(8, 4) not null default 1
    check (context_physical_multiplier > 0),
  context_sentimental_multiplier numeric(8, 4) not null default 1
    check (context_sentimental_multiplier > 0),
  created_by uuid not null references public.profiles (id) on delete restrict,
  host_user_id uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, season_id),
  constraint live_sessions_scheduled_dates check (
    scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start
  ),
  constraint live_sessions_actual_dates check (
    actual_end is null or actual_start is null or actual_end >= actual_start
  )
);

create table public.live_attendees (
  live_id uuid not null references public.live_sessions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  attendance_status public.attendance_status not null default 'UNKNOWN',
  live_role public.live_member_role not null default 'VIEWER',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  primary key (live_id, user_id),
  constraint live_attendees_valid_times check (
    checked_out_at is null or checked_in_at is null or checked_out_at >= checked_in_at
  )
);

create table public.action_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]*$'),
  public_label text not null check (btrim(public_label) <> ''),
  trash_label text not null check (btrim(trash_label) <> ''),
  category public.market_category not null,
  privacy_level public.privacy_level not null,
  confirmation_policy public.confirmation_policy not null,
  deduplication_window_minutes integer not null default 5
    check (deduplication_window_minutes between 0 and 120),
  rechute_proximity_delta integer not null default 0
    check (rechute_proximity_delta between -100 and 100),
  rechute_physical_delta integer not null default 0
    check (rechute_physical_delta between -100 and 100),
  rechute_regularity_delta integer not null default 0
    check (rechute_regularity_delta between -100 and 100),
  rechute_commitment_delta integer not null default 0
    check (rechute_commitment_delta between -100 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.action_type_confirmation_rules (
  id uuid primary key default gen_random_uuid(),
  action_type_id uuid not null references public.action_types (id) on delete restrict,
  policy public.confirmation_policy not null,
  priority integer not null default 100 check (priority >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (action_type_id, policy)
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  live_id uuid,
  action_type_id uuid not null references public.action_types (id) on delete restrict,
  occurred_at timestamptz not null,
  declared_at timestamptz not null default now(),
  official_occurred_at timestamptz,
  declared_by uuid not null references public.profiles (id) on delete restrict,
  status public.action_status not null default 'DECLARED',
  certainty public.action_certainty not null,
  public_description text,
  private_note text,
  classified boolean not null default false,
  supersedes_action_id uuid references public.actions (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, season_id),
  constraint actions_live_season_fk foreign key (live_id, season_id)
    references public.live_sessions (id, season_id) on delete restrict,
  constraint actions_not_self_superseding check (supersedes_action_id is distinct from id)
);

comment on column public.actions.occurred_at is
  'Heure réelle déclarée de l action, distincte de son heure de saisie.';
comment on column public.actions.declared_at is
  'Heure à laquelle la déclaration a été enregistrée dans MK Bet.';
comment on column public.actions.official_occurred_at is
  'Heure officielle retenue après confirmation ou correction, sans écraser occurred_at.';

create table public.action_reports (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions (id) on delete restrict,
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  source_type public.action_certainty not null,
  certainty public.action_certainty not null,
  comment text,
  reported_at timestamptz not null default now(),
  unique (action_id, reporter_id)
);

create table public.action_confirmations (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  subject_key public.subject_key,
  decision public.confirmation_decision not null,
  corrected_occurred_at timestamptz,
  comment text,
  created_at timestamptz not null default now(),
  unique (action_id, user_id),
  constraint action_confirmations_corrected_time check (
    (decision = 'CORRECT_TIME' and corrected_occurred_at is not null)
    or (decision <> 'CORRECT_TIME' and corrected_occurred_at is null)
  )
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  live_id uuid,
  action_id uuid,
  storage_path text not null unique check (btrim(storage_path) <> ''),
  media_type text not null check (btrim(media_type) <> ''),
  caption text,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  status public.media_status not null default 'PENDING',
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  constraint media_assets_live_season_fk foreign key (live_id, season_id)
    references public.live_sessions (id, season_id) on delete restrict,
  constraint media_assets_action_season_fk foreign key (action_id, season_id)
    references public.actions (id, season_id) on delete restrict
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger seasons_set_updated_at
before update on public.seasons
for each row execute function public.set_updated_at();

create trigger live_sessions_set_updated_at
before update on public.live_sessions
for each row execute function public.set_updated_at();

create trigger action_types_set_updated_at
before update on public.action_types
for each row execute function public.set_updated_at();

create trigger actions_set_updated_at
before update on public.actions
for each row execute function public.set_updated_at();
