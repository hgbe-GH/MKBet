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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition",
        active
          ? "bg-[var(--brand-muted)] text-[var(--brand-active)] ring-1 ring-[var(--brand)]"
          : "text-[var(--text-secondary)] hover:bg-stone-100 hover:text-[var(--text-primary)]",
        compact && "flex-col gap-1 px-2 py-1 text-[0.68rem]",
      )}
      href={href}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span>{label}</span>
      {active ? <span className="sr-only">page active</span> : null}
    </Link>
  );
}
