import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AstryxProviders } from "@/components/astryx/providers";
import { AccountMenu } from "@/components/sportsbook/account-menu";
import { AppNavigation } from "@/components/sportsbook/app-navigation";
import { AppShell } from "@/components/sportsbook/app-shell";
import type { SeasonMemberRole } from "@/domain/database/enums";
import { demoSeasonContext } from "@/fixtures/sportsbook/demo-data";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/markets"),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

function mockMobileViewport() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string): MediaQueryList => ({
      matches: query.includes("max-width: 1024px"),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  );
}

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

  it("closes the mobile drawer when a destination is activated through the full shell", async () => {
    mockMobileViewport();
    render(
      <AstryxProviders>
        <AppShell season={demoSeasonContext}>
          <p>Contenu marchés</p>
        </AppShell>
      </AstryxProviders>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ouvrir la navigation" }),
    );

    const drawer = await screen.findByRole("dialog", {
      name: "Navigation mobile",
    });
    expect(drawer).toHaveAttribute("open");
    expect(within(drawer).getAllByRole("link")).toHaveLength(5);

    const marketsLink = within(drawer).getByRole("link", { name: "Marchés" });
    marketsLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(marketsLink);

    await waitFor(() => expect(drawer).not.toHaveAttribute("open"));
  });

  it.each([
    { label: "Compte", roles: ["PLAYER"] as const },
    {
      label: "Administration",
      roles: ["PLAYER", "ADMIN"] as const,
    },
  ])(
    "closes the controlled account menu when $label is activated",
    async ({ label, roles }) => {
      render(
        <AstryxProviders>
          <AccountMenu seasonTitle="Margot × Kévin" roles={roles} />
        </AstryxProviders>,
      );

      const trigger = screen.getByRole("button", {
        name: "Ouvrir le menu du compte",
      });
      fireEvent.click(trigger);
      await waitFor(() =>
        expect(trigger).toHaveAttribute("aria-expanded", "true"),
      );

      const menuLink = screen.getByRole("menuitem", {
        name: label,
        hidden: true,
      });
      menuLink.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
      fireEvent.click(menuLink);

      await waitFor(() =>
        expect(trigger).toHaveAttribute("aria-expanded", "false"),
      );
    },
  );

  it("exposes one ticket complementary landmark in the full shell", () => {
    render(
      <AstryxProviders>
        <AppShell season={demoSeasonContext}>
          <p>Contenu principal</p>
        </AppShell>
      </AstryxProviders>,
    );

    expect(
      screen.getAllByRole("complementary", { name: "Ticket de pari" }),
    ).toHaveLength(1);
  });

  it("keeps logout as a POST action and closes the account menu", async () => {
    render(
      <AstryxProviders>
        <AccountMenu seasonTitle="Margot × Kévin" roles={["PLAYER"]} />
      </AstryxProviders>,
    );

    const trigger = screen.getByRole("button", {
      name: "Ouvrir le menu du compte",
    });
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "true"),
    );

    const logout = screen.getByRole("menuitem", {
      name: "Déconnexion",
      hidden: true,
    });
    const form = logout.closest("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/logout");
    form?.addEventListener("submit", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(logout);

    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "false"),
    );
  });
});
