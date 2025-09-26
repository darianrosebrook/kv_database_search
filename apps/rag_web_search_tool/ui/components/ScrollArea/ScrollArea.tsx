import React, { forwardRef } from "react";
import styles from "./ScrollArea.module.scss";

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${styles.scrollArea} ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

export default ScrollArea;
