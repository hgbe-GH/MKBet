import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarketForm } from "@/components/admin/market-form";

vi.mock("@/application/markets/admin-actions", () => ({
  openTemplateMarketAction: vi.fn(async () => ({
    ok: true,
    message: "Marché créé.",
  })),
}));

describe("market administration form", () => {
  it("offers template and dates without client-controlled pricing fields", () => {
    render(
      <MarketForm
        defaultDates={{
          opensAt: "2026-07-12T12:00:00.000Z",
          closesAt: "2026-08-10T12:00:00.000Z",
          deadlineAt: "2026-08-11T12:00:00.000Z",
        }}
        seasonId="10000000-0000-4000-8000-000000000001"
        templates={[{ code: "KISS", title: "Premier bisou" }]}
      />,
    );
    expect(screen.getByLabelText("Template")).toHaveValue("KISS");
    expect(screen.getByLabelText("Ouverture")).toBeRequired();
    expect(screen.getByLabelText("Clôture")).toBeRequired();
    expect(screen.getByLabelText("Échéance")).toBeRequired();
    expect(screen.queryByLabelText(/^q$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/demi-vie/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/probabilité/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/marge/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^cote$/i)).not.toBeInTheDocument();
  });
});
