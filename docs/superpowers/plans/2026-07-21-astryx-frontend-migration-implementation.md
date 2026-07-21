# Astryx Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every MK Bet public, authenticated, sportsbook, and administrative interface with Astryx 0.1.7 using the Neutral dark theme, while preserving all existing business, Supabase, RLS, and odds contracts.

**Architecture:** Mount Astryx `Theme` and `LinkProvider` in one client leaf under the Next.js root layout, then compose the published Astryx primitives inside focused MK Bet domain components. Tailwind remains only for responsive layout and spacing; the final cutover deletes the parallel B3 visual primitives and tokens without touching data repositories, migrations, or `src/domain/odds`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Astryx 0.1.7, StyleX 0.19.0, Tailwind CSS 4, Supabase SSR, Vitest, Testing Library, Playwright, axe.

---

## File structure and boundaries

Create these focused files:

- `src/components/astryx/providers.tsx` — client-only Astryx theme/link/toast provider leaf.
- `src/components/astryx/page-heading.tsx` — MK Bet page-heading composition using Astryx typography and actions.
- `src/components/astryx/async-state.tsx` — application-specific loading, empty, error, and not-configured composition.
- `src/components/sportsbook/app-navigation.tsx` — one Astryx navigation implementation shared by desktop and mobile shell render modes.
- `src/components/sportsbook/account-menu.tsx` — account, season, admin access, and logout menu.
- `src/components/sportsbook/today-summary.tsx` — serializable presentation component for `/direct` summary.
- `tests/astryx-foundation.test.tsx` — provider and dependency integration contracts.
- `tests/astryx-shell.test.tsx` — navigation, role, landmark, and active-route contracts.
- `tests/astryx-auth-ui.test.tsx` — Astryx Auth rendering and accessible state contracts.
- `tests/astryx-sportsbook-ui.test.tsx` — Astryx sportsbook and ticket contracts.

Modify the existing page and domain-component files in place. Do not move repositories, actions, or domain models. Delete B3-only files only after `rg` proves they have no consumers.

### Task 1: Create an isolated implementation worktree and freeze the baseline

**Files:**

- Read: `AGENTS.md`
- Read: `docs/superpowers/specs/2026-07-21-astryx-frontend-migration-design.md`
- Read: `docs/CURRENT_STATE.md`
- Create through Git: `.worktrees/astryx-frontend/`

- [ ] **Step 1: Confirm the starting branch is clean**

Run:

```bash
git status --short --branch
git log -3 --oneline
```

Expected: no tracked or untracked changes and `main` contains `f7908d8` plus the committed implementation plan.

- [ ] **Step 2: Create the isolated worktree**

Use `superpowers:using-git-worktrees`, then run:

```bash
git worktree add .worktrees/astryx-frontend -b feat/astryx-frontend
```

Expected: the new branch is checked out under `.worktrees/astryx-frontend` and the main workspace remains untouched.

- [ ] **Step 3: Record immutable-path hashes**

Run from the worktree:

```bash
git diff --quiet main -- supabase/migrations src/domain/odds
find supabase/migrations src/domain/odds -type f -print0 | sort -z | xargs -0 sha256sum > /tmp/mkbet-astryx-immutable.sha256
```

Expected: `git diff` exits 0 and the hash manifest is created outside the repository.

- [ ] **Step 4: Run the fast baseline**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Expected: all current checks pass before Astryx is introduced. Do not continue with an unexplained failure.

### Task 2: Install and mount the Astryx foundation

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/components/astryx/providers.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/styles/globals.css`
- Create: `tests/astryx-foundation.test.tsx`
- Modify: `tests/setup.ts`

- [ ] **Step 1: Write the failing provider contract**

Create `tests/astryx-foundation.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AstryxProviders } from "@/components/astryx/providers";

