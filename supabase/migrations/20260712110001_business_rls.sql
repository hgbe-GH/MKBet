grant usage on schema public to anon, authenticated;

grant select on public.action_types to authenticated;
grant select on public.action_type_confirmation_rules to authenticated;
grant select on public.market_templates to authenticated;
grant select on public.market_action_rules to authenticated;

grant select on public.profiles, public.seasons, public.season_members,
  public.live_sessions, public.live_attendees, public.actions,
  public.action_reports, public.action_confirmations, public.media_assets,
  public.markets, public.market_outcomes, public.odds_snapshots,
  public.wallets, public.wallet_transactions, public.bets, public.bet_legs,
  public.settlements, public.notifications, public.audit_logs,
  public.rechute_snapshots to authenticated;

grant update (display_name, avatar_url) on public.profiles to authenticated;
grant update on public.seasons, public.season_members, public.live_sessions,
  public.live_attendees, public.media_assets, public.markets to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert on public.live_sessions, public.live_attendees, public.actions,
  public.action_reports, public.action_confirmations, public.media_assets,
  public.markets to authenticated;
grant delete on public.live_attendees to authenticated;

create or replace view public.member_action_feed
with (security_invoker = true)
as
select
  a.id,
  a.season_id,
  a.live_id,
  a.action_type_id,
  at.code as action_type_code,
  at.public_label,
  at.trash_label,
  at.privacy_level,
  a.occurred_at,
  a.declared_at,
  a.official_occurred_at,
  a.declared_by,
  a.status,
  a.certainty,
  a.public_description,
  a.classified,
  a.created_at,
  a.updated_at
from public.actions a
join public.action_types at on at.id = a.action_type_id
where private.is_season_member(a.season_id)
  and a.private_note is null
  and not a.classified
  and at.privacy_level in ('PUBLIC', 'MEMBERS_ONLY');

grant select on public.member_action_feed to authenticated;

create policy profiles_select_visible
on public.profiles for select to authenticated
using (id = auth.uid() or private.shares_active_season(id));

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy seasons_select_member
on public.seasons for select to authenticated
using (private.is_season_member(id));

create policy seasons_insert_rpc_only
on public.seasons for insert to authenticated
with check (false);

create policy seasons_update_admin
on public.seasons for update to authenticated
using (private.has_season_role(id, array['ADMIN']::public.season_member_role[]))
with check (private.has_season_role(id, array['ADMIN']::public.season_member_role[]));

create policy seasons_delete_never
on public.seasons for delete to authenticated
using (false);

create policy season_members_select_same_season
on public.season_members for select to authenticated
using (private.is_season_member(season_id));

create policy season_members_insert_rpc_only
on public.season_members for insert to authenticated
with check (false);

create policy season_members_update_admin
on public.season_members for update to authenticated
using (private.has_season_role(season_id, array['ADMIN']::public.season_member_role[]))
with check (private.has_season_role(season_id, array['ADMIN']::public.season_member_role[]));

create policy season_members_delete_never
on public.season_members for delete to authenticated
using (false);

create policy season_invitations_select_rpc_only
on public.season_invitations for select to authenticated
using (false);

create policy season_invitations_insert_rpc_only
on public.season_invitations for insert to authenticated
with check (false);

create policy season_invitations_update_rpc_only
on public.season_invitations for update to authenticated
using (false)
with check (false);

create policy season_invitations_delete_never
on public.season_invitations for delete to authenticated
using (false);

create policy live_sessions_select_member
on public.live_sessions for select to authenticated
using (private.is_season_member(season_id));

create policy live_sessions_insert_host
on public.live_sessions for insert to authenticated
with check (
  created_by = auth.uid()
  and private.has_season_role(
    season_id,
    array['ADMIN', 'LIVE_HOST']::public.season_member_role[]
  )
);

create policy live_sessions_update_host
on public.live_sessions for update to authenticated
using (
  private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
  or private.is_live_host(id)
)
with check (
  private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
  or private.is_live_host(id)
);

create policy live_sessions_delete_never
on public.live_sessions for delete to authenticated
using (false);

create policy live_attendees_select_member
on public.live_attendees for select to authenticated
using (
  exists (
    select 1 from public.live_sessions ls
    where ls.id = live_id and private.is_season_member(ls.season_id)
  )
);

