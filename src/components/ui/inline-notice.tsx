import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InlineNotice({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "error" | "neutral" | "success" | "warning";
}) {
  return (
    <div
      className={cn("mk-inline-notice", `mk-inline-notice-${tone}`, className)}
      role="status"
    >
      {children}
    </div>
  );
}
