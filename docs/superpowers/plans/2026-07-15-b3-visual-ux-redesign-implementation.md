# MK Bet B3 Visual UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refaire entièrement l’interface MK Bet dans la direction B3 « Halo nocturne », sur desktop et mobile, sans modifier les contrats Supabase, les migrations, les règles de pari ou le moteur de cotes.

**Architecture:** Conserver les Server Components, Server Actions, repositories et contextes existants. Introduire quatre primitives visuelles composables, appliquer les nouveaux tokens dans Tailwind v4/CSS, puis migrer les surfaces par parcours utilisateur en TDD. Les données et mutations restent strictement identiques ; seule leur hiérarchie et leur présentation changent.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, CSS variables, Lucide React existant, Vitest, Testing Library, Playwright Chromium, axe-core.

---

## Structure de fichiers

### Nouvelles primitives

- `src/components/ui/glass-surface.tsx` : surface de verre avec variantes typées.
- `src/components/ui/page-intro.tsx` : titre de page, contexte et action principale.
- `src/components/ui/segmented-filter.tsx` : filtres accessibles reposant sur des liens.
- `src/components/ui/inline-notice.tsx` : messages succès, erreur et avertissement.
- `tests/visual-primitives.test.tsx` : contrats sémantiques et classes critiques.

### Fichiers de shell

- `src/styles/globals.css`
- `src/components/sportsbook/app-shell.tsx`
- `src/components/sportsbook/desktop-sidebar.tsx`
- `src/components/sportsbook/top-header.tsx`
- `src/components/sportsbook/mobile-bottom-navigation.tsx`
- `src/components/sportsbook/navigation-link.tsx`
- `src/components/sportsbook/mobile-bet-slip.tsx`

### Parcours à migrer

- Direct : `src/app/(protected)/direct/page.tsx`, `src/components/events/event-report-card.tsx`, `src/components/events/event-vote-controls.tsx`.
- Marchés : `src/app/(protected)/markets/page.tsx`, `src/app/(protected)/markets/[marketId]/page.tsx`, `src/components/sportsbook/market-card.tsx`, `src/components/sportsbook/odds-button.tsx`, `src/components/sportsbook/category-tabs.tsx`.
- Ticket : `src/components/sportsbook/bet-slip.tsx`, `src/components/sportsbook/bet-slip-selection.tsx`, `src/app/(protected)/bets/page.tsx`.
- Déclaration : `src/app/(protected)/report/page.tsx`, `src/components/events/event-report-form.tsx`.
- Classement et compte : `src/app/(protected)/leaderboard/page.tsx`, `src/app/(protected)/settings/account/page.tsx`, `src/components/account/account-form.tsx`.
- Public et états : `src/app/page.tsx`, `src/app/login/page.tsx`, `src/components/auth/login-form.tsx`, `src/components/layout/site-header.tsx`, `src/components/layout/site-footer.tsx`, `src/components/layout/status-page.tsx`, `src/components/states/*.tsx`.

---

### Task 1: Stabiliser le callback Auth déjà déployé et figer la baseline

**Files:**

- Modify: `src/app/auth/callback/route.ts`
- Test: `tests/auth-callback-route.test.ts`
- Modify: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Compléter les tests des quatre branches d’échec**

Ajouter à `tests/auth-callback-route.test.ts` des cas qui exigent les étapes stables sans donnée sensible :

```ts
it.each([
  ["missing_code", "https://mk-bet.vercel.app/auth/callback"],
  ["exchange", "https://mk-bet.vercel.app/auth/callback?code=secret-code"],
])("redirects a %s failure without leaking the token", async (reason, url) => {
  if (reason === "exchange") {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("private") });
  }
  const response = await GET(new NextRequest(url));
  expect(response.headers.get("location")).toContain(`reason=${reason}`);
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain("secret-code");
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain("private");
});
```

Configurer ensuite `rpc.mockImplementationOnce` pour vérifier séparément `profile` puis `room`.