create policy live_attendees_insert_self_or_host
on public.live_attendees for insert to authenticated
with check (
  (
    user_id = auth.uid()
    and live_role <> 'HOST'
    and exists (
      select 1 from public.live_sessions ls
      where ls.id = live_id and private.is_season_member(ls.season_id)
    )
  )
  or private.is_live_host(live_id)
);

create policy live_attendees_update_self_or_host
on public.live_attendees for update to authenticated
using (user_id = auth.uid() or private.is_live_host(live_id))
with check (
  (user_id = auth.uid() and live_role <> 'HOST')
  or private.is_live_host(live_id)
);

create policy live_attendees_delete_host
on public.live_attendees for delete to authenticated
using (private.is_live_host(live_id));

create policy action_types_select_authenticated
on public.action_types for select to authenticated
using (true);

create policy action_types_insert_never
on public.action_types for insert to authenticated
with check (false);

create policy action_types_update_never
on public.action_types for update to authenticated
using (false)
with check (false);

create policy action_type_confirmation_rules_select_authenticated
on public.action_type_confirmation_rules for select to authenticated
using (true);

create policy actions_select_admin_or_public_safe
on public.actions for select to authenticated
using (
  private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
  or declared_by = auth.uid()
  or (
    private.is_season_member(season_id)
    and private_note is null
    and not classified
    and exists (
      select 1 from public.action_types at
      where at.id = action_type_id
        and at.privacy_level in ('PUBLIC', 'MEMBERS_ONLY')
    )
  )
);

create policy actions_insert_reporter
on public.actions for insert to authenticated
with check (
  declared_by = auth.uid()
  and private.has_season_role(
    season_id,
    array['ADMIN', 'LIVE_HOST', 'REPORTER', 'SUBJECT']::public.season_member_role[]
  )
);

create policy actions_update_rpc_only
on public.actions for update to authenticated
using (false)
with check (false);

create policy actions_delete_never
on public.actions for delete to authenticated
using (false);

create policy action_reports_select_relevant
on public.action_reports for select to authenticated
using (
  reporter_id = auth.uid()
  or exists (
    select 1 from public.actions a
    where a.id = action_id
      and (
        private.has_season_role(a.season_id, array['ADMIN']::public.season_member_role[])
        or (a.live_id is not null and private.is_live_host(a.live_id))
      )
  )
);

create policy action_reports_insert_reporter
on public.action_reports for insert to authenticated
with check (
  reporter_id = auth.uid()
  and exists (
    select 1 from public.actions a
    where a.id = action_id
      and private.has_season_role(
        a.season_id,
        array['ADMIN', 'LIVE_HOST', 'REPORTER', 'SUBJECT']::public.season_member_role[]
      )
  )
);

create policy action_reports_update_never
on public.action_reports for update to authenticated
using (false)
with check (false);

create policy action_reports_delete_never
on public.action_reports for delete to authenticated
using (false);

create policy action_confirmations_select_relevant
on public.action_confirmations for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.actions a
    where a.id = action_id
      and (
        private.has_season_role(a.season_id, array['ADMIN']::public.season_member_role[])
        or (
          subject_key is not null
          and private.is_season_subject(a.season_id, subject_key)
        )
      )
  )
);

create policy action_confirmations_insert_subject_or_admin
on public.action_confirmations for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.actions a
    where a.id = action_id
      and (
        private.has_season_role(a.season_id, array['ADMIN']::public.season_member_role[])
        or (
          subject_key is not null
          and private.is_season_subject(a.season_id, subject_key)
        )
      )
  )
);

create policy action_confirmations_update_never
on public.action_confirmations for update to authenticated
using (false)
with check (false);

create policy action_confirmations_delete_never
on public.action_confirmations for delete to authenticated
using (false);

create policy media_assets_select_visible
on public.media_assets for select to authenticated
using (
  uploaded_by = auth.uid()
  or private.has_season_role(season_id, array['ADMIN', 'LIVE_HOST']::public.season_member_role[])
  or (
    status = 'APPROVED'
    and private.is_season_member(season_id)
  )
);

create policy media_assets_insert_authorized
on public.media_assets for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and private.has_season_role(
    season_id,
    array['ADMIN', 'LIVE_HOST', 'REPORTER', 'SUBJECT']::public.season_member_role[]
  )
);

