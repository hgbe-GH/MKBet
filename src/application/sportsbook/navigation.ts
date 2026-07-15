import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  RadioTower,
  Settings,
  Trophy,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile: boolean;
}

export const sportsbookNavigation: NavigationItem[] = [
  { href: "/direct", label: "Direct", icon: RadioTower, mobile: true },
  { href: "/markets", label: "Marchés", icon: BarChart3, mobile: true },
  { href: "/report", label: "Déclarer", icon: FilePlus2, mobile: true },
  { href: "/bets", label: "Mon ticket", icon: ClipboardList, mobile: true },
  { href: "/leaderboard", label: "Classement", icon: Trophy, mobile: true },
  { href: "/settings/account", label: "Compte", icon: Settings, mobile: false },
];
