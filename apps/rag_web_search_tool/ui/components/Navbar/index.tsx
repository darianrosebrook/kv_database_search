/**
 * Navbar component
 */
import React from "react";
import { useRouter } from "../Router";
import { usePerformanceMonitor } from "../usePerformanceMonitor";
import { Icon } from "../Icon";
import styles from "./Navbar.module.scss";

export interface NavbarProps {
  children?: React.ReactNode;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ children, className = "" }) => {
  const router = useRouter();
  const { getAverageRenderTime } = usePerformanceMonitor("Navbar");

  return (
    <nav className={`${styles.navbar} ${className}`}>
      {children || (
        <div className={styles.defaultContent}>
          <div className={styles.logo}>
            <Icon name="info-circle" size={24} />
            <span>Obsidian RAG</span>
          </div>
          <div className={styles.navItems}>
            <button onClick={() => router.push("/")} className={styles.navItem}>
              Home
            </button>
            <button
              onClick={() => router.push("/search")}
              className={styles.navItem}
            >
              Search
            </button>
            <button
              onClick={() => router.push("/chat")}
              className={styles.navItem}
            >
              Chat
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
