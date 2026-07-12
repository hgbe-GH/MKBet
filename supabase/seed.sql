begin;

insert into public.action_types (
  code,
  public_label,
  trash_label,
  category,
  privacy_level,
  confirmation_policy,
  deduplication_window_minutes,
  rechute_proximity_delta,
  rechute_physical_delta,
  rechute_regularity_delta,
  rechute_commitment_delta,
  is_active
)
values
-- ACTION_TYPES_BEGIN
  ('MESSAGE_SIGNIFICANT', 'Message significatif', 'Le texto qui ne voulait rien dire', 'CONTACT', 'PUBLIC', 'TWO_REPORTERS', 5, 1, 0, 0, 0, true),
  ('PRIVATE_DISCUSSION', 'Discussion isolée', 'Conseil d’administration clandestin', 'CONTACT', 'MEMBERS_ONLY', 'HOST_CONFIRMATION', 10, 2, 0, 1, 0, true),
  ('MISS_YOU_DECLARATION', 'Déclaration de manque', 'Alerte faiblesse émotionnelle', 'CONTACT', 'PUBLIC', 'TWO_REPORTERS', 10, 4, 0, 0, 0, true),
  ('DENIAL_PHRASE', 'Phrase de déni', 'Communication financière douteuse', 'STATUS', 'PUBLIC', 'TWO_REPORTERS', 5, -1, 0, 0, 0, true),
  ('CUDDLE', 'Câlin', 'Fusion corporelle légère', 'PHYSICAL', 'PUBLIC', 'TWO_REPORTERS', 5, 3, 2, 0, 0, true),
  ('HAND_ON_THIGH', 'Main sur la cuisse', 'Acquisition hostile', 'PHYSICAL', 'PUBLIC', 'TWO_REPORTERS', 5, 1, 3, 0, 0, true),
  ('KISS', 'Bisou', 'Fusion-acquisition labiale', 'PHYSICAL', 'PUBLIC', 'TWO_REPORTERS', 5, 4, 8, 0, 0, true),
  ('LEAVE_TOGETHER', 'Départ ensemble', 'Transfert conjoint des actifs', 'CONTACT', 'PUBLIC', 'TWO_REPORTERS', 10, 2, 0, 1, 0, true),
  ('SLEEP_SAME_PLACE', 'Nuit au même endroit', 'Mutualisation géographique des infrastructures', 'PHYSICAL', 'SUBJECTS_AND_ADMINS', 'ONE_SUBJECT', 30, 2, 2, 2, 0, true),
  ('SLEEP_SAME_BED', 'Dormir dans le même lit', 'Mutualisation complète des infrastructures', 'PHYSICAL', 'SUBJECTS_AND_ADMINS', 'ONE_SUBJECT', 30, 3, 7, 3, 0, true),
  ('BLOWJOB', 'Pipe', 'Performance orale ascendante', 'SEXUAL', 'SUBJECTS_AND_ADMINS', 'ONE_SUBJECT', 60, 0, 8, 2, 0, true),
  ('CUNNILINGUS', 'Cunni', 'Audit complet du département inférieur', 'SEXUAL', 'SUBJECTS_AND_ADMINS', 'ONE_SUBJECT', 60, 0, 8, 2, 0, true),
  ('SEX', 'Rapport sexuel', 'Fusion totale des actifs', 'SEXUAL', 'SUBJECTS_AND_ADMINS', 'ONE_SUBJECT', 60, 0, 10, 3, 0, true),
  ('SEX_FRIENDS', 'Sex-friends', 'Partenariat stratégique sans capital commun', 'RELATIONSHIP', 'SUBJECTS_AND_ADMINS', 'BOTH_SUBJECTS', 120, 0, 0, 8, 0, true),
  ('EXCLUSIVITY', 'Exclusivité', 'Monopole temporaire', 'RELATIONSHIP', 'SUBJECTS_AND_ADMINS', 'BOTH_SUBJECTS', 120, 0, 0, 4, 8, true),
  ('OFFICIAL_COUPLE', 'Couple officiel', 'Réintroduction en Bourse', 'STATUS', 'SUBJECTS_AND_ADMINS', 'BOTH_SUBJECTS', 120, 5, 0, 8, 20, true),
  ('ARGUMENT', 'Dispute', 'Correction brutale du marché', 'CONFLICT', 'PUBLIC', 'TWO_REPORTERS', 10, -4, 0, -4, -4, true),
  ('DISTANCE', 'Prise de distance', 'Gel temporaire des échanges', 'CONFLICT', 'PUBLIC', 'TWO_REPORTERS', 30, -6, 0, -4, 0, true),
  ('NEW_EXTERNAL_RELATION', 'Nouvelle relation extérieure', 'Entrée d’un concurrent sur le marché', 'LONG_TERM', 'SUBJECTS_AND_ADMINS', 'ONE_SUBJECT', 120, 0, 0, 0, -10, true)
