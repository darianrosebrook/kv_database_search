/**
 * Scroll area component
 */
import React from "react";
import styles from "./ScrollArea.module.scss";

export interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  maxWidth?: string;
  orientation?: "vertical" | "horizontal" | "both";
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className = "",
  maxHeight = "200px",
  maxWidth,
  orientation = "vertical",
}) => {
  const orientationClass = styles[orientation];

  const style: React.CSSProperties = {
    maxHeight,
    maxWidth,
  };

  return (
    <div
      className={`${styles.scrollArea} ${orientationClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default ScrollArea;
