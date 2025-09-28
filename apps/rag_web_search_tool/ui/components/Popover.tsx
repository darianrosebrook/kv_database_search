/**
 * Popover component for floating content
 */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "./Popover.module.scss";

export interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  trigger?: "click" | "hover" | "focus";
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
  disabled?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  children,
  content,
  trigger = "click",
  placement = "bottom",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTrigger = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleMouseEnter = () => {
    if (trigger === "hover" && !disabled) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover" && !disabled) {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (trigger === "focus" && !disabled) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    if (trigger === "focus" && !disabled) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const placementClass = styles[placement];

  return (
    <div className={`${styles.popover} ${className}`}>
      <div
        ref={triggerRef}
        onClick={trigger === "click" ? handleTrigger : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={styles.trigger}
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            className={`${styles.content} ${placementClass}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Popover;
