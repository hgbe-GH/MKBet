import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { BetSlip } from "@/components/sportsbook/bet-slip";
import { MarketCard } from "@/components/sportsbook/market-card";
import { MobileBetSlip } from "@/components/sportsbook/mobile-bet-slip";
import { OddsButton } from "@/components/sportsbook/odds-button";
import { RechuteMeter } from "@/components/sportsbook/rechute-meter";
import { SeasonSwitcher } from "@/components/sportsbook/season-switcher";
import {
  demoMarkets,
  demoSeasonContext,
} from "@/fixtures/sportsbook/demo-data";

describe("sportsbook UI components", () => {
  it("renders an accessible odds button with movement and selected state", async () => {
    render(
      <OddsButton
        marketId="market-kiss-30"
        odds={1.88}
        oddsVersion={4}
        outcomeId="yes"
        outcomeLabel="Oui"
        selected={false}
        status="OPEN"
        movement="UP"
      />,
    );

    const button = screen.getByRole("button", {
      name: /Oui, cote 1,88, marché ouvert, cote en hausse/i,
    });
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);
    expect(screen.getByText("En hausse")).toBeInTheDocument();
  });

  it("announces suspended outcomes and prevents interaction", () => {
    render(
      <OddsButton
        marketId="market-status"
        odds={3.25}
        oddsVersion={2}
        outcomeId="official"
        outcomeLabel="Retour officiel"
        selected={false}
        status="SUSPENDED"
        movement="STABLE"
      />,
    );

    const button = screen.getByRole("button", {
      name: /Retour officiel, cote 3,25, suspendu/i,
    });
    expect(button).toBeDisabled();
    expect(screen.getByText("Suspendu")).toBeInTheDocument();
  });

  it("renders binary and multi-option market cards", () => {
    render(
      <BetSlipProvider>
        <div>
          <MarketCard market={demoMarkets[0]} />
          <MarketCard market={demoMarkets[2]} />
        </div>
      </BetSlipProvider>,
    );

    expect(
      screen.getByRole("heading", { name: demoMarkets[0].title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Binaire")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: demoMarkets[2].title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Multi-options")).toBeInTheDocument();
  });

  it("keeps the bet slip visual only with conflict and stake validation", async () => {
    render(
      <BetSlipProvider>
        <MarketCard market={demoMarkets[0]} />
        <BetSlip balanceMkb={1200} seasonId={demoSeasonContext.id} />
      </BetSlipProvider>,
    );

    expect(
      screen.getByText(
        "Tes amis prennent peut-être de mauvaises décisions pendant que ton ticket reste vide.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Oui, cote/i }));
    expect(screen.getByText("1 sélection")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "VÉRIFIER LE TICKET" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Non, cote/i }));
    expect(
      screen
        .getAllByRole("status")
        .some((status) =>
          status.textContent?.includes(
            "Une seule issue peut être sélectionnée par marché.",
          ),
        ),
    ).toBe(true);

    const stake = screen.getByLabelText("Mise en MKB");
    fireEvent.change(stake, { target: { value: "3" } });
    expect(screen.getByText("Mise minimale : 5 MKB.")).toBeInTheDocument();
  });

  it("opens the mobile ticket in an accessible dialog", () => {
    render(
      <BetSlipProvider>
        <MobileBetSlip balanceMkb={1200} seasonId={demoSeasonContext.id} />
      </BetSlipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Ouvrir le ticket/ }));
    expect(
      screen.getByRole("dialog", { name: "Ticket de pari" }),
    ).toBeVisible();
  });

  it("renders season context, roles and no admin link for regular players", () => {
    render(
      <SeasonSwitcher
        currentSeason={demoSeasonContext}
        seasons={[demoSeasonContext]}
      />,
    );

    expect(screen.getByText("Margot × Kévin")).toBeInTheDocument();
    expect(screen.getByText("PLAYER")).toBeInTheDocument();
  });

  it("renders the Rechutomètre with segment labels", () => {
    render(<RechuteMeter snapshot={demoSeasonContext.rechute} />);

    expect(screen.getByText("Rechutomètre")).toBeInTheDocument();
    expect(screen.getByText("Proximité")).toBeInTheDocument();
    expect(screen.getByText("Physique")).toBeInTheDocument();
    expect(screen.getByText("Régularité")).toBeInTheDocument();
    expect(screen.getByText("Engagement")).toBeInTheDocument();
  });
});
