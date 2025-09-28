/**
 * Page transition component for smooth navigation
 */
import React from "react";
import { motion } from "motion/react";
import styles from "./PageTransition.module.scss";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
  duration = 0.3,
  delay = 0,
}) => {
  return (
    <motion.div
      className={`${styles.pageTransition} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration,
        delay,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export const BreadcrumbNavigationLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = "" }) => {
  return (
    <a href={href} className={`${styles.breadcrumbLink} ${className}`}>
      {children}
    </a>
  );
};

export default PageTransition;
