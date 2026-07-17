# Password Authentication and B3 Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le magic link par l’inscription, la connexion et la récupération par e-mail et mot de passe, puis terminer la refonte B3 « Halo nocturne » avec une validation locale et Production complète.

**Architecture:** Supabase Auth reste l’autorité des identités et sessions. Des Server Actions Next.js valident les formulaires avec Zod, appellent les méthodes Auth publiques puis garantissent l’accès idempotent à la salle via les RPC existantes. Le portail public utilise des composants visuels dédiés et les primitives B3 déjà présentes ; aucune migration métier, règle RLS, cote ou opération financière n’est modifiée.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase Auth SSR 0.12, Supabase JS 2.110, Zod 4, Tailwind CSS v4, Lucide React, Vitest, Testing Library, Playwright Chromium, axe-core.

---

## Structure de fichiers

### Contrats et orchestration Auth

- Modify: `src/application/auth/validation.ts` — schémas Zod connexion, inscription, récupération et nouveau mot de passe.
- Modify: `src/auth/auth-errors.ts` — codes stables propres au mot de passe.
- Modify: `src/application/auth/index.ts` — messages français non énumérants.
- Create: `src/application/auth/initialize-access.ts` — initialisation idempotente du profil et de la salle.
- Modify: `src/application/auth/actions.ts` — quatre Server Actions Auth et déconnexion.

### Portail et récupération

- Create: `src/components/auth/auth-shell.tsx` — composition publique B3 commune.
- Create: `src/components/auth/password-field.tsx` — champ accessible avec affichage/masquage.
- Create: `src/components/auth/sign-in-form.tsx` — connexion classique.
- Create: `src/components/auth/sign-up-form.tsx` — inscription et confirmation requise.
- Create: `src/components/auth/password-reset-request-form.tsx` — demande de récupération.
- Create: `src/components/auth/update-password-form.tsx` — nouveau mot de passe.
- Delete: `src/components/auth/login-form.tsx` — ancien formulaire magic link.
- Modify: `src/app/login/page.tsx` — portail unifié `mode=login|register`.
- Create: `src/app/forgot-password/page.tsx`.
- Create: `src/app/auth/update-password/page.tsx`.
- Modify: `src/app/auth/callback/route.ts` — intentions `signup` et `recovery`.
- Modify: `src/app/auth/error/page.tsx` — reprise compatible mot de passe.

### Finition et validation

- Modify: `src/styles/globals.css` — motion tokens, états Auth, halos contextuels et contraste.
- Modify: composants B3 ciblés uniquement si l’audit détecte un écart structurel.
- Modify: `tests/e2e/global-setup.ts` — création de comptes locaux par mot de passe.
- Modify: `tests/e2e/public-interface.spec.ts` — parcours publics classiques.
- Create: `tests/e2e/password-auth.spec.ts` — inscription, connexion, récupération et mobile.
- Modify: `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT.md`, `docs/CURRENT_STATE.md`.

---

### Task 1: Définir les contrats de validation et erreurs Auth

**Files:**

- Modify: `src/application/auth/validation.ts`
- Modify: `src/auth/auth-errors.ts`
- Modify: `src/application/auth/index.ts`
- Test: `tests/auth-contracts.test.ts`

- [ ] **Step 1: Écrire les tests rouges des quatre formulaires**

Remplacer les assertions magic-link de `tests/auth-contracts.test.ts` par les contrats suivants :

