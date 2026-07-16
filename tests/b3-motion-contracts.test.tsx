import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthShell } from "@/components/auth/auth-shell";
import { BetSlip } from "@/components/sportsbook/bet-slip";
import { BetSlipProvider } from "@/components/sportsbook/bet-slip-context";
import { OddsButton } from "@/components/sportsbook/odds-button";
import { SegmentedFilter } from "@/components/ui/segmented-filter";

const styles = readFileSync(
  join(process.cwd(), "src/styles/globals.css"),
  "utf8",
);
const voteControls = readFileSync(
  join(process.cwd(), "src/components/events/event-vote-controls.tsx"),
  "utf8",
);
const rootLoading = readFileSync(
  join(process.cwd(), "src/app/loading.tsx"),
  "utf8",
);
const rootLayout = readFileSync(
  join(process.cwd(), "src/app/layout.tsx"),
  "utf8",
);
const authFormSources = [
  "password-field.tsx",
  "password-reset-request-form.tsx",
  "sign-in-form.tsx",
  "sign-up-form.tsx",
].map((file) =>
  readFileSync(join(process.cwd(), "src/components/auth", file), "utf8"),
);
const marketsPage = readFileSync(
  join(process.cwd(), "src/app/(protected)/markets/page.tsx"),
  "utf8",
);

describe("B3 motion contracts", () => {
  it("marks bounded page, interaction, ticket and URL filter states", () => {
    render(
      <>
        <AuthShell>
          <p>Portail</p>
        </AuthShell>
        <BetSlipProvider>
          <OddsButton
            marketId="market-kiss"
            movement="STABLE"
            odds={1.88}
            oddsVersion={1}
            outcomeId="yes"
            outcomeLabel="Oui"
            selected={false}
            status="OPEN"
          />
          <BetSlip balanceMkb={1_000} seasonId="season-room" />
        </BetSlipProvider>
        <SegmentedFilter
          ariaLabel="Filtrer les marchés"
          items={[
            { active: true, href: "/markets", label: "Ouverts" },
            {
              active: false,
              href: "/markets?status=closed",
              label: "Terminés",
            },
          ]}
        />
      </>,
    );

    expect(
      screen.getByText("Portail").closest("[data-motion]"),
    ).toHaveAttribute("data-motion", "enter");
    expect(
      screen.getByRole("button", { name: /Oui, cote 1,88/i }),
    ).toHaveAttribute("data-interactive", "lift");
    expect(
      screen.getByRole("complementary", { name: "Ticket de pari" }),
    ).toHaveAttribute("data-ticket-step", "empty");
    expect(screen.getByRole("link", { name: "Ouverts" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("defines the three approved duration bands and compositor-safe motion", () => {
    expect(styles).toMatch(/--motion-fast:\s*1(?:4\d|5\d|6\d|7\d|80)ms/);
    expect(styles).toMatch(
      /--motion-medium:\s*2(?:2\d|3\d|4\d|5\d|6\d|7\d|80)ms/,
    );
    expect(styles).toMatch(/--motion-slow:\s*(?:3[2-9]\d|4[01]\d|420)ms/);
    expect(styles).not.toMatch(/transition\s*:\s*all\b/);
    expect(styles).not.toMatch(/animation:[^;]*infinite/);
    expect(styles).toMatch(
      /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/,
    );
  });

  it("provides opaque transparency and reduced-motion fallbacks", () => {
    expect(styles).toMatch(
      /@media\s*\(prefers-reduced-transparency:\s*reduce\)/,
    );
    expect(styles).toMatch(/@supports\s+not\s+\(backdrop-filter:/);

    const reducedMotion = styles.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1];
    expect(reducedMotion).toContain("transform: none");
    expect(reducedMotion).toContain("animation: none");
  });

  it("routes vote lift through the fine-pointer motion contract", () => {
    expect(voteControls).not.toContain("hover:-translate");
    expect(voteControls.match(/data-interactive="lift"/g)).toHaveLength(2);
  });

  it("keeps the root loading state nocturnal and matte", () => {
    expect(rootLoading).toContain("bg-[var(--background)]");
    expect(rootLoading).toContain("OUVERTURE DE LA SALLE…");
    expect(rootLoading).not.toMatch(/animate-(?:spin|pulse)/);
  });

  it("declares the nocturnal browser chrome theme", () => {
    expect(rootLayout).toContain('themeColor: "#08080b"');
  });

  it("uses focus-visible replacements on auth fields", () => {
    for (const source of authFormSources) {
      expect(source).not.toMatch(/outline-none[^"\n]*\sfocus:/);
    }
  });

  it("uses a typographic ellipsis in the market search hint", () => {
    expect(marketsPage).not.toContain('placeholder="bisou, statut..."');
    expect(marketsPage).toContain('placeholder="bisou, statut…"');
  });
});
