/**
 * Footer component
 */
import React from "react";
import styles from "./Footer.module.scss";

export interface FooterProps {
  children?: React.ReactNode;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ children, className = "" }) => {
  return (
    <footer className={`${styles.footer} ${className}`}>
      {children || (
        <div className={styles.defaultContent}>
          <p>&copy; 2024 Obsidian RAG. All rights reserved.</p>
        </div>
      )}
    </footer>
  );
};

export default Footer;
