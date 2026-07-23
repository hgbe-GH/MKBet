# Accès immédiat et calendrier des marchés Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner immédiatement accès à la salle après une inscription par e-mail/mot de passe et rendre les combinés, fermetures et échéances de marché explicites.

**Architecture:** L’inscription conserve une Server Action et les RPC existantes : seule une session réellement créée déclenche l’initialisation idempotente de l’accès, avant une redirection interne. Le calendrier est une lecture Server Component fondée sur le repository de marchés existant; un module pur valide sa semaine UTC et prépare des groupes de jours sans introduire de modèle persistant ou de calcul de cote côté client.

**Tech Stack:** Next.js App Router, React, TypeScript strict, Zod, Vitest/Testing Library, Playwright, Supabase SSR/PostgreSQL existant.

---

## Structure ciblée

- `supabase/config.toml` : désactive la confirmation locale de l’e-mail; le changement Production est documenté et appliqué hors migration.
- `src/application/auth/actions.ts` : inscription immédiate, initialisation RPC puis redirection sûre; récupération inchangée.
- `src/components/auth/sign-up-form.tsx` et tests Auth : suppriment l’état « confirmer l’adresse » et conservent les erreurs génériques.
- `src/application/sportsbook/calendar-query.ts` : parseur Zod pur de `week`, catégorie et statut, et helpers UTC testables.
- `src/application/sportsbook/market-calendar.ts` : transforme les marchés lus en groupes journaliers, calcule les libellés d’ouverture, fermeture et échéance sans modifier les données.
- `src/app/(protected)/markets/calendar/page.tsx` : route protégée et responsive de lecture.
- `src/components/sportsbook/market-calendar.tsx` et `market-calendar-controls.tsx` : navigation hebdomadaire accessible, filtres, états vide/fermé et cartes sans logique Supabase.
- `src/application/sportsbook/navigation.ts` et composants de navigation : lien explicite vers le calendrier.
- `src/components/sportsbook/bet-slip*.tsx` : présentation transparente du simple/combiné et du devis autoritaire, sans modifier le payload de devis ou de placement.
- `tests/*` et `tests/e2e/*` : contrats d’action, rendu, calendrier et parcours navigateur.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT.md`, `docs/BETTING.md`, `docs/CURRENT_STATE.md` : comportement final, absence de confirmation et dates de marché.

### Task 1: Mettre l’inscription immédiate sous contrat

**Files:**
- Modify: `tests/password-auth-actions.test.ts`
- Modify: `tests/auth-ui.test.tsx`
- Modify: `tests/e2e/password-auth.spec.ts`

- [ ] **Step 1: Write the failing action tests**

  Remplacer les attentes de callback `intent=signup` par une session explicite et une redirection. Ajouter ces cas :

  ```ts
  signUp.mockResolvedValue({ data: { user: { id: "user-1" }, session: {} }, error: null });

  await expect(signUpWithPasswordAction(initialState, validSignUpData()))
    .rejects.toThrow("NEXT_REDIRECT:/direct");

  expect(signUp).toHaveBeenCalledWith({
    email: "alice@example.com",
    password: "mot-de-passe-solide",
    options: { data: { display_name: "Alice Marchés" } },
  });
  expect(rpc).toHaveBeenNthCalledWith(1, "ensure_current_profile");
  expect(rpc).toHaveBeenNthCalledWith(2, "ensure_single_room_access");
  ```

  Ajouter le cas `session: null` qui attend `{ ok: false, code: "AUTH_SIGN_UP_FAILED" }`, `signOut` et aucune RPC. Adapter le test UI pour vérifier que le formulaire ne rend plus « Confirme ton adresse ».

- [ ] **Step 2: Run the focused tests to verify they fail**

  Run: `pnpm vitest run tests/password-auth-actions.test.ts tests/auth-ui.test.tsx`

  Expected: FAIL car l’action attend encore une confirmation e-mail et ne redirige pas après inscription.

- [ ] **Step 3: Implement the minimal immediate-access action**

  Dans `signUpWithPasswordAction`, appeler seulement :

  ```ts
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error || !data.session) {
    await supabase.auth.signOut().catch(() => undefined);
    return failure("AUTH_SIGN_UP_FAILED");
  }
  const initialization = await initializeAuthenticatedAccess(supabase);
  if (!initialization.ok) {
    await supabase.auth.signOut().catch(() => undefined);
    return failure("DATABASE_OPERATION_FAILED");
  }
  redirect(parsed.data.next);
  ```

  Supprimer `SIGN_UP_SUCCESS`, le callback de signup et `configuredSiteUrl()` seulement si ce dernier n’est plus utilisé par la récupération. Dans `SignUpForm`, supprimer la branche de succès « compte presque prêt » : une réussite navigue, une erreur reste affichée.

- [ ] **Step 4: Run focused tests to verify they pass**

  Run: `pnpm vitest run tests/password-auth-actions.test.ts tests/auth-ui.test.tsx`

  Expected: PASS; les tests de récupération attendent toujours le callback `intent=recovery`.

- [ ] **Step 5: Commit the contract and implementation**

  ```bash
  git add src/application/auth/actions.ts src/components/auth/sign-up-form.tsx tests/password-auth-actions.test.ts tests/auth-ui.test.tsx
  git commit -m "feat: grant immediate access after password signup"
  ```

### Task 2: Configurer Auth sans confirmation et préserver la récupération

**Files:**
- Modify: `supabase/config.toml`
- Modify: `tests/e2e/global-setup.ts`
- Modify: `tests/e2e/password-auth.spec.ts`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/SECURITY.md`
- Modify: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Write the failing local/E2E expectations**

  Dans l’E2E, remplacer le scénario « creates, confirms and recovers » par un scénario qui soumet l’inscription puis attend directement `/direct`, le solde MKB et l’absence de message de confirmation. Dans le setup, attendre un utilisateur e-mail confirmé après création directe, pas un callback Mailpit de signup. Conserver le callback Mailpit pour `forgot-password`.