- [ ] **Step 2: Exécuter le test ciblé**

Run: `pnpm exec vitest run tests/auth-callback-route.test.ts`

Expected: les quatre branches et la redirection réussie passent ; aucun message brut Supabase n’apparaît.

- [ ] **Step 3: Documenter la validation manuelle Production**

Dans `docs/CURRENT_STATE.md`, remplacer la limite indiquant qu’un essai magic-link reste à faire par :

```md
Le magic link Production a été validé manuellement le 15 juillet 2026 : le callback crée la session puis `/direct`, `/markets`, `/report`, `/bets` et `/leaderboard` répondent sous session authentifiée.
```

- [ ] **Step 4: Vérifier et committer la correction Auth**

Run: `pnpm typecheck && pnpm exec vitest run tests/auth-callback-route.test.ts && git diff --check`

Expected: succès.

```bash
git add src/app/auth/callback/route.ts tests/auth-callback-route.test.ts docs/CURRENT_STATE.md
git commit -m "fix: diagnose auth callback failures safely"
```

### Task 2: Créer les tokens B3 et les primitives visuelles

**Files:**

- Modify: `src/styles/globals.css`
- Create: `src/components/ui/glass-surface.tsx`
- Create: `src/components/ui/page-intro.tsx`
- Create: `src/components/ui/segmented-filter.tsx`
- Create: `src/components/ui/inline-notice.tsx`
- Test: `tests/visual-primitives.test.tsx`

- [ ] **Step 1: Écrire les tests rouges des primitives**

Créer `tests/visual-primitives.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlassSurface } from "@/components/ui/glass-surface";
import { InlineNotice } from "@/components/ui/inline-notice";
import { PageIntro } from "@/components/ui/page-intro";
import { SegmentedFilter } from "@/components/ui/segmented-filter";

describe("B3 visual primitives", () => {
  it("renders a semantic page intro with an optional action", () => {
    render(
      <PageIntro
        eyebrow="Salle privée"
        title="Le groupe fait le marché"
        action={<a href="/report">Déclarer</a>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Le groupe fait le marché",
    );
    expect(screen.getByRole("link", { name: "Déclarer" })).toHaveAttribute(
      "href",
      "/report",
    );
  });

  it("marks the active segment independently from color", () => {
    render(
      <SegmentedFilter
        ariaLabel="Filtrer"
        items={[
          { href: "/direct", label: "À vérifier", active: true },
          { href: "/direct?vue=confirmed", label: "Confirmés", active: false },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "À vérifier" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("uses a status role for notices", () => {
    render(<InlineNotice tone="success">Vote enregistré</InlineNotice>);
    expect(screen.getByRole("status")).toHaveTextContent("Vote enregistré");
  });

  it("supports opaque fallback content", () => {
    render(<GlassSurface variant="opaque">Règle lisible</GlassSurface>);
    expect(screen.getByText("Règle lisible")).toHaveAttribute(
      "data-surface",
      "opaque",
    );
  });
});
```

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/visual-primitives.test.tsx`

Expected: FAIL car les quatre composants n’existent pas.

- [ ] **Step 3: Implémenter les primitives typées**

Implémenter `GlassSurface` sans booléens de présentation :

```tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

const surfaceClasses = {
  subtle: "mk-glass-subtle",
  interactive: "mk-glass-interactive",
  opaque: "mk-surface-opaque",
} as const;

