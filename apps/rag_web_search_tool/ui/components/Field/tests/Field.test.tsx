/**
 * Field component tests
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Field } from "../Field";

describe("Field", () => {
  it("renders with label", () => {
    render(
      <Field label="Test Label">
        <input />
      </Field>
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("renders with required indicator", () => {
    render(
      <Field label="Test Label" required>
        <input />
      </Field>
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(
      <Field label="Test Label" description="Test description">
        <input />
      </Field>
    );

    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("renders with error", () => {
    render(
      <Field label="Test Label" error="Test error">
        <input />
      </Field>
    );

    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders with loading state", () => {
    render(
      <Field label="Test Label" loading>
        <input />
      </Field>
    );

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});
