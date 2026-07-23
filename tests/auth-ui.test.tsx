import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthFormState } from "@/application/auth/actions";
import { hasPasswordUpdatedNotice, parseAuthMode } from "@/app/login/page";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthModeSwitcher } from "@/components/auth/auth-mode-switcher";
import { PasswordField } from "@/components/auth/password-field";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import { SeasonSelector } from "@/components/seasons/season-selector";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("auth UI", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("moves the Astryx segmented selection when navigation starts and syncs URL props", async () => {
    const { rerender } = render(
      <AuthModeSwitcher mode="login" next="/markets" />,
    );
    const navigation = screen.getByRole("navigation", {
      name: "Choisir le mode d’accès",
    });
    const registerOption = screen.getByRole("radio", {
      name: "Créer un compte",
    });

    expect(navigation).toHaveAttribute("data-auth-mode", "login");
    expect(registerOption).toHaveAttribute("aria-checked", "false");
    fireEvent.click(registerOption);
    expect(navigation).toHaveAttribute("data-auth-mode", "register");
    expect(registerOption).toHaveAttribute("aria-checked", "true");
    expect(push).toHaveBeenCalledWith("/login?mode=register&next=%2Fmarkets");

    rerender(<AuthModeSwitcher mode="register" next="/markets" />);
    expect(registerOption).toHaveAttribute("aria-checked", "true");

    rerender(<AuthModeSwitcher mode="login" next="/markets" />);
    await waitFor(() =>
      expect(navigation).toHaveAttribute("data-auth-mode", "login"),
    );
  });

  it("preserves the encoded safe next path in both mode routes", () => {
    render(<AuthModeSwitcher mode="register" next="/direct?filtre=à voir" />);

    fireEvent.click(screen.getByRole("radio", { name: "Connexion" }));

    expect(push).toHaveBeenCalledWith(
      "/login?next=%2Fdirect%3Ffiltre%3D%C3%A0%20voir",
    );
  });

  it("renders the password sign-in controls without magic-link copy", () => {
    render(<SignInForm next="/direct" />);

    expect(
      screen.getByRole("heading", { name: "Bon retour dans la salle" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accès membre")).toHaveAttribute(
      "data-type",
      "label",
    );
    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "maxlength",
      "320",
    );
    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "spellcheck",
      "false",
    );
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("link", { name: "Mot de passe oublié ?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(
      screen.getByRole("button", { name: "Se connecter" }),
    ).toHaveAttribute("data-variant", "primary");
    expect(screen.getByDisplayValue("/direct")).toHaveAttribute("name", "next");
    expect(screen.queryByText(/lien d’accès/i)).not.toBeInTheDocument();
  });

  it("renders a safe public password-update confirmation with the sign-in form", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(
      await LoginPage({
        searchParams: Promise.resolve({ notice: "password-updated" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Mot de passe modifié" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tu peux maintenant te connecter."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse e-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
  });

  it("renders the complete password sign-up controls without secrets", () => {
    const { container } = render(<SignUpForm next="/markets" />);

    expect(
      screen.getByRole("heading", { name: "Créer mon compte" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nouveau joueur")).toHaveAttribute(
      "data-type",
      "label",
    );
    expect(screen.getByLabelText("Nom d’affichage")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom d’affichage")).toHaveAttribute(
      "maxlength",
      "80",
    );
    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "minlength",
      "10",
    );
    expect(screen.getByLabelText("Confirmer le mot de passe")).toHaveAttribute(
      "minlength",
      "10",
    );
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "maxlength",
      "128",
    );
    expect(
      screen.getByRole("button", { name: "Créer mon compte" }),
    ).toHaveAttribute("data-variant", "primary");
    expect(container.innerHTML).not.toMatch(/token|secret|supabase\.co/i);
  });

  it("toggles password visibility without controlling the input value", () => {
    render(
      <PasswordField
        autoComplete="current-password"
        id="member-password"
        label="Mot de passe"
        name="password"
      />,
    );

    const input = screen.getByLabelText("Mot de passe");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    );
    expect(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toHaveAttribute("aria-controls", input.id);
    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    );
    expect(input).toHaveAttribute("type", "password");
  });

  it("exposes independent password toggles throughout sign-up", () => {
    render(<SignUpForm next="/direct" />);

    const password = screen.getByLabelText("Mot de passe");
    const confirmation = screen.getByLabelText("Confirmer le mot de passe");
    const showPassword = screen.getByRole("button", {
      name: "Afficher le mot de passe",
    });
    const showConfirmation = screen.getByRole("button", {
      name: "Afficher la confirmation du mot de passe",
    });

    expect(showPassword).toHaveAttribute("aria-controls", password.id);
    expect(showConfirmation).toHaveAttribute("aria-controls", confirmation.id);

    fireEvent.click(showConfirmation);
    expect(confirmation).toHaveAttribute("type", "text");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Masquer la confirmation du mot de passe",
      }),
    );
    expect(confirmation).toHaveAttribute("type", "password");
  });

  it("preserves sign-in email and associates the generic failure", async () => {
    const failureAction = async (): Promise<AuthFormState> => ({
      ok: false,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Connexion impossible.",
    });
    render(<SignInForm action={failureAction} next="/direct" />);

    const email = screen.getByLabelText("Adresse e-mail");
    const password = screen.getByLabelText("Mot de passe");
    fireEvent.change(email, { target: { value: "safe@example.test" } });
    fireEvent.change(password, { target: { value: "password-value" } });
    fireEvent.submit(email.closest("form") as HTMLFormElement);

    await screen.findByText("Connexion impossible.");
    expect(email).toHaveValue("safe@example.test");
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "sign-in-error");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAttribute("aria-describedby", "sign-in-error");
    expect(document.getElementById("sign-in-error")).toHaveTextContent(
      "Connexion impossible.",
    );
  });

  it("preserves sign-up identity fields and focuses the first failure", async () => {
    const failureAction = async (): Promise<AuthFormState> => ({
      ok: false,
      code: "AUTH_SIGN_UP_FAILED",
      message: "Création impossible.",
    });
    render(<SignUpForm action={failureAction} next="/direct" />);

    const displayName = screen.getByLabelText("Nom d’affichage");
    const email = screen.getByLabelText("Adresse e-mail");
    const password = screen.getByLabelText("Mot de passe");
    const confirmation = screen.getByLabelText("Confirmer le mot de passe");
    fireEvent.change(displayName, { target: { value: "Joueur Sûr" } });
    fireEvent.change(email, { target: { value: "safe@example.test" } });
    fireEvent.change(password, { target: { value: "password-value" } });
    fireEvent.change(confirmation, { target: { value: "password-value" } });
    fireEvent.submit(email.closest("form") as HTMLFormElement);

    await screen.findByText("Création impossible.");
    expect(displayName).toHaveValue("Joueur Sûr");
    expect(email).toHaveValue("safe@example.test");
    await waitFor(() => expect(displayName).toHaveFocus());
    for (const input of [displayName, email, password, confirmation]) {
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", "sign-up-error");
    }
    expect(document.getElementById("sign-up-error")).toHaveTextContent(
      "Création impossible.",
    );
  });

  it("keeps sign-up fields visible when an action returns success without redirecting", async () => {
    const successAction = vi.fn(async (): Promise<AuthFormState> => ({
      ok: true,
      message: "Compte créé. Consulte l’e-mail reçu pour confirmer ton compte.",
    }));

    const { container } = render(
      <SignUpForm action={successAction} next="/direct" />,
    );

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => expect(successAction).toHaveBeenCalledOnce());
    expect(
      screen.getByRole("heading", { name: "Créer mon compte" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse e-mail")).toBeInTheDocument();
    expect(screen.queryByText("Confirme ton adresse")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Compte créé. Consulte l’e-mail reçu pour confirmer ton compte.",
      ),
    ).not.toBeInTheDocument();
  });

  it("keeps the sign-in label stable while submission is pending", async () => {
    let resolveAction: ((state: AuthFormState) => void) | undefined;
    const pendingAction = (): Promise<AuthFormState> =>
      new Promise((resolve) => {
        resolveAction = resolve;
      });

    const { container } = render(
      <SignInForm action={pendingAction} next="/direct" />,
    );
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    const button = await screen.findByRole("button", { name: "Se connecter" });
    await waitFor(() =>
      expect(container.querySelector("form")).toHaveAttribute(
        "data-status",
        "pending",
      ),
    );
    expect(button).toBeDisabled();
    expect(screen.getByText("Connexion en cours.")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(
      button.querySelector('[data-pending-indicator="true"]'),
    ).not.toBeNull();

    resolveAction?.({
      ok: false,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Connexion impossible.",
    });
    await waitFor(() =>
      expect(container.querySelector("form")).toHaveAttribute(
        "data-status",
        "error",
      ),
    );
  });

  it("keeps the sign-up label stable while submission is pending", async () => {
    let resolveAction: ((state: AuthFormState) => void) | undefined;
    const pendingAction = (): Promise<AuthFormState> =>
      new Promise((resolve) => {
        resolveAction = resolve;
      });

    const { container } = render(
      <SignUpForm action={pendingAction} next="/direct" />,
    );
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    const button = await screen.findByRole("button", {
      name: "Créer mon compte",
    });
    await waitFor(() =>
      expect(container.querySelector("form")).toHaveAttribute(
        "data-status",
        "pending",
      ),
    );
    expect(button).toBeDisabled();
    expect(screen.getByText("Création du compte en cours.")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(
      button.querySelector('[data-pending-indicator="true"]'),
    ).not.toBeNull();

    resolveAction?.({
      ok: false,
      code: "AUTH_SIGN_UP_FAILED",
      message: "Création impossible.",
    });
    await waitFor(() =>
      expect(container.querySelector("form")).toHaveAttribute(
        "data-status",
        "error",
      ),
    );
  });

  it("presents only useful public context and safe mode navigation", () => {
    const { container } = render(
      <AuthShell mode="register" next="/markets">
        <p>Formulaire public</p>
      </AuthShell>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Retour à l’accueil MK Bet" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Retour à l’accueil MK Bet" }),
    ).toHaveTextContent("MKBET");
    expect(screen.getByText("Margot × Kévin")).toBeInTheDocument();
    expect(screen.getByText("1 000 MKB fictifs")).toBeInTheDocument();
    expect(screen.getByText("Deux votes concordants")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(
      /Une histoire|salle à sept|Aucun pari en argent réel/i,
    );
    expect(
      container.querySelector('[data-auth-editorial-details="true"]'),
    ).toHaveClass("hidden");
    for (const halo of container.querySelectorAll(
      '[data-auth-decoration="halo"]',
    )) {
      expect(halo).toHaveClass("hidden");
    }

    expect(screen.getByRole("radio", { name: "Connexion" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(
      screen.getByRole("radio", { name: "Créer un compte" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(container.querySelector(".astryx-card")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[\w.+-]+@[\w.-]+/);
  });

  it("selects registration only for the exact register mode", () => {
    expect(parseAuthMode("register")).toBe("register");
    expect(parseAuthMode("REGISTER")).toBe("login");
    expect(parseAuthMode(["register"])).toBe("login");
    expect(parseAuthMode(undefined)).toBe("login");
  });

  it("accepts only the exact public password-update notice", () => {
    expect(hasPasswordUpdatedNotice("password-updated")).toBe(true);
    expect(hasPasswordUpdatedNotice("PASSWORD-UPDATED")).toBe(false);
    expect(hasPasswordUpdatedNotice(["password-updated"])).toBe(false);
    expect(hasPasswordUpdatedNotice(undefined)).toBe(false);
  });

  it("renders invitation previews without leaking the raw token", () => {
    render(
      <InvitationPanel
        isAuthenticated
        nextPath="/invite/raw-secret-token"
        preview={{
          isValid: true,
          seasonTitle: "Saison A",
          proposedRole: "PLAYER",
          proposedSubjectKey: null,
          expiresAt: "2026-08-01T00:00:00.000Z",
          maskedEmail: "a***@example.com",
          reason: null,
        }}
      />,
    );

    expect(
      screen.getByText("Tu as été convoqué dans la salle des marchés."),
    ).toBeInTheDocument();
    expect(screen.getByText("Saison A")).toBeInTheDocument();
    expect(screen.queryByText("raw-secret-token")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accepter l’invitation" }),
    ).toBeInTheDocument();
  });

  it("renders a season selector with an empty state", () => {
    render(<SeasonSelector seasons={[]} />);

    expect(
      screen.getByText(
        "Aucun championnat actif. Utilise une invitation ou crée une nouvelle saison.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Créer une saison" }),
    ).toHaveAttribute("href", "/seasons/new");
  });
});
