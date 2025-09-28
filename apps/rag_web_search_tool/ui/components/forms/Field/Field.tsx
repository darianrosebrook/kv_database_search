/**
 * Field component for form fields
 */
import React from "react";
import { Spinner } from "../Spinner";
import styles from "./Field.module.scss";

export interface FieldProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  loading?: boolean;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  children,
  label,
  description,
  error,
  required,
  loading,
  className = "",
}) => {
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputContainer}>
        {children}
        {loading && (
          <div className={styles.loading}>
            <Spinner size="small" />
          </div>
        )}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {description && !error && (
        <div className={styles.description}>{description}</div>
      )}
    </div>
  );
};

export default Field;
