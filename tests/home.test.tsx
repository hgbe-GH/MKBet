import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("MK Bet home page", () => {
  it("presents the pre-season experience with accessible landmarks", () => {
    render(<Home />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "La salle des marchés de la rechute",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Margot × Kévin")).toBeInTheDocument();
    expect(screen.getByText("Saison post-rupture")).toBeInTheDocument();
    expect(
      screen.getByText("Les marchés ouvriront prochainement."),
    ).toBeInTheDocument();
    expect(screen.getByText("PRÉ-SAISON")).toBeInTheDocument();
    expect(screen.getByText("100 % monnaie fictive")).toBeInTheDocument();
  });

  it("keeps the odds action unavailable before markets open", () => {
    render(<Home />);

    expect(
      screen.getByRole("button", { name: "CONSULTER LES COTES" }),
    ).toBeDisabled();
  });
});
