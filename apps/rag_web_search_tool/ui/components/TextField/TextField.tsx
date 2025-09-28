"use client";
import * as React from "react";
import { Input, type InputProps } from "../Input";
import { Label } from "../Label";
import styles from "./TextField.module.scss";

export interface TextFieldProps {
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  // Include other InputProps properties
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "filled" | "outlined";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      label,
      description,
      error,
      className = "",
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...inputProps
    },
    ref
  ) => {
    const inputId = React.useId();
    const resolvedId = id ?? `tf-${inputId}`;
    const descId = description ? `${resolvedId}-desc` : undefined;
    const errId = error ? `${resolvedId}-err` : undefined;
    const describedBy =
      [ariaDescribedBy, descId, errId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={[styles.field, className].filter(Boolean).join(" ")}>
        {label ? (
          <Label htmlFor={resolvedId} className={styles.label}>
            {label}
          </Label>
        ) : null}
        <Input
          id={resolvedId}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid || !!error}
          {...inputProps}
        />
        {description ? (
          <div id={descId} className={styles.description}>
            {description}
          </div>
        ) : null}
        {error ? (
          <div id={errId} role="alert" className={styles.error}>
            {error}
          </div>
        ) : null}
      </div>
    );
  }
);
TextField.displayName = "TextField";

export default TextField;