create policy media_assets_update_pending_or_host
on public.media_assets for update to authenticated
using (
  (uploaded_by = auth.uid() and status = 'PENDING')
  or private.has_season_role(season_id, array['ADMIN', 'LIVE_HOST']::public.season_member_role[])
)
with check (
  uploaded_by = auth.uid()
  or private.has_season_role(season_id, array['ADMIN', 'LIVE_HOST']::public.season_member_role[])
);

create policy media_assets_delete_never
on public.media_assets for delete to authenticated
using (false);

create policy market_templates_select_authenticated
on public.market_templates for select to authenticated
using (true);

create policy market_action_rules_select_authenticated
on public.market_action_rules for select to authenticated
using (true);

create policy markets_select_member
on public.markets for select to authenticated
using (private.is_season_member(season_id));

create policy markets_insert_admin_or_live_host
on public.markets for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
    or (live_id is not null and private.is_live_host(live_id))
  )
);

create policy markets_update_admin_or_live_host
on public.markets for update to authenticated
using (
  private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
  or (live_id is not null and private.is_live_host(live_id))
)
with check (
  private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
  or (live_id is not null and private.is_live_host(live_id))
);

create policy markets_delete_never
on public.markets for delete to authenticated
using (false);

create policy market_outcomes_select_parent_market
on public.market_outcomes for select to authenticated
using (
  exists (
    select 1 from public.markets m
    where m.id = market_id and private.is_season_member(m.season_id)
  )
);

create policy market_outcomes_insert_never
on public.market_outcomes for insert to authenticated
with check (false);

create policy odds_snapshots_select_parent_market
on public.odds_snapshots for select to authenticated
using (
  exists (
    select 1
    from public.market_outcomes mo
    join public.markets m on m.id = mo.market_id
    where mo.id = outcome_id
      and private.is_season_member(m.season_id)
  )
);

create policy odds_snapshots_insert_never
on public.odds_snapshots for insert to authenticated
with check (false);

create policy wallets_select_owner_or_admin
on public.wallets for select to authenticated
using (
  user_id = auth.uid()
  or private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
);

create policy wallets_insert_never
on public.wallets for insert to authenticated
with check (false);

create policy wallets_update_never
on public.wallets for update to authenticated
using (false)
with check (false);

create policy wallet_transactions_select_owner_or_admin
on public.wallet_transactions for select to authenticated
using (
  user_id = auth.uid()
  or private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
);

create policy wallet_transactions_insert_never
on public.wallet_transactions for insert to authenticated
with check (false);

create policy bets_select_owner_or_admin
on public.bets for select to authenticated
using (
  user_id = auth.uid()
  or private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
);

create policy bets_insert_never
on public.bets for insert to authenticated
with check (false);

create policy bet_legs_select_parent_bet
on public.bet_legs for select to authenticated
using (
  exists (
    select 1 from public.bets b
    where b.id = bet_id
      and (
        b.user_id = auth.uid()
        or private.has_season_role(b.season_id, array['ADMIN']::public.season_member_role[])
      )
  )
);

create policy bet_legs_insert_never
on public.bet_legs for insert to authenticated
with check (false);

create policy settlements_select_market_members
on public.settlements for select to authenticated
using (
  exists (
    select 1 from public.markets m
    where m.id = market_id and private.is_season_member(m.season_id)
  )
);

create policy settlements_insert_never
on public.settlements for insert to authenticated
with check (false);

create policy notifications_select_recipient
on public.notifications for select to authenticated
using (user_id = auth.uid());

create policy notifications_update_read_at
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_insert_never
on public.notifications for insert to authenticated
with check (false);

create policy audit_logs_select_admin
on public.audit_logs for select to authenticated
using (
  season_id is not null
  and private.has_season_role(season_id, array['ADMIN']::public.season_member_role[])
);

create policy audit_logs_insert_never
on public.audit_logs for insert to authenticated
with check (false);

create policy rechute_snapshots_select_member
on public.rechute_snapshots for select to authenticated
using (private.is_season_member(season_id));

create policy rechute_snapshots_insert_never
on public.rechute_snapshots for insert to authenticated
with check (false);
