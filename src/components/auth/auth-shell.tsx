import Link from "next/link";
import type { ReactNode } from "react";

import { sanitizeInternalRedirectPath } from "@/application/auth";
import { GlassSurface } from "@/components/ui/glass-surface";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: ReactNode;
  mode?: "login" | "register";
  next?: string;
  showModeNavigation?: boolean;
}

function modeHref(mode: "login" | "register", next: string): string {
  const modeQuery = mode === "register" ? "mode=register&" : "";
  return `/login?${modeQuery}next=${encodeURIComponent(next)}`;
}

export function AuthShell({
  children,
  mode = "login",
  next = "/direct",
  showModeNavigation = true,
}: AuthShellProps) {
  const safeNext = sanitizeInternalRedirectPath(next);

  return (
    <main className="mk-auth-shell relative min-h-dvh overflow-hidden bg-[#08080b] text-white">
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
        <section className="flex flex-col gap-6 px-5 pt-7 pb-5 sm:px-8 lg:min-h-dvh lg:justify-between lg:px-14 lg:py-12 xl:px-20 xl:py-16">
          <div className="flex items-center">
            <Link
              aria-label="Retour à l’accueil MK Bet"
              className="mk-brand-link inline-flex min-h-11 items-center border-l-4 border-[var(--brand)] pl-3 text-sm font-black tracking-[0.22em]"
              href="/"
            >
              MKBET
            </Link>
          </div>

          <p className="text-2xl leading-none font-black tracking-[-0.045em] text-white lg:max-w-[8ch] lg:text-[clamp(4.5rem,8vw,8rem)] lg:leading-[0.86] lg:tracking-[-0.075em]">
            Margot × Kévin
          </p>

          <ul
            className="hidden gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12 lg:grid lg:grid-cols-2"
            data-auth-editorial-details="true"
          >
            {["1 000 MKB fictifs", "Deux votes concordants"].map(
              (item, index) => (
                <li
                  className="flex min-h-16 items-center bg-[#0c0b0f]/95 px-4 text-sm font-bold text-[var(--text-secondary)]"
                  key={item}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mr-3 h-1.5 w-1.5 rounded-full",
                      index === 0 ? "bg-[var(--brand)]" : "bg-white/45",
                    )}
                  />
                  {item}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="flex items-start px-4 pb-5 sm:px-8 sm:pb-8 lg:min-h-dvh lg:items-center lg:px-8 lg:py-10 xl:px-12">
          <GlassSurface
            className="w-full rounded-2xl border-white/16 bg-[#111016] p-2 shadow-[0_32px_90px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-3"
            variant="opaque"
          >
            {showModeNavigation ? (
              <nav
                aria-label="Choisir le mode d’accès"
                className="relative grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 p-1"
                data-auth-mode={mode}
              >
                <span aria-hidden="true" className="mk-auth-mode-indicator" />
                {(["login", "register"] as const).map((itemMode) => {
                  const isActive = itemMode === mode;
                  const label =
                    itemMode === "login" ? "Connexion" : "Créer un compte";

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "mk-auth-mode relative z-10 inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-black",
                        isActive
                          ? "text-white"
                          : "text-[var(--text-muted)] hover:bg-white/6 hover:text-white",
                      )}
                      href={modeHref(itemMode, safeNext)}
                      key={itemMode}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}

            <div
              className={cn(
                "p-5 sm:p-7 lg:p-8",
                showModeNavigation && "mk-auth-mode-content",
              )}
              data-motion={showModeNavigation ? "auth-content" : undefined}
              key={showModeNavigation ? mode : "single"}
            >
              {children}
            </div>
          </GlassSurface>
        </section>
      </div>
    </main>
  );
}
