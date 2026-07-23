"use client";

import { SegmentedControl } from "@astryxdesign/core/SegmentedControl";
import { SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();
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
    <nav aria-label="Choisir le mode d’accès" data-auth-mode={activeMode}>
      <SegmentedControl
        label="Choisir le mode d’accès"
        layout="fill"
        onChange={(value) => {
          const nextMode: AuthMode =
            value === "register" ? "register" : "login";
          setSelection({ activeMode: nextMode, serverMode: mode });
          router.push(modeHref(nextMode, next));
        }}
        size="lg"
        value={activeMode}
      >
        <SegmentedControlItem label="Connexion" value="login" />
        <SegmentedControlItem label="Créer un compte" value="register" />
      </SegmentedControl>
    </nav>
  );
}