describe("Astryx foundation", () => {
  it("mounts the neutral dark theme without hiding its children", () => {
    render(
      <AstryxProviders>
        <a href="/markets">Marchés</a>
      </AstryxProviders>,
    );

    expect(screen.getByRole("link", { name: "Marchés" })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
```

Add deterministic browser shims to `tests/setup.ts` before the first Astryx render:

```ts
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub;

HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  this.open = false;
};
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run:

```bash
pnpm vitest run tests/astryx-foundation.test.tsx
```

Expected: FAIL because `@/components/astryx/providers` does not exist.

- [ ] **Step 3: Install exact packages and add the CLI script**

Run:

```bash
pnpm add @astryxdesign/core@0.1.7 @astryxdesign/theme-neutral@0.1.7 @stylexjs/stylex@0.19.0
pnpm add -D @astryxdesign/cli@0.1.7
```

Add to `package.json` scripts:

```json
"astryx": "node node_modules/@astryxdesign/cli/bin/astryx.mjs"
```

Expected: all four versions are exact in `package.json` and the lockfile changes.

- [ ] **Step 4: Implement the provider leaf**

Create `src/components/astryx/providers.tsx`:

```tsx
"use client";

import { LinkProvider } from "@astryxdesign/core/Link";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme } from "@astryxdesign/core/theme";
import { ToastViewport } from "@astryxdesign/core/Toast";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import Link from "next/link";
import type { ReactNode } from "react";

export function AstryxProviders({ children }: { children: ReactNode }) {
  return (
    <Theme mode="dark" theme={neutralTheme}>
      <InternationalizationProvider
        locale="fr"
        overrides={{
          fr: {
            "@astryx.appShell.mobileNavigation": "Navigation mobile",
            "@astryx.dialog.close": "Fermer",
            "@astryx.mobileNav.closeNavigation": "Fermer la navigation",
            "@astryx.mobileNav.navigation": "Navigation mobile",
            "@astryx.mobileNav.toggle.open": "Ouvrir la navigation",
            "@astryx.sideNav.label": "Navigation principale",
            "@astryx.sideNavCollapseButton.collapseSidebar":
              "Réduire la navigation",
            "@astryx.sideNavCollapseButton.expandSidebar":
              "Développer la navigation",
            "@astryx.textInput.clearLabel": "Effacer le champ",
            "@astryx.toast.dismiss": "Fermer la notification",
            "@astryx.toast.viewport": "Notifications",
          },
        }}
      >
        <LinkProvider component={Link}>
          <ToastViewport>{children}</ToastViewport>
        </LinkProvider>
      </InternationalizationProvider>
    </Theme>
  );
}
```

Wrap `{children}` with `<AstryxProviders>` in `src/app/layout.tsx`, set `<html lang="fr" data-theme="dark">` to prevent a pre-hydration color flash, and change the viewport theme color to `#1b1b1b`.

- [ ] **Step 5: Replace the global import foundation**

Start `src/styles/globals.css` with the exact Astryx/Tailwind layer order:

```css
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;

@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "@astryxdesign/theme-neutral/theme.css";
@import "@astryxdesign/core/tailwind-theme.css";
@import "tailwindcss/utilities.css" layer(utilities);
```

Keep the existing B3 declarations temporarily below these imports so consumers remain functional. Add only these bridge rules:

```css
html {
  color-scheme: dark;
}

body {
  min-width: 320px;
  background: var(--color-background-body);
  color: var(--color-text-primary);
}

:focus-visible {
  scroll-margin: var(--spacing-4);
}
```

- [ ] **Step 6: Verify the foundation**

Run:

```bash
pnpm vitest run tests/astryx-foundation.test.tsx
pnpm typecheck
pnpm build
```

Expected: PASS; the build succeeds without Supabase environment variables.

- [ ] **Step 7: Commit the foundation**

```bash
git add package.json pnpm-lock.yaml src/app/layout.tsx src/styles/globals.css src/components/astryx/providers.tsx tests/astryx-foundation.test.tsx tests/setup.ts
git commit -m "feat: add astryx design foundation"
```

### Task 3: Replace the protected shell and navigation

**Files:**

- Modify: `src/application/sportsbook/navigation.ts`
- Create: `src/components/sportsbook/app-navigation.tsx`
- Create: `src/components/sportsbook/account-menu.tsx`
- Modify: `src/components/sportsbook/app-shell.tsx`
- Modify: `src/components/sportsbook/top-header.tsx`
- Delete after migration: `src/components/sportsbook/desktop-sidebar.tsx`
- Delete after migration: `src/components/sportsbook/mobile-bottom-navigation.tsx`
- Delete after migration: `src/components/sportsbook/navigation-link.tsx`
- Create: `tests/astryx-shell.test.tsx`
- Modify: `tests/protected-layout.test.tsx`
- Modify: `tests/sportsbook-routing.test.ts`

- [ ] **Step 1: Write the navigation contract tests**

Create `tests/astryx-shell.test.tsx` with these assertions:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppNavigation } from "@/components/sportsbook/app-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/markets" }));

