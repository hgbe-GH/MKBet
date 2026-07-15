# Margot × Kévin Betting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réduire MK Bet à une salle unique Margot × Kévin où tout compte confirmé reçoit 1 000 MKB, parie, déclare un événement avec preuves privées et participe à une décision 2-pour/2-contre qui suspend, rouvre ou règle les marchés.

**Architecture:** Conserver le schéma financier, le moteur de cotes, les devis, les tickets et le bucket privé existants. Ajouter quatre migrations forward-only pour la salle unique, les rapports/votes, le règlement atomique et la RLS, puis exposer ces capacités via une couche application/data et une interface `Direct` mobile-first. Les anciennes routes restent compatibles mais redirigent vers `/direct`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Zod 4, Supabase PostgreSQL/Auth/Storage/RLS, Tailwind v4, Vitest/Testing Library, Playwright Chromium, pnpm 11.

---

## Structure de fichiers

### Base et types

- Create: `supabase/migrations/20260715170000_single_room.sql` — salle fixe, rattachement automatique, portefeuille et marchés KISS/OFFICIAL_COUPLE.
- Create: `supabase/migrations/20260715170001_event_reports.sql` — enums, rapports, votes, preuves et RPC de soumission.
- Create: `supabase/migrations/20260715170002_event_resolution.sql` — vote décisif, suspension/réouverture et règlement financier idempotent.
- Create: `supabase/migrations/20260715170003_event_reports_rls.sql` — RLS rapports/votes/médias et droits RPC.
- Create: `supabase/tests/single_room_events_validation.sql` — scénario SQL complet multi-identités.
- Modify: `src/types/database.ts` — régénéré depuis PostgreSQL local uniquement.
- Create: `src/domain/events/types.ts` — unions sérialisables et labels runtime.

### Application et données

- Create: `src/application/events/event-report-schema.ts` — validation Zod du formulaire et des fichiers.
- Create: `src/application/events/event-errors.ts` — codes stables et messages français non sensibles.
- Create: `src/application/events/actions.ts` — upload WebP, nettoyage compensatoire, soumission et vote.
- Create: `src/data/supabase/events/repository.ts` — lecture du fil, détails, marchés/issus éligibles et appels RPC typés.
- Create: `src/application/sportsbook/require-single-room.ts` — résolution de la salle globale sans query param.
- Modify: `src/app/auth/callback/route.ts` — garantir profil + salle avant `/direct`.
- Modify: `src/application/auth/actions.ts` — `next` par défaut vers `/direct`.

### Interface

- Create: `src/app/(protected)/direct/page.tsx` — fil prioritaire.
- Create: `src/app/(protected)/report/page.tsx` — formulaire de déclaration.
- Create: `src/components/events/event-report-card.tsx` — preuve, statut, votes et marché.
- Create: `src/components/events/event-report-form.tsx` — formulaire multi-photo accessible.
- Create: `src/components/events/event-vote-controls.tsx` — Server Action, pending et résultat.
- Modify: `src/application/sportsbook/navigation.ts` — six destinations seulement.
- Modify: `src/components/sportsbook/app-shell.tsx` — shell sans rôle admin ni season switcher.
- Modify: `src/components/sportsbook/desktop-sidebar.tsx` — identité Margot × Kévin et navigation directe.
- Modify: `src/components/sportsbook/mobile-bottom-navigation.tsx` — Direct, Marchés, Déclarer, Ticket, Classement.
- Modify: `src/components/sportsbook/top-header.tsx` — solde et compte, aucune sélection de saison.
- Modify: `src/app/(protected)/layout.tsx` — salle globale obligatoire après Auth.
- Modify: `src/app/(protected)/markets/page.tsx`, `bets/page.tsx`, `leaderboard/page.tsx` — utiliser la salle globale.
- Modify: anciennes pages `dashboard`, `seasons`, `lives`, `results`, `timeline`, `wallet`, `admin` — redirection serveur vers `/direct`.
- Modify: `src/app/page.tsx` — bouton public vers `/login?next=/direct`.

### Tests et documentation

- Create: `tests/single-room-schema.test.ts`.
- Create: `tests/event-report-schema.test.ts`.
- Create: `tests/event-report-actions.test.ts`.
- Create: `tests/event-report-ui.test.tsx`.
- Modify: `tests/protected-layout.test.tsx`, `tests/sportsbook-routing.test.ts`, `tests/sportsbook-pages.test.tsx`.
- Create: `tests/e2e/event-reports.spec.ts`.
- Modify: `tests/e2e/global-setup.ts`, `tests/e2e/support/auth-state.ts`.
- Modify: `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/CURRENT_STATE.md`.

