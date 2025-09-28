/**
 * Toolbar wrapper component for TipTap
 */
import React from "react";
import { Toolbar } from "./Toolbar";
import styles from "./ToolbarWrapper.module.scss";

export interface ToolbarWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarWrapper: React.FC<ToolbarWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`${styles.toolbarWrapper} ${className}`}>
      <Toolbar>{children}</Toolbar>
    </div>
  );
};

export default ToolbarWrapper;
