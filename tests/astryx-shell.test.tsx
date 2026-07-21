import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AstryxProviders } from "@/components/astryx/providers";
import { AppNavigation } from "@/components/sportsbook/app-navigation";
import type { SeasonMemberRole } from "@/domain/database/enums";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/markets"),
}));

function renderNavigation(
  mode: "desktop" | "mobile",
  roles: readonly SeasonMemberRole[],
) {
  return render(
    <AstryxProviders>
      <AppNavigation mode={mode} roles={roles} />
    </AstryxProviders>,
  );
}

describe("Astryx application navigation", () => {
  it("shows exactly the five primary destinations to a player", () => {
    renderNavigation("desktop", ["PLAYER"]);

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });
    const primary = screen.getByRole("group", { name: "Navigation" });
    const links = within(primary).getAllByRole("link");

    expect(within(navigation).getAllByRole("link")).toHaveLength(5);
    expect(links).toHaveLength(5);
    expect(links.map((link) => link.textContent)).toEqual([
      "Aujourd’hui",
      "Marchés",
      "Déclarer",
      "Mes paris",
      "Classement",
    ]);
    expect(
      within(primary).getByRole("link", { name: "Marchés" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("link", { name: "Administration" }),
    ).not.toBeInTheDocument();
  });

  it.each<SeasonMemberRole>(["ADMIN", "LIVE_HOST"])(
    "shows Administration in the secondary area for %s",
    (role) => {
      renderNavigation("desktop", ["PLAYER", role]);

      expect(
        within(
          screen.getByRole("group", { name: "Accès privilégié" }),
        ).getByRole("link", { name: "Administration" }),
      ).toHaveAttribute("href", "/admin");
    },
  );

  it("reuses the five primary destinations in the Astryx mobile navigation", () => {
    renderNavigation("mobile", ["PLAYER"]);

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Navigation mobile",
    });
    const primary = within(mobileNavigation).getByRole("group", {
      name: "Navigation",
    });

    expect(within(primary).getAllByRole("link")).toHaveLength(5);
    expect(
      within(primary).getByRole("link", { name: "Marchés" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
