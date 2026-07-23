"use client";

import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import {
  ChartNoAxesCombined,
  FilePlus2,
  House,
  ShieldCheck,
  Tickets,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  canSeeAdministration,
  isNavigationItemActive,
  primaryNavigation,
  type PrimaryNavigationItem,
} from "@/application/sportsbook/navigation";
import type { SeasonMemberRole } from "@/domain/database/enums";

interface AppNavigationProps {
  mode: "desktop" | "mobile";
  roles: readonly SeasonMemberRole[];
}

const navigationIcons: Record<PrimaryNavigationItem["icon"], LucideIcon> = {
  home: House,
  chart: ChartNoAxesCombined,
  add: FilePlus2,
  ticket: Tickets,
  ranking: Trophy,
};

export function AppNavigation({ mode, roles }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <SideNav
      aria-label={
        mode === "mobile" ? "Navigation mobile" : "Navigation principale"
      }
      header={<SideNavHeading heading="MK Bet" subheading="Margot × Kévin" />}
    >
      <SideNavSection isHeaderHidden title="Navigation">
        {primaryNavigation.map((item) => {
          const Icon = navigationIcons[item.icon];

          return (
            <SideNavItem
              href={item.href}
              icon={<Icon aria-hidden="true" size={18} />}
              isSelected={isNavigationItemActive(pathname, item.href)}
              key={item.href}
              label={item.label}
            />
          );
        })}
      </SideNavSection>
      {canSeeAdministration(roles) ? (
        <SideNavSection title="Accès privilégié">
          <SideNavItem
            href="/admin"
            icon={<ShieldCheck aria-hidden="true" size={18} />}
            isSelected={isNavigationItemActive(pathname, "/admin")}
            label="Administration"
          />
        </SideNavSection>
      ) : null}
    </SideNav>
  );
}