export function GlassSurface<T extends ElementType = "div">({
  as,
  variant = "subtle",
  className,
  children,
  ...props
}: {
  as?: T;
  variant?: keyof typeof surfaceClasses;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">) {
  const Component = as ?? "div";
  return (
    <Component
      className={cn(surfaceClasses[variant], className)}
      data-surface={variant}
      {...props}
    >
      {children}
    </Component>
  );
}
```

`PageIntro` rend un `<header>`, `SegmentedFilter` un `<nav aria-label>`, et `InlineNotice` un `<div role="status">` avec les tons `success | warning | error | neutral`.

- [ ] **Step 4: Remplacer les variables globales et ajouter les fallbacks**

Dans `src/styles/globals.css`, définir les tokens de la spécification et les classes :

```css
:root {
  color-scheme: dark;
  --background: #08080b;
  --surface: #111116;
  --surface-raised: #18151a;
  --surface-subtle: rgba(255, 255, 255, 0.07);
  --foreground: #faf7f5;
  --text-primary: #faf7f5;
  --text-secondary: #b8afb3;
  --text-muted: #91888c;
  --brand: #ff3453;
  --brand-hover: #ff5a72;
  --brand-active: #e72746;
  --border: rgba(255, 255, 255, 0.14);
  --positive: #42c77a;
  --negative: #ff5d67;
  --warning: #f4b860;
}

.mk-glass-subtle,
.mk-glass-interactive {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--border);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.12),
    0 18px 45px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(20px);
}

@supports not (backdrop-filter: blur(1px)) {
  .mk-glass-subtle,
  .mk-glass-interactive {
    background: #18151a;
  }
}
```

Ajouter le fond à halos, le grain statique, les chiffres tabulaires, le focus renforcé et les règles reduced-motion.

- [ ] **Step 5: Vérifier puis committer les fondations**

Run: `pnpm exec vitest run tests/visual-primitives.test.tsx && pnpm typecheck && pnpm lint`

Expected: succès sans avertissement.

```bash
git add src/styles/globals.css src/components/ui tests/visual-primitives.test.tsx
git commit -m "feat: add b3 nocturnal design foundations"
```

### Task 3: Refaire le shell responsive et la navigation

**Files:**

- Modify: `src/components/sportsbook/app-shell.tsx`
- Modify: `src/components/sportsbook/desktop-sidebar.tsx`
- Modify: `src/components/sportsbook/top-header.tsx`
- Modify: `src/components/sportsbook/mobile-bottom-navigation.tsx`
- Modify: `src/components/sportsbook/navigation-link.tsx`
- Modify: `src/components/sportsbook/mobile-bet-slip.tsx`
- Test: `tests/sportsbook-ui.test.tsx`
- Test: `tests/protected-layout.test.tsx`

- [ ] **Step 1: Ajouter les assertions rouges du shell B3**

Dans `tests/sportsbook-ui.test.tsx`, exiger :

```tsx
expect(
  screen.getByRole("navigation", { name: "Navigation principale" }),
).toHaveClass("mk-sidebar");
expect(
  screen.getByRole("navigation", { name: "Navigation mobile" }),
).toHaveClass("mk-mobile-nav");
expect(screen.getByRole("link", { name: /Direct/ })).toHaveAttribute(
  "aria-current",
  "page",
);
expect(screen.getByText("1 000 MKB")).toHaveClass("tabular-nums");
expect(
  screen.queryByText("Deux votes concordants suffisent"),
).not.toBeInTheDocument();
```

Conserver les assertions existantes sur le skip link et les cinq liens mobiles.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/sportsbook-ui.test.tsx tests/protected-layout.test.tsx`

Expected: FAIL sur les nouvelles classes et l’ancien encart de sidebar.

- [ ] **Step 3: Implémenter la composition desktop**

Dans `app-shell.tsx`, utiliser la grille cible :

```tsx
<div className="mk-app-background min-h-dvh text-[var(--text-primary)]">
  <a className="mk-skip-link" href="#main-content">
    Aller au contenu principal
  </a>
  <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)]">
    <DesktopSidebar />
    <div className="min-w-0 pb-36 lg:pb-8">
      <TopHeader season={season} />
      <div className="mx-auto grid w-full max-w-[96rem] gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <BetSlip balanceMkb={season.balanceMkb} seasonId={season.id} />
          </div>
        </aside>
      </div>
    </div>
  </div>
</div>
```

La sidebar ne contient que marque, salle et navigation. Le header rend le solde et le lien Compte ; la déconnexion est retirée du header.

