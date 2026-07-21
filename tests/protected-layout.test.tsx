import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProtectedLayout from "@/app/(protected)/layout";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("@/auth/require-auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: "player-1" })),
}));

vi.mock("@/application/sportsbook/require-single-room", () => ({
  requireSingleRoom: vi.fn(async () => ({
    id: "single-room",
    title: "Margot × Kévin",
    matchup: "Margot × Kévin",
    status: "ACTIVE",
    breakupDate: "2026-07-01",
    daysSinceBreakup: 14,
    roles: ["PLAYER"],
    balanceMkb: 1000,
    isDemo: false,
    rechute: { total: 0, delta: 0, label: "", explanation: "", segments: [] },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect,
  usePathname: vi.fn(() => "/direct"),
}));

describe("protected layout", () => {
  it("always renders the permanent room shell for an authenticated player", async () => {
    render(
      await ProtectedLayout({
        children: <p>Fil privé</p>,
      }),
    );

    expect(screen.getByText("Fil privé")).toBeInTheDocument();
    expect(screen.getAllByText("Margot × Kévin").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("navigation", { name: "Navigation principale" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Aller au contenu principal" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByText("1 000 MKB")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ouvrir le menu du compte" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(
      document.querySelector("#main-content"),
    );
    expect(
      screen.queryByRole("link", { name: "Administration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Deux votes concordants suffisent pour trancher un fait.",
      ),
    ).not.toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
