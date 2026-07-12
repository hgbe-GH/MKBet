import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { InvitationPanel } from "@/components/invitations/invitation-panel";
import { SeasonSelector } from "@/components/seasons/season-selector";

describe("auth UI", () => {
  it("renders the login form without exposing user enumeration details", () => {
    render(<LoginForm next="/seasons" />);

    expect(
      screen.getByRole("heading", { name: "Accéder à la salle des marchés" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Nom d’affichage")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "RECEVOIR MON LIEN D’ACCÈS" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Accès privé sur invitation/)).toBeInTheDocument();
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
      screen.getByRole("button", { name: "ACCEPTER L’INVITATION" }),
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
