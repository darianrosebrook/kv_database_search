"use client";

import { cn } from "@/lib/utils";
import { Button } from "../button";
import styles from "./tab-bar.module.scss";
import {
  X,
  Plus,
  FileText,
  MessageSquare,
  Search,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import type { AppTab } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface TabBarProps {
  className?: string;
}

export function TabBar({ className }: TabBarProps) {
  const {
    tabs,
    activeTabId,
    closeTab,
    switchToTab,
    addTab,
    reorderTabs,
    closeOtherTabs,
    closeTabsToTheRight,
  } = useAppState();

  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowScrollLeft(scrollLeft > 0);
      setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [tabs]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const addNewTab = () => {
    addTab({
      title: "Untitled",
      type: "document",
      isActive: true,
      isDirty: false,
    });
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      tabId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    switch (action) {
      case "close":
        closeTab(contextMenu.tabId);
        break;
      case "closeOthers":
        closeOtherTabs(contextMenu.tabId);
        break;
      case "closeToRight":
        closeTabsToTheRight(contextMenu.tabId);
        break;
    }
    closeContextMenu();
  };

  const getTabIcon = (type: AppTab["type"]) => {
    switch (type) {
      case "search":
        return <Search className={styles.tabIcon} />;
      case "chat":
        return <MessageSquare className={styles.tabIcon} />;
      case "document":
        return <FileText className={styles.tabIcon} />;
      case "workspace":
        return <FolderOpen className={styles.tabIcon} />;
      default:
        return <FileText className={styles.tabIcon} />;
    }
  };

  return (
    <>
      <div className={cn(styles.tabBar, className)}>
        {/* Scroll Left Button */}
        {showScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.scrollButton}
            onClick={scrollLeft}
          >
            <ChevronLeft className={styles.iconMd} />
          </Button>
        )}

        {/* Tabs Container */}
        <div ref={scrollContainerRef} className={styles.tabsContainer}>
          {tabs.length > 0 ? (
            tabs.map((tab, index) => (
              <div
                key={tab.id}
                className={cn(
                  styles.tab,
                  activeTabId === tab.id && styles.active
                )}
                onClick={() => switchToTab(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", index.toString());
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(
                    e.dataTransfer.getData("text/plain")
                  );
                  if (fromIndex !== index) {
                    reorderTabs(fromIndex, index);
                  }
                }}
              >
                {getTabIcon(tab.type)}
                <span className={styles.tabContent}>
                  {tab.title}
                  {tab.isDirty && (
                    <span className={styles.tabDirtyIndicator}>•</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.tabCloseButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <X className={styles.iconSm} />
                </Button>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>No tabs open</div>
          )}
        </div>

        {/* Scroll Right Button */}
        {showScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.scrollButton}
            onClick={scrollRight}
          >
            <ChevronRight className={styles.iconMd} />
          </Button>
        )}

        {/* Add Tab Button */}
        <Button
          variant="ghost"
          size="sm"
          className={styles.addButton}
          onClick={addNewTab}
        >
          <Plus className={styles.iconMd} />
        </Button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <div
            className={styles.contextMenuBackdrop}
            onClick={closeContextMenu}
          />
          {/* Menu */}
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className={styles.contextMenuItem}
              onClick={() => handleContextMenuAction("close")}
            >
              Close Tab
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => handleContextMenuAction("closeOthers")}
            >
              Close Other Tabs
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => handleContextMenuAction("closeToRight")}
            >
              Close Tabs to the Right
            </button>
          </div>
        </>
      )}
    </>
  );
}
