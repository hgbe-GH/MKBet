import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "MK Bet",
    template: "%s | MK Bet",
  },
  description:
    "La salle privée des marchés fictifs de la saison post-rupture Margot × Kévin.",
  applicationName: "MK Bet",
};

export const viewport: Viewport = {
  themeColor: "#08080b",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
