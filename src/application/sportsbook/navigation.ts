export const primaryNavigation = [
  { href: "/direct", label: "Aujourd’hui", icon: "home" },
  { href: "/markets", label: "Marchés", icon: "chart" },
  { href: "/report", label: "Déclarer", icon: "add" },
  { href: "/bets", label: "Mes paris", icon: "ticket" },
  { href: "/leaderboard", label: "Classement", icon: "ranking" },
] as const;

export type PrimaryNavigationItem = (typeof primaryNavigation)[number];

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function canSeeAdministration(roles: readonly string[]) {
  return roles.includes("ADMIN") || roles.includes("LIVE_HOST");
}
