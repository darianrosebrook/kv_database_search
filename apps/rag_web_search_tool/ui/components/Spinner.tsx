/**
 * Spinner component for loading states
 */
import React from "react";
import styles from "./Spinner.module.scss";

export interface SpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "medium",
  className = "",
  color,
}) => {
  const sizeClass = styles[size];
  const style = color ? { borderTopColor: color } : undefined;

  return (
    <div
      className={`${styles.spinner} ${sizeClass} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
};

export default Spinner;
