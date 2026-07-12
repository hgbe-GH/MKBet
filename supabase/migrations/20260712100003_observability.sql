create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  transaction_type public.wallet_transaction_type not null,
  amount_mkb integer not null check (amount_mkb <> 0),
  balance_after_mkb integer not null check (balance_after_mkb >= 0),
  bet_id uuid references public.bets (id) on delete restrict,
  settlement_id uuid references public.settlements (id) on delete restrict,
  idempotency_key text not null unique check (btrim(idempotency_key) <> ''),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint wallet_transactions_wallet_fk foreign key (season_id, user_id)
    references public.wallets (season_id, user_id) on delete restrict
);

comment on table public.wallet_transactions is
  'Journal financier fictif immuable. Toute correction crée une nouvelle transaction.';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  season_id uuid not null references public.seasons (id) on delete restrict,
  notification_type text not null check (btrim(notification_type) <> ''),
  title text not null check (btrim(title) <> ''),
  body text not null check (btrim(body) <> ''),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  season_id uuid references public.seasons (id) on delete restrict,
  actor_user_id uuid references public.profiles (id) on delete restrict,
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id text not null check (btrim(entity_id) <> ''),
  action text not null check (btrim(action) <> ''),
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Journal append-only des opérations administratives et transactionnelles importantes.';

create table public.rechute_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  proximity_score integer not null check (proximity_score between 0 and 30),
  physical_score integer not null check (physical_score between 0 and 30),
  regularity_score integer not null check (regularity_score between 0 and 20),
  commitment_score integer not null check (commitment_score between 0 and 20),
  total_score integer not null check (total_score between 0 and 100),
  reason text not null check (btrim(reason) <> ''),
  action_id uuid references public.actions (id) on delete restrict,
  calculated_at timestamptz not null default now(),
  constraint rechute_snapshots_total check (
    total_score = proximity_score + physical_score + regularity_score + commitment_score
  )
);

create or replace function public.write_audit_log(
  p_season_id uuid,
  p_actor_user_id uuid,
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_before_data jsonb,
  p_after_data jsonb,
  p_metadata jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_id bigint;
begin
  insert into public.audit_logs (
    season_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data,
    metadata
  )
  values (
    p_season_id,
    p_actor_user_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_before_data,
    p_after_data,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

revoke all on function public.write_audit_log(
  uuid, uuid, text, text, text, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.write_audit_log(
  uuid, uuid, text, text, text, jsonb, jsonb, jsonb
) to service_role;

create trigger wallet_transactions_prevent_mutation
before update or delete on public.wallet_transactions
for each row execute function public.prevent_immutable_table_mutation();

create trigger audit_logs_prevent_mutation
before update or delete on public.audit_logs
for each row execute function public.prevent_immutable_table_mutation();
