import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBetQuoteAction } from "@/application/betting/create-bet-quote-action";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { MobileBetSlip } from "@/components/sportsbook/mobile-bet-slip";
import { OddsButton } from "@/components/sportsbook/odds-button";

vi.mock("@/application/betting/create-bet-quote-action", () => ({
  createBetQuoteAction: vi.fn(),
}));

const createQuoteMock = vi.mocked(createBetQuoteAction);

describe("Astryx sportsbook interactions", () => {
  beforeEach(() => {
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
        legs: [],
      },
    });
  });

  it("selects a live odds button without relying on color", () => {
    render(
      <BetSlipProvider>
        <OddsButton
          marketId="market"
          outcomeId="yes"
          outcomeLabel="Oui"
          odds={1.88}
          oddsVersion={4}
          selected={false}
          status="OPEN"
          movement="UP"
        />
      </BetSlipProvider>,
    );

    const odds = screen.getByRole("button", { name: /Oui, cote 1,88/i });
    fireEvent.click(odds);
    expect(odds).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the mobile ticket in a named dialog and preserves selections", () => {
    render(
      <BetSlipProvider>
        <OddsButton
          marketId="market"
          outcomeId="yes"
          outcomeLabel="Oui"
          odds={1.88}
          oddsVersion={4}
          selected={false}
          status="OPEN"
          movement="UP"
        />
        <MobileBetSlip balanceMkb={1000} seasonId="season" />
      </BetSlipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Oui, cote 1,88/i }));
    expect(
      screen.getByRole("button", { name: /retour après devis/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir le ticket/i }));
    expect(
      screen.getByRole("dialog", { name: "Ticket de pari" }),
    ).toBeVisible();
    expect(screen.getByText("1 sélection")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog", { name: "Ticket de pari" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir le ticket/i }));
    expect(screen.getByText("1 sélection")).toBeVisible();
  });

  it("updates the persistent ticket trigger from an authoritative quote", async () => {
    render(
      <BetSlipProvider>
        <OddsButton
          marketId="market"
          outcomeId="yes"
          outcomeLabel="Oui"
          odds={1.88}
          oddsVersion={4}
          selected={false}
          status="OPEN"
          movement="UP"
        />
        <MobileBetSlip balanceMkb={1000} seasonId="season" />
      </BetSlipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Oui, cote 1,88/i }));
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir le ticket/i }));
    fireEvent.click(screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /retour potentiel 18 MKB/i }),
      ).toBeInTheDocument(),
    );
  });
});
