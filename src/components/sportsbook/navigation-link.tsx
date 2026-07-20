"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavigationLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  compact?: boolean;
}

export function NavigationLink({
  href,
  label,
  icon: Icon,
  compact = false,
}: NavigationLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold",
        active
          ? "border border-white/10 bg-white/[0.09] text-white shadow-[inset_0_1px_rgba(255,255,255,0.1)] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--brand)]"
          : "text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]",
        compact && "min-h-12 flex-col gap-1 px-2 py-1 text-[0.68rem]",
        compact &&
          active &&
          "border-transparent bg-transparent text-[var(--brand-hover)] before:hidden",
      )}
      href={href}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span>{label}</span>
      {active ? <span className="sr-only">page active</span> : null}
    </Link>
  );
}
