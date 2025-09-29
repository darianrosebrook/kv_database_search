"use client";

import { cn } from "@/lib/utils";
import { Button } from "../button";
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
        return (
          <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        );
      case "chat":
        return (
          <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        );
      case "document":
        return (
          <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        );
      case "workspace":
        return (
          <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        );
      default:
        return (
          <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        );
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center bg-card border-b border-border relative",
          className
        )}
      >
        {/* Scroll Left Button */}
        {showScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            className="h-full px-2 border-r border-border rounded-none"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Tabs Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center overflow-x-auto scrollbar-none flex-1"
        >
          {tabs.length > 0 ? (
            tabs.map((tab, index) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-r border-border cursor-pointer",
                  "hover:bg-accent/50 transition-colors group min-w-0 relative",
                  activeTabId === tab.id &&
                    "bg-background border-b-2 border-b-workspace-accent"
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
                <span className="text-sm truncate max-w-32">
                  {tab.title}
                  {tab.isDirty && (
                    <span className="text-workspace-accent ml-1">•</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No tabs open
            </div>
          )}
        </div>

        {/* Scroll Right Button */}
        {showScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            className="h-full px-2 border-l border-border rounded-none"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Add Tab Button */}
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 mr-4"
          onClick={addNewTab}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50" onClick={closeContextMenu} />
          {/* Menu */}
          <div
            className="fixed z-50 bg-popover border border-border rounded-md shadow-md p-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
              onClick={() => handleContextMenuAction("close")}
            >
              Close Tab
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
              onClick={() => handleContextMenuAction("closeOthers")}
            >
              Close Other Tabs
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
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
