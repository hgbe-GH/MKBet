create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists private.season_creation_requests (
  idempotency_key uuid not null,
  user_id uuid not null,
  season_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (idempotency_key, user_id)
);

create or replace function private.profile_display_name(
  p_email text,
  p_metadata jsonb
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(p_metadata->>'display_name'), ''),
    nullif(regexp_replace(split_part(coalesce(p_email, ''), '@', 1), '[^[:alnum:]_. -]+', '', 'g'), ''),
    'Nouveau joueur'
  );
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    private.profile_display_name(new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_create_on_auth_user on auth.users;
create trigger profiles_create_on_auth_user
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function public.ensure_current_profile()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  current_metadata jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select email, raw_user_meta_data
  into current_email, current_metadata
  from auth.users
  where id = current_user_id;

  insert into public.profiles (id, display_name)
  values (
    current_user_id,
    private.profile_display_name(current_email, coalesce(current_metadata, '{}'::jsonb))
  )
  on conflict (id) do nothing;

  return current_user_id;
end;
$$;

create or replace function private.is_season_member(
  p_season_id uuid,
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
    from public.season_members sm
    where sm.season_id = p_season_id
      and sm.user_id = p_user_id
      and sm.is_active
  );
$$;

create or replace function private.has_season_role(
  p_season_id uuid,
  p_roles public.season_member_role[],
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
    from public.season_members sm
    where sm.season_id = p_season_id
      and sm.user_id = p_user_id
      and sm.role = any(p_roles)
      and sm.is_active
  );
$$;

create or replace function private.is_season_subject(
  p_season_id uuid,
  p_subject_key public.subject_key,
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
    from public.season_members sm
    where sm.season_id = p_season_id
      and sm.user_id = p_user_id
      and sm.role = 'SUBJECT'
      and sm.subject_key = p_subject_key
      and sm.is_active
  );
$$;

create or replace function private.shares_active_season(
  p_profile_id uuid,
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
    from public.season_members mine
    join public.season_members theirs
      on theirs.season_id = mine.season_id
    where mine.user_id = p_user_id
      and mine.is_active
      and theirs.user_id = p_profile_id
      and theirs.is_active
  );
$$;

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
      and (
        ls.host_user_id = p_user_id
        or private.has_season_role(
          ls.season_id,
          array['ADMIN', 'LIVE_HOST']::public.season_member_role[],
          p_user_id
        )
      )
  );
$$;

create or replace function private.owns_bet(
  p_bet_id uuid,
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
    from public.bets b
    where b.id = p_bet_id
      and b.user_id = p_user_id
  );
$$;

