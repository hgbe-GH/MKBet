import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AstryxProviders } from "@/components/astryx/providers";

describe("Astryx foundation", () => {
  it("mounts the neutral dark theme without hiding its children", () => {
    render(
      <AstryxProviders>
        {/* The provider contract deliberately verifies a plain anchor child. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/markets">Marchés</a>
      </AstryxProviders>,
    );

    expect(screen.getByRole("link", { name: "Marchés" })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
