import {
  demoBets,
  demoLeaderboard,
  demoLives,
  demoMarkets,
  demoResults,
  demoSeasonContext,
  demoTimeline,
} from "./demo-data";
import type {
  LeaderboardReadRepository,
  MarketCategoryFilter,
  MarketReadRepository,
  MarketSort,
  MarketStatusFilter,
  SportsbookBet,
  SportsbookLive,
  SportsbookMarket,
  SportsbookReadRepository,
  SportsbookResult,
  SportsbookSeasonContext,
  TimelineEvent,
} from "./types";

function matchesQuery(market: SportsbookMarket, q: string): boolean {
  if (!q) {
    return true;
  }

  const haystack =
    `${market.title} ${market.trashTitle ?? ""} ${market.description}`.toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function sortMarkets(markets: SportsbookMarket[], sort: MarketSort) {
  return markets.toSorted((a, b) => {
    if (sort === "deadline") {
      return a.deadline.localeCompare(b.deadline);
    }
    if (sort === "odds") {
      return a.outcomes[0].odds - b.outcomes[0].odds;
    }
    if (sort === "movement") {
      return b.variationLabel.localeCompare(a.variationLabel);
    }

    return b.betCount - a.betCount;
  });
}

export const demoSportsbookRepository: SportsbookReadRepository = {
  async getSeasonContext(): Promise<SportsbookSeasonContext> {
    return demoSeasonContext;
  },
};

export const demoMarketRepository: MarketReadRepository = {
  async listMarkets({
    category,
    status,
    sort,
    q,
  }: {
    category: MarketCategoryFilter;
    status: MarketStatusFilter;
    sort: MarketSort;
    q: string;
  }): Promise<SportsbookMarket[]> {
    const filtered = demoMarkets.filter((market) => {
      const categoryMatches =
        category === "ALL" || market.category === category;
      const statusMatches = status === "ALL" || market.status === status;

      return categoryMatches && statusMatches && matchesQuery(market, q);
    });

    return sortMarkets(filtered, sort);
  },

  async getMarket(marketId: string): Promise<SportsbookMarket | null> {
    return demoMarkets.find((market) => market.id === marketId) ?? null;
  },
};

export const demoLiveRepository = {
  async listLives(): Promise<SportsbookLive[]> {
    return demoLives;
  },
  async getLive(liveId: string): Promise<SportsbookLive | null> {
    return demoLives.find((live) => live.id === liveId) ?? null;
  },
};

export const demoLeaderboardRepository: LeaderboardReadRepository = {
  async listLeaderboard() {
    return demoLeaderboard;
  },
};

export async function listDemoBets(): Promise<SportsbookBet[]> {
  return demoBets;
}

export async function listDemoResults(): Promise<SportsbookResult[]> {
  return demoResults;
}

export async function listDemoTimeline(): Promise<TimelineEvent[]> {
  return demoTimeline;
}
