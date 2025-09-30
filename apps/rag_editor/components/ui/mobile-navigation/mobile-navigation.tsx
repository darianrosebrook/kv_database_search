"use client";

import { useState } from "react";
import { Button } from "../button";
import { cn } from "@/lib/utils";
import { Home, Search, MessageSquare, FileText, User } from "lucide-react";
import styles from "./mobile-navigation.module.scss";

interface MobileNavigationProps {
  className?: string;
}

const navigationItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
  { id: "documents", label: "Docs", icon: FileText, href: "/workspace" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [activeItem, setActiveItem] = useState("home");

  return (
    <nav className={cn(styles.mobileNavigation, className)}>
      <div className={styles.navContainer}>
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveItem(item.id)}
            className={cn(
              styles.navItem,
              activeItem === item.id && styles.active
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
