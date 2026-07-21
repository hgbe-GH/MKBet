import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { InvitationFormState } from "@/application/invitations/actions";
import type { SeasonFormState } from "@/application/seasons/actions";
import { PasswordField } from "@/components/auth/password-field";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import { NewSeasonForm } from "@/components/seasons/new-season-form";

const validInvitation = {
  isValid: true as const,
  seasonTitle: "Saison A",
  proposedRole: "PLAYER" as const,
  proposedSubjectKey: null,
  expiresAt: "2026-08-01T00:00:00.000Z",
  maskedEmail: "a***@example.com",
  reason: null,
};

describe("Astryx mutation forms", () => {
  it("keeps every mandatory season field subject to native validation", () => {
    render(
      <NewSeasonForm
        action={async (): Promise<SeasonFormState> => ({
          ok: false,
          code: "DATABASE_OPERATION_FAILED",
          message: "Création impossible.",
        })}
      />,
    );

    expect(screen.getByLabelText("Titre")).toBeRequired();
    expect(screen.getByLabelText("Date de rupture")).toBeRequired();
    expect(screen.getByLabelText("Capital initial MKB")).toBeRequired();
  });

  it("announces invitation submission without changing its action label", async () => {
    let resolveAction: ((state: InvitationFormState) => void) | undefined;
    const pendingAction = (): Promise<InvitationFormState> =>
      new Promise((resolve) => {
        resolveAction = resolve;
      });
    const { container } = render(
      <InvitationPanel
        action={pendingAction}
        isAuthenticated
        nextPath="/invite/safe-token"
        preview={validInvitation}
        token="safe-token"
      />,
    );

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    const button = await screen.findByRole("button", {
      name: "Accepter l’invitation",
    });
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    expect(button).toBeDisabled();
    expect(screen.getByText("Acceptation en cours.")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    resolveAction?.({
      ok: false,
      code: "INVITATION_INVALID",
      message: "Invitation impossible.",
    });
    await screen.findByText("Invitation impossible.");
  });

  it("announces season creation without changing its action label", async () => {
    let resolveAction: ((state: SeasonFormState) => void) | undefined;
    const pendingAction = (): Promise<SeasonFormState> =>
      new Promise((resolve) => {
        resolveAction = resolve;
      });
    const { container } = render(<NewSeasonForm action={pendingAction} />);

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    const button = await screen.findByRole("button", {
      name: "Créer la saison",
    });
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    expect(button).toBeDisabled();
    expect(screen.getByText("Création de la saison en cours.")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    resolveAction?.({
      ok: false,
      code: "DATABASE_OPERATION_FAILED",
      message: "Création impossible.",
    });
    await screen.findByText("Création impossible.");
  });

  it("keeps password visibility controls touch-sized", () => {
    render(
      <PasswordField
        autoComplete="current-password"
        id="touch-password"
        label="Mot de passe tactile"
        name="password"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    ).toHaveClass("min-h-11", "min-w-11");
  });
});
