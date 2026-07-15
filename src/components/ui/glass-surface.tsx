import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const surfaceClasses = {
  subtle: "mk-glass-subtle",
  interactive: "mk-glass-interactive",
  opaque: "mk-surface-opaque",
} as const;

interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "aside" | "div" | "section";
  children: ReactNode;
  variant?: keyof typeof surfaceClasses;
}

export function GlassSurface({
  as: Component = "div",
  children,
  className,
  variant = "subtle",
  ...props
}: GlassSurfaceProps) {
  return (
    <Component
      className={cn(surfaceClasses[variant], className)}
      data-surface={variant}
      {...props}
    >
      {children}
    </Component>
  );
}
