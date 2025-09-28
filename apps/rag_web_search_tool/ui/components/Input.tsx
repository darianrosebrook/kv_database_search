/**
 * Input component for form fields
 */
import React from "react";
import styles from "./Input.module.scss";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: "small" | "medium" | "large";
  variant?: "default" | "filled" | "outlined";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = "medium",
      variant = "default",
      leftIcon,
      rightIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const sizeClass = styles[size];
    const variantClass = styles[variant];
    const errorClass = error ? styles.error : "";

    return (
      <div className={`${styles.inputWrapper} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={`${styles.input} ${sizeClass} ${variantClass} ${errorClass}`}
            {...props}
          />
          {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
        </div>
        {error && <div className={styles.errorText}>{error}</div>}
        {helperText && !error && (
          <div className={styles.helperText}>{helperText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
