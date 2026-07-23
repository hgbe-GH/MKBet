"use client";

import { TextInput, type TextInputProps } from "@astryxdesign/core/TextInput";
import {
  useCallback,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type Ref,
  type RefObject,
} from "react";

type NativeInputContract = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "autoComplete" | "maxLength" | "minLength" | "required" | "spellCheck"
>;

export type AuthTextInputProps = Omit<TextInputProps, "aria-describedby"> &
  NativeInputContract & {
    describedBy?: string;
  };

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    (ref as RefObject<T | null>).current = value;
  }
}

/**
 * Keeps the browser-level Auth constraints that Astryx deliberately leaves in
 * its generic BaseProps. Astryx owns aria-describedby internally, so the
 * association is restored after every controlled-input render.
 */
export function AuthTextInput({
  describedBy,
  ref,
  ...props
}: AuthTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useCallback(
    (input: HTMLInputElement | null) => {
      inputRef.current = input;
      assignRef(ref, input);
    },
    [ref],
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (describedBy) input.setAttribute("aria-describedby", describedBy);
    else input.removeAttribute("aria-describedby");
  });

  return <TextInput {...props} ref={mergedRef} />;
}