- [ ] **Step 2: Run the targeted E2E test to verify it fails**

  Run: `pnpm playwright test tests/e2e/password-auth.spec.ts --project=chromium-desktop`

  Expected: FAIL tant que `enable_confirmations = true` et l’UI exige le callback signup.

- [ ] **Step 3: Disable only signup confirmation**

  Mettre dans `supabase/config.toml` :

  ```toml
  [auth.email]
  enable_confirmations = false
  ```

  Conserver le SMTP, le rate limit et tous les paramètres de récupération. Dans les documents, remplacer « confirmation obligatoire » par « accès immédiat », indiquer que le changement Production doit être fait dans Supabase Auth (`Confirm email` désactivé), et conserver l’URL callback uniquement pour la récupération.

- [ ] **Step 4: Run the targeted E2E test to verify it passes**

  Run: `pnpm db:reset && pnpm playwright test tests/e2e/password-auth.spec.ts --project=chromium-desktop`

  Expected: PASS; l’inscription redirige directement et la récupération reste couverte.

- [ ] **Step 5: Commit the environment/documentation change**

  ```bash
  git add supabase/config.toml tests/e2e/global-setup.ts tests/e2e/password-auth.spec.ts README.md docs/ARCHITECTURE.md docs/SECURITY.md docs/DEPLOYMENT.md
  git commit -m "config: disable email confirmation for password signup"
  ```

### Task 3: Construire le modèle pur du calendrier UTC

**Files:**
- Create: `src/application/sportsbook/calendar-query.ts`
- Create: `src/application/sportsbook/market-calendar.ts`
- Create: `tests/market-calendar.test.ts`

- [ ] **Step 1: Write failing pure tests**

  Définir des marchés à `2026-07-20T10:00:00.000Z`, `2026-07-26T23:59:59.000Z` et hors semaine. Tester :

  ```ts
  expect(parseMarketCalendarSearchParams({ week: "2026-07-22" }).weekStart)
    .toBe("2026-07-20T00:00:00.000Z");
  expect(parseMarketCalendarSearchParams({ week: "not-a-date" }).weekStart)
    .toBe(defaultWeekStart);
  expect(groupMarketsByUtcDay(markets, weekStart)).toHaveLength(2);
  expect(toMarketCalendarEntry(closedMarket).bettingState).toBe("CLOSED");
  expect(entry.deadlineLabel).not.toBe(entry.closeLabel);
  ```

  Utiliser une date `now` passée explicitement aux helpers : aucun accès à `Date.now()` dans le module.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `pnpm vitest run tests/market-calendar.test.ts`

  Expected: FAIL car les modules n’existent pas.