```ts
import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInFormSchema,
  signUpFormSchema,
} from "@/application/auth/validation";

it("normalizes a password sign-in request", () => {
  expect(
    signInFormSchema.parse({
      email: "  ALICE@example.com ",
      password: "mot-de-passe-solide",
      next: "/markets",
    }),
  ).toEqual({
    email: "alice@example.com",
    password: "mot-de-passe-solide",
    next: "/markets",
  });
});

it("requires a matching ten-character password for sign-up", () => {
  expect(
    signUpFormSchema.parse({
      email: "alice@example.com",
      displayName: "  Alice   Marchés ",
      password: "mot-de-passe-solide",
      passwordConfirmation: "mot-de-passe-solide",
      next: "/direct",
    }),
  ).toMatchObject({ displayName: "Alice Marchés" });

  expect(() =>
    signUpFormSchema.parse({
      email: "alice@example.com",
      displayName: "Alice",
      password: "tropcourt",
      passwordConfirmation: "different!",
    }),
  ).toThrow();
});

it("validates reset and password update requests", () => {
  expect(
    passwordResetRequestSchema.parse({ email: " ALICE@example.com " }),
  ).toEqual({ email: "alice@example.com" });
  expect(
    passwordUpdateSchema.parse({
      password: "nouveau-mot-de-passe",
      passwordConfirmation: "nouveau-mot-de-passe",
    }),
  ).toEqual({
    password: "nouveau-mot-de-passe",
    passwordConfirmation: "nouveau-mot-de-passe",
  });
});
```

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/auth-contracts.test.ts`

Expected: FAIL car les quatre schémas n’existent pas.

- [ ] **Step 3: Implémenter les schémas Zod partagés**

Dans `src/application/auth/validation.ts`, remplacer `loginFormSchema` par :

```ts
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresse email invalide")
  .max(320);

const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères")
  .max(128, "Le mot de passe est trop long");

export const signInFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  next: z
    .preprocess((value) => sanitizeInternalRedirectPath(value), z.string())
    .default("/direct"),
});

export const signUpFormSchema = z
  .object({
    email: emailSchema,
    displayName: z
      .string()
      .transform(normalizeSpaces)
      .pipe(z.string().min(2).max(80))
      .refine((value) => !/[<>]/.test(value), "Nom d’affichage invalide"),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    next: z
      .preprocess((value) => sanitizeInternalRedirectPath(value), z.string())
      .default("/direct"),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Les mots de passe ne correspondent pas",
  });

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Les mots de passe ne correspondent pas",
  });
```

Exporter les quatre types inférés et supprimer `LoginFormInput`.

- [ ] **Step 4: Ajouter les codes et messages non énumérants**

Ajouter dans `AUTH_ERROR_CODES` :

```ts
"AUTH_INVALID_CREDENTIALS",
"AUTH_SIGN_UP_FAILED",
"AUTH_PASSWORD_RESET_FAILED",
"AUTH_PASSWORD_UPDATE_FAILED",
```

Ajouter dans `AUTH_MESSAGES` :

```ts
AUTH_INVALID_CREDENTIALS:
  "Connexion impossible. Vérifie tes informations ou réinitialise ton mot de passe.",
AUTH_SIGN_UP_FAILED:
  "Impossible de créer le compte. Vérifie les informations et réessaie.",
AUTH_PASSWORD_RESET_FAILED:
  "La demande n'a pas pu être traitée. Réessaie dans quelques instants.",
AUTH_PASSWORD_UPDATE_FAILED:
  "Le mot de passe n'a pas pu être modifié. Demande un nouveau lien.",
```

Modifier `AUTH_CALLBACK_FAILED` en :

```ts
AUTH_CALLBACK_FAILED:
  "La demande d'authentification n'a pas pu être validée. Recommence depuis la connexion.",
```

- [ ] **Step 5: Vérifier puis committer les contrats**

Run: `pnpm exec vitest run tests/auth-contracts.test.ts && pnpm typecheck`

Expected: PASS.

```bash
git add src/application/auth/validation.ts src/auth/auth-errors.ts src/application/auth/index.ts tests/auth-contracts.test.ts
git commit -m "feat: define password auth contracts"
```

### Task 2: Implémenter l’orchestration Supabase Auth en TDD

**Files:**

- Create: `src/application/auth/initialize-access.ts`
- Modify: `src/application/auth/actions.ts`
- Create: `tests/password-auth-actions.test.ts`

- [ ] **Step 1: Écrire les tests rouges de connexion et d’initialisation**

Créer `tests/password-auth-actions.test.ts` avec des mocks de `next/headers`, `next/navigation`, du client Supabase et de `asRpcClient`. Les assertions centrales sont :

```ts
it("signs in, initializes access and redirects internally", async () => {
  signInWithPassword.mockResolvedValue({ error: null });
  rpc.mockResolvedValue({ data: "room-id", error: null });

  const form = new FormData();
  form.set("email", "alice@example.com");
  form.set("password", "mot-de-passe-solide");
  form.set("next", "/markets");

  await expect(signInWithPasswordAction(initialState, form)).rejects.toThrow(
    "NEXT_REDIRECT:/markets",
  );
  expect(signInWithPassword).toHaveBeenCalledWith({
    email: "alice@example.com",
    password: "mot-de-passe-solide",
  });
  expect(rpc).toHaveBeenNthCalledWith(1, "ensure_current_profile");
  expect(rpc).toHaveBeenNthCalledWith(2, "ensure_single_room_access");
});

