import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AsyncState } from "@/components/astryx/async-state";
import { PageHeading } from "@/components/astryx/page-heading";
import { GlassSurface } from "@/components/ui/glass-surface";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SegmentedFilter } from "@/components/ui/segmented-filter";

describe("Astryx shared compositions", () => {
  it("renders one page heading and an optional action", () => {
    render(<PageHeading title="Marchés" action={<button>Filtrer</button>} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Marchés" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Filtrer" })).toBeVisible();
  });

  it("renders a useful empty state", () => {
    render(
      <AsyncState
        action={<button>Voir tous les marchés</button>}
        kind="empty"
        title="Aucun marché ouvert"
        description="Reviens après la prochaine mise à jour."
      />,
    );

    expect(screen.getByText("Aucun marché ouvert")).toBeVisible();
    expect(
      screen.getByText("Reviens après la prochaine mise à jour."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Voir tous les marchés" }),
    ).toBeVisible();
  });

  it("announces a loading state with useful context", () => {
    render(
      <AsyncState
        description="Les cotes arrivent."
        kind="loading"
        title="Chargement des marchés"
      />,
    );

    expect(
      screen.getByRole("status", { name: "Chargement des marchés" }),
    ).toBeVisible();
    expect(screen.getByText("Les cotes arrivent.")).toBeVisible();
  });

  it("renders a generic error with a recovery action", () => {
    render(
      <AsyncState
        action={<button>Réessayer</button>}
        description="Réessaie dans quelques instants."
        kind="error"
        title="Impossible de charger ce contenu"
      />,
    );

    expect(screen.getByText("Impossible de charger ce contenu")).toBeVisible();
    expect(screen.getByText("Réessaie dans quelques instants.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeVisible();
  });

  it("uses generic configuration copy and supports an action", () => {
    render(
      <AsyncState action={<button>Retour</button>} kind="not-configured" />,
    );

    expect(screen.getByText("Configuration indisponible")).toBeVisible();
    expect(
      screen.getByText(
        "Cette fonctionnalité n’est pas disponible pour le moment.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Retour" })).toBeVisible();
  });
});

describe("preserved B3 visual contracts", () => {
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
    expect(screen.getByText("Règle lisible")).toHaveClass("mk-fallback-opaque");
  });

  it.each(["subtle", "interactive"] as const)(
    "keeps an opaque fallback on the %s glass surface",
    (variant) => {
      render(<GlassSurface variant={variant}>{variant}</GlassSurface>);

      expect(screen.getByText(variant)).toHaveAttribute(
        "data-surface",
        variant,
      );
      expect(screen.getByText(variant)).toHaveClass("mk-fallback-opaque");
    },
  );

  it("keeps filter links at touch-target size", () => {
    render(
      <SegmentedFilter
        ariaLabel="Filtrer"
        items={[{ href: "/direct", label: "À vérifier", active: true }]}
      />,
    );

    expect(screen.getByRole("link", { name: "À vérifier" })).toHaveClass(
      "min-h-11",
    );
  });
});
