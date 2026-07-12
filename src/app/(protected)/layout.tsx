import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireAuth } from "@/auth/require-auth";
import { AppShell } from "@/components/sportsbook/app-shell";
import { getCurrentSportsbookSeason } from "@/data/supabase/sportsbook/repository";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "MK Bet — Salle des marchés",
  robots: {
    index: false,
    follow: false,
  },
};

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  await requireAuth("/dashboard");
  const season = await getCurrentSportsbookSeason();
  if (!season) redirect("/seasons");

  return <AppShell season={season}>{children}</AppShell>;
}
