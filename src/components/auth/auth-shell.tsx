import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Link from "next/link";
import type { ReactNode } from "react";

import { sanitizeInternalRedirectPath } from "@/application/auth";
import { AuthModeSwitcher } from "@/components/auth/auth-mode-switcher";

interface AuthShellProps {
  children: ReactNode;
  mode?: "login" | "register";
  next?: string;
  showModeNavigation?: boolean;
}

export function AuthShell({
  children,
  mode = "login",
  next = "/direct",
  showModeNavigation = true,
}: AuthShellProps) {
  const safeNext = sanitizeInternalRedirectPath(next);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--color-background-body)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-44 -left-40 hidden h-[32rem] w-[32rem] rounded-full bg-[var(--brand)]/18 blur-3xl lg:block"
        data-auth-decoration="halo"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-14rem] bottom-[-16rem] hidden h-[38rem] w-[38rem] rounded-full bg-[var(--brand-strong)]/14 blur-3xl lg:block"
        data-auth-decoration="halo"
      />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[96rem] grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.75fr)]">
        <section className="flex flex-col gap-8 px-5 pt-7 pb-5 sm:px-8 lg:min-h-dvh lg:justify-between lg:px-14 lg:py-12 xl:px-20 xl:py-16">
          <div className="flex items-center">
            <Link
              aria-label="Retour à l’accueil MK Bet"
              className="inline-flex min-h-11 items-center border-l-4 border-[var(--color-accent)] pl-3 text-sm font-black tracking-[0.22em]"
              href="/"
            >
              MKBET
            </Link>
          </div>

          <Text
            as="p"
            className="text-2xl leading-none font-black tracking-[-0.045em] lg:max-w-[8ch] lg:text-[clamp(4.5rem,8vw,8rem)] lg:leading-[0.86] lg:tracking-[-0.075em]"
          >
            Margot × Kévin
          </Text>

          <div
            className="hidden flex-wrap gap-2 lg:flex"
            data-auth-editorial-details="true"
          >
            <Badge label="1 000 MKB fictifs" variant="red" />
            <Badge label="Deux votes concordants" variant="neutral" />
          </div>
        </section>

        <section className="flex items-start px-4 pb-5 sm:px-8 sm:pb-8 lg:min-h-dvh lg:items-center lg:px-8 lg:py-10 xl:px-12">
          <Card className="w-full" maxWidth="42rem" padding={3}>
            <VStack gap={3}>
              {showModeNavigation ? (
                <AuthModeSwitcher mode={mode} next={safeNext} />
              ) : null}
              <div
                className="p-3 sm:p-5 lg:p-6"
                data-motion={showModeNavigation ? "auth-content" : undefined}
                key={showModeNavigation ? mode : "single"}
              >
                {children}
              </div>
            </VStack>
          </Card>
        </section>
      </div>
    </main>
  );
}