describe("Astryx application navigation", () => {
  it("shows exactly five primary destinations and the active page", () => {
    render(<AppNavigation mode="desktop" roles={["PLAYER"]} />);

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });
    expect(navigation).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Marchés" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Administration" })).toBeNull();
  });

  it("exposes administration only to an authorized role", () => {
    render(<AppNavigation mode="desktop" roles={["ADMIN"]} />);
    expect(screen.getByRole("link", { name: "Administration" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the shell tests and verify failure**

Run:

```bash
pnpm vitest run tests/astryx-shell.test.tsx tests/protected-layout.test.tsx tests/sportsbook-routing.test.ts
```

Expected: FAIL because `AppNavigation` does not exist and the old B3 class assertions are obsolete.

- [ ] **Step 3: Make navigation data presentation-agnostic**

Replace the Lucide-specific contract in `src/application/sportsbook/navigation.ts` with:

```ts
export const primaryNavigation = [
  { href: "/direct", label: "Aujourd’hui", icon: "home" },
  { href: "/markets", label: "Marchés", icon: "chart" },
  { href: "/report", label: "Déclarer", icon: "add" },
  { href: "/bets", label: "Mes paris", icon: "ticket" },
  { href: "/leaderboard", label: "Classement", icon: "ranking" },
] as const;

export type PrimaryNavigationItem = (typeof primaryNavigation)[number];

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function canSeeAdministration(roles: readonly string[]) {
  return roles.includes("ADMIN") || roles.includes("LIVE_HOST");
}
```

Use this explicit Lucide map inside `app-navigation.tsx`, because the Neutral registry does not expose product-navigation glyphs; keep the navigation model free of React component types:

```ts
const navigationIcons = {
  home: House,
  chart: ChartNoAxesCombined,
  add: FilePlus2,
  ticket: Tickets,
  ranking: Trophy,
} as const;
```

- [ ] **Step 4: Build the Astryx shell**

Implement `AppNavigation` with `SideNav`, `SideNavHeading`, `SideNavSection`, and `SideNavItem`. Use the same five items for the mobile render mode and expose Administration in a secondary section only when `canSeeAdministration(roles)` is true.

Replace the outer structure of `src/components/sportsbook/app-shell.tsx` with Astryx `AppShell`:

```tsx
<AstryxAppShell
  contentPadding={0}
  height="auto"
  mobileNav={{ breakpoint: "lg", content: mobileNavigation }}
  sideNav={desktopNavigation}
  topNav={<TopHeader season={season} />}
  variant="elevated"
>
  <a className="sr-only focus:not-sr-only" href="#main-content">
    Aller au contenu principal
  </a>
  <div className="mx-auto grid w-full max-w-[96rem] gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
    <div id="main-content" tabIndex={-1}>
      {children}
    </div>
    <aside aria-label="Ticket de pari" className="hidden xl:block">
      <BetSlip balanceMkb={season.balanceMkb} seasonId={season.id} />
    </aside>
  </div>
  <MobileBetSlip balanceMkb={season.balanceMkb} seasonId={season.id} />
</AstryxAppShell>
```

Alias the import as `AstryxAppShell` to avoid colliding with the local component. The published 0.1.7 slots are `sideNav`, `topNav`, and `mobileNav`. Because Astryx 0.1.7 hardcodes its own skip-link text in English, add this rule and keep the French skip link shown above:

```css
[data-testid="skip-to-content"] {
  display: none;
}
```

- [ ] **Step 5: Implement account and season access**

Build `account-menu.tsx` from Astryx `DropdownMenu`, `Avatar`, `Badge`, and links. It must show the season name, roles, Compte, Administration when authorized, and Déconnexion. `top-header.tsx` renders the MKB balance as tabular text and the account menu, without repeating marketing copy.

- [ ] **Step 6: Remove old navigation and pass tests**

Delete the three superseded navigation files only after:

```bash
rg "desktop-sidebar|mobile-bottom-navigation|navigation-link|sportsbookNavigation" src tests
```

returns no consumers. Update `tests/protected-layout.test.tsx` to assert landmarks, labels, balance, and `aria-current` rather than `mk-*` classes.

Run:

```bash
pnpm vitest run tests/astryx-shell.test.tsx tests/protected-layout.test.tsx tests/sportsbook-routing.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the shell migration**

```bash
git add src/application/sportsbook/navigation.ts src/components/sportsbook tests/astryx-shell.test.tsx tests/protected-layout.test.tsx tests/sportsbook-routing.test.ts
git commit -m "feat: migrate application shell to astryx"
```

### Task 4: Replace shared headings and asynchronous states

**Files:**

- Create: `src/components/astryx/page-heading.tsx`
- Create: `src/components/astryx/async-state.tsx`
- Modify consumers of: `src/components/ui/page-intro.tsx`
- Modify consumers of: `src/components/states/empty-state.tsx`
- Modify consumers of: `src/components/states/error-state.tsx`
- Modify consumers of: `src/components/states/loading-skeleton.tsx`
- Modify consumers of: `src/components/states/not-configured-state.tsx`
- Delete the five superseded files after consumer migration
- Modify: `tests/visual-primitives.test.tsx`

- [ ] **Step 1: Replace B3 visual tests with semantic state tests**

Change `tests/visual-primitives.test.tsx` to cover the new contracts:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AsyncState } from "@/components/astryx/async-state";
import { PageHeading } from "@/components/astryx/page-heading";

describe("Astryx shared compositions", () => {
  it("renders one page heading and an optional action", () => {
    render(<PageHeading title="Marchés" action={<button>Filtrer</button>} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Marchés" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Filtrer" })).toBeVisible();
  });

  it("renders a useful empty state", () => {
    render(
      <AsyncState
        kind="empty"
        title="Aucun marché ouvert"
        description="Reviens après la prochaine mise à jour."
      />,
    );
    expect(screen.getByText("Aucun marché ouvert")).toBeVisible();
  });
});
```

- [ ] **Step 2: Verify the new contracts fail**

Run:

```bash
pnpm vitest run tests/visual-primitives.test.tsx
```

Expected: FAIL on the missing Astryx composition files.

- [ ] **Step 3: Implement focused compositions**

`PageHeading` accepts only:

```ts
export interface PageHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}
```

It composes Astryx `Text`/heading primitives and a responsive action slot. `AsyncState` accepts:

```ts
export type AsyncStateKind = "loading" | "empty" | "error" | "not-configured";

export interface AsyncStateProps {
  kind: AsyncStateKind;
  title?: string;
  description?: string;
  action?: ReactNode;
}
```

Use `Skeleton` for loading and `EmptyState` for the other three variants. Error and configuration text must remain generic and must not accept raw `Error` objects.

- [ ] **Step 4: Migrate all consumers and delete duplicates**

Run:

```bash
rg -l "PageIntro|EmptyState|ErrorState|LoadingSkeleton|NotConfiguredState" src/app src/components
```

For every returned file, replace the old import with `PageHeading` or `AsyncState`, preserving visible French text and actions. Then remove the five superseded files and verify:

```bash
rg "components/(ui/page-intro|states/(empty-state|error-state|loading-skeleton|not-configured-state))" src tests
```

Expected: no matches.

- [ ] **Step 5: Run affected tests and commit**

Run:

```bash
pnpm vitest run tests/visual-primitives.test.tsx tests/sportsbook-pages.test.tsx tests/home.test.tsx
pnpm typecheck
```

Expected: PASS.

```bash
git add src/app src/components tests/visual-primitives.test.tsx tests/sportsbook-pages.test.tsx tests/home.test.tsx
git commit -m "refactor: replace shared b3 primitives with astryx"
```

### Task 5: Migrate the public and authentication surfaces

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/site-header.tsx`
- Modify: `src/components/layout/site-footer.tsx`
- Modify: `src/components/layout/status-page.tsx`
- Modify: `src/components/auth/auth-shell.tsx`
- Modify: `src/components/auth/auth-mode-switcher.tsx`
- Modify: `src/components/auth/password-field.tsx`
- Modify: `src/components/auth/sign-in-form.tsx`
- Modify: `src/components/auth/sign-up-form.tsx`
- Modify: `src/components/auth/password-reset-request-form.tsx`
- Modify: `src/components/auth/update-password-form.tsx`
- Modify: `src/components/invitations/invitation-panel.tsx`
- Modify: `src/components/seasons/new-season-form.tsx`
- Create: `tests/astryx-auth-ui.test.tsx`
- Modify: `tests/auth-ui.test.tsx`
- Modify: `tests/password-recovery-ui.test.tsx`
- Modify: `tests/home.test.tsx`

- [ ] **Step 1: Add Astryx Auth assertions before changing implementation**

Create `tests/astryx-auth-ui.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignInForm } from "@/components/auth/sign-in-form";

describe("Astryx authentication UI", () => {
  it("keeps permanent labels and recovery access", () => {
    render(<SignInForm next="/direct" />);
    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Mot de passe oublié ?" }),
    ).toBeVisible();
  });
});
```

The existing optional `action` prop remains unchanged so tests can inject deterministic Server Action results; production continues to pass the real action from `src/app/login/page.tsx`.

- [ ] **Step 2: Verify the existing visual assumptions fail after test update**

Run:

```bash
pnpm vitest run tests/astryx-auth-ui.test.tsx tests/auth-ui.test.tsx tests/password-recovery-ui.test.tsx tests/home.test.tsx
```

Expected: the new test fails until the Astryx controls are rendered.

- [ ] **Step 3: Migrate the common Auth shell and controls**

Use `Card`, `Text`, and `Badge` in `auth-shell.tsx`; use `SegmentedControl` for Connexion/Créer un compte; use `TextInput` with `type="password"` and an accessible show/hide action in `password-field.tsx`. Use `Button` for submissions and retain native `<form action={...}>` Server Action wiring.

Every action state follows this shape already expected by the forms:

```ts
type AuthPresentationState = {
  status: "idle" | "pending" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
```

Do not pass Supabase error objects into any component. Keep `aria-describedby`, `aria-invalid`, `aria-live="polite"`, autocomplete attributes, disabled double-submit behavior, safe `next`, and password manager compatibility.

- [ ] **Step 4: Migrate public, invite, season, and status pages**

Use Astryx `TopNav`, `Card`, `Button`, `EmptyState`, and form primitives while preserving the existing route behavior. Public pages may render only MK Bet, Margot × Kévin, fictional-money copy, and authentication actions. Do not render season member data or private media.

- [ ] **Step 5: Run Auth contracts and build**

Run:

```bash
pnpm vitest run tests/astryx-auth-ui.test.tsx tests/auth-ui.test.tsx tests/password-auth-actions.test.ts tests/password-recovery-ui.test.tsx tests/auth-contracts.test.ts tests/home.test.tsx
pnpm typecheck
pnpm build
```

Expected: PASS without Supabase configuration at build time.

- [ ] **Step 6: Commit Auth migration**

```bash
git add src/app/page.tsx src/components/auth src/components/layout src/components/invitations src/components/seasons tests
git commit -m "feat: migrate public and auth surfaces to astryx"
```

### Task 6: Turn `/direct` into the Astryx “Aujourd’hui” dashboard

**Files:**

- Modify: `src/app/(protected)/direct/page.tsx`
- Modify: `src/app/(protected)/direct/loading.tsx`
- Create: `src/components/sportsbook/today-summary.tsx`
- Modify: `src/components/events/event-report-card.tsx`
- Modify: `src/components/events/event-vote-controls.tsx`
- Modify: `src/components/sportsbook/activity-feed.tsx`
- Modify: `src/components/sportsbook/activity-feed-item.tsx`
- Modify: `src/components/sportsbook/leaderboard-preview.tsx`
- Modify: `src/components/sportsbook/wallet-summary.tsx`
- Modify: `src/fixtures/sportsbook/types.ts`
- Modify: `src/data/supabase/leaderboard/leaderboard-repository.ts`
- Modify: `tests/sportsbook-pages.test.tsx`
- Modify: `tests/event-report-ui.test.tsx`

- [ ] **Step 1: Add a failing dashboard hierarchy test**

In `tests/sportsbook-pages.test.tsx`, add:

```tsx
it("orders Aujourd’hui around personal context and actions", async () => {
  render(await DirectPage({ searchParams: Promise.resolve({}) }));
  const headings = screen
    .getAllByRole("heading")
    .map((heading) => heading.textContent);
  expect(headings[0]).toMatch(/Aujourd’hui/i);
  expect(screen.getByText(/MKB/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Déclarer/i })).toBeVisible();
  expect(screen.getByRole("link", { name: /Tous les marchés/i })).toBeVisible();
});
```

Extend the page repository mocks with exactly the existing serialized balance, rank, two markets, reports, and recent activity used by the page. Do not add fixtures to production code.

- [ ] **Step 2: Verify the hierarchy test fails**

Run:

```bash
pnpm vitest run tests/sportsbook-pages.test.tsx tests/event-report-ui.test.tsx
```

Expected: FAIL because `/direct` is still only a filtered report feed.

- [ ] **Step 3: Compose the new server-rendered dashboard**

Add `userId: string` to `LeaderboardRow` and map `row.user_id` in `listSeasonLeaderboard()`. Use `requireSingleRoom()` for the canonical season context, then run these existing reads concurrently in the page:

```ts
const [markets, reports, leaderboard, activity] = await Promise.all([
  listSeasonMarkets(
    season.id,
    { category: "ALL", status: "OPEN", sort: "deadline", q: "" },
    2,
  ),
  listEventReports(claims.userId, "PENDING"),
  listSeasonLeaderboard(season.id),
  listRecentMarketAudit(season.id, 5),
]);
```

Derive the current rank with `leaderboard.find((row) => row.userId === claims.userId)?.rank ?? null`. Never match a player by display name or balance, and never open a browser Supabase client for dashboard reads.

`TodaySummary` accepts:

```ts
export interface TodaySummaryProps {
  balanceMkb: number;
  rank: number | null;
  pendingCount: number;
  activeMarketCount: number;
}
```

Render sections in this exact order: summary, priority actions, up to two markets, pending validations, recent activity. Use Astryx `Card`, `Badge`, `Button`, `MetadataList`, `ProgressBar`, `EmptyState`, and `Skeleton`.

- [ ] **Step 4: Preserve vote behavior while replacing presentation**

Migrate `event-report-card.tsx` and `event-vote-controls.tsx` to Astryx cards, metadata, buttons, dialogs, and toast feedback. Keep action IDs, confirmation thresholds, authenticated media URLs, author/voter permissions, `occurredAt`, and `declaredAt` untouched.

- [ ] **Step 5: Verify dashboard and event behavior**

Run:

```bash
pnpm vitest run tests/sportsbook-pages.test.tsx tests/event-report-ui.test.tsx tests/event-report-actions.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit dashboard migration**

```bash
git add src/app/'(protected)'/direct src/components/events src/components/sportsbook tests/sportsbook-pages.test.tsx tests/event-report-ui.test.tsx
git commit -m "feat: build astryx today dashboard"
```

### Task 7: Migrate markets, odds, and the transactional ticket

**Files:**

- Modify: `src/app/(protected)/markets/page.tsx`
- Modify: `src/app/(protected)/markets/[marketId]/page.tsx`
- Modify: `src/components/sportsbook/category-tabs.tsx`
- Modify: `src/components/sportsbook/market-card.tsx`
- Modify: `src/components/sportsbook/market-group.tsx`
- Modify: `src/components/sportsbook/odds-button.tsx`
- Modify: `src/components/sportsbook/odds-movement.tsx`
- Modify: `src/components/sportsbook/bet-slip.tsx`
- Modify: `src/components/sportsbook/bet-slip-selection.tsx`
- Modify: `src/components/sportsbook/mobile-bet-slip.tsx`
- Preserve: `src/components/sportsbook/bet-slip-context.tsx`
- Create: `tests/astryx-sportsbook-ui.test.tsx`
- Modify: `tests/betting-ui.test.tsx`
- Modify: `tests/sportsbook-ui.test.tsx`

- [ ] **Step 1: Write failing semantic selection and mobile-dialog tests**

Create `tests/astryx-sportsbook-ui.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { MobileBetSlip } from "@/components/sportsbook/mobile-bet-slip";
import { OddsButton } from "@/components/sportsbook/odds-button";

describe("Astryx sportsbook interactions", () => {
  it("selects a live odds button without relying on color", () => {
    render(
      <BetSlipProvider>
        <OddsButton
          marketId="market"
          outcomeId="yes"
          outcomeLabel="Oui"
          odds={1.88}
          oddsVersion={4}
          selected={false}
          status="OPEN"
          movement="UP"
        />
      </BetSlipProvider>,
    );
    const odds = screen.getByRole("button", { name: /Oui, cote 1,88/i });
    fireEvent.click(odds);
    expect(odds).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the mobile ticket in a named dialog", () => {
    render(
      <BetSlipProvider>
        <MobileBetSlip balanceMkb={1000} seasonId="season" />
      </BetSlipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir le ticket/i }));
    expect(
      screen.getByRole("dialog", { name: "Ticket de pari" }),
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Verify failures before implementation**

Run:

```bash
pnpm vitest run tests/astryx-sportsbook-ui.test.tsx tests/betting-ui.test.tsx tests/sportsbook-ui.test.tsx
```

Expected: at least the mobile dialog contract fails against the B3 wrapper.

- [ ] **Step 3: Replace market presentation**

Use `PageHeading`, `SegmentedControl`, `Selector`, and `TextInput` on the list. Use `Card`, `Badge`, `MetadataList`, and Astryx buttons on cards and detail. Keep the Zod query parser, search defaults, repository calls, `marketId`, `outcomeId`, `oddsVersion`, market status, and all URLs unchanged.

The `OddsButton` public API remains its existing strict props. Internally compose `Button` or `SelectableCard`; preserve the complete accessible name, `disabled` state for non-open markets, `aria-pressed`, movement text, line/handicap, and two-decimal formatting.

- [ ] **Step 4: Replace ticket presentation without changing its reducer**

Keep `bet-slip-context.tsx`, quote creation, quote expiry, `ODDS_CHANGED`, minimum stake, maximum legs, conflict handling, idempotency key, and double-submit protection unchanged. Migrate controls to Astryx `Card`, `TextInput`, `Button`, `AlertDialog`, `ProgressBar`, and `Toast`.

Use Astryx `Dialog` for `mobile-bet-slip.tsx`. The trigger summary remains visible above the mobile navigation and reports selection count plus potential return. Closing and reopening must retain context state.

- [ ] **Step 5: Run transaction-facing tests**

Run:

```bash
pnpm vitest run tests/astryx-sportsbook-ui.test.tsx tests/betting-ui.test.tsx tests/betting-application.test.ts tests/sportsbook-ui.test.tsx tests/sportsbook-pages.test.tsx
pnpm typecheck
```

Expected: PASS; no expectation based on a `mk-glass-*` class remains.

- [ ] **Step 6: Commit markets and ticket**

```bash
git add src/app/'(protected)'/markets src/components/sportsbook tests
git commit -m "feat: migrate markets and betting ticket to astryx"
```

### Task 8: Migrate declaration, private media, and moderation

**Files:**

- Modify: `src/app/(protected)/report/page.tsx`
- Modify: `src/components/events/event-report-form.tsx`
- Modify: `src/app/(protected)/admin/media/page.tsx`
- Modify: `src/components/media/media-upload-form.tsx`
- Modify: `src/components/media/media-moderation-controls.tsx`
- Modify: `tests/event-report-ui.test.tsx`
- Modify: `tests/media-upload-form.test.tsx`
- Modify: `tests/media-moderation-controls.test.tsx`
- Preserve: `src/application/events/**`
- Preserve: `src/application/media/**`
- Preserve: `src/app/api/media/[mediaId]/route.ts`

- [ ] **Step 1: Strengthen UI tests around privacy and accessible controls**

Add these assertions to the existing tests before changing components:

```tsx
expect(screen.getByLabelText("Type d’événement")).toBeVisible();
expect(screen.getByLabelText("Heure réelle")).toBeVisible();
expect(screen.getByLabelText(/Ajouter des preuves/i)).toHaveAttribute(
  "type",
  "file",
);
expect(document.body.innerHTML).not.toMatch(
  /supabase\.co\/storage|token=|sb_secret_/i,
);
```

For moderation, assert the three explicit actions by role: Approuver, Rejeter, Archiver.

- [ ] **Step 2: Run and capture the current failures**

Run:

```bash
pnpm vitest run tests/event-report-ui.test.tsx tests/media-upload-form.test.tsx tests/media-moderation-controls.test.tsx
```

Expected: updated Astryx-structure assertions fail before migration.

- [ ] **Step 3: Migrate the declaration form**

Compose the existing action with Astryx `FormLayout`, `Selector`, `DateTimeInput`, `TextArea`, `CheckboxList`, `Button`, `ProgressBar`, and inline field feedback. Keep file types, 10 MB limit, WebP processing, roles, people selection, `occurredAt`, and idempotency behavior unchanged.

- [ ] **Step 4: Migrate private-media administration**

Use `Card`, `Badge`, `Table` or responsive `List`, `Dialog`, `AlertDialog`, and `Toast`. Media image sources must remain `/api/media/{mediaId}`. Never render a bucket path, signed URL, author e-mail, or raw storage error.

- [ ] **Step 5: Run media and route contracts**

Run:

```bash
pnpm vitest run tests/event-report-ui.test.tsx tests/event-report-actions.test.ts tests/media-upload-form.test.tsx tests/media-moderation-controls.test.tsx tests/media-actions.test.ts tests/media-route.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit declaration and media migration**

```bash
git add src/app/'(protected)'/report src/app/'(protected)'/admin/media src/components/events src/components/media tests
git commit -m "feat: migrate reports and private media to astryx"
```

### Task 9: Migrate remaining member-facing pages

**Files:**

- Modify: `src/app/(protected)/bets/page.tsx`
- Modify: `src/app/(protected)/leaderboard/page.tsx`
- Modify: `src/app/(protected)/lives/page.tsx`
- Modify: `src/app/(protected)/lives/[liveId]/page.tsx`
- Modify: `src/app/(protected)/results/page.tsx`
- Modify: `src/app/(protected)/timeline/page.tsx`
- Modify: `src/app/(protected)/wallet/page.tsx`
- Modify: `src/app/(protected)/settings/account/page.tsx`
- Modify: `src/components/account/account-form.tsx`
- Modify: `src/components/sportsbook/live-card.tsx`
- Modify: `src/components/sportsbook/live-badge.tsx`
- Modify: `src/components/sportsbook/result-card.tsx`
- Modify: `src/components/sportsbook/timeline-item.tsx`
- Modify: `src/components/sportsbook/rechute-meter.tsx`
- Modify: `src/components/sportsbook/event-scoreboard.tsx`
- Modify: `src/components/sportsbook/leaderboard-preview.tsx`
- Modify: `tests/sportsbook-pages.test.tsx`
- Modify: `tests/sportsbook-ui.test.tsx`

- [ ] **Step 1: Add one semantic contract per route**

Extend `tests/sportsbook-pages.test.tsx` so each mocked page asserts its unique level-one heading and primary landmark. Add these route-specific expectations:

```tsx
expect(screen.getByRole("tab", { name: "Ouverts" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Classement" })).toBeVisible();
expect(screen.getByText("Rechutomètre")).toBeVisible();
expect(screen.getByRole("heading", { name: "Chronologie" })).toBeVisible();
expect(screen.getByLabelText("Nom d’affichage")).toBeVisible();
```

Render each assertion in its existing isolated test; do not combine unrelated pages into one render.

- [ ] **Step 2: Verify failures against old presentation**

Run:

```bash
pnpm vitest run tests/sportsbook-pages.test.tsx tests/sportsbook-ui.test.tsx tests/auth-ui.test.tsx
```

Expected: the new tab/heading/form contracts expose remaining legacy components.

- [ ] **Step 3: Migrate each page with the matching Astryx pattern**

Apply these explicit mappings:

| Route               | Astryx composition                                                      |
| ------------------- | ----------------------------------------------------------------------- |
| `/bets`             | `TabList`, `Card`, `MetadataList`, `Badge`                              |
| `/leaderboard`      | three `Card` podium entries plus responsive `List`                      |
| `/lives`            | `Card`, `Badge`, `AvatarGroup`, `EmptyState`                            |
| `/lives/[liveId]`   | `PageHeading`, `MetadataList`, participant `List`, linked-market `Card` |
| `/results`          | `TabList`, `Card`, `Badge`                                              |
| `/timeline`         | ordered `List`, `Timestamp`, `Badge`                                    |
| `/wallet`           | balance `Card`, transaction `Table` on desktop and `List` on mobile     |
| `/settings/account` | `FormLayout`, `TextInput`, `Button`, account `Card`                     |

Preserve every repository call, status, amount, time, member-visibility rule, and server action.

- [ ] **Step 4: Verify all member-facing pages**

Run:

```bash
pnpm vitest run tests/sportsbook-pages.test.tsx tests/sportsbook-ui.test.tsx tests/auth-ui.test.tsx
pnpm typecheck
```

Expected: PASS at 320 px-compatible markup without horizontal table assumptions.

- [ ] **Step 5: Commit member-facing pages**

```bash
git add src/app/'(protected)' src/components/account src/components/sportsbook tests
git commit -m "feat: migrate member pages to astryx"
```

### Task 10: Migrate administration and resource forms

**Files:**

- Modify: `src/app/(protected)/admin/page.tsx`
- Modify: `src/app/(protected)/admin/markets/page.tsx`
- Modify: `src/app/(protected)/admin/markets/new/page.tsx`
- Modify: `src/app/(protected)/admin/lives/page.tsx`
- Modify: `src/app/(protected)/admin/lives/new/page.tsx`
- Modify: `src/components/admin/initialize-markets-button.tsx`
- Modify: `src/components/admin/market-form.tsx`
- Modify: `src/components/admin/market-status-controls.tsx`
- Modify: `src/components/admin/live-form.tsx`
- Modify: `src/components/seasons/season-selector.tsx`
- Modify: `tests/admin-markets-ui.test.tsx`
- Modify: `tests/live-actions.test.ts`
- Modify: `tests/sportsbook-pages.test.tsx`

- [ ] **Step 1: Add role and destructive-action UI contracts**

Add to `tests/admin-markets-ui.test.tsx`:

```tsx
expect(screen.getByRole("heading", { name: /Administration/i })).toBeVisible();
expect(screen.getByRole("button", { name: /Suspendre/i })).toBeVisible();
expect(screen.getByRole("button", { name: /Fermer/i })).toBeVisible();
```

Add a user-event assertion that the destructive action opens an `alertdialog` and is not executed until confirmation. Keep the existing unauthorized-page assertion.

- [ ] **Step 2: Verify the confirmation test fails**

Run:

```bash
pnpm vitest run tests/admin-markets-ui.test.tsx tests/sportsbook-pages.test.tsx
```

Expected: FAIL until Astryx `AlertDialog` is wired.

- [ ] **Step 3: Migrate the admin resource index**

Use an administration `SideNav` or resource `TabList` for Marchés, Lives, Médias, Saison et Audit. Render only resources allowed by the existing role checks. Do not infer authorization from visibility; keep server guards and RPC errors.

- [ ] **Step 4: Migrate forms and status controls**

Use `FormLayout`, `TextInput`, `TextArea`, `DateTimeInput`, `Selector`, `CheckboxList`, `Button`, `Table`, `DropdownMenu`, `Dialog`, `AlertDialog`, and `Toast`. Preserve current Zod schemas, idempotency keys, UTC semantics, host eligibility, market status transitions, server actions, and error codes.

- [ ] **Step 5: Verify administration behavior**

Run:

```bash
pnpm vitest run tests/admin-markets-ui.test.tsx tests/live-actions.test.ts tests/live-creation-schema.test.ts tests/sportsbook-pages.test.tsx
pnpm typecheck
```

Expected: PASS; PLAYER remains unauthorized and all mutations remain server-controlled.

- [ ] **Step 6: Commit administration migration**

```bash
git add src/app/'(protected)'/admin src/components/admin src/components/seasons tests
git commit -m "feat: migrate administration to astryx"
```

### Task 11: Remove B3, update documentation, and prove the final cutover

**Files:**

- Modify: `src/styles/globals.css`
- Delete: `src/components/ui/button.tsx` after its consumer count reaches zero
- Delete: `src/components/ui/glass-surface.tsx`
- Delete: `src/components/ui/inline-notice.tsx`
- Delete: `src/components/ui/segmented-filter.tsx`
- Delete: `tests/b3-motion-contracts.test.tsx`
- Create: `tests/astryx-cutover.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DESIGN_SYSTEM.md`
- Modify: `docs/PRODUCT.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Write the static cutover contract**

Replace `tests/b3-motion-contracts.test.tsx` with `tests/astryx-cutover.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = fs
  .readdirSync(path.join(root, "src"), { recursive: true })
  .filter(
    (entry): entry is string =>
      typeof entry === "string" && /\.(css|tsx?)$/.test(entry),
  )
  .map((entry) => fs.readFileSync(path.join(root, "src", entry), "utf8"))
  .join("\n");

describe("Astryx final cutover", () => {
  it("does not retain the B3 visual vocabulary", () => {
    expect(source).not.toMatch(/mk-glass|mk-halo|GlassSurface|Halo nocturne/);
  });

  it("keeps Astryx theme imports in the required order", () => {
    const css = fs.readFileSync(
      path.join(root, "src/styles/globals.css"),
      "utf8",
    );
    expect(css.indexOf("core/reset.css")).toBeLessThan(
      css.indexOf("core/astryx.css"),
    );
    expect(css.indexOf("core/astryx.css")).toBeLessThan(
      css.indexOf("theme-neutral/theme.css"),
    );
  });
});
```

- [ ] **Step 2: Run the cutover test and verify it fails**

Run:

```bash
pnpm vitest run tests/astryx-cutover.test.ts
```

Expected: FAIL while B3 selectors and files remain.

- [ ] **Step 3: Remove all remaining B3 CSS and components**

Run:

```bash
rg -n "mk-glass|mk-halo|mk-surface|GlassSurface|InlineNotice|SegmentedFilter|components/ui/button" src tests
```

Replace each remaining presentation consumer with the matching Astryx primitive. Then reduce `src/styles/globals.css` to the import foundation, body defaults, layout-only project utilities, safe-area placement, print rules, and reduced-motion fallback. Delete decorative gradients, grain, glass, custom button, custom form-control, and B3 keyframe rules.

- [ ] **Step 4: Remove unused presentation dependencies only after proof**

Run:

```bash
rg -n "@radix-ui/react-slot|class-variance-authority|tailwind-merge|lucide-react" src tests
```

For every dependency with zero matches, remove it using `pnpm remove <package>`. Keep any dependency with a real consumer and document the exception in `docs/CURRENT_STATE.md`.

- [ ] **Step 5: Update documentation with exact final state**

Document:

```text
Design system: Astryx 0.1.7, Neutral dark, pinned because Beta.
Tailwind boundary: responsive composition and spacing only.
Upgrade rule: update Astryx packages together, run component/unit/E2E/visual checks, then promote.
Unchanged systems: migrations, RLS, Supabase repositories, financial RPC, odds engine.
```

Mark only the Astryx front migration as complete in the roadmap. Record actual test counts and any retained dependency after validation, not estimated values.

- [ ] **Step 6: Pass static and full unit validation**

Run:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm vitest run tests/astryx-cutover.test.ts
```

Expected: all commands pass and no B3 visual vocabulary remains.

- [ ] **Step 7: Commit the final cutover**

```bash
git add package.json pnpm-lock.yaml src tests README.md docs
git commit -m "refactor: complete astryx frontend cutover"
```

### Task 12: Validate SQL invariants, E2E, visuals, build, and production promotion

**Files:**

- Modify: `tests/e2e/public-interface.spec.ts`
- Modify: `tests/e2e/password-auth.spec.ts`
- Modify: `tests/e2e/event-reports.spec.ts`
- Modify: `tests/e2e/responsive-matrix.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify/create: `tests/e2e/visual-audit.spec.ts`
- Regenerate: `tests/e2e/visual-audit.spec.ts-snapshots/*.png`
- Modify with final results: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Update E2E selectors to semantic Astryx contracts**

Use role/name locators rather than Astryx implementation classes:

```ts
await expect(
  page.getByRole("navigation", { name: "Navigation principale" }),
).toBeVisible();
await page.getByRole("link", { name: "Marchés" }).click();
await page
  .getByRole("button", { name: /Oui, cote/i })
  .first()
  .click();
await page.getByRole("button", { name: /Ouvrir le ticket/i }).click();
await expect(
  page.getByRole("dialog", { name: "Ticket de pari" }),
).toBeVisible();
```

Keep existing isolated Auth sessions and immutable visual-audit user. Do not broaden screenshot masks beyond timestamps and already-documented nondeterministic values.

- [ ] **Step 2: Run database validation before browser tests**

Run:

```bash
pnpm db:start
pnpm db:reset
pnpm exec supabase db lint --local
pnpm db:test:rls
pnpm db:test:betting
pnpm db:test:lives
pnpm db:test:media
pnpm db:test:single-room
```

Expected: all migrations apply and every SQL scenario passes without modifying migration files.

- [ ] **Step 3: Run focused E2E and accessibility first**

Run:

```bash
pnpm exec playwright test tests/e2e/public-interface.spec.ts tests/e2e/password-auth.spec.ts tests/e2e/event-reports.spec.ts tests/e2e/accessibility.spec.ts
```

Expected: PASS for public/Auth/private flows and axe checks.

- [ ] **Step 4: Run responsive and full E2E**

Run:

```bash
pnpm exec playwright test tests/e2e/responsive-matrix.spec.ts
pnpm test:e2e
pnpm exec playwright test --repeat-each=2
```

Expected: PASS on desktop and mobile with no horizontal overflow at 320 px. Repeated visual tests must be stable before snapshot updates.

- [ ] **Step 5: Update and verify visual snapshots**

Run only after the repeated suite is stable:

```bash
pnpm exec playwright test tests/e2e/visual-audit.spec.ts --update-snapshots
pnpm exec playwright test tests/e2e/visual-audit.spec.ts --repeat-each=2
```

Expected: dashboard, login, markets, and mobile ticket snapshots show Astryx Neutral dark and pass twice without expanded masks.

- [ ] **Step 6: Stop Supabase and prove Vercel compatibility**

Run:

```bash
pnpm db:stop
pnpm build
pnpm install --frozen-lockfile
```

Expected: build and frozen installation pass while Supabase is stopped.

- [ ] **Step 7: Verify secrets and immutable paths**

Run:

```bash
git diff --check main...HEAD
git diff --exit-code main...HEAD -- supabase/migrations src/domain/odds
sha256sum -c /tmp/mkbet-astryx-immutable.sha256
git grep -nEI 'sb_secret_|service_role|SUPABASE_ACCESS_TOKEN|VERCEL_TOKEN' -- ':!pnpm-lock.yaml' ':!docs/SECURITY.md'
git status --short
```

Expected: no whitespace errors; no immutable-path diff; every hash reports `OK`; the secret scan finds no credential value; worktree contains only intentional snapshot/docs changes.

- [ ] **Step 8: Record real results and commit validation**

Update `docs/CURRENT_STATE.md` with actual Vitest, SQL, Playwright, axe, build, and snapshot counts. Then run:

```bash
git add tests/e2e docs/CURRENT_STATE.md
git commit -m "test: validate astryx frontend migration"
```

- [ ] **Step 9: Request code review and integrate**

Use `superpowers:requesting-code-review`, resolve verified findings, rerun affected checks, then use `superpowers:finishing-a-development-branch`. Merge into `main` only when the review and complete validation are green.

- [ ] **Step 10: Promote and smoke-test Production**

Push `main` only after explicit integration. Let the connected Vercel project deploy, then verify:

```text
GET /                       200 and no private data
GET /api/health             200 with the exact health contract
/login                      password login and registration UI
/direct                     authenticated Astryx dashboard
/markets                    market selection and quote
/report                     event report with private proof
/api/media/{authorized-id}  authenticated private response
```

Exercise one fictional MKB bet and one authorized private-media read with a production test account. Do not create or migrate a new Supabase project during this frontend-only promotion.
