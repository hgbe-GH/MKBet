import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveForm } from "@/components/admin/live-form";
import { MarketForm } from "@/components/admin/market-form";

vi.mock("@/application/markets/admin-actions", () => ({
  openTemplateMarketAction: vi.fn(async () => ({
    ok: true,
    message: "Marché créé.",
  })),
}));

vi.mock("@/application/lives/actions", () => ({
  createLiveSessionAction: vi.fn(async () => ({
    ok: true,
    message: "Live créé.",
  })),
}));

describe("market administration form", () => {
  it("offers template and dates without client-controlled pricing fields", () => {
    render(
      <MarketForm
        defaultDates={{
          opensAt: "2026-07-12T12:00:00.000Z",
          closesAt: "2026-08-10T12:00:00.000Z",
          deadlineAt: "2026-08-11T12:00:00.000Z",
        }}
        seasonId="10000000-0000-4000-8000-000000000001"
        templates={[{ code: "KISS", title: "Premier bisou" }]}
      />,
    );
    expect(screen.getByLabelText("Template")).toHaveValue("KISS");
    expect(screen.getByLabelText("Ouverture")).toBeRequired();
    expect(screen.getByLabelText("Clôture")).toBeRequired();
    expect(screen.getByLabelText("Échéance")).toBeRequired();
    expect(screen.queryByLabelText(/^q$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/demi-vie/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/probabilité/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/marge/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^cote$/i)).not.toBeInTheDocument();
  });
});

describe("live administration form", () => {
  it("adds the host automatically and keeps planning accessible", () => {
    render(
      <LiveForm
        canAssignHost
        currentUserId="10000000-0000-4000-8000-000000000001"
        members={[
          {
            displayName: "Alice",
            roles: ["ADMIN", "LIVE_HOST"],
            userId: "10000000-0000-4000-8000-000000000001",
          },
          {
            displayName: "Chloé",
            roles: ["LIVE_HOST"],
            userId: "20000000-0000-4000-8000-000000000001",
          },
          {
            displayName: "Bob",
            roles: ["PLAYER"],
            userId: "30000000-0000-4000-8000-000000000001",
          },
        ]}
        seasonId="40000000-0000-4000-8000-000000000001"
      />,
    );

    expect(screen.getByLabelText("Hôte")).toHaveValue(
      "10000000-0000-4000-8000-000000000001",
    );
    expect(screen.getByText(/ajouté automatiquement/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Début planifié (UTC)")).toBeRequired();
    expect(screen.getByLabelText("Fin planifiée (UTC)")).toBeRequired();
    expect(screen.getByLabelText("Participant Bob")).toBeInTheDocument();
    expect(screen.queryByLabelText(/multiplicateur/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type de live"), {
      target: { value: "INSTANT" },
    });
    expect(screen.getByLabelText("Début planifié (UTC)")).not.toBeRequired();
    expect(screen.getByText(/planning indicatif facultatif/i)).toBeInTheDocument();
  });
});
