import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AdminPage from "@/app/(protected)/admin/page";
import DashboardPage from "@/app/(protected)/dashboard/page";
import LivesPage from "@/app/(protected)/lives/page";
import MarketsPage from "@/app/(protected)/markets/page";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";

describe("sportsbook pages", () => {
  it("renders the dashboard demo sportsbook surface without secrets", async () => {
    render(<BetSlipProvider>{await DashboardPage()}</BetSlipProvider>);

    expect(
      screen.getByRole("heading", { name: "Margot × Kévin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Données de démonstration")).toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
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
  });

  it("renders live cards and empty-state copy contract", async () => {
    render(await LivesPage());

    expect(
      screen.getByRole("heading", { name: "Sessions en cours" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Soirée rooftop à risque")).toBeInTheDocument();
  });

  it("renders admin as visual-only disabled controls", () => {
    render(<AdminPage />);

    expect(
      screen.getByRole("heading", { name: "Console visuelle" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "ACTION DÉSACTIVÉE" })[0],
    ).toBeDisabled();
  });
});
