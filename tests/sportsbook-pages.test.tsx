import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectPage from "@/app/(protected)/direct/page";
import MarketsPage from "@/app/(protected)/markets/page";
import MarketCalendarPage from "@/app/(protected)/markets/calendar/page";
import LeaderboardPage from "@/app/(protected)/leaderboard/page";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import {
  adminSeasonContext,
  demoMarkets,
} from "@/fixtures/sportsbook/demo-data";
import { listEventReports } from "@/data/supabase/events/repository";
import { listSeasonMarkets } from "@/data/supabase/markets/market-repository";

vi.mock("@/application/sportsbook/require-season", () => ({
  requireSportsbookSeason: vi.fn(async () => adminSeasonContext),
}));
vi.mock("@/application/sportsbook/require-single-room", () => ({
  requireSingleRoom: vi.fn(async () => adminSeasonContext),
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
      userId: "player-user",
      rank: 1,
      playerName: "Alice",
      avatarUrl: null,
      capitalMkb: 1240,
      totalStakedMkb: 100,
      totalReturnedMkb: 340,
      netProfitMkb: 240,
    },
    {
      userId: "bob-user",
      rank: 2,
      playerName: "Bob",
      avatarUrl: null,
      capitalMkb: 1100,
      totalStakedMkb: 80,
      totalReturnedMkb: 180,
      netProfitMkb: 100,
    },
    {
      userId: "chloe-user",
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
vi.mock("@/data/supabase/markets/audit-repository", () => ({
  listRecentMarketAudit: vi.fn(async () => [
    {
      id: 1,
      action: "MARKET_OPENED",
      actor_user_id: "player-user",
      after_data: null,
      before_data: null,
      created_at: "2026-07-21T08:00:00.000Z",
      entity_id: demoMarkets[0].id,
      entity_type: "market",
      metadata: {},
      season_id: adminSeasonContext.id,
    },
  ]),
}));

describe("sportsbook pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the permanent direct room without demonstration content", async () => {
    render(
      <BetSlipProvider>
        {await DirectPage({ searchParams: Promise.resolve({}) })}
      </BetSlipProvider>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Aujourd’hui",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Déclarer/i })[0],
    ).toHaveAttribute("href", "/report");
    expect(screen.queryByText(/données de démonstration/i)).toBeNull();
    expect(screen.queryByText(/service_role/i)).not.toBeInTheDocument();
    expect(screen.getByText("Aucune validation en attente")).toBeVisible();
  });

  it("orders Aujourd’hui around personal context and actions", async () => {
    render(
      <BetSlipProvider>
        {await DirectPage({ searchParams: Promise.resolve({}) })}
      </BetSlipProvider>,
    );

    const headings = screen
      .getAllByRole("heading")
      .map((heading) => heading.textContent);
    expect(headings[0]).toMatch(/Aujourd’hui/i);
    expect(
      screen.getByRole("heading", { level: 2, name: /1.*200 MKB/ }),
    ).toBeVisible();
    expect(screen.getByText(/rang #1/i)).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Déclarer/i })[0]).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Tous les marchés/i }),
    ).toBeVisible();
    expect(vi.mocked(listSeasonMarkets)).toHaveBeenCalledWith(
      adminSeasonContext.id,
      { category: "ALL", status: "OPEN", sort: "deadline", q: "" },
      2,
    );
    expect(vi.mocked(listEventReports)).toHaveBeenCalledWith(
      "player-user",
      "PENDING",
    );
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
      screen.getByRole("heading", { level: 1, name: "Marchés" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("lit")).toBeInTheDocument();
    expect(
      screen.queryByText("Données de démonstration"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir le calendrier des marchés" }),
    ).toHaveAttribute("href", "/markets/calendar");
  });

  it("renders the market calendar with week controls and closed market dates", async () => {
    render(
      await MarketCalendarPage({
        searchParams: Promise.resolve({
          week: "2026-07-13",
          category: "CONTACT",
          status: "OPEN",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Calendrier des marchés" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Semaine précédente.*6 juillet/i }),
    ).toHaveAttribute(
      "href",
      "/markets/calendar?week=2026-07-06&category=CONTACT&status=OPEN",
    );
    expect(
      screen.getByRole("link", { name: /Semaine suivante.*20 juillet/i }),
    ).toHaveAttribute(
      "href",
      "/markets/calendar?week=2026-07-20&category=CONTACT&status=OPEN",
    );
    expect(screen.getByLabelText("Catégorie")).toHaveValue("CONTACT");
    expect(screen.getByLabelText("Statut")).toHaveValue("OPEN");
    expect(screen.getByDisplayValue("2026-07-13")).toHaveAttribute(
      "name",
      "week",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /14 juillet 2026/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ouverture")).toBeVisible();
    expect(screen.getByText("Fermeture des mises")).toBeVisible();
    expect(screen.getByText("Échéance du fait")).toBeVisible();
    expect(screen.getByText("Mises fermées")).toBeVisible();
    expect(screen.getAllByText(/UTC/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Un bisou avant J\+30/i }),
    ).toHaveAttribute("href", `/markets/${demoMarkets[0].id}`);
    expect(requireSportsbookSeason).toHaveBeenCalledTimes(1);
    expect(vi.mocked(listSeasonMarkets)).toHaveBeenCalledWith(
      adminSeasonContext.id,
      { category: "CONTACT", status: "OPEN", sort: "deadline", q: "" },
    );
  });

  it("uses close as the only operational date when a calendar market has no deadline", async () => {
    vi.mocked(listSeasonMarkets).mockResolvedValueOnce([
      { ...demoMarkets[0], deadlineAt: null },
    ]);

    render(
      await MarketCalendarPage({
        searchParams: Promise.resolve({
          week: "2026-07-13",
          category: "CONTACT",
          status: "OPEN",
        }),
      }),
    );

    expect(screen.getByText("Fermeture des mises")).toBeVisible();
    expect(screen.queryByText("Échéance du fait")).not.toBeInTheDocument();
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
