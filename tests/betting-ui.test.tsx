import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBetQuoteAction } from "@/application/betting/create-bet-quote-action";
import { placeBetAction } from "@/application/betting/place-bet-action";
import { BetSlip } from "@/components/sportsbook/bet-slip";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { MarketCard } from "@/components/sportsbook/market-card";
import {
  demoMarkets,
  demoSeasonContext,
} from "@/fixtures/sportsbook/demo-data";

vi.mock("@/application/betting/create-bet-quote-action", () => ({
  createBetQuoteAction: vi.fn(),
}));
vi.mock("@/application/betting/place-bet-action", () => ({
  placeBetAction: vi.fn(),
}));

const createQuoteMock = vi.mocked(createBetQuoteAction);
const placeBetMock = vi.mocked(placeBetAction);

describe("transactional bet slip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createQuoteMock.mockResolvedValue({
      ok: true,
      quote: {
        quoteId: "10000000-0000-4000-8000-000000000001",
        betType: "SINGLE",
        stakeMkb: 10,
        totalOdds: 1.88,
        potentialReturnMkb: 18,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        correlationAdjustment: null,
        legs: [
          {
            marketId: demoMarkets[0].id,
            outcomeId: demoMarkets[0].outcomes[0].id,
            eventCode: "KISS",
            fairProbability: 0.49,
            displayedOdds: 1.88,
            oddsVersion: 4,
          },
        ],
      },
    });
    placeBetMock.mockResolvedValue({
      ok: true,
      bet: {
        betId: "20000000-0000-4000-8000-000000000001",
        ticketNumber: "20000000",
        balanceMkb: 1190,
        stakeMkb: 10,
        totalOdds: 1.88,
        potentialReturnMkb: 18,
      },
    });
  });

  it("requires an authoritative quote before placement and clears on success", async () => {
    render(
      <BetSlipProvider>
        <MarketCard market={demoMarkets[0]} />
        <BetSlip balanceMkb={1200} seasonId={demoSeasonContext.id} />
      </BetSlipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Oui, cote/i }));
    fireEvent.click(screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByRole("button", { name: "PLACER MON PRONOSTIC" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Retour potentiel").nextSibling).toHaveTextContent(
      "18 MKB",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "PLACER MON PRONOSTIC" }),
    );
    await waitFor(() => expect(placeBetMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Pronostic enregistré",
    );
    expect(screen.getByText("0 sélection")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir mes paris" }),
    ).toHaveAttribute("href", "/bets");
  });

  it("invalidates the quote as soon as the stake changes", async () => {
    render(
      <BetSlipProvider>
        <MarketCard market={demoMarkets[0]} />
        <BetSlip balanceMkb={1200} seasonId={demoSeasonContext.id} />
      </BetSlipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Oui, cote/i }));
    fireEvent.click(screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }));
    expect(
      await screen.findByRole("button", { name: "PLACER MON PRONOSTIC" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Mise en MKB"), {
      target: { value: "15" },
    });
    expect(
      screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }),
    ).toBeInTheDocument();
  });
});
