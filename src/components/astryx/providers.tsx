"use client";

import { LinkProvider } from "@astryxdesign/core/Link";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme } from "@astryxdesign/core/theme";
import { ToastViewport } from "@astryxdesign/core/Toast";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import Link from "next/link";
import type { ReactNode } from "react";

interface AstryxProvidersProps {
  children: ReactNode;
}

export function AstryxProviders({ children }: AstryxProvidersProps) {
  return (
    <Theme mode="dark" theme={neutralTheme}>
      <InternationalizationProvider
        locale="fr"
        overrides={{
          fr: {
            "@astryx.appShell.mobileNavigation": "Navigation mobile",
            "@astryx.dialog.close": "Fermer",
            "@astryx.calendar.nextMonth": "Mois suivant",
            "@astryx.calendar.previousMonth": "Mois précédent",
            "@astryx.dateInput.clear": "Effacer {label}",
            "@astryx.dateInput.closeCalendar": "Fermer le calendrier",
            "@astryx.dateInput.dialogLabel": "Choisir une date",
            "@astryx.dateInput.openCalendar": "Ouvrir le calendrier",
            "@astryx.dateInput.placeholder": "Sélectionner une date",
            "@astryx.dateInput.toggleCalendarClose": "Fermer le calendrier",
            "@astryx.mobileNav.closeNavigation": "Fermer la navigation",
            "@astryx.mobileNav.navigation": "Navigation mobile",
            "@astryx.mobileNav.toggle.open": "Ouvrir la navigation",
            "@astryx.sideNav.label": "Navigation principale",
            "@astryx.sideNavCollapseButton.collapseSidebar":
              "Réduire la navigation",
            "@astryx.sideNavCollapseButton.expandSidebar":
              "Développer la navigation",
            "@astryx.textInput.clearLabel": "Effacer le champ",
            "@astryx.toast.dismiss": "Fermer la notification",
            "@astryx.toast.viewport": "Notifications",
          },
        }}
      >
        <LinkProvider component={Link}>
          <ToastViewport>{children}</ToastViewport>
        </LinkProvider>
      </InternationalizationProvider>
    </Theme>
  );
}