- [ ] **Step 4: Implémenter navigation et ticket mobile**

Le lien actif reçoit une barre framboise, une icône et `aria-current`. La navigation basse utilise `mk-mobile-nav`, les safe areas et cinq colonnes. `MobileBetSlip` conserve `aria-expanded`, Échap et retour de focus, mais utilise une surface de verre et un panneau `role="region"`.

- [ ] **Step 5: Vérifier responsive et committer**

Run: `pnpm exec vitest run tests/sportsbook-ui.test.tsx tests/protected-layout.test.tsx && pnpm typecheck`

Expected: navigation desktop/mobile, compte, ticket et focus passent.

```bash
git add src/components/sportsbook/app-shell.tsx src/components/sportsbook/desktop-sidebar.tsx src/components/sportsbook/top-header.tsx src/components/sportsbook/mobile-bottom-navigation.tsx src/components/sportsbook/navigation-link.tsx src/components/sportsbook/mobile-bet-slip.tsx tests/sportsbook-ui.test.tsx tests/protected-layout.test.tsx
git commit -m "feat: rebuild b3 responsive sportsbook shell"
```

### Task 4: Refaire le Direct et les votes

**Files:**

- Modify: `src/app/(protected)/direct/page.tsx`
- Modify: `src/app/(protected)/direct/loading.tsx`
- Modify: `src/components/events/event-report-card.tsx`
- Modify: `src/components/events/event-vote-controls.tsx`
- Test: `tests/event-report-ui.test.tsx`

- [ ] **Step 1: Écrire les assertions rouges de hiérarchie**

Ajouter dans `tests/event-report-ui.test.tsx` :

```tsx
expect(
  screen.getByRole("heading", { level: 1, name: /Le groupe fait le marché/ }),
).toBeInTheDocument();
expect(
  screen.getByRole("navigation", { name: "Filtrer les événements" }),
).toBeInTheDocument();
expect(screen.getByRole("article")).toHaveAttribute(
  "data-report-status",
  "PENDING",
);
expect(screen.getByText("1 validation sur 2")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Valider ce fait" })).toBeEnabled();
expect(screen.getByRole("button", { name: "Invalider ce fait" })).toBeEnabled();
```

Conserver les tests interdisant le vote de l’auteur et vérifiant l’URL privée `/api/media/:id`.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/event-report-ui.test.tsx`

Expected: FAIL sur le nouveau titre, les libellés de boutons et les attributs de statut.

- [ ] **Step 3: Recomposer la page Direct**

Remplacer le bloc bordeaux par `PageIntro` :

```tsx
<PageIntro
  eyebrow="Salle privée · 7 membres"
  title={
    <>
      Le groupe fait <span className="text-[var(--brand)]">le marché.</span>
    </>
  }
  description="Une preuve, deux votes, une décision. Tout se joue entre nous."
  action={
    <Link className="mk-primary-action" href="/report">
      Déclarer
    </Link>
  }