create or replace function private.mask_email(p_email text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select case
    when p_email is null then null
    when position('@' in p_email) <= 1 then '***'
    else left(p_email, 1) || '***@' || split_part(p_email, '@', 2)
  end;
$$;

create or replace function public.create_season(
  p_title text,
  p_description text,
  p_breakup_date date,
  p_started_at timestamptz,
  p_starting_balance_mkb integer,
  p_secret_bets_until_close boolean,
  p_idempotency_key uuid
)
returns table(season_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_season_id uuid;
  existing_season_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'Season title is required' using errcode = '22023';
  end if;
  if p_starting_balance_mkb < 0 then
    raise exception 'Initial balance cannot be negative' using errcode = '22023';
  end if;

  perform public.ensure_current_profile();

  select scr.season_id into existing_season_id
  from private.season_creation_requests scr
  where scr.idempotency_key = p_idempotency_key
    and scr.user_id = current_user_id;

  if existing_season_id is not null then
    season_id := existing_season_id;
    return next;
    return;
  end if;

  insert into public.seasons (
    title,
    description,
    breakup_date,
    started_at,
    starting_balance_mkb,
    secret_bets_until_close,
    created_by
  )
  values (
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_breakup_date,
    p_started_at,
    p_starting_balance_mkb,
    coalesce(p_secret_bets_until_close, false),
    current_user_id
  )
  returning id into created_season_id;

  insert into public.season_members (season_id, user_id, role)
  values
    (created_season_id, current_user_id, 'ADMIN'),
    (created_season_id, current_user_id, 'PLAYER')
  on conflict do nothing;

  insert into public.wallets (season_id, user_id, balance_mkb)
  values (created_season_id, current_user_id, p_starting_balance_mkb)
  on conflict do nothing;

  if p_starting_balance_mkb > 0 then
    insert into public.wallet_transactions (
      season_id,
      user_id,
      transaction_type,
      amount_mkb,
      balance_after_mkb,
      idempotency_key,
      metadata
    )
    values (
      created_season_id,
      current_user_id,
      'INITIAL_CREDIT',
      p_starting_balance_mkb,
      p_starting_balance_mkb,
      'season-initial:' || created_season_id::text || ':' || current_user_id::text,
      jsonb_build_object('source', 'create_season')
    )
    on conflict (idempotency_key) do nothing;
  end if;

  insert into private.season_creation_requests (idempotency_key, user_id, season_id)
  values (p_idempotency_key, current_user_id, created_season_id);

  perform public.write_audit_log(
    created_season_id,
    current_user_id,
    'season',
    created_season_id::text,
    'CREATE_SEASON',
    null,
    jsonb_build_object('title', btrim(p_title)),
    '{}'::jsonb
  );

  season_id := created_season_id;
  return next;
end;
$$;

create or replace function public.create_season_invitation(
  p_season_id uuid,
  p_proposed_role public.season_member_role,
  p_proposed_subject_key public.subject_key,
  p_email text,
  p_expires_at timestamptz,
  p_max_uses integer default 1
)
returns table(invitation_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  raw_token text;
  created_invitation_id uuid;
begin
  if not private.has_season_role(p_season_id, array['ADMIN']::public.season_member_role[], current_user_id) then
    raise exception 'Season admin role required' using errcode = '42501';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '90 days' then
    raise exception 'Invalid invitation expiry' using errcode = '22023';
  end if;
  if p_max_uses < 1 or p_max_uses > 25 then
    raise exception 'Invalid invitation use count' using errcode = '22023';
  end if;
  if (p_proposed_role = 'SUBJECT') <> (p_proposed_subject_key is not null) then
    raise exception 'Invalid invitation subject role' using errcode = '22023';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.season_invitations (
    season_id,
    token_hash,
    email,
    proposed_role,
    proposed_subject_key,
    expires_at,
    max_uses,
    created_by
  )
  values (
    p_season_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    nullif(lower(btrim(coalesce(p_email, ''))), ''),
    p_proposed_role,
    p_proposed_subject_key,
    p_expires_at,
    p_max_uses,
    current_user_id
  )
  returning id into created_invitation_id;

  perform public.write_audit_log(
    p_season_id,
    current_user_id,
    'season_invitation',
    created_invitation_id::text,
    'CREATE_INVITATION',
    null,
    jsonb_build_object('role', p_proposed_role, 'subject_key', p_proposed_subject_key),
    '{}'::jsonb
  );

  invitation_id := created_invitation_id;
  token := raw_token;
  return next;
end;
$$;

create or replace function public.get_invitation_preview(p_token text)
returns table(
  "isValid" boolean,
  "seasonTitle" text,
  "proposedRole" public.season_member_role,
  "proposedSubjectKey" public.subject_key,
  "expiresAt" timestamptz,
  "maskedEmail" text,
  reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
begin
  select si.*, s.title as season_title
  into invitation
  from public.season_invitations si
  join public.seasons s on s.id = si.season_id
  where si.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if invitation.id is null then
    "isValid" := false; reason := 'INVITATION_INVALID'; return next; return;
  end if;
  if invitation.status = 'REVOKED' then
    "isValid" := false; reason := 'INVITATION_INVALID'; return next; return;
  end if;
  if invitation.expires_at <= now() or invitation.status = 'EXPIRED' then
    "isValid" := false; reason := 'INVITATION_EXPIRED'; return next; return;
  end if;
  if invitation.use_count >= invitation.max_uses or invitation.status = 'ACCEPTED' then
    "isValid" := false; reason := 'INVITATION_ALREADY_USED'; return next; return;
  end if;

  "isValid" := true;
  "seasonTitle" := invitation.season_title;
  "proposedRole" := invitation.proposed_role;
  "proposedSubjectKey" := invitation.proposed_subject_key;
  "expiresAt" := invitation.expires_at;
  "maskedEmail" := private.mask_email(invitation.email);
  reason := null;
  return next;
end;
$$;

create or replace function public.accept_season_invitation(p_token text)
returns table(season_id uuid, roles public.season_member_role[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  invitation record;
  was_member boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform public.ensure_current_profile();
  select email into current_email from auth.users where id = current_user_id;

  select *
  into invitation
  from public.season_invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if invitation.id is null or invitation.status = 'REVOKED' then
    raise exception 'Invalid invitation' using errcode = '22023';
  end if;
  if invitation.expires_at <= now() or invitation.status = 'EXPIRED' then
    update public.season_invitations set status = 'EXPIRED' where id = invitation.id;
    raise exception 'Expired invitation' using errcode = '22023';
  end if;
  if invitation.use_count >= invitation.max_uses or invitation.status = 'ACCEPTED' then
    raise exception 'Invitation already used' using errcode = '22023';
  end if;
  if invitation.email is not null and lower(invitation.email) <> lower(coalesce(current_email, '')) then
    raise exception 'Invitation email mismatch' using errcode = '42501';
  end if;
  if invitation.proposed_role = 'SUBJECT' and exists (
    select 1
    from public.season_members sm
    where sm.season_id = invitation.season_id
      and sm.user_id = current_user_id
      and sm.role = 'SUBJECT'
      and sm.subject_key is distinct from invitation.proposed_subject_key
      and sm.is_active
  ) then
    raise exception 'A subject cannot hold both subject keys' using errcode = '23514';
  end if;

  select exists (
    select 1 from public.season_members sm
    where sm.season_id = invitation.season_id
      and sm.user_id = current_user_id
      and sm.is_active
  ) into was_member;

  insert into public.season_members (
    season_id,
    user_id,
    role,
    subject_key
  )
  values (
    invitation.season_id,
    current_user_id,
    invitation.proposed_role,
    invitation.proposed_subject_key
  )
  on conflict do nothing;

  insert into public.wallets (season_id, user_id, balance_mkb)
  select invitation.season_id, current_user_id, s.starting_balance_mkb
  from public.seasons s
  where s.id = invitation.season_id
  on conflict do nothing;

  if not was_member then
    insert into public.wallet_transactions (
      season_id,
      user_id,
      transaction_type,
      amount_mkb,
      balance_after_mkb,
      idempotency_key,
      metadata
    )
    select
      s.id,
      current_user_id,
      'INITIAL_CREDIT',
      s.starting_balance_mkb,
      s.starting_balance_mkb,
      'invitation-initial:' || s.id::text || ':' || current_user_id::text,
      jsonb_build_object('source', 'accept_season_invitation')
    from public.seasons s
    where s.id = invitation.season_id
      and s.starting_balance_mkb > 0
    on conflict (idempotency_key) do nothing;
  end if;

  update public.season_invitations
  set
    use_count = use_count + 1,
    status = case when use_count + 1 >= max_uses then 'ACCEPTED' else status end,
    accepted_by = current_user_id,
    accepted_at = now()
  where id = invitation.id;

  perform public.write_audit_log(
    invitation.season_id,
    current_user_id,
    'season_invitation',
    invitation.id::text,
    'ACCEPT_INVITATION',
    null,
    jsonb_build_object('role', invitation.proposed_role),
    '{}'::jsonb
  );

  season_id := invitation.season_id;
  select array_agg(sm.role order by sm.role)
  into roles
  from public.season_members sm
  where sm.season_id = invitation.season_id
    and sm.user_id = current_user_id
    and sm.is_active;
  return next;
end;
$$;

create or replace function public.revoke_season_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  invitation_season_id uuid;
begin
  select season_id into invitation_season_id
  from public.season_invitations
  where id = p_invitation_id;

  if not private.has_season_role(invitation_season_id, array['ADMIN']::public.season_member_role[], current_user_id) then
    raise exception 'Season admin role required' using errcode = '42501';
  end if;

  update public.season_invitations
  set status = 'REVOKED'
  where id = p_invitation_id
    and status = 'PENDING';
end;
$$;

create or replace function public.list_season_invitations(p_season_id uuid)
returns table(
  id uuid,
  proposed_role public.season_member_role,
  proposed_subject_key public.subject_key,
  status public.invitation_status,
  max_uses integer,
  use_count integer,
  expires_at timestamptz,
  masked_email text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    si.id,
    si.proposed_role,
    si.proposed_subject_key,
    si.status,
    si.max_uses,
    si.use_count,
    si.expires_at,
    private.mask_email(si.email),
    si.created_at
  from public.season_invitations si
  where si.season_id = p_season_id
    and private.has_season_role(p_season_id, array['ADMIN']::public.season_member_role[])
  order by si.created_at desc;
$$;

create or replace function private.active_admin_count(p_season_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.season_members sm
  where sm.season_id = p_season_id
    and sm.role = 'ADMIN'
    and sm.is_active;
$$;

create or replace function public.set_season_member_active(
  p_season_id uuid,
  p_user_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_season_role(p_season_id, array['ADMIN']::public.season_member_role[]) then
    raise exception 'Season admin role required' using errcode = '42501';
  end if;
  if not p_is_active and exists (
    select 1 from public.season_members sm
    where sm.season_id = p_season_id
      and sm.user_id = p_user_id
      and sm.role = 'ADMIN'
      and sm.is_active
  ) and private.active_admin_count(p_season_id) <= 1 then
    raise exception 'Cannot deactivate last active admin' using errcode = '23514';
  end if;

  update public.season_members
  set is_active = p_is_active
  where season_id = p_season_id
    and user_id = p_user_id;
end;
$$;

create or replace function public.grant_season_member_role(
  p_season_id uuid,
  p_user_id uuid,
  p_role public.season_member_role,
  p_subject_key public.subject_key default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_season_role(p_season_id, array['ADMIN']::public.season_member_role[]) then
    raise exception 'Season admin role required' using errcode = '42501';
  end if;
  if (p_role = 'SUBJECT') <> (p_subject_key is not null) then
    raise exception 'Invalid subject role' using errcode = '22023';
  end if;
  if p_role = 'SUBJECT' and exists (
    select 1 from public.season_members sm
    where sm.season_id = p_season_id
      and sm.user_id = p_user_id
      and sm.role = 'SUBJECT'
      and sm.subject_key is distinct from p_subject_key
      and sm.is_active
  ) then
    raise exception 'A subject cannot hold both subject keys' using errcode = '23514';
  end if;

  insert into public.season_members (season_id, user_id, role, subject_key)
  values (p_season_id, p_user_id, p_role, p_subject_key)
  on conflict (season_id, user_id, role) do update set
    subject_key = excluded.subject_key,
    is_active = true;
end;
$$;

create or replace function public.revoke_season_member_role(
  p_season_id uuid,
  p_user_id uuid,
  p_role public.season_member_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_season_role(p_season_id, array['ADMIN']::public.season_member_role[]) then
    raise exception 'Season admin role required' using errcode = '42501';
  end if;
  if p_role = 'ADMIN' and exists (
    select 1 from public.season_members sm
    where sm.season_id = p_season_id
      and sm.user_id = p_user_id
      and sm.role = 'ADMIN'
      and sm.is_active
  ) and private.active_admin_count(p_season_id) <= 1 then
    raise exception 'Cannot revoke last active admin' using errcode = '23514';
  end if;

  update public.season_members
  set is_active = false
  where season_id = p_season_id
    and user_id = p_user_id
    and role = p_role;
end;
$$;

create or replace function public.list_my_seasons()
returns table(
  id uuid,
  title text,
  status text,
  "roles" public.season_member_role[],
  "balanceMkb" integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.title,
    s.status::text,
    array_agg(sm.role order by sm.role) as "roles",
    w.balance_mkb as "balanceMkb"
  from public.seasons s
  join public.season_members sm on sm.season_id = s.id
  left join public.wallets w on w.season_id = s.id and w.user_id = auth.uid()
  where sm.user_id = auth.uid()
    and sm.is_active
  group by s.id, s.title, s.status, w.balance_mkb
  order by s.started_at desc;
$$;

create or replace function public.get_dashboard_season(p_season_id uuid default null)
returns table(
  id uuid,
  title text,
  "breakupDate" date,
  "roles" public.season_member_role[],
  "balanceMkb" integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with selected as (
    select coalesce(
      p_season_id,
      (
        select sm.season_id
        from public.season_members sm
        join public.seasons s on s.id = sm.season_id
        where sm.user_id = auth.uid() and sm.is_active
        order by s.started_at desc
        limit 1
      )
    ) as season_id
  )
  select
    s.id,
    s.title,
    s.breakup_date as "breakupDate",
    array_agg(sm.role order by sm.role) as "roles",
    w.balance_mkb as "balanceMkb"
  from selected
  join public.seasons s on s.id = selected.season_id
  join public.season_members sm on sm.season_id = s.id and sm.user_id = auth.uid()
  left join public.wallets w on w.season_id = s.id and w.user_id = auth.uid()
  where private.is_season_member(s.id)
  group by s.id, s.title, s.breakup_date, w.balance_mkb;
$$;

revoke all on function private.profile_display_name(text, jsonb) from public, anon, authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.mask_email(text) from public, anon, authenticated;
revoke all on function private.active_admin_count(uuid) from public, anon, authenticated;
revoke all on function private.is_season_member(uuid, uuid) from public, anon;
revoke all on function private.has_season_role(uuid, public.season_member_role[], uuid) from public, anon;
revoke all on function private.is_season_subject(uuid, public.subject_key, uuid) from public, anon;
revoke all on function private.shares_active_season(uuid, uuid) from public, anon;
revoke all on function private.is_live_host(uuid, uuid) from public, anon;
revoke all on function private.owns_bet(uuid, uuid) from public, anon;

grant execute on function private.is_season_member(uuid, uuid) to authenticated;
grant execute on function private.has_season_role(uuid, public.season_member_role[], uuid) to authenticated;
grant execute on function private.is_season_subject(uuid, public.subject_key, uuid) to authenticated;
grant execute on function private.shares_active_season(uuid, uuid) to authenticated;
grant execute on function private.is_live_host(uuid, uuid) to authenticated;
grant execute on function private.owns_bet(uuid, uuid) to authenticated;

grant execute on function public.ensure_current_profile() to authenticated;
grant execute on function public.create_season(text, text, date, timestamptz, integer, boolean, uuid) to authenticated;
grant execute on function public.create_season_invitation(uuid, public.season_member_role, public.subject_key, text, timestamptz, integer) to authenticated;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;
grant execute on function public.accept_season_invitation(text) to authenticated;
grant execute on function public.revoke_season_invitation(uuid) to authenticated;
grant execute on function public.list_season_invitations(uuid) to authenticated;
grant execute on function public.set_season_member_active(uuid, uuid, boolean) to authenticated;
grant execute on function public.grant_season_member_role(uuid, uuid, public.season_member_role, public.subject_key) to authenticated;
grant execute on function public.revoke_season_member_role(uuid, uuid, public.season_member_role) to authenticated;
grant execute on function public.list_my_seasons() to authenticated;
grant execute on function public.get_dashboard_season(uuid) to authenticated;
