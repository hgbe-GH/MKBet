import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AsyncState } from "@/components/astryx/async-state";
import { PageHeading } from "@/components/astryx/page-heading";

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
        kind="empty"
        title="Aucun marché ouvert"
        description="Reviens après la prochaine mise à jour."
      />,
    );

    expect(screen.getByText("Aucun marché ouvert")).toBeVisible();
  });
});