/>
```

Utiliser `SegmentedFilter` pour les trois vues avec le nombre de rapports filtrés dans le libellé actif.

- [ ] **Step 4: Recomposer la carte et les contrôles**

`EventReportCard` rend `data-report-status`, place la preuve avant le texte sur mobile, affiche une barre de progression et donne à chaque bouton un nom accessible explicite. Pour `PENDING`, utiliser `GlassSurface variant="interactive"`; pour les états clos, utiliser `opaque`.

Le composant vote garde exactement les mêmes appels et ajoute un état de soumission :

```tsx
<button aria-label="Valider ce fait" disabled={isPending} onClick={() => vote("CONFIRM")}>...</button>
<button aria-label="Invalider ce fait" disabled={isPending} onClick={() => vote("REJECT")}>...</button>
```

- [ ] **Step 5: Vérifier puis committer le Direct**

Run: `pnpm exec vitest run tests/event-report-ui.test.tsx tests/event-report-actions.test.ts`

Expected: UI et mutations existantes passent.

```bash
git add 'src/app/(protected)/direct' src/components/events/event-report-card.tsx src/components/events/event-vote-controls.tsx tests/event-report-ui.test.tsx
git commit -m "feat: redesign direct evidence and voting flow"
```

### Task 5: Refaire les marchés, les cotes et le ticket transactionnel

**Files:**

- Modify: `src/app/(protected)/markets/page.tsx`
- Modify: `src/app/(protected)/markets/[marketId]/page.tsx`
- Modify: `src/components/sportsbook/category-tabs.tsx`
- Modify: `src/components/sportsbook/market-card.tsx`
- Modify: `src/components/sportsbook/odds-button.tsx`
- Modify: `src/components/sportsbook/bet-slip.tsx`
- Modify: `src/components/sportsbook/bet-slip-selection.tsx`
- Test: `tests/betting-ui.test.tsx`
- Test: `tests/sportsbook-pages.test.tsx`

- [ ] **Step 1: Ajouter les tests rouges des états de cote et du devis**

Dans `tests/betting-ui.test.tsx`, exiger :

```tsx
expect(screen.getByRole("button", { name: /Oui, cote 1,72/ })).toHaveAttribute(
  "aria-pressed",
  "false",
);
await user.click(screen.getByRole("button", { name: /Oui, cote 1,72/ }));
expect(screen.getByRole("button", { name: /Oui, cote 1,72/ })).toHaveAttribute(
  "aria-pressed",
  "true",
);
expect(
  screen.getByRole("complementary", { name: "Ticket de pari" }),
).toHaveAttribute("data-ticket-step", "selection");
```

Après création d’un devis mocké, exiger `data-ticket-step="quote"`, le compte à rebours et la comparaison de cote en cas de `ODDS_CHANGED`.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/betting-ui.test.tsx tests/sportsbook-pages.test.tsx`

Expected: FAIL sur les nouveaux attributs et la nouvelle hiérarchie.

- [ ] **Step 3: Simplifier Marchés pour deux marchés réels**

Utiliser `PageIntro`, transformer le formulaire de filtre en surface compacte et ne pas afficher les catégories vides. La carte marché utilise une surface opaque pour le texte et deux `OddsButton` larges. Le bouton de cote sélectionné reçoit :

```tsx
selected
  ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_22%,transparent)] shadow-[0_0_24px_rgba(255,52,83,.28)] -translate-y-0.5"
  : "border-[var(--border)] bg-white/[0.06] hover:bg-white/[0.1]";
```

Le statut suspendu conserve `disabled`, le cadenas, le libellé et la raison.

- [ ] **Step 4: Refaire la fiche marché**

Conserver le calcul SVG existant. Ajouter un `<defs>` avec un filtre lumineux léger, utiliser `var(--brand)` pour la ligne et rendre la liste des points dans `GlassSurface variant="opaque"`. La règle de règlement reste du texte sélectionnable.

- [ ] **Step 5: Recomposer les trois étapes du ticket**

Ajouter :

```ts
const ticketStep = activeQuote
  ? "quote"
  : betSlip.selections.length
    ? "selection"
    : "empty";
```

Puis :

```tsx
<aside aria-label="Ticket de pari" data-ticket-step={ticketStep} className="mk-ticket-panel">
```

Ne modifier ni `createBetQuoteAction`, ni `placeBetAction`, ni le calcul de `currentBasis`. Les textes techniques détaillés passent dans un `<details>` nommé « Comment le ticket est sécurisé ».

- [ ] **Step 6: Vérifier puis committer marchés et ticket**

Run: `pnpm exec vitest run tests/betting-ui.test.tsx tests/betting-application.test.ts tests/sportsbook-pages.test.tsx`

Expected: sélection, devis, expiration, changement de cote, placement et double-clic restent couverts.