it("returns the same generic failure for invalid credentials", async () => {
  signInWithPassword.mockResolvedValue({ error: new Error("user missing") });
  const result = await signInWithPasswordAction(initialState, validSignInData);
  expect(result).toMatchObject({
    ok: false,
    code: "AUTH_INVALID_CREDENTIALS",
  });
  expect(JSON.stringify(result)).not.toContain("user missing");
});
```

- [ ] **Step 2: Écrire les tests rouges d’inscription et récupération**

Ajouter :

```ts
it("creates a password account with a safe confirmation callback", async () => {
  signUp.mockResolvedValue({
    data: { user: { identities: [{}] } },
    error: null,
  });
  const result = await signUpWithPasswordAction(initialState, validSignUpData);
  expect(signUp).toHaveBeenCalledWith({
    email: "alice@example.com",
    password: "mot-de-passe-solide",
    options: {
      data: { display_name: "Alice" },
      emailRedirectTo:
        "https://mk-bet.vercel.app/auth/callback?intent=signup&next=%2Fdirect",
    },
  });
  expect(result).toMatchObject({ ok: true });
});

it("uses a generic reset response", async () => {
  resetPasswordForEmail.mockResolvedValue({ error: new Error("not found") });
  const result = await requestPasswordResetAction(initialState, resetData);
  expect(result).toEqual({
    ok: true,
    message:
      "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.",
  });
});

it("updates the password only for an authenticated recovery session", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null });
  updateUser.mockResolvedValue({ error: null });
  const result = await updatePasswordAction(initialState, updateData);
  expect(updateUser).toHaveBeenCalledWith({
    password: "nouveau-mot-de-passe",
  });
  expect(result).toMatchObject({ ok: true });
});
```

- [ ] **Step 3: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/password-auth-actions.test.ts`

Expected: FAIL car les actions et le helper n’existent pas.

- [ ] **Step 4: Créer l’initialisation idempotente**

Créer `src/application/auth/initialize-access.ts` :

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import { asRpcClient } from "@/data/supabase/rpc";
import type { Database } from "@/types/database";

export type AccessInitializationResult =
  { ok: true } | { ok: false; stage: "profile" | "room" };

export async function initializeAuthenticatedAccess(
  client: SupabaseClient<Database>,
): Promise<AccessInitializationResult> {
  const rpc = asRpcClient(client);
  const { error: profileError } = await rpc.rpc("ensure_current_profile");
  if (profileError) return { ok: false, stage: "profile" };
  const { error: roomError } = await rpc.rpc("ensure_single_room_access");
  if (roomError) return { ok: false, stage: "room" };
  return { ok: true };
}
```

- [ ] **Step 5: Remplacer l’action magic-link par les quatre actions**

Dans `src/application/auth/actions.ts`, conserver `requestOrigin`, `failure`, `signOut` et `updateAccount`, supprimer `requestLoginLink`, puis ajouter :

```ts
const SIGN_UP_SUCCESS =
  "Compte créé. Confirme ton adresse depuis l'e-mail reçu avant de te connecter.";
const RESET_REQUEST_SUCCESS =
  "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.";