-- ACTION_TYPES_END
on conflict (code) do update set
  public_label = excluded.public_label,
  trash_label = excluded.trash_label,
  category = excluded.category,
  privacy_level = excluded.privacy_level,
  confirmation_policy = excluded.confirmation_policy,
  deduplication_window_minutes = excluded.deduplication_window_minutes,
  rechute_proximity_delta = excluded.rechute_proximity_delta,
  rechute_physical_delta = excluded.rechute_physical_delta,
  rechute_regularity_delta = excluded.rechute_regularity_delta,
  rechute_commitment_delta = excluded.rechute_commitment_delta,
  is_active = excluded.is_active;

with confirmation_rules (action_code, policy, priority) as (
  values
    ('MESSAGE_SIGNIFICANT', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('MISS_YOU_DECLARATION', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('DENIAL_PHRASE', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('CUDDLE', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('HAND_ON_THIGH', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('KISS', 'ONE_SUBJECT'::public.confirmation_policy, 200),
    ('LEAVE_TOGETHER', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('SEX_FRIENDS', 'ADMIN_DECISION'::public.confirmation_policy, 200),
    ('EXCLUSIVITY', 'ADMIN_DECISION'::public.confirmation_policy, 200),
    ('OFFICIAL_COUPLE', 'ADMIN_DECISION'::public.confirmation_policy, 200),
    ('ARGUMENT', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('DISTANCE', 'HOST_CONFIRMATION'::public.confirmation_policy, 200),
    ('NEW_EXTERNAL_RELATION', 'ADMIN_DECISION'::public.confirmation_policy, 200)
)
insert into public.action_type_confirmation_rules (
  action_type_id,
  policy,
  priority,
  is_active
)
select action_types.id, confirmation_rules.policy, confirmation_rules.priority, true
from confirmation_rules
join public.action_types on action_types.code = confirmation_rules.action_code
on conflict (action_type_id, policy) do update set
  priority = excluded.priority,
  is_active = excluded.is_active;

insert into public.market_templates (
  code,
  title_template,
  trash_title_template,
  market_type,
  event_code,
  category,
  default_q,
  default_half_life_days,
  default_margin,
  settlement_rule,
  is_active
)
values
-- MARKET_TEMPLATES_BEGIN
  ('KISS', 'Premier bisou post-rupture', 'Fusion-acquisition labiale', 'BINARY', 'KISS', 'PHYSICAL', 0.88, 14, 1.08, '{"trigger_action_code":"KISS","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true),
  ('SLEEP_SAME_BED', 'Première nuit dans le même lit', 'Mutualisation complète des infrastructures', 'BINARY', 'SLEEP_SAME_BED', 'PHYSICAL', 0.84, 18, 1.08, '{"trigger_action_code":"SLEEP_SAME_BED","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true),
  ('SEX', 'Premier rapport sexuel post-rupture', 'Fusion totale des actifs', 'BINARY', 'SEX', 'SEXUAL', 0.78, 21, 1.08, '{"trigger_action_code":"SEX","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true),
  ('BLOWJOB', 'Première pipe post-rupture', 'Performance orale ascendante', 'BINARY', 'BLOWJOB', 'SEXUAL', 0.60, 30, 1.08, '{"trigger_action_code":"BLOWJOB","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true),
  ('CUNNILINGUS', 'Premier cunni post-rupture', 'Audit complet du département inférieur', 'BINARY', 'CUNNILINGUS', 'SEXUAL', 0.60, 30, 1.08, '{"trigger_action_code":"CUNNILINGUS","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true),
  ('SEX_FRIENDS', 'Début d’une relation de sex-friends', 'Partenariat stratégique sans capital commun', 'BINARY', 'SEX_FRIENDS', 'RELATIONSHIP', 0.62, 40, 1.08, '{"trigger_action_code":"SEX_FRIENDS","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true),
  ('OFFICIAL_COUPLE', 'Retour officiel en couple', 'Réintroduction en Bourse', 'BINARY', 'OFFICIAL_COUPLE', 'STATUS', 0.50, 75, 1.08, '{"trigger_action_code":"OFFICIAL_COUPLE","reference_time_order":["official_occurred_at","occurred_at"],"contested_action_policy":"SUSPEND_UNTIL_RESOLVED","indeterminate_time_policy":"VOID_MARKET","refund_policy":"REFUND_STAKES"}'::jsonb, true)
-- MARKET_TEMPLATES_END
on conflict (code) do update set
  title_template = excluded.title_template,
  trash_title_template = excluded.trash_title_template,
  market_type = excluded.market_type,
  event_code = excluded.event_code,
  category = excluded.category,
  default_q = excluded.default_q,
  default_half_life_days = excluded.default_half_life_days,
  default_margin = excluded.default_margin,
  settlement_rule = excluded.settlement_rule,
  is_active = excluded.is_active;

with impact_rules (source_code, target_event_code, effect_type, effect_value) as (
  values
-- MARKET_ACTION_RULES_BEGIN
    ('KISS', 'SLEEP_SAME_BED', 'SPEED_MULTIPLIER'::public.market_effect_type, 1.35),
    ('KISS', 'SEX', 'SPEED_MULTIPLIER'::public.market_effect_type, 1.45),
    ('KISS', 'SEX_FRIENDS', 'Q_SHIFT'::public.market_effect_type, 0.10),
    ('KISS', 'OFFICIAL_COUPLE', 'Q_SHIFT'::public.market_effect_type, 0.02),
    ('SEX', 'SEX_FRIENDS', 'Q_SHIFT'::public.market_effect_type, 0.15),
    ('SEX', 'OFFICIAL_COUPLE', 'Q_SHIFT'::public.market_effect_type, 0.03),
    ('MISS_YOU_DECLARATION', 'SLEEP_SAME_BED', 'SPEED_MULTIPLIER'::public.market_effect_type, 1.15),
    ('MISS_YOU_DECLARATION', 'SEX', 'SPEED_MULTIPLIER'::public.market_effect_type, 1.10),
    ('ARGUMENT', 'KISS', 'SPEED_MULTIPLIER'::public.market_effect_type, 0.70),
    ('ARGUMENT', 'SLEEP_SAME_BED', 'SPEED_MULTIPLIER'::public.market_effect_type, 0.70),
    ('ARGUMENT', 'SEX', 'SPEED_MULTIPLIER'::public.market_effect_type, 0.70),
    ('DISTANCE', 'KISS', 'SPEED_MULTIPLIER'::public.market_effect_type, 0.65),
    ('DISTANCE', 'SLEEP_SAME_BED', 'SPEED_MULTIPLIER'::public.market_effect_type, 0.65),
    ('DISTANCE', 'SEX', 'SPEED_MULTIPLIER'::public.market_effect_type, 0.65),
    ('NEW_EXTERNAL_RELATION', 'OFFICIAL_COUPLE', 'Q_SHIFT'::public.market_effect_type, -0.20)
-- MARKET_ACTION_RULES_END
)
insert into public.market_action_rules (
  source_action_type_id,
  target_event_code,
  effect_type,
  effect_value,
  priority,
  is_active,
  metadata
)
select
  action_types.id,
  impact_rules.target_event_code,
  impact_rules.effect_type,
  impact_rules.effect_value,
  100,
  true,
  jsonb_build_object('seed_version', 1)
from impact_rules
join public.action_types on action_types.code = impact_rules.source_code
on conflict (source_action_type_id, target_event_code, effect_type) do update set
  effect_value = excluded.effect_value,
  priority = excluded.priority,
  is_active = excluded.is_active,
  metadata = excluded.metadata;

commit;
