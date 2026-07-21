"use client";

import { Eye, EyeOff } from "lucide-react";
import { useCallback, useState, type Ref, type RefObject } from "react";

import { AuthTextInput } from "@/components/auth/auth-text-input";

interface PasswordFieldProps {
  autoComplete: string;
  describedBy?: string;
  id: string;
  invalid?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  label: string;
  minLength?: number;
  name: string;
  required?: boolean;
  resetSignal?: object;
  visibilityContext?: "confirmation" | "password";
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    (ref as RefObject<T | null>).current = value;
  }
}

export function PasswordField({
  autoComplete,
  describedBy,
  id,
  invalid = false,
  inputRef,
  label,
  minLength,
  name,
  required = false,
  resetSignal,
  visibilityContext = "password",
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [fieldState, setFieldState] = useState({
    resetSignal,
    value: "",
  });
  const [controlId, setControlId] = useState<string>();
  const localRef = useCallback(
    (input: HTMLInputElement | null) => {
      assignRef(inputRef, input);
      setControlId(input?.id);
    },
    [inputRef],
  );

  if (fieldState.resetSignal !== resetSignal) {
    setFieldState({ resetSignal, value: "" });
  }

  const visibilityLabel =
    visibilityContext === "confirmation"
      ? isVisible
        ? "Masquer la confirmation du mot de passe"
        : "Afficher la confirmation du mot de passe"
      : isVisible
        ? "Masquer le mot de passe"
        : "Afficher le mot de passe";
  const VisibilityIcon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative" data-auth-password-field={id}>
      <AuthTextInput
        autoComplete={autoComplete}
        className="pr-12"
        describedBy={describedBy}
        htmlName={name}
        label={label}
        maxLength={128}
        minLength={minLength}
        onChange={(value) => setFieldState({ resetSignal, value })}
        ref={localRef}
        required={required}
        size="lg"
        spellCheck={false}
        status={invalid ? { type: "error" } : undefined}
        type={isVisible ? "text" : "password"}
        value={fieldState.value}
        width="100%"
      />
      <div className="absolute right-0 bottom-0 flex h-11 items-center">
        <button
          aria-controls={controlId}
          aria-label={visibilityLabel}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          <VisibilityIcon aria-hidden="true" size={19} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
