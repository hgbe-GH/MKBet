"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type AuthMode = "login" | "register";

function modeHref(mode: AuthMode, next: string): string {
  const modeQuery = mode === "register" ? "mode=register&" : "";
  return `/login?${modeQuery}next=${encodeURIComponent(next)}`;
}

export function AuthModeSwitcher({
  mode,
  next,
}: {
  mode: AuthMode;
  next: string;
}) {
  const [selection, setSelection] = useState({
    activeMode: mode,
    serverMode: mode,
  });
  if (selection.serverMode !== mode) {
    setSelection({ activeMode: mode, serverMode: mode });
  }
  const activeMode =
    selection.serverMode === mode ? selection.activeMode : mode;

  return (
    <nav
      aria-label="Choisir le mode d’accès"
      className="relative grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 p-1"
      data-auth-mode={activeMode}
    >
      <span aria-hidden="true" className="mk-auth-mode-indicator" />
      {(["login", "register"] as const).map((itemMode) => {
        const isActive = itemMode === activeMode;
        const label = itemMode === "login" ? "Connexion" : "Créer un compte";

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "mk-auth-mode relative z-10 inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-black",
              isActive
                ? "text-white"
                : "text-[var(--text-muted)] hover:bg-white/6 hover:text-white",
            )}
            href={modeHref(itemMode, next)}
            key={itemMode}
            onNavigate={() =>
              setSelection({ activeMode: itemMode, serverMode: mode })
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
