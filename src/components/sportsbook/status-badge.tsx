import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  children: string;
  tone?: "default" | "live" | "warning" | "positive" | "muted";
}

export function StatusBadge({ children, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.1em]",
        tone === "default" &&
          "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
        tone === "live" &&
          "border-[var(--brand)]/50 bg-[var(--brand-muted)] text-[var(--brand-hover)]",
        tone === "warning" &&
          "border-amber-300/35 bg-amber-300/10 text-amber-200",
        tone === "positive" &&
          "border-emerald-300/35 bg-emerald-300/10 text-emerald-200",
        tone === "muted" &&
          "border-white/10 bg-white/[0.04] text-[var(--text-muted)]",
      )}
    >
      {children}
    </span>
  );
}
