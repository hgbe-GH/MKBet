import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GlassSurface } from "@/components/ui/glass-surface";
import { InlineNotice } from "@/components/ui/inline-notice";
import { PageIntro } from "@/components/ui/page-intro";
import { SegmentedFilter } from "@/components/ui/segmented-filter";

describe("B3 visual primitives", () => {
  it("renders a semantic page intro with an optional action", () => {
    render(
      <PageIntro
        action={<a href="/report">Déclarer</a>}
        eyebrow="Salle privée"
        title="Le groupe fait le marché"
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Le groupe fait le marché",
    );
    expect(screen.getByRole("link", { name: "Déclarer" })).toHaveAttribute(
      "href",
      "/report",
    );
  });

  it("marks the active segment independently from color", () => {
    render(
      <SegmentedFilter
        ariaLabel="Filtrer"
        items={[
          { href: "/direct", label: "À vérifier", active: true },
          {
            href: "/direct?vue=confirmed",
            label: "Confirmés",
            active: false,
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "À vérifier" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("uses a status role for notices", () => {
    render(<InlineNotice tone="success">Vote enregistré</InlineNotice>);
    expect(screen.getByRole("status")).toHaveTextContent("Vote enregistré");
  });

  it("supports opaque fallback content", () => {
    render(<GlassSurface variant="opaque">Règle lisible</GlassSurface>);
    expect(screen.getByText("Règle lisible")).toHaveAttribute(
      "data-surface",
      "opaque",
    );
  });
});
