import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthFormState } from "@/application/auth/actions";

const { createServerSupabaseClient, getClaims, redirect } = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getClaims: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient }));

import AuthErrorPage from "@/app/auth/error/page";
import UpdatePasswordPage, {
  dynamic as updatePasswordRenderingMode,
} from "@/app/auth/update-password/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

describe("password recovery UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerSupabaseClient.mockResolvedValue({ auth: { getClaims } });
    getClaims.mockResolvedValue({
      data: { claims: { amr: ["recovery"] } },
      error: null,
    });
  });

  it("renders the reset request constraints and a stable pending submit", async () => {
    let resolveAction: ((state: AuthFormState) => void) | undefined;
    const pendingAction = (): Promise<AuthFormState> =>
      new Promise((resolve) => {
        resolveAction = resolve;
      });
    const { container } = render(
      <PasswordResetRequestForm action={pendingAction} />,
    );

    expect(
      screen.getByRole("heading", { name: "Retrouver mon accès" }),
    ).toBeInTheDocument();
    const email = screen.getByLabelText("Adresse e-mail");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("maxlength", "320");
    expect(email).toHaveAttribute("spellcheck", "false");

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    const button = await screen.findByRole("button", {
      name: "ENVOYER L’E-MAIL",
    });
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    expect(button).toBeDisabled();
    expect(
      button.querySelector('[data-pending-indicator="true"]'),
    ).not.toBeNull();

    resolveAction?.({ ok: true, message: "message générique" });
    await screen.findByRole("heading", { name: "Consulte ta boîte mail" });
  });

  it("replaces the reset form with the exact generic success and no submitted identity", async () => {
    const successAction = async (): Promise<AuthFormState> => ({
      ok: true,
      message:
        "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.",
    });
    const { container } = render(
      <PasswordResetRequestForm action={successAction} />,
    );
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
      target: { value: "private@example.test" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(
      await screen.findByRole("heading", { name: "Consulte ta boîte mail" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Revenir à la connexion" }),
    ).toHaveAttribute("href", "/login");
    expect(screen.queryByLabelText("Adresse e-mail")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/private@example\.test|token/i);
  });

  it("preserves and focuses the reset email after an associated failure", async () => {
    const failureAction = async (): Promise<AuthFormState> => ({
      ok: false,
      code: "AUTH_PASSWORD_RESET_FAILED",
      message: "Demande impossible.",
    });
    const { container } = render(
      <PasswordResetRequestForm action={failureAction} />,
    );
    const email = screen.getByLabelText("Adresse e-mail");
    fireEvent.change(email, { target: { value: "safe@example.test" } });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await screen.findByText("Demande impossible.");
    expect(email).toHaveValue("safe@example.test");
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "password-reset-error");
    expect(document.getElementById("password-reset-error")).toHaveTextContent(
      "Demande impossible.",
    );
  });

  it("renders update constraints, independent toggles, and stable pending state", async () => {
    let resolveAction: ((state: AuthFormState) => void) | undefined;
    const pendingAction = (): Promise<AuthFormState> =>
      new Promise((resolve) => {
        resolveAction = resolve;
      });
    const { container } = render(<UpdatePasswordForm action={pendingAction} />);

    expect(
      screen.getByRole("heading", {
        name: "Choisir un nouveau mot de passe",
      }),
    ).toBeInTheDocument();
    const password = screen.getByLabelText("Nouveau mot de passe");
    const confirmation = screen.getByLabelText(
      "Confirmer le nouveau mot de passe",
    );
    for (const input of [password, confirmation]) {
      expect(input).toHaveAttribute("autocomplete", "new-password");
      expect(input).toHaveAttribute("minlength", "10");
      expect(input).toHaveAttribute("maxlength", "128");
    }
    expect(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    ).toHaveAttribute("aria-controls", "update-password");
    expect(
      screen.getByRole("button", {
        name: "Afficher la confirmation du mot de passe",
      }),
    ).toHaveAttribute("aria-controls", "update-password-confirmation");

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    const button = await screen.findByRole("button", {
      name: "MODIFIER LE MOT DE PASSE",
    });
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    expect(button).toBeDisabled();
    expect(
      button.querySelector('[data-pending-indicator="true"]'),
    ).not.toBeNull();
    resolveAction?.({
      ok: false,
      code: "AUTH_PASSWORD_UPDATE_FAILED",
      message: "Modification impossible.",
    });
    await screen.findByText("Modification impossible.");
  });

  it("associates update failures, focuses the first field, and clears passwords", async () => {
    const failureAction = async (): Promise<AuthFormState> => ({
      ok: false,
      code: "AUTH_PASSWORD_UPDATE_FAILED",
      message: "Modification impossible.",
    });
    const { container } = render(<UpdatePasswordForm action={failureAction} />);
    const password = screen.getByLabelText("Nouveau mot de passe");
    const confirmation = screen.getByLabelText(
      "Confirmer le nouveau mot de passe",
    );
    fireEvent.change(password, { target: { value: "private-password" } });
    fireEvent.change(confirmation, { target: { value: "private-password" } });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await screen.findByText("Modification impossible.");
    await waitFor(() => expect(password).toHaveFocus());
    for (const input of [password, confirmation]) {
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute(
        "aria-describedby",
        "update-password-error",
      );
      expect(input).toHaveValue("");
    }
    expect(container.textContent).not.toContain("private-password");
  });

  it("replaces update fields with the exact success and login link", async () => {
    const successAction = async (): Promise<AuthFormState> => ({
      ok: true,
      message: "Mot de passe modifié. Tu peux maintenant te connecter.",
    });
    const { container } = render(<UpdatePasswordForm action={successAction} />);
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(
      await screen.findByRole("heading", { name: "Mot de passe modifié" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mot de passe modifié. Tu peux maintenant te connecter.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.queryByLabelText("Nouveau mot de passe"),
    ).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/token|private-password/i);
  });

  it("uses the public shell without mode tabs on both recovery pages", async () => {
    const forgot = render(<ForgotPasswordPage />);
    expect(
      screen.queryByRole("navigation", { name: "Choisir le mode d’accès" }),
    ).not.toBeInTheDocument();
    expect(forgot.container.textContent).not.toMatch(
      /solde|portefeuille|token/i,
    );
    forgot.unmount();

    const update = render(await UpdatePasswordPage());
    expect(
      screen.queryByRole("navigation", { name: "Choisir le mode d’accès" }),
    ).not.toBeInTheDocument();
    expect(update.container.textContent).not.toMatch(
      /solde|portefeuille|token/i,
    );
  });

  it("keeps the session-gated update page dynamic", () => {
    expect(updatePasswordRenderingMode).toBe("force-dynamic");
  });

  it("refuses to render the update page for an ordinary session", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { amr: ["password"] } },
      error: null,
    });

    await expect(UpdatePasswordPage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("shows a generic auth error action without magic-link copy", () => {
    const { container } = render(<AuthErrorPage />);
    expect(
      screen.getByText(
        "La demande d’authentification n’a pas pu être validée. Recommence depuis la connexion.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Revenir à la connexion" }),
    ).toHaveAttribute("href", "/login");
    expect(container.textContent).not.toMatch(
      /magic|lien d'accès|jeton|token/i,
    );
  });
});
