import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectPage from "@/app/(protected)/direct/page";
import MarketsPage from "@/app/(protected)/markets/page";
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
  listSeasonLeaderboard: vi.fn(async () => []),
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
      screen.getByRole("heading", { name: "Margot × Kévin - Direct" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Déclarer un événement" }),
    ).toHaveAttribute("href", "/report");
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
});
