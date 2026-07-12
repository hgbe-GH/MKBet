import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Crown,
  Home,
  Radio,
  Settings,
  Shield,
  Trophy,
} from "lucide-react";

import type { SeasonMemberRole } from "@/domain/database/enums";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile: boolean;
  adminOnly?: boolean;
}

export const sportsbookNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Accueil", icon: Home, mobile: true },
  { href: "/markets", label: "Marchés", icon: BarChart3, mobile: true },
  { href: "/lives", label: "Live", icon: Radio, mobile: true },
  { href: "/bets", label: "Mes paris", icon: ClipboardList, mobile: true },
  { href: "/results", label: "Résultats", icon: Crown, mobile: false },
  { href: "/timeline", label: "Chronologie", icon: Activity, mobile: false },
  { href: "/leaderboard", label: "Classement", icon: Trophy, mobile: false },
  {
    href: "/admin",
    label: "Administration",
    icon: Shield,
    mobile: false,
    adminOnly: true,
  },
  { href: "/settings/account", label: "Compte", icon: Settings, mobile: true },
  { href: "/seasons", label: "Saisons", icon: CalendarClock, mobile: false },
];

export function canSeeAdminNavigation(roles: readonly SeasonMemberRole[]) {
  return roles.includes("ADMIN") || roles.includes("LIVE_HOST");
}
