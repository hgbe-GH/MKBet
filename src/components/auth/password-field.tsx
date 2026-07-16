"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
  autoComplete: string;
  id: string;
  label: string;
  minLength?: number;
  name: string;
  required?: boolean;
}

export function PasswordField({
  autoComplete,
  id,
  label,
  minLength,
  name,
  required = false,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const visibilityLabel = isVisible
    ? "Masquer le mot de passe"
    : "Afficher le mot de passe";
  const VisibilityIcon = isVisible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <label
        className="block text-sm font-bold text-[var(--text-primary)]"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-black/25 px-4 pr-14 text-base text-white outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-hover)] focus:bg-black/35 focus:ring-2 focus:ring-[var(--brand-muted)]"
          id={id}
          minLength={minLength}
          name={name}
          required={required}
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={visibilityLabel}
          className="absolute top-1/2 right-1 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-hover)]"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          <VisibilityIcon aria-hidden="true" size={19} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