export async function signInWithPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("AUTH_INVALID_CREDENTIALS");
  const next = parsed.data.next;
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) return failure("AUTH_INVALID_CREDENTIALS");
    const initialization = await initializeAuthenticatedAccess(supabase);
    if (!initialization.ok) {
      await supabase.auth.signOut();
      return failure("DATABASE_OPERATION_FAILED");
    }
  } catch (error) {
    return failure(
      toSupabaseConfigurationError(error)
        ? "SUPABASE_NOT_CONFIGURED"
        : "AUTH_INVALID_CREDENTIALS",
    );
  }
  redirect(next);
}
```

Implémenter `signUpWithPasswordAction`, `requestPasswordResetAction` et `updatePasswordAction` avec les méthodes Supabase et messages testés. `requestPasswordResetAction` retourne toujours `RESET_REQUEST_SUCCESS` après une entrée Zod valide, même si Supabase renvoie une erreur fonctionnelle. Les erreurs de configuration restent distinctes.

- [ ] **Step 6: Vérifier puis committer l’orchestration**

Run: `pnpm exec vitest run tests/password-auth-actions.test.ts tests/auth-contracts.test.ts && pnpm typecheck`

Expected: PASS sans message Supabase dans la sortie.

```bash
git add src/application/auth/initialize-access.ts src/application/auth/actions.ts tests/password-auth-actions.test.ts
git commit -m "feat: add password authentication actions"
```

### Task 3: Construire le portail Auth B3 unifié

**Files:**

- Create: `src/components/auth/auth-shell.tsx`
- Create: `src/components/auth/password-field.tsx`
- Create: `src/components/auth/sign-in-form.tsx`
- Create: `src/components/auth/sign-up-form.tsx`
- Delete: `src/components/auth/login-form.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `tests/auth-ui.test.tsx`
- Modify: `tests/security-static.test.ts`

- [ ] **Step 1: Écrire les tests rouges du portail**

Dans `tests/auth-ui.test.tsx`, remplacer le test `LoginForm` par :

```tsx
it("renders the sign-in mode with a password recovery path", () => {
  render(<SignInForm next="/markets" />);
  expect(
    screen.getByRole("heading", { name: "Bon retour dans la salle" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
    "type",
    "email",
  );
  expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
    "type",
    "password",
  );
  expect(
    screen.getByRole("link", { name: "Mot de passe oublié ?" }),
  ).toHaveAttribute("href", "/forgot-password");
  expect(
    screen.getByRole("button", { name: "SE CONNECTER" }),
  ).toBeInTheDocument();
});

it("renders the sign-up mode without exposing private content", () => {
  render(<SignUpForm next="/direct" />);
  expect(
    screen.getByRole("heading", { name: "Créer mon compte" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Nom d’affichage")).toBeInTheDocument();
  expect(
    screen.getByLabelText("Confirmer le mot de passe"),
  ).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(
    /token|service_role|storage\/v1/i,
  );
});
```

Ajouter un test `PasswordField` qui clique sur « Afficher le mot de passe », vérifie `type="text"`, puis clique sur « Masquer le mot de passe » et retrouve `type="password"`.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/auth-ui.test.tsx tests/security-static.test.ts`

Expected: FAIL car les nouveaux composants n’existent pas.

- [ ] **Step 3: Créer le champ de mot de passe accessible**

Créer `src/components/auth/password-field.tsx` comme Client Component. Il accepte `id`, `name`, `label`, `autoComplete`, `required` et `minLength`, conserve un booléen local `visible`, et rend un vrai `<button type="button">` dont le nom accessible alterne entre « Afficher le mot de passe » et « Masquer le mot de passe ».

- [ ] **Step 4: Créer les formulaires de connexion et inscription**

Les deux composants utilisent `useActionState`, `InlineNotice`, `PasswordField` et `Button`. Le formulaire de connexion transmet `email`, `password` et `next`. Le formulaire d’inscription transmet `displayName`, `email`, `password`, `passwordConfirmation` et `next`, puis remplace le formulaire par l’état de confirmation lorsque `state.ok && state.message`.

Leurs conteneurs commencent respectivement par :

```tsx
<header className="space-y-2">
  <p className="mk-kicker">Accès membre</p>
  <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
    Bon retour dans la salle
  </h1>
</header>
```

et :

```tsx
<header className="space-y-2">
  <p className="mk-kicker">Nouveau joueur</p>
  <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
    Créer mon compte
  </h1>
