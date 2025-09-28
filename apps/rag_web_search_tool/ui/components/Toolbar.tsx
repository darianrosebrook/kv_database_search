/**
 * Toolbar component for editor toolbars
 */
import React from "react";
import styles from "./Toolbar.module.scss";

export interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
}

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  className = "",
  orientation = "horizontal",
  size = "md",
}) => {
  const orientationClass = styles[orientation];
  const sizeClass = styles[size];

  return (
    <div
      className={`${styles.toolbar} ${orientationClass} ${sizeClass} ${className}`}
      role="toolbar"
    >
      {children}
    </div>
  );
};

export default Toolbar;
