import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProtectedLayout from "@/app/(protected)/layout";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("@/auth/require-auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: "player-1" })),
}));

vi.mock("@/data/supabase/sportsbook/repository", () => ({
  getCurrentSportsbookSeason: vi.fn(async () => null),
}));

vi.mock("next/navigation", () => ({ redirect }));

describe("protected layout", () => {
  it("renders the season onboarding when an authenticated player has no season", async () => {
    render(
      await ProtectedLayout({
        children: <p>Créer une saison</p>,
      }),
    );

    expect(screen.getByText("Créer une saison")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