</header>
```

- [ ] **Step 5: Créer le shell éditorial et la navigation de modes**

Créer `src/components/auth/auth-shell.tsx` avec une grille desktop `lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.75fr)]`, un panneau éditorial opaque et un panneau fonctionnel en verre. Le shell reçoit `mode`, `next` et `children`. Les segments sont des `Link` vers :

```ts
const modes = [
  { value: "login", label: "Connexion" },
  { value: "register", label: "Créer un compte" },
] as const;
```

Le lien actif porte `aria-current="page"`. Le panneau éditorial ne contient que « Margot × Kévin », « 1 000 MKB fictifs » et « Deux votes concordants ».

- [ ] **Step 6: Remplacer la page de login et retirer le magic link**

Dans `src/app/login/page.tsx`, valider `mode` par une fonction locale :

```ts
function parseAuthMode(value: string | string[] | undefined) {
  return value === "register" ? "register" : "login";
}
```

Rendre `AuthShell`, puis `SignUpForm` avec `signUpWithPasswordAction` ou `SignInForm` avec `signInWithPasswordAction`. Supprimer `src/components/auth/login-form.tsx` et mettre à jour le scan statique pour inspecter les deux nouveaux formulaires.

- [ ] **Step 7: Vérifier puis committer le portail**

Run: `pnpm exec vitest run tests/auth-ui.test.tsx tests/security-static.test.ts && pnpm lint && pnpm typecheck`

Expected: PASS.

```bash
git add src/app/login/page.tsx src/components/auth tests/auth-ui.test.tsx tests/security-static.test.ts
git commit -m "feat: build unified password auth portal"
```

### Task 4: Ajouter récupération, nouveau mot de passe et callback typé

**Files:**

- Create: `src/components/auth/password-reset-request-form.tsx`
- Create: `src/components/auth/update-password-form.tsx`
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/auth/update-password/page.tsx`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/auth/error/page.tsx`
- Modify: `tests/auth-callback-route.test.ts`
- Create: `tests/password-recovery-ui.test.tsx`

- [ ] **Step 1: Écrire les tests rouges du callback**

Ajouter dans `tests/auth-callback-route.test.ts` :

```ts
it("initializes a confirmed sign-up before redirecting", async () => {
  const response = await GET(
    new NextRequest(
      "https://mk-bet.vercel.app/auth/callback?code=safe-code&intent=signup&next=%2Fmarkets",
    ),
  );
  expect(exchangeCodeForSession).toHaveBeenCalledWith("safe-code");
  expect(rpc).toHaveBeenNthCalledWith(1, "ensure_current_profile");
  expect(rpc).toHaveBeenNthCalledWith(2, "ensure_single_room_access");
  expect(response.headers.get("location")).toBe(
    "https://mk-bet.vercel.app/markets",
  );
});

it("sends a recovery session to the password update page", async () => {
  const response = await GET(
    new NextRequest(
      "https://mk-bet.vercel.app/auth/callback?code=safe-code&intent=recovery",
    ),
  );
  expect(rpc).not.toHaveBeenCalled();
  expect(response.headers.get("location")).toBe(
    "https://mk-bet.vercel.app/auth/update-password",
  );
});
```

- [ ] **Step 2: Écrire les tests rouges des pages de récupération**

Créer `tests/password-recovery-ui.test.tsx` qui vérifie le champ e-mail, le message générique de succès, les deux champs de nouveau mot de passe et les liens de retour vers `/login`.

- [ ] **Step 3: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/auth-callback-route.test.ts tests/password-recovery-ui.test.tsx`

Expected: FAIL sur l’intention recovery et les composants absents.

- [ ] **Step 4: Implémenter les deux formulaires et pages**

Créer les formulaires avec `useActionState`. `PasswordResetRequestForm` appelle `requestPasswordResetAction` et remplace le formulaire par `InlineNotice` au succès. `UpdatePasswordForm` appelle `updatePasswordAction`, affiche les deux `PasswordField`, puis propose un lien vers `/login` au succès.

Les pages utilisent `AuthShell` sans segments de mode et les titres « Retrouver mon accès » et « Choisir un nouveau mot de passe ».

- [ ] **Step 5: Adapter le callback sans donnée sensible**

Dans `src/app/auth/callback/route.ts`, parser :

```ts
const intent = requestUrl.searchParams.get("intent");
```

Après `exchangeCodeForSession`, si `intent === "recovery"`, rediriger immédiatement vers `/auth/update-password`. Sinon appeler `initializeAuthenticatedAccess`. Ne jamais journaliser `intent`, `code`, `next` ou l’erreur brute ; conserver uniquement les étapes stables existantes.

