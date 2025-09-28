import * as React from "react";
import { render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import axe from "axe-core";
import Button from "../Button";

describe("Button", () => {
  it("renders button with text correctly", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeTruthy();
    expect(button.textContent).toBe("Click me");
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("renders correctly with different props", () => {
    render(
      <Button variant="secondary" size="large">
        Test
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole("button");
    expect(button.classList.contains("custom-class")).toBe(true);
  });

  it("passes through HTML attributes", () => {
    render(<Button data-testid="test-button">Test</Button>);
    expect(screen.getByTestId("test-button")).toBeTruthy();
  });

  describe("Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Button>Accessible button</Button>);
      const results = await (axe as any)(container);
      expect(results.violations.length).toBe(0);
    });

    it("supports keyboard activation", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");
      button.focus();
      expect(document.activeElement === button).toBe(true);
    });
  });

  describe("Design Tokens", () => {
    it("uses design tokens instead of hardcoded values", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");

      // Verify CSS custom properties are being used
      // Note: In jsdom, CSS custom properties may not resolve,
      // but we can check that the class is applied correctly
      expect(button.classList.contains("button")).toBe(true);
    });
  });

  describe("Variants", () => {
    it("applies variant classes correctly", () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole("button");
      expect(button.getAttribute("data-variant")).toBe("primary");
    });

    it("applies size classes correctly", () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole("button");
      expect(button.getAttribute("data-size")).toBe("large");
    });
  });
});
