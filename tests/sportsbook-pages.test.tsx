import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/(protected)/admin/page";
import DashboardPage from "@/app/(protected)/dashboard/page";
import LivesPage from "@/app/(protected)/lives/page";
import MarketsPage from "@/app/(protected)/markets/page";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import {
  adminSeasonContext,
  demoLeaderboard,
  demoMarkets,
} from "@/fixtures/sportsbook/demo-data";

vi.mock("@/application/sportsbook/require-season", () => ({
  requireSportsbookSeason: vi.fn(async () => adminSeasonContext),
}));
vi.mock("@/data/supabase/markets/market-repository", () => ({
  listSeasonMarkets: vi.fn(async () => demoMarkets),
  getSeasonMarket: vi.fn(async () => demoMarkets[0]),
}));
vi.mock("@/data/supabase/betting/bet-repository", () => ({
  listCurrentUserBets: vi.fn(async () => []),
}));
vi.mock("@/data/supabase/leaderboard/leaderboard-repository", () => ({
  listSeasonLeaderboard: vi.fn(async () => demoLeaderboard),
}));

describe("sportsbook pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the dashboard with real financial surfaces and clearly marked demo timeline", async () => {
    render(<BetSlipProvider>{await DashboardPage()}</BetSlipProvider>);
    expect(
      screen.getByRole("heading", { name: "Margot × Kévin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saison réelle")).toBeInTheDocument();
    expect(
      screen.getByText(/Chronologie · données de démonstration/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/service_role/i)).not.toBeInTheDocument();
  });

  it("renders market filters from sanitized search params", async () => {
    render(
      <BetSlipProvider>
        {await MarketsPage({
          searchParams: Promise.resolve({
            category: "PHYSICAL",
            status: "OPEN",
            sort: "deadline",
            q: "lit",
          }),
        })}
      </BetSlipProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Tableau des cotes" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("lit")).toBeInTheDocument();
    expect(
      screen.queryByText("Données de démonstration"),
    ).not.toBeInTheDocument();
  });

  it("keeps lives explicitly demonstrative", async () => {
    render(await LivesPage());
    expect(
      screen.getByRole("heading", { name: "Sessions en cours" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Soirée rooftop à risque")).toBeInTheDocument();
  });

  it("protects and renders the admin market entrypoint", async () => {
    render(await AdminPage());
    expect(
      screen.getByRole("heading", { name: "Console MK Bet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Marchés/i })).toHaveAttribute(
      "href",
      "/admin/markets",
    );
  });
});
