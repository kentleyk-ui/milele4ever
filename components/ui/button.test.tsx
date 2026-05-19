import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("affiche le texte fourni", () => {
    render(<Button>Cliquez-moi</Button>);
    expect(screen.getByText("Cliquez-moi")).toBeInTheDocument();
  });

  it("déclenche le onClick quand cliqué", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Test</Button>);

    const button = screen.getByRole("button", { name: "Test" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("appelle le onClick avec le bon événement", async () => {
    const handleClick = vi.fn((e: React.MouseEvent<HTMLButtonElement>) => {
      expect(e.type).toBe("click");
    });
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click Test</Button>);

    await user.click(screen.getByRole("button", { name: "Click Test" }));
    expect(handleClick).toHaveBeenCalled();
  });

  it("désactive le bouton quand disabled=true", () => {
    render(<Button disabled>Désactivé</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