```bash
git add 'src/app/(protected)/markets' src/components/sportsbook/category-tabs.tsx src/components/sportsbook/market-card.tsx src/components/sportsbook/odds-button.tsx src/components/sportsbook/bet-slip.tsx src/components/sportsbook/bet-slip-selection.tsx tests/betting-ui.test.tsx tests/sportsbook-pages.test.tsx
git commit -m "feat: redesign markets odds and transactional ticket"
```

### Task 6: Refaire Déclarer et Mes paris

**Files:**

- Modify: `src/app/(protected)/report/page.tsx`
- Modify: `src/components/events/event-report-form.tsx`
- Modify: `src/app/(protected)/bets/page.tsx`
- Test: `tests/event-report-ui.test.tsx`
- Test: `tests/sportsbook-pages.test.tsx`

- [ ] **Step 1: Ajouter les tests rouges du formulaire progressif**

Tester les quatre groupes :

```tsx
expect(screen.getByRole("group", { name: "1. Événement" })).toBeInTheDocument();
expect(screen.getByRole("group", { name: "2. Moment" })).toBeInTheDocument();
expect(
  screen.getByRole("group", { name: "3. Marché concerné" }),
).toBeInTheDocument();
expect(
  screen.getByRole("group", { name: "4. Preuves privées" }),
).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Envoyer au vote" })).toBeEnabled();
```

Vérifier également que le choix marché continue d’afficher l’issue correspondante.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/event-report-ui.test.tsx tests/sportsbook-pages.test.tsx`

Expected: FAIL sur les groupes numérotés.

- [ ] **Step 3: Recomposer sans transformer en assistant multi-page**

Envelopper chaque bloc dans :

```tsx
<fieldset className="mk-form-step">
  <legend>
    <span aria-hidden="true">01</span> Événement
  </legend>
  ...
</fieldset>
```

Pour conserver le nom accessible demandé, utiliser `aria-label="1. Événement"`. Ajouter un résumé du nombre de fichiers via `aria-live`, sans lire leur contenu ni les stocker.

- [ ] **Step 4: Recomposer Mes paris**

Utiliser `SegmentedFilter` pour Ouverts, Réglés, Tous. Chaque ticket devient un article opaque avec statut, mise, cote figée, retour, identifiant et liste de jambes. Les valeurs utilisent `tabular-nums`; les termes financiers restent identiques.

- [ ] **Step 5: Vérifier puis committer**

Run: `pnpm exec vitest run tests/event-report-ui.test.tsx tests/event-report-actions.test.ts tests/sportsbook-pages.test.tsx`

Expected: formulaire, upload, nettoyage compensatoire et affichage des paris passent.

```bash
git add 'src/app/(protected)/report' 'src/app/(protected)/bets' src/components/events/event-report-form.tsx tests/event-report-ui.test.tsx tests/sportsbook-pages.test.tsx
git commit -m "feat: redesign reporting and bet history flows"
```

### Task 7: Refaire Classement, Compte et états système

**Files:**

- Modify: `src/app/(protected)/leaderboard/page.tsx`
- Modify: `src/app/(protected)/settings/account/page.tsx`
- Modify: `src/components/account/account-form.tsx`
- Modify: `src/components/states/empty-state.tsx`
- Modify: `src/components/states/error-state.tsx`
- Modify: `src/components/states/loading-skeleton.tsx`
- Modify: `src/components/states/not-configured-state.tsx`
- Test: `tests/sportsbook-pages.test.tsx`
- Test: `tests/auth-ui.test.tsx`

- [ ] **Step 1: Ajouter les tests rouges du classement responsive**

Dans `tests/sportsbook-pages.test.tsx`, exiger un podium et une liste :

```tsx
expect(screen.getByRole("region", { name: "Podium MKB" })).toBeInTheDocument();
expect(screen.getByText("#1")).toBeInTheDocument();
expect(
  screen.getByRole("list", { name: "Classement complet" }),
).toBeInTheDocument();
expect(screen.queryByRole("table")).not.toBeInTheDocument();
```

Dans `tests/auth-ui.test.tsx`, exiger que l’email reste dans Compte mais jamais dans le `<h1>`.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/sportsbook-pages.test.tsx tests/auth-ui.test.tsx`

