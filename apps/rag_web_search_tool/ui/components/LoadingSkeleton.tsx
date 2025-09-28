/**
 * Loading skeleton component for loading states
 */
import React from "react";
import styles from "./LoadingSkeleton.module.scss";

export interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  animation?: "pulse" | "wave" | "none";
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = "100%",
  height = "1em",
  className = "",
  variant = "rectangular",
  animation = "pulse",
}) => {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  const variantClass = styles[variant];
  const animationClass = styles[animation];

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${animationClass} ${className}`}
      style={style}
      aria-label="Loading"
    />
  );
};

export default LoadingSkeleton;
