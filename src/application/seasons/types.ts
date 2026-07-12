import type { SeasonMemberRole } from "@/domain/database/enums";

export interface SeasonSummary {
  id: string;
  title: string;
  status: string;
  roles: SeasonMemberRole[];
  balanceMkb: number | null;
}

export interface DashboardSeason {
  id: string;
  title: string;
  breakupDate: string;
  roles: SeasonMemberRole[];
  balanceMkb: number | null;
}