Expected: FAIL car le classement est encore une table.

- [ ] **Step 3: Implémenter le podium et la liste**

Séparer `rows.slice(0, 3)` et `rows.slice(3)`. Le podium utilise trois articles `GlassSurface`; la liste utilise `<ol aria-label="Classement complet">`. Conserver exactement `capitalMkb`, `totalStakedMkb`, `totalReturnedMkb` et `netProfitMkb`.

- [ ] **Step 4: Refaire Compte et les états**

Compte utilise `PageIntro`, une surface opaque et une zone de déconnexion distincte. Les champs conservent leurs noms, autocomplete et action. Les composants d’état utilisent les nouvelles primitives ; `LoadingSkeleton` rend les formes rapport + marché et conserve `role="status"`.

- [ ] **Step 5: Vérifier puis committer**

Run: `pnpm exec vitest run tests/sportsbook-pages.test.tsx tests/auth-ui.test.tsx tests/auth-contracts.test.ts`

Expected: succès.

```bash
git add 'src/app/(protected)/leaderboard' 'src/app/(protected)/settings/account' src/components/account src/components/states tests/sportsbook-pages.test.tsx tests/auth-ui.test.tsx
git commit -m "feat: redesign leaderboard account and system states"
```

### Task 8: Refaire l’accueil public, la connexion et les pages de statut

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/auth/login-form.tsx`
- Modify: `src/components/layout/site-header.tsx`
- Modify: `src/components/layout/site-footer.tsx`
- Modify: `src/components/layout/status-page.tsx`
- Test: `tests/home.test.tsx`
- Test: `tests/auth-ui.test.tsx`
- Test: `tests/e2e/public-interface.spec.ts`

- [ ] **Step 1: Ajouter les tests rouges du poster public**

Dans `tests/home.test.tsx` :

```tsx
expect(
  screen.getByRole("heading", { name: /Tout se joue entre nous/ }),
).toBeInTheDocument();
expect(
  screen.getByRole("link", { name: /Entrer dans la salle/ }),
).toHaveAttribute("href", "/login?next=/direct");
expect(screen.getByText(/100 % monnaie fictive/)).toBeInTheDocument();
expect(screen.queryByText(/1 000 MKB/)).not.toBeInTheDocument();
expect(document.querySelector("[data-public-aurora]")).toBeInTheDocument();
```

Dans `tests/auth-ui.test.tsx`, vérifier l’état succès du magic link et l’absence de token/email dans le HTML.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/home.test.tsx tests/auth-ui.test.tsx`

Expected: FAIL sur le nouveau titre et l’aurora.

- [ ] **Step 3: Implémenter accueil et connexion**

L’accueil rend un premier viewport plein écran sans donnée privée. La connexion place `LoginForm` dans une surface de verre. Après succès, `LoginForm` masque les champs et rend :

```tsx
if (state.ok && state.message) {
  return (
    <InlineNotice tone="success">
      <h1>Vérifie ta boîte mail</h1>
      <p>{state.message}</p>
    </InlineNotice>
  );
}
```

Le formulaire initial conserve `email`, `displayName`, `next` et la Server Action existante.

- [ ] **Step 4: Harmoniser les pages de statut**

`StatusPage` utilise le même fond aurora, la marque et une surface opaque. Ne jamais afficher `reason`, exception, email ou token ; le query param du diagnostic reste uniquement destiné aux journaux et à l’URL technique.

- [ ] **Step 5: Vérifier puis committer**

Run: `pnpm exec vitest run tests/home.test.tsx tests/auth-ui.test.tsx tests/auth-contracts.test.ts tests/health.test.ts`

Expected: accueil, login, auth/error et health passent sans configuration Supabase active.

