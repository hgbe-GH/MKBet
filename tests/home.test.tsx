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
        name: "Tout se joue entre nous.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Margot × Kévin")).toHaveLength(2);
    expect(screen.getByText("Salle privée · 7 membres")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Une preuve, deux votes, une décision. Suis l’histoire de Margot et Kévin en MKB fictifs.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("100 % monnaie fictive")).toBeInTheDocument();
    expect(document.querySelector("[data-public-aurora]")).toBeInTheDocument();
  });

  it("sends visitors to the direct room login", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: "Entrer dans la salle" }),
    ).toHaveAttribute("href", "/login?next=/direct");
  });
});
