import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AstryxProviders } from "@/components/astryx/providers";
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
  themeColor: "#1b1b1b",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" data-theme="dark">
      <body>
        <AstryxProviders>{children}</AstryxProviders>
      </body>
    </html>
  );
}