---

### Task 1: Verrouiller le contrat statique des migrations

**Files:**

- Create: `tests/single-room-schema.test.ts`
- Test: `tests/database-schema.test.ts`

- [ ] **Step 1: Write the failing migration contract test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = (name: string) =>
  readFileSync(`supabase/migrations/${name}`, "utf8");

describe("single-room event schema", () => {
  it("defines the room, immutable votes, settlement and RLS in forward-only migrations", () => {
    const room = migration("20260715170000_single_room.sql");
    const reports = migration("20260715170001_event_reports.sql");
    const resolution = migration("20260715170002_event_resolution.sql");
    const rls = migration("20260715170003_event_reports_rls.sql");

    expect(room).toContain("ensure_single_room_membership");
    expect(reports).toContain("create table public.event_reports");
    expect(reports).toContain("unique (report_id, user_id)");
    expect(resolution).toContain("vote_event_report");
    expect(resolution).toContain("settle_event_market");
    expect(rls).toContain(
      "alter table public.event_reports enable row level security",
    );
    expect(rls).toContain("revoke all on function public.vote_event_report");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run tests/single-room-schema.test.ts`

Expected: FAIL because the four migrations do not exist.

- [ ] **Step 3: Commit the red contract**

```bash
git add tests/single-room-schema.test.ts
git commit -m "test: define single room event schema contract"
```

### Task 2: Créer la salle unique et rattacher tous les comptes

**Files:**

- Modify: `supabase/migrations/20260715170000_single_room.sql`
- Create: `supabase/tests/single_room_events_validation.sql`
- Modify: `tests/single-room-schema.test.ts`

- [ ] **Step 1: Add SQL assertions for automatic membership**

Le scénario SQL crée Alice et Bob dans `auth.users`, appelle le trigger de profil puis vérifie pour chacun : profil, rôle `PLAYER`, portefeuille à 1 000 MKB et une seule transaction `INITIAL_CREDIT`. Il réappelle `public.ensure_single_room_access()` et exige les mêmes décomptes.

```sql
select public.test_assert(
  (select count(*) from public.wallet_transactions
   where user_id = :'alice_id'::uuid and transaction_type = 'INITIAL_CREDIT') = 1,
  'initial credit is idempotent'
);
```

- [ ] **Step 2: Implement the fixed room contract**

Dans `20260715170000_single_room.sql`, définir :

```sql
create or replace function public.single_room_id()
returns uuid language sql immutable set search_path = ''
as $$ select '6d6b0000-0000-4000-8000-000000000001'::uuid $$;

create or replace function public.ensure_single_room_access()
returns uuid language plpgsql security definer set search_path = '';
```

La fonction : exige `auth.uid()`, garantit le profil, upsert la saison active `Margot × Kévin`, upsert le rôle `PLAYER`, crée le portefeuille à 1 000 et `wallet_transactions.idempotency_key = 'single-room-initial-credit:' || auth.uid()`. Un helper privé prend un `p_user_id` explicite pour le backfill et pour `private.handle_new_auth_user()`.

- [ ] **Step 3: Initialize only KISS and OFFICIAL_COUPLE**

Au premier profil disponible, ouvrir de façon idempotente les deux templates existants avec issues `YES/NO`, dates fixes documentées et clés dérivées de `single_room_id()`. `FRIENDLY_MEETING`, `AFFECTIONATE_GESTURE` et `DIPLOMATIC_INCIDENT` restent informatifs.

- [ ] **Step 4: Verify the migration locally**

Run: `pnpm db:reset && pnpm db:test:single-room`

Expected: room, two markets, membership, wallet and initial transaction assertions pass twice.

- [ ] **Step 5: Commit the foundation**

```bash
git add supabase/migrations/20260715170000_single_room.sql supabase/tests/single_room_events_validation.sql package.json tests/single-room-schema.test.ts
git commit -m "feat: add automatic margot kevin room"
```

### Task 3: Ajouter rapports, votes et preuves privées

**Files:**

- Modify: `supabase/migrations/20260715170001_event_reports.sql`
- Modify: `supabase/migrations/20260715170003_event_reports_rls.sql`
- Modify: `supabase/tests/single_room_events_validation.sql`

- [ ] **Step 1: Extend SQL tests for report integrity**

Tester : événement futur refusé, note > 500 refusée, marché/issue composite, type/marché incompatible, auteur interdit de vote, unicité du vote et double soumission avec même clé.

- [ ] **Step 2: Create enums and tables**

```sql
create type public.event_report_status as enum ('PENDING', 'CONFIRMED', 'REJECTED');
create type public.event_report_type as enum (
  'FRIENDLY_MEETING', 'AFFECTIONATE_GESTURE', 'KISS',
  'DIPLOMATIC_INCIDENT', 'OFFICIAL_RELATIONSHIP'
);
create type public.event_vote_decision as enum ('CONFIRM', 'REJECT');
```

Créer `event_reports`, `event_report_votes`, `event_report_media` et `event_market_outcome_rules` avec toutes les FK `ON DELETE RESTRICT`, l’unicité `(author_user_id, idempotency_key)` et `(report_id, user_id)`.

- [ ] **Step 3: Implement submit_event_report**

La RPC reçoit `p_report_type`, `p_occurred_at`, `p_note`, `p_market_id`, `p_outcome_id`, `p_media jsonb`, `p_idempotency_key`. Elle verrouille la clé, vérifie la salle globale et les chemins Storage appartenant à l’auteur, insère rapport + `media_assets` + liens, suspend le marché si présent et audite le tout.

- [ ] **Step 4: Add deny-by-default then explicit RLS**

Tout membre authentifié de la salle lit les rapports et votes ; seules les RPC écrivent. La policy Storage lit les blobs liés à un rapport `PENDING` ou `CONFIRMED`, tandis qu’un rapport `REJECTED` n’est pas servi dans le fil. Aucun accès `anon`.

- [ ] **Step 5: Verify and commit**

Run: `pnpm db:reset && pnpm db:test:single-room && pnpm exec supabase db lint --local`

```bash
git add supabase/migrations/20260715170001_event_reports.sql supabase/migrations/20260715170003_event_reports_rls.sql supabase/tests/single_room_events_validation.sql
git commit -m "feat: add private event reports and votes"
```

### Task 4: Régler marchés, jambes et portefeuilles atomiquement

**Files:**

- Modify: `supabase/migrations/20260715170002_event_resolution.sql`
- Modify: `supabase/tests/single_room_events_validation.sql`

- [ ] **Step 1: Add failing financial scenarios**

Placer un simple et un combiné via les RPC existantes, confirmer une issue puis vérifier : `market_outcomes`, `bet_legs`, `bets`, `settlements`, `wallets`, `wallet_transactions`, audit et répétition idempotente. Ajouter un rapport rejeté qui rouvre le marché sans transaction.

- [ ] **Step 2: Implement private.settle_event_market**

Sous verrous marché → tickets → portefeuilles : marquer l’issue gagnante, les autres perdantes, régler les jambes, finaliser les tickets déterminables, insérer un `settlements` STANDARD et créditer chaque gain avec `bet-win:<bet_id>`. Une jambe perdante clôt un combiné `LOST`; toutes les jambes `WON` donnent `WON`; toutes `VOID` donnent `REFUNDED`.

- [ ] **Step 3: Implement public.vote_event_report**

La RPC vérifie l’auteur, insère le vote immuable, compte les décisions sous verrou du rapport et :

```sql
if confirm_count >= 2 then
  update public.event_reports set status = 'CONFIRMED', resolved_at = now();
  perform private.settle_event_market(...);
elsif reject_count >= 2 then
  update public.event_reports set status = 'REJECTED', resolved_at = now();
  update public.markets set status = 'OPEN', suspension_reason = null;
end if;
```

- [ ] **Step 4: Verify concurrency and immutability**

Exécuter deux votes simultanés et réappeler la même décision. Exiger un seul règlement, un seul crédit par pari et aucune mutation des transactions/audits.

- [ ] **Step 5: Commit resolution**

```bash
git add supabase/migrations/20260715170002_event_resolution.sql supabase/tests/single_room_events_validation.sql
git commit -m "feat: settle bets from confirmed events"
```

### Task 5: Régénérer les types et construire le domaine TypeScript

**Files:**

- Modify: `src/types/database.ts`
- Create: `src/domain/events/types.ts`
- Create: `src/application/events/event-report-schema.ts`
- Create: `tests/event-report-schema.test.ts`

- [ ] **Step 1: Write Zod boundary tests**

Tester les cinq types, date future, note 500/501, UUID optionnels couplés, maximum cinq fichiers et formats JPEG/PNG/WebP ≤ 10 MiB.

- [ ] **Step 2: Implement runtime types and schema**

Exporter `EVENT_REPORT_TYPES`, `EventReportType`, `EVENT_REPORT_LABELS`, `EventReportStatus`, `EventVoteDecision` et `eventReportFormSchema`. Le schéma exige `marketId` et `outcomeId` ensemble.

- [ ] **Step 3: Reset and regenerate generated types**

Run: `pnpm db:reset && pnpm db:types`

Expected: `event_reports`, `event_report_votes`, `submit_event_report`, `vote_event_report` and enums appear in `Database`.

- [ ] **Step 4: Run tests and commit**

```bash
pnpm vitest run tests/event-report-schema.test.ts tests/database-schema.test.ts
git add src/types/database.ts src/domain/events/types.ts src/application/events/event-report-schema.ts tests/event-report-schema.test.ts
git commit -m "feat: add typed event report contracts"
```

### Task 6: Ajouter repositories et Server Actions

**Files:**

- Create: `src/application/events/event-errors.ts`
- Create: `src/application/events/actions.ts`
- Create: `src/data/supabase/events/repository.ts`
- Create: `tests/event-report-actions.test.ts`

- [ ] **Step 1: Write failing repository/action tests**

Mocker le client Supabase et tester : paramètres RPC exacts, conversion de cinq images en WebP, nettoyage de tous les blobs si RPC échoue, message uniforme, vote sans détail PostgreSQL et revalidation `/direct`, `/markets`, `/bets`, `/leaderboard`.

- [ ] **Step 2: Implement focused repository functions**

Créer `listEventReports`, `listReportableMarkets`, `submitEventReport` et `voteEventReport`. Mapper les lignes snake_case vers des DTO camelCase sérialisables ; aucun composant React ne reçoit de client Supabase.

- [ ] **Step 3: Implement actions with compensating cleanup**

Pour chaque fichier : Sharp `rotate()`, `resize({width:1600, withoutEnlargement:true})`, WebP quality 84, upload sous `singleRoomId/userId/uuid.webp`. Si un upload ou la RPC échoue, supprimer tous les chemins déjà créés.

- [ ] **Step 4: Verify tests and commit**

```bash
pnpm vitest run tests/event-report-actions.test.ts tests/media-validation.test.ts
git add src/application/events src/data/supabase/events tests/event-report-actions.test.ts
git commit -m "feat: add event report application layer"
```

### Task 7: Remplacer le shell par le Fil en direct

**Files:**

- Create: `src/app/(protected)/direct/page.tsx`
- Create: `src/app/(protected)/report/page.tsx`
- Create: `src/components/events/event-report-card.tsx`
- Create: `src/components/events/event-report-form.tsx`
- Create: `src/components/events/event-vote-controls.tsx`
- Modify: navigation/shell/header/sidebar/mobile files listed above
- Create: `tests/event-report-ui.test.tsx`

- [ ] **Step 1: Write failing accessible UI tests**

Vérifier landmarks, titre `Margot × Kévin — Direct`, tabs `À vérifier/Confirmés/Invalidés`, auteur/date, image `/api/media/:id`, compteurs, absence de vote auteur, `aria-live`, formulaire et cinq liens mobiles.

- [ ] **Step 2: Implement the report cards and vote control**

Une carte affiche un seul CTA `VALIDER` et un seul `INVALIDER`, désactivés pour auteur ou rapport fermé. Les décisions déjà prises sont des listes textuelles ; la couleur n’est jamais le seul signal.

- [ ] **Step 3: Implement the report form**

Le formulaire expose type, `datetime-local` converti UTC, note, marché/issue conditionnels, 1 à 5 fichiers et confirmation. Il utilise `useActionState`, indique upload/pending et ne stocke rien en localStorage.

- [ ] **Step 4: Simplify the shell and navigation**

Retirer SeasonSwitcher et `showAdmin`. Desktop : Direct, Marchés, Déclarer, Mon ticket, Classement, Compte. Mobile : cinq premiers. Conserver skip-link, focus visible, ticket desktop/mobile et solde MKB.

- [ ] **Step 5: Verify and commit**

```bash
pnpm vitest run tests/event-report-ui.test.tsx tests/sportsbook-ui.test.tsx tests/sportsbook-routing.test.ts
git add src/app/'(protected)'/direct src/app/'(protected)'/report src/components/events src/application/sportsbook/navigation.ts src/components/sportsbook
git commit -m "feat: build margot kevin live feed"
```

### Task 8: Basculer Auth et toutes les routes sur la salle unique

**Files:**

- Create: `src/application/sportsbook/require-single-room.ts`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/(protected)/layout.tsx`
- Modify: protected pages and `src/app/page.tsx`
- Modify: `tests/protected-layout.test.tsx`, `tests/auth-contracts.test.ts`, `tests/sportsbook-pages.test.tsx`

- [ ] **Step 1: Write failing first-login tests**

Le callback appelle `ensure_current_profile`, puis `ensure_single_room_access`, puis redirige `/direct`. Le layout ne redirige jamais `/seasons`. Les pages marché/ticket/classement utilisent toujours l’UUID fixe retourné côté serveur.

- [ ] **Step 2: Implement single-room resolution**

`requireSingleRoom()` appelle la RPC, charge `getCurrentSportsbookSeason(roomId)` et redirige `/login` uniquement en absence Auth. Aucun query param `season` n’est accepté.

- [ ] **Step 3: Redirect obsolete routes**

Les pages `dashboard`, `seasons`, `lives`, `results`, `timeline`, `wallet`, `admin` appellent `redirect('/direct')`. Les routes `/markets`, `/bets`, `/leaderboard`, `/settings/account` restent fonctionnelles.

- [ ] **Step 4: Verify and commit**

```bash
pnpm vitest run tests/protected-layout.test.tsx tests/auth-contracts.test.ts tests/sportsbook-pages.test.tsx
git add src/app src/application/sportsbook tests/protected-layout.test.tsx tests/auth-contracts.test.ts tests/sportsbook-pages.test.tsx
git commit -m "feat: route every player into the single room"
```

### Task 9: Adapter le harness et ajouter le parcours E2E complet

**Files:**

- Modify: `tests/e2e/global-setup.ts`
- Modify: `tests/e2e/support/auth-state.ts`
- Create: `tests/e2e/event-reports.spec.ts`

- [ ] **Step 1: Replace season creation with automatic room membership**

Créer quatre identités : auteur, validateur A, validateur B, opposant. Après création Auth, appeler `ensure_single_room_access`; sauvegarder leurs sessions `/direct`. Ne créer aucune invitation ou saison E2E.

- [ ] **Step 2: Add E2E confirmation scenario**

Auteur place un pari KISS=YES, soumet KISS avec PNG, vérifie sa propre impossibilité de voter. Validateur A puis B votent. Vérifier rapport confirmé, marché réglé, ticket `WON`, solde crédité et image accessible authentifiée.

- [ ] **Step 3: Add E2E rejection scenario**

Soumettre un rapport lié, deux comptes refusent, vérifier `REJECTED`, preuve absente du fil normal, marché `OPEN`, aucune nouvelle wallet transaction et route média sans session `404`.

- [ ] **Step 4: Run desktop and mobile**

Run: `pnpm test:e2e --project=chromium-desktop tests/e2e/event-reports.spec.ts && pnpm test:e2e --project=chromium-mobile tests/e2e/event-reports.spec.ts`

- [ ] **Step 5: Commit E2E**

```bash
git add tests/e2e
git commit -m "test: cover collaborative event settlement"
```

### Task 10: Documentation, validation complète et livraison

**Files:**

- Modify: `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md`, `docs/CURRENT_STATE.md`

- [ ] **Step 1: Update documentation truthfully**

Documenter la salle unique, inscription ouverte, preuves visibles aux comptes authentifiés, vote 2/2, règlement, limites de confidentialité, migrations Production avant Vercel et procédure de rollback applicatif. Retirer les affirmations de saisons/lives comme parcours courant.

- [ ] **Step 2: Run the ordered local gate**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm db:reset
pnpm exec supabase db lint --local
pnpm db:test:rls
pnpm db:test:betting
pnpm db:test:media
pnpm db:test:single-room
pnpm test:e2e
pnpm db:stop
pnpm build
pnpm install --frozen-lockfile
```

- [ ] **Step 3: Scan and inspect protected history**

Vérifier aucun secret/image personnelle dans Git, aucun diff dans `src/domain/odds`, et aucun changement des migrations antérieures à `20260715170000`.

- [ ] **Step 4: Commit the completed redesign**

```bash
git add README.md docs package.json pnpm-lock.yaml
git commit -m "feat: focus mk bet on margot and kevin"
```

- [ ] **Step 5: Promote Production in dependency order**

Appliquer d’abord les quatre migrations et le seed de référence au projet Supabase lié. Vérifier les décomptes et RPC, pousser `main`, attendre le déploiement Vercel, puis tester `/`, `/api/health`, magic link, `/direct`, preuve privée, vote et un pari MKB. Aucun secret, média personnel ou clé de service n’est envoyé à Vercel.
