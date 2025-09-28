/**
 * Sidebar component
 */
import React from "react";
import { NavigationLink } from "../NavigationLink";
import styles from "./Sidebar.module.scss";

export interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  className = "",
  isOpen = false,
  onToggle,
}) => {
  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${className}`}
    >
      {children || (
        <div className={styles.defaultContent}>
          <nav className={styles.nav}>
            <NavigationLink href="/" className={styles.navItem}>
              Home
            </NavigationLink>
            <NavigationLink href="/search" className={styles.navItem}>
              Search
            </NavigationLink>
            <NavigationLink href="/chat" className={styles.navItem}>
              Chat
            </NavigationLink>
            <NavigationLink href="/settings" className={styles.navItem}>
              Settings
            </NavigationLink>
          </nav>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
