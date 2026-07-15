import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireSingleRoom } from "@/application/sportsbook/require-single-room";
import { AppShell } from "@/components/sportsbook/app-shell";

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
  const season = await requireSingleRoom();

  return <AppShell season={season}>{children}</AppShell>;
}
