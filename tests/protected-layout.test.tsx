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
    expect(screen.getByText("Margot × Kévin")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