- [ ] **Step 3: Implement the pure calendar modules**

  Créer un schéma Zod qui accepte `week` au format `YYYY-MM-DD`, `category` et `status` avec valeurs par défaut sûres. Exporter :

  ```ts
  export function getUtcWeekStart(date: Date): string;
  export function parseMarketCalendarSearchParams(input, now = new Date()): ParsedMarketCalendarSearchParams;
  export function groupMarketsByUtcDay(markets: readonly SportsbookMarket[], weekStart: string, now: Date): readonly MarketCalendarDay[];
  ```

  Calculer une semaine `[lundi 00:00Z, lundi suivant 00:00Z)`. Écarter les marchés dont `deadline` n’est pas dans cette fenêtre; les cartes conservent l’heure d’ouverture/feture depuis les champs persistants ajoutés à la forme UI. Ajouter ces champs lors du mapping, plutôt que de déduire une fermeture de `deadline`.

- [ ] **Step 4: Run focused tests to verify they pass**

  Run: `pnpm vitest run tests/market-calendar.test.ts`

  Expected: PASS avec valeurs invalides ramenées à la semaine sûre et libellés dates distincts.

- [ ] **Step 5: Commit the pure model**

  ```bash
  git add src/application/sportsbook/calendar-query.ts src/application/sportsbook/market-calendar.ts src/fixtures/sportsbook/types.ts src/data/supabase/markets/market-mappers.ts tests/market-calendar.test.ts
  git commit -m "feat: add UTC market calendar model"
  ```

### Task 4: Rendre le calendrier et le ticket lisibles

**Files:**
- Create: `src/app/(protected)/markets/calendar/page.tsx`
- Create: `src/components/sportsbook/market-calendar.tsx`
- Create: `src/components/sportsbook/market-calendar-controls.tsx`
- Modify: `src/application/sportsbook/navigation.ts`
- Modify: `src/components/sportsbook/desktop-sidebar.tsx`
- Modify: `src/components/sportsbook/mobile-bottom-navigation.tsx`
- Modify: `src/components/sportsbook/bet-slip.tsx`
- Modify: `src/components/sportsbook/bet-slip-selection.tsx`
- Modify: `tests/sportsbook-pages.test.tsx`
- Modify: `tests/betting-ui.test.tsx`

- [ ] **Step 1: Write failing rendering tests**

  Ajouter une page mockée qui attend : lien « Calendrier », titre « Calendrier des marchés », contrôle semaine précédente/suivante, dates « Ouverture », « Fermeture des mises », « Échéance du fait », et statut désactivé « Mises fermées ». Ajouter un ticket à deux jambes qui attend :

  ```tsx
  expect(screen.getByText("Combiné · 2 sélections")).toBeInTheDocument();
  expect(screen.getByText("Cote calculée par le devis officiel")).toBeInTheDocument();
  expect(screen.getByText(/corrélation/i)).toBeInTheDocument();
  ```

  Le test vérifie aussi qu’un simple rend « Simple · 1 sélection » et qu’aucun calcul client de cote naïve n’est introduit.

- [ ] **Step 2: Run focused UI tests to verify they fail**

  Run: `pnpm vitest run tests/sportsbook-pages.test.tsx tests/betting-ui.test.tsx`

  Expected: FAIL car la route, le lien et les textes du calendrier/combiné n’existent pas.

- [ ] **Step 3: Implement the route and presentational components**

  Dans la page, appeler `requireSportsbookSeason`, `parseMarketCalendarSearchParams`, puis `listSeasonMarkets(season.id, { category, status, sort: "deadline", q: "" })`; regrouper avant rendu. Construire les liens de semaine avec `week=YYYY-MM-DD` et conserver les filtres. Les contrôles sont de vrais liens, avec `aria-label` comprenant la semaine cible. Les cartes restent des liens vers `/markets/[marketId]`; aucune mutation ni nouvelle requête client.

  Dans le ticket, afficher les jambes dans l’ordre de sélection, le libellé de type, la cote `activeQuote.totalOdds` uniquement après devis, et un encart conditionnel sur `activeQuote.correlationExplanation` si ce champ existe déjà dans le DTO. Ne changer ni la Server Action ni les identifiants envoyés au devis.

