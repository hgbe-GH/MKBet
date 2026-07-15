import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/(protected)/admin/page";
import AdminLivesPage from "@/app/(protected)/admin/lives/page";
import NewLivePage from "@/app/(protected)/admin/lives/new/page";
import DashboardPage from "@/app/(protected)/dashboard/page";
import LiveDetailPage from "@/app/(protected)/lives/[liveId]/page";
import LivesPage from "@/app/(protected)/lives/page";
import MarketsPage from "@/app/(protected)/markets/page";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import {
  adminSeasonContext,
  demoLeaderboard,
  demoMarkets,
} from "@/fixtures/sportsbook/demo-data";

const realLives = [
  {
    id: "live-1",
    title: "Soirée planifiée",
    type: "Programmé",
    status: "SCHEDULED",
    scheduledStart: "2026-07-20T18:00:00.000Z",
    scheduledEnd: "2026-07-20T22:00:00.000Z",
    host: "Chloé",
    marketCount: 0,
    participants: ["Chloé", "Bob"],
    lastEvent: "Aucune action déclarée pour ce live.",
  },
];

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
vi.mock("@/data/supabase/lives/repository", () => ({
  getSeasonLive: vi.fn(async () => realLives[0]),
  listActiveSeasonMembers: vi.fn(async () => [
    {
      displayName: "Chloé",
      roles: ["LIVE_HOST"],
      userId: "live-host-1",
    },
  ]),
  listSeasonLives: vi.fn(async () => realLives),
}));
vi.mock("@/data/supabase/media/repository", () => ({
  listSeasonMedia: vi.fn(async () => [
    {
      id: "media-1",
      caption: "Photo de groupe",
      mediaType: "image/webp",
      status: "APPROVED",
    },
  ]),
}));
vi.mock("@/auth/get-auth-claims", () => ({
  getAuthClaims: vi.fn(async () => ({ userId: "admin-user" })),
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

  it("renders persisted lives without a demonstration warning", async () => {
    render(await LivesPage());
    expect(
      screen.getByRole("heading", { name: "Sessions en cours" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Soirée planifiée")).toBeInTheDocument();
    expect(
      screen.queryByText(/Données de démonstration/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Médias de la saison" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Photo de groupe" }),
    ).toHaveAttribute("src", "/api/media/media-1");
  });

  it("renders a persisted live detail and keeps action reporting unavailable", async () => {
    render(
      await LiveDetailPage({ params: Promise.resolve({ liveId: "live-1" }) }),
    );

    expect(screen.getByText("Chloé, Bob")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "SIGNALER UNE ACTION" }),
    ).toBeDisabled();
    expect(screen.queryByText(/fictif/i)).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /Lives/i })).toHaveAttribute(
      "href",
      "/admin/lives",
    );
  });

  it("renders real live administration and its creation entrypoint", async () => {
    render(
      await AdminLivesPage({ searchParams: Promise.resolve({ created: "1" }) }),
    );
    expect(
      screen.getByRole("heading", { name: "Lives réels" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/trace d’audit/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NOUVEAU LIVE" })).toHaveAttribute(
      "href",
      "/admin/lives/new",
    );

    render(await NewLivePage());
    expect(
      screen.getByRole("heading", { name: "Créer un live" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Hôte")).toBeInTheDocument();
  });
});
