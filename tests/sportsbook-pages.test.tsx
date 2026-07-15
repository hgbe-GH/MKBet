import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectPage from "@/app/(protected)/direct/page";
import MarketsPage from "@/app/(protected)/markets/page";
import LeaderboardPage from "@/app/(protected)/leaderboard/page";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import {
  adminSeasonContext,
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
  listSeasonLeaderboard: vi.fn(async () => [
    {
      rank: 1,
      playerName: "Alice",
      avatarUrl: null,
      capitalMkb: 1240,
      totalStakedMkb: 100,
      totalReturnedMkb: 340,
      netProfitMkb: 240,
    },
    {
      rank: 2,
      playerName: "Bob",
      avatarUrl: null,
      capitalMkb: 1100,
      totalStakedMkb: 80,
      totalReturnedMkb: 180,
      netProfitMkb: 100,
    },
    {
      rank: 3,
      playerName: "Chloé",
      avatarUrl: null,
      capitalMkb: 980,
      totalStakedMkb: 50,
      totalReturnedMkb: 30,
      netProfitMkb: -20,
    },
  ]),
}));
vi.mock("@/auth/require-auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: "player-user" })),
}));
vi.mock("@/data/supabase/events/repository", () => ({
  listEventReports: vi.fn(async () => []),
  listReportableMarkets: vi.fn(async () => []),
}));

describe("sportsbook pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the permanent direct room without demonstration content", async () => {
    render(await DirectPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: "Le groupe fait le marché." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ Déclarer" })).toHaveAttribute(
      "href",
      "/report",
    );
    expect(screen.queryByText(/données de démonstration/i)).toBeNull();
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

  it("renders a mobile-friendly podium and ranking list", async () => {
    render(await LeaderboardPage());
    expect(
      screen.getByRole("region", { name: "Podium MKB" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Classement complet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