- [ ] **Step 4: Run focused UI tests to verify they pass**

  Run: `pnpm vitest run tests/sportsbook-pages.test.tsx tests/betting-ui.test.tsx`

  Expected: PASS, y compris les landmarks, libellés et état fermé.

- [ ] **Step 5: Commit the protected UI**

  ```bash
  git add src/app/'(protected)'/markets/calendar/page.tsx src/components/sportsbook src/application/sportsbook/navigation.ts tests/sportsbook-pages.test.tsx tests/betting-ui.test.tsx
  git commit -m "feat: add market calendar and clearer accumulator ticket"
  ```

### Task 5: Vérifier le parcours complet et documenter l’état final

**Files:**
- Modify: `tests/e2e/password-auth.spec.ts`
- Create or Modify: `tests/e2e/market-calendar.spec.ts`
- Modify: `README.md`
- Modify: `docs/PRODUCT.md`
- Modify: `docs/BETTING.md`
- Modify: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Write the failing browser scenarios**

  Ajouter : inscription mot de passe → `/direct` sans ouverture de Mailpit; membre authentifié → `/markets/calendar` → semaine suivante → marché fermé non sélectionnable; ticket combiné autorisé affiche l’explication du devis; combinaison invalide affiche le refus sans placement.

- [ ] **Step 2: Run targeted E2E tests to verify they fail before the UI implementation**

  Run: `pnpm playwright test tests/e2e/password-auth.spec.ts tests/e2e/market-calendar.spec.ts --project=chromium-desktop`

  Expected: FAIL uniquement avant que les Tasks 1–4 soient terminées; après les Tasks 1–4, les mêmes scénarios doivent être verts.

- [ ] **Step 3: Update product documentation**

  Documenter l’accès immédiat, le fait que le callback e-mail sert uniquement à la récupération, le calendrier UTC et la différence fermeture des mises/échéance. Décrire clairement que les combinés restent calculés par PostgreSQL, dans la limite de deux ou trois marchés et d’une règle de corrélation existante.

- [ ] **Step 4: Run the complete validation suite**

  Run:

  ```bash
  pnpm format
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm db:reset
  pnpm db:lint
  pnpm db:test:single-room
  pnpm db:test:betting
  pnpm test:e2e
  pnpm db:stop
  pnpm build
  pnpm install --frozen-lockfile
  rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' '(sb_secret_|service_role|SUPABASE_SERVICE_ROLE_KEY=)' .
  git diff --check
  ```

  Expected: toutes les commandes passent; le scan ne remonte aucun secret réel; `git diff --name-only` ne contient aucun fichier sous `supabase/migrations/` ni `src/domain/odds/`.

- [ ] **Step 5: Update final state and commit**

  Mettre les comptes de tests réellement obtenus et les contrôles Production restant manuels dans `docs/CURRENT_STATE.md`, puis :

  ```bash
  git add README.md docs/PRODUCT.md docs/BETTING.md docs/CURRENT_STATE.md tests/e2e
  git commit -m "docs: document immediate access and market deadlines"
  ```

### Task 6: Appliquer et vérifier le réglage Supabase Production

**Files:**
- Modify: `docs/CURRENT_STATE.md`
- Modify: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Verify the linked remote project without printing credentials**

  Run: `pnpm exec supabase projects list` and compare the linked project reference with the Production project documented for MK Bet. Do not run a schema push and do not print API keys.

- [ ] **Step 2: Disable Confirm email in the authenticated Supabase project**

  Use the Supabase dashboard or its supported configuration command to set **Authentication → Providers → Email → Confirm email** to disabled. Do not alter recovery emails, password minimum, site URL, redirect URL, SMTP or RLS.

- [ ] **Step 3: Verify the deployed behavior**

  On the Vercel Production deployment, create a fresh throwaway account through `/login`; verify direct `/direct` access and initial MKB once. Then initiate password recovery and verify its e-mail callback still reaches `/auth/update-password`.

- [ ] **Step 4: Record only non-sensitive evidence**

  Record date, environment, and success/failure in `docs/CURRENT_STATE.md`. Never include e-mail addresses, tokens, password, cookies or API keys.

- [ ] **Step 5: Commit documentation evidence**

  ```bash
  git add docs/CURRENT_STATE.md docs/DEPLOYMENT.md
  git commit -m "docs: record production immediate access verification"
  ```
