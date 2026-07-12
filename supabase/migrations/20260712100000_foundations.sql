create extension if not exists pgcrypto;

create type public.season_status as enum (
  'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'
);

create type public.season_member_role as enum (
  'ADMIN', 'LIVE_HOST', 'REPORTER', 'PLAYER', 'SUBJECT'
);

create type public.subject_key as enum ('MARGOT', 'KEVIN');

create type public.invitation_status as enum (
  'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'
);

create type public.live_status as enum (
  'PROPOSED', 'SCHEDULED', 'BETTING_OPEN', 'ARMED', 'LIVE', 'SUSPENDED',
  'ENDED', 'VERIFYING', 'SETTLED', 'ARCHIVED', 'CANCELLED'
);

create type public.live_type as enum ('PROGRAMMED', 'INSTANT', 'TIME_WINDOW');

create type public.attendance_status as enum (
  'EXPECTED', 'PRESENT', 'ABSENT', 'LEFT', 'UNKNOWN'
);

create type public.live_member_role as enum ('HOST', 'REPORTER', 'VIEWER');

create type public.action_status as enum (
  'DECLARED', 'PENDING_CONFIRMATION', 'CORROBORATED', 'CONFIRMED',
  'CONTESTED', 'REJECTED', 'CLASSIFIED', 'CORRECTED'
);

create type public.action_certainty as enum (
  'RUMOR', 'PROBABLE', 'DIRECT_WITNESS', 'DIRECT_INFORMATION',
  'CONFIRMED_BY_MARGOT', 'CONFIRMED_BY_KEVIN', 'CONFIRMED_BY_BOTH'
);

create type public.confirmation_policy as enum (
  'ONE_REPORTER', 'TWO_REPORTERS', 'HOST_CONFIRMATION', 'ONE_SUBJECT',
  'BOTH_SUBJECTS', 'ADMIN_DECISION'
);

create type public.privacy_level as enum (
  'PUBLIC', 'MEMBERS_ONLY', 'SUBJECTS_AND_ADMINS', 'CLASSIFIED'
);

create type public.confirmation_decision as enum (
  'CONFIRM', 'REJECT', 'CORRECT_TIME', 'CLASSIFY', 'NO_COMMENT'
);

create type public.media_status as enum (
  'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'
);

create type public.market_type as enum (
  'BINARY', 'MULTI_OUTCOME', 'DATE_RANGE', 'EXACT_DATE', 'NEXT_ACTION',
  'OVER_UNDER', 'ACCUMULATOR'
);

create type public.market_category as enum (
  'CONTACT', 'PHYSICAL', 'SEXUAL', 'RELATIONSHIP', 'STATUS', 'CONFLICT',
  'LONG_TERM', 'LIVE_SPECIAL'
);

create type public.market_status as enum (
  'DRAFT', 'OPEN', 'SUSPENDED', 'CLOSED', 'PENDING_RESULT',
  'RESULT_DETERMINED', 'SETTLED', 'VOID', 'REFUNDED'
);

create type public.outcome_result_status as enum (
  'PENDING', 'WINNER', 'LOSER', 'VOID'
);

create type public.bet_type as enum ('SINGLE', 'ACCUMULATOR');

create type public.bet_status as enum (
  'PENDING', 'OPEN', 'WON', 'LOST', 'VOID', 'REFUNDED', 'PARTIALLY_SETTLED'
);

create type public.bet_leg_status as enum ('OPEN', 'WON', 'LOST', 'VOID');

create type public.settlement_type as enum (
  'STANDARD', 'MANUAL', 'VOID', 'REFUND', 'PARTIAL', 'CORRECTION'
);

create type public.wallet_transaction_type as enum (
  'INITIAL_CREDIT', 'BET_STAKE', 'BET_WIN', 'BET_REFUND', 'ADMIN_CREDIT',
  'ADMIN_DEBIT', 'SURVIVAL_BONUS', 'CORRECTION'
);

create type public.market_effect_type as enum (
  'Q_SHIFT', 'SPEED_MULTIPLIER', 'SUSPEND', 'CLOSE', 'SETTLE',
  'OPEN_RELATED', 'REPRICE'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_immutable_table_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception '% is append-only; % is not allowed', tg_table_name, tg_op
    using errcode = '55000';
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_immutable_table_mutation() from public, anon, authenticated;
