import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignInForm } from "@/components/auth/sign-in-form";

describe("Astryx auth UI", () => {
  it("renders the permanent sign-in controls and safe recovery action", () => {
    render(<SignInForm next="/direct" />);

    expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Mot de passe oublié ?" }),
    ).toHaveAttribute("href", "/forgot-password");
  });
});