- [ ] **Step 6: Vérifier puis committer la récupération**

Run: `pnpm exec vitest run tests/auth-callback-route.test.ts tests/password-recovery-ui.test.tsx tests/password-auth-actions.test.ts && pnpm typecheck`

Expected: PASS.

```bash
git add src/app/auth src/app/forgot-password src/components/auth src/application/auth tests/auth-callback-route.test.ts tests/password-recovery-ui.test.tsx
git commit -m "feat: add secure password recovery flow"
```

### Task 5: Pousser la finition graphique et le mouvement B3

**Files:**

- Modify: `src/styles/globals.css`
- Modify: `src/components/auth/auth-shell.tsx`
- Modify: composants B3 seulement lorsqu’un défaut est prouvé par l’audit
- Modify: `tests/visual-primitives.test.tsx`
- Create: `tests/b3-motion-contracts.test.tsx`

- [ ] **Step 1: Écrire les contrats rouges de mouvement et fallback**

Créer `tests/b3-motion-contracts.test.tsx` qui rend le portail, une cote, le ticket et un filtre puis exige les marqueurs `data-motion="enter"`, `data-interactive="lift"`, `data-ticket-step` et `aria-current`. Dans `tests/visual-primitives.test.tsx`, vérifier que chaque surface conserve `data-surface` et une classe de fallback opaque.

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `pnpm exec vitest run tests/b3-motion-contracts.test.tsx tests/visual-primitives.test.tsx`

Expected: FAIL seulement sur les nouveaux contrats de présentation.

- [ ] **Step 3: Ajouter les tokens et animations bornées**

Dans `src/styles/globals.css`, ajouter :

```css
:root {
  --motion-fast: 160ms;
  --motion-medium: 260ms;
  --motion-slow: 380ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
}

[data-motion="enter"] {
  animation: mk-enter var(--motion-slow) var(--ease-out) both;
}

[data-interactive="lift"] {
  transition:
    transform var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) ease,
    box-shadow var(--motion-fast) ease;
}

@media (hover: hover) {
  [data-interactive="lift"]:hover {
    transform: translateY(-1px);
  }
}

@keyframes mk-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Ajouter les classes dédiées au rail lumineux Auth, aux segments actifs, aux champs invalides et au halo contextuel. Le fallback `@supports not (backdrop-filter: blur(1px))` doit rester opaque.

- [ ] **Step 4: Auditer toutes les routes avec les outils frontend**

Lancer le serveur de build local, puis inspecter à 390×844, 768×1024 et 1440×1000 : `/`, `/login`, `/login?mode=register`, `/forgot-password`, `/direct`, `/markets`, `/report`, `/bets`, `/leaderboard`, `/settings/account`, ainsi que les états loading/error/empty disponibles.

Pour chaque défaut constaté, ajouter d’abord une assertion structurelle ou une reproduction Playwright ciblée, vérifier l’échec, corriger uniquement le composant concerné, puis relancer le test. Les contrôles obligatoires sont : aucun overflow horizontal, aucune cible sous 44 px, focus visible, ticket non masqué par la navigation mobile, contraste lisible, aucun effet continu et aucune photo privée dans une surface publique.

- [ ] **Step 5: Vérifier puis committer la finition**

Run: `pnpm exec vitest run tests/b3-motion-contracts.test.tsx tests/visual-primitives.test.tsx && pnpm lint && pnpm typecheck`

Expected: PASS.

```bash
git add src/styles/globals.css src/components tests/b3-motion-contracts.test.tsx tests/visual-primitives.test.tsx
git commit -m "feat: polish b3 motion and glass interactions"
```

### Task 6: Migrer les parcours E2E vers les mots de passe

**Files:**

- Modify: `tests/e2e/global-setup.ts`
- Modify: `tests/e2e/public-interface.spec.ts`
- Create: `tests/e2e/password-auth.spec.ts`
- Modify: `playwright.config.ts` si un projet public isolé est requis

- [ ] **Step 1: Écrire le scénario E2E de connexion**

Créer `tests/e2e/password-auth.spec.ts` avec un utilisateur unique par exécution. Le test remplit l’inscription, récupère le lien de confirmation depuis Mailpit local, ouvre le callback, se déconnecte, puis se reconnecte avec le mot de passe et vérifie le titre de `/direct`.

- [ ] **Step 2: Ajouter récupération et non-énumération**

Ajouter un test qui demande une récupération pour une adresse inconnue et une adresse existante, puis exige exactement le même message. Pour l’adresse existante, ouvrir le lien Mailpit, choisir un nouveau mot de passe, puis vérifier que l’ancien échoue et que le nouveau ouvre `/direct`.

- [ ] **Step 3: Migrer le setup des comptes métier**

Dans `tests/e2e/global-setup.ts`, créer les utilisateurs par l’API Auth locale d’administration avec `email_confirm: true` et un mot de passe fixe réservé aux tests, puis ouvrir `/login` et utiliser le formulaire classique pour générer chaque `storageState`. Supprimer l’extraction du magic link du setup.

- [ ] **Step 4: Exécuter la suite publique puis complète**

Run: `pnpm exec playwright test tests/e2e/public-interface.spec.ts tests/e2e/password-auth.spec.ts --project=desktop`

Expected: PASS.

Run: `pnpm test:e2e`

Expected: tous les parcours attendus passent, avec seulement les skips croisés documentés entre projets desktop/mobile.

- [ ] **Step 5: Vérifier la stabilité**

Run: `pnpm exec playwright test tests/e2e/password-auth.spec.ts --repeat-each=2`

Expected: PASS deux fois sans collision d’e-mail ni état partagé.

- [ ] **Step 6: Committer les parcours E2E**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: cover password authentication journeys"
```

