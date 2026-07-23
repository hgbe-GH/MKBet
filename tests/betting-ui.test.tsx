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
const thirdOpenMarket = {
  ...demoMarkets[0],
  id: "market-third-open",
  title: "Troisième marché ouvert",
  outcomes: demoMarkets[0].outcomes.map((outcome) => ({
    ...outcome,
    id: `market-third-open-${outcome.code.toLowerCase()}`,
    marketId: "market-third-open",
  })),
};

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
    expect(screen.getByText("Simple")).toBeVisible();
    expect(
      screen.getByRole("complementary", { name: "Ticket de pari" }),
    ).toHaveAttribute("data-ticket-step", "selection");
    fireEvent.click(screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "PLACER MON PRONOSTIC" }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByRole("complementary", { name: "Ticket de pari" }),
    ).toHaveAttribute("data-ticket-step", "quote");
    expect(screen.getByText("Retour potentiel").nextSibling).toHaveTextContent(
      "18 MKB",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "PLACER MON PRONOSTIC" }),
    );
    expect(
      screen.getByRole("alertdialog", { name: "Placer ce pronostic ?" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le pari" }));
    await waitFor(() => expect(placeBetMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("status")
          .some((status) =>
            status.textContent?.includes("Pronostic enregistré"),
          ),
      ).toBe(true),
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
    fireEvent.change(screen.getByLabelText("Mise en MKB"), {
      target: { value: "10" },
    });
    expect(
      screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }),
    ).toBeInTheDocument();
  });

  it("explains singles, accumulator legs, and the authoritative correlated quote", async () => {
    createQuoteMock.mockResolvedValueOnce({
      ok: true,
      quote: {
        quoteId: "10000000-0000-4000-8000-000000000001",
        betType: "ACCUMULATOR",
        stakeMkb: 10,
        totalOdds: 3.2,
        potentialReturnMkb: 32,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        correlationAdjustment: 0.75,
        legs: [],
      },
    });
    render(
      <BetSlipProvider>
        <MarketCard market={demoMarkets[0]} />
        <MarketCard market={demoMarkets[1]} />
        <MarketCard market={thirdOpenMarket} />
        <BetSlip balanceMkb={1200} seasonId={demoSeasonContext.id} />
      </BetSlipProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Oui, cote/i })[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: /Oui, cote/i })[1]!);
    expect(screen.getByText("Combiné 2 sélections")).toBeVisible();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      demoMarkets[0].title,
    );
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent(
      demoMarkets[1].title,
    );
    expect(screen.getByLabelText("Mise en MKB")).toHaveAttribute(
      "type",
      "number",
    );
    expect(screen.getByLabelText("Mise en MKB")).toHaveAttribute("min", "5");
    expect(screen.getByLabelText("Mise en MKB")).toHaveAttribute("max", "1200");
    expect(screen.getByLabelText("Mise en MKB")).toHaveAttribute("step", "1");

    fireEvent.click(screen.getAllByRole("button", { name: /Oui, cote/i })[2]!);
    expect(screen.getByText("Combiné 3 sélections")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }));
    expect(
      await screen.findByText(
        /cote totale et le retour potentiel affichés proviennent uniquement du devis actif/i,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(/PostgreSQL applique la corrélation exacte/i),
    ).toBeVisible();
    expect(
      screen.queryByText(/multiplication naïve côté navigateur/i),
    ).toBeNull();
  });
});
