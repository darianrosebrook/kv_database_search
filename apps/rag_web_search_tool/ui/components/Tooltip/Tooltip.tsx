/**
 * Tooltip component
 */
import React from "react";
import { motion } from "motion/react";
import { Popover } from "../Popover";
import styles from "./Tooltip.module.scss";

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = "top",
  className = "",
  delay = 500,
}) => {
  return (
    <Popover
      content={
        <div className={`${styles.tooltip} ${className}`}>{content}</div>
      }
      trigger="hover"
      placement={placement}
    >
      {children}
    </Popover>
  );
};

export default Tooltip;