### Task 7: Documenter, valider et préparer la promotion

**Files:**

- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/SECURITY.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Mettre à jour la documentation**

Documenter explicitement : e-mail comme identifiant, confirmation obligatoire, suppression du magic link, récupération, minimum de dix caractères, initialisation idempotente, URLs Supabase autorisées et absence de service role dans Vercel. Dans `CURRENT_STATE`, reporter uniquement les nombres réellement obtenus après validation.

- [ ] **Step 2: Configurer Supabase local et vérifier les contrats SQL**

Mettre `minimum_password_length = 10` dans `supabase/config.toml`. Cette configuration n’est pas une migration métier. Exécuter :

```bash
pnpm db:start
pnpm db:reset
pnpm db:types
pnpm exec supabase db lint --local
pnpm db:test:rls
pnpm db:test:betting
pnpm db:test:lives
pnpm db:test:media
pnpm db:test:single-room
```

Expected: toutes les migrations, fonctions, policies et assertions passent.

- [ ] **Step 3: Exécuter la validation applicative complète**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:stop
pnpm build
pnpm install --frozen-lockfile
```

Expected: toutes les commandes passent ; le build réussit avec Supabase local arrêté.

- [ ] **Step 4: Scanner les secrets et les frontières protégées**

Run:

```bash
git grep -nE 'sb_secret_|service_role|SUPABASE_ACCESS_TOKEN|VERCEL_TOKEN' -- ':!pnpm-lock.yaml' ':!docs/SECURITY.md' ':!docs/DEPLOYMENT.md'
git diff 62fadd2 -- supabase/migrations src/domain/odds
git status --short
git diff --check
```

Expected: aucun secret réel ; aucune modification de migration historique ni du moteur de cotes ; worktree maîtrisé.

- [ ] **Step 5: Committer la livraison locale**

```bash
git add README.md docs supabase/config.toml src tests
git commit -m "feat: complete password auth and b3 redesign"
```

- [ ] **Step 6: Préparer la Production sans dépense**

Configurer dans Supabase Auth Production le minimum de mot de passe compatible, l’URL du site `https://mk-bet.vercel.app` et les callbacks `/auth/callback`. Vérifier que les clés restent uniquement dans les environnements Vercel. Déployer la branche fusionnée, puis exécuter manuellement : inscription, confirmation, connexion, récupération, `/api/health`, `/direct`, `/markets`, pari MKB, signalement et déconnexion.

- [ ] **Step 7: Finaliser la branche**

Invoquer `superpowers:verification-before-completion`, puis `superpowers:finishing-a-development-branch`. Ne fusionner dans `main` et ne promouvoir Production qu’après preuve de toutes les validations.
