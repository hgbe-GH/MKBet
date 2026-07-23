import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { MobileBetSlip } from "@/components/sportsbook/mobile-bet-slip";
import { OddsButton } from "@/components/sportsbook/odds-button";

describe("Astryx sportsbook interactions", () => {
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
});