```bash
git add src/app/page.tsx src/app/login/page.tsx src/components/auth/login-form.tsx src/components/layout tests/home.test.tsx tests/auth-ui.test.tsx tests/e2e/public-interface.spec.ts
git commit -m "feat: redesign public entry and authentication ui"
```

### Task 9: Audit visuel, accessibilité, documentation et promotion

**Files:**

- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/responsive-matrix.spec.ts`
- Create: `tests/e2e/visual-audit.spec.ts`
- Modify: `tests/e2e/visual-audit.spec.ts-snapshots/*.png`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DESIGN_SYSTEM.md`
- Modify: `docs/PRODUCT.md`
- Modify: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Étendre les contrôles E2E avant mise à jour des snapshots**

Ajouter les assertions suivantes :

```ts
await expect(page.locator("html")).toHaveCSS("min-width", "320px");
await expect(
  page.getByRole("navigation", { name: "Navigation mobile" }),
).toBeVisible();
await expect(
  page.getByRole("button", { name: /cote/ }).first(),
).toHaveAttribute("aria-pressed", "false");
await page.keyboard.press("Tab");
await expect(page.locator(":focus-visible")).toBeVisible();
expect(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
).toBe(true);
```

Tester à 320, 390, 768, 1024 et 1440 px. Conserver le refus anonyme des médias privés.

- [ ] **Step 2: Lancer la suite sans mettre à jour les snapshots**

Run: `pnpm test:e2e`

Expected: parcours fonctionnels et axe passent ; seuls les snapshots visuels B3 échouent par différence attendue.

- [ ] **Step 3: Inspecter puis mettre à jour les snapshots**

Run: `pnpm exec playwright test tests/e2e/visual-audit.spec.ts --update-snapshots`

Expected: nouveaux snapshots pour accueil/login, Direct desktop, Marchés desktop/mobile et ticket mobile. Vérifier visuellement qu’aucun masque ne couvre solde, cotes, classement ou contenu métier.

- [ ] **Step 4: Documenter le système livré**

Mettre `docs/DESIGN_SYSTEM.md` en conformité avec les tokens B3, surfaces, contrastes, motion et fallbacks. Dans `docs/CURRENT_STATE.md`, inscrire les comptes réels de tests et la validation magic-link. README, Product et Architecture décrivent le shell nocturne et confirment que la refonte n’affecte pas les données.

- [ ] **Step 5: Exécuter la validation complète**

Run, dans cet ordre :

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm db:start
pnpm db:reset
pnpm exec supabase db lint --local
pnpm db:test:rls
pnpm db:test:betting
pnpm db:test:lives
pnpm db:test:media
pnpm db:test:single-room
pnpm test:e2e
pnpm exec playwright test --repeat-each=2
pnpm db:stop
pnpm build
pnpm install --frozen-lockfile
```

Expected: tous les contrôles réussissent ; seuls les skips croisés explicitement prévus par les projets Playwright restent présents.

- [ ] **Step 6: Vérifier les frontières et secrets**

Run :

```bash
git diff --exit-code 1ff559d -- supabase/migrations src/domain/odds
git grep -nE 'sb_secret_|service_role|SUPABASE_ACCESS_TOKEN|VERCEL_TOKEN' -- ':!pnpm-lock.yaml'
find public .next -type f -regextype posix-extended -regex '.*\.(jpg|jpeg|png|webp)$' -print
git status --short
```

Expected: aucun changement migration/odds, aucun secret réel, aucune photo personnelle ajoutée aux assets publics ou statiques, worktree limité aux fichiers de refonte et documentation.

- [ ] **Step 7: Commit final et promotion Production**

```bash
git add README.md docs src tests
git commit -m "feat: complete b3 ux ui redesign"
git push origin main
vercel --prod --yes
```

Après déploiement, vérifier `/`, `/api/health`, `/login`, un magic link neuf, `/direct`, `/markets`, la sélection d’une cote, le ticket, `/report`, `/bets` et `/leaderboard`. Ne modifier Supabase Production : aucune migration n’est requise par cette refonte.
