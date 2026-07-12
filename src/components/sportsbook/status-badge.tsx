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
        tone === "live" && "border-red-200 bg-red-50 text-[var(--live)]",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "positive" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "muted" && "border-stone-200 bg-stone-100 text-stone-500",
      )}
    >
      {children}
    </span>
  );
}
