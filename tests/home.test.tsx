import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("MK Bet home page", () => {
  it("presents the active private room with accessible landmarks", () => {
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
      screen.getByText(
        "Parie en MKB, partage un fait et laisse le groupe trancher.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("SALLE OUVERTE")).toBeInTheDocument();
    expect(screen.getByText("100 % monnaie fictive")).toBeInTheDocument();
  });

  it("sends visitors to the direct room login", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: "ENTRER DANS LA SALLE" }),
    ).toHaveAttribute("href", "/login?next=/direct");
  });
});
