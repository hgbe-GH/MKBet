import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center rounded-lg px-6 text-sm font-black tracking-[0.07em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand)] text-[var(--on-brand)] shadow-[0_0_24px_rgba(255,52,83,0.28)] hover:bg-[var(--brand-hover)] active:translate-y-px active:bg-[var(--brand-active)]",
        outline:
          "border border-[var(--border-strong)] bg-white/[0.06] text-white hover:bg-white/[0.1]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  asChild = false,
  className,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(buttonVariants({ variant, className }))}
      data-interactive="lift"
      {...props}
    />
  );
}
