"use client";

import React from "react";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import styles from "./split-layout.module.scss";

interface SplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
}

export function SplitLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
  className,
}: SplitLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const container = document.getElementById("split-container");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

    if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div id="split-container" className={cn(styles.splitLayout, className)}>
      {/* Left Panel */}
      <div
        className={cn(styles.leftPanel)}
        style={{ width: isLeftCollapsed ? 0 : `${leftWidth}%` }}
      >
        {!isLeftCollapsed && (
          <>
            <div className={styles.panelContent}>{leftPanel}</div>
            <div className={styles.panelToggle}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLeftCollapsed(true)}
                className="bg-background/80 backdrop-blur-sm"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Resize Handle */}
      {!isLeftCollapsed && !isRightCollapsed && (
        <div
          className={styles.resizeHandle}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Right Panel */}
      <div
        className={cn(styles.rightPanel)}
        style={{
          width: isRightCollapsed
            ? 0
            : isLeftCollapsed
            ? "100%"
            : `${100 - leftWidth}%`
        }}
      >
        {!isRightCollapsed && (
          <>
            <div className={styles.panelContent}>{rightPanel}</div>
            {!isLeftCollapsed && (
              <div className={styles.panelToggle}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRightCollapsed(true)}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Collapsed Panel Toggles */}
      {isLeftCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLeftCollapsed(false)}
          className={styles.collapsedToggleLeft + " bg-background/80 backdrop-blur-sm"}
        >
          <PanelLeftClose className="h-4 w-4 rotate-180" />
        </Button>
      )}

      {isRightCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRightCollapsed(false)}
          className={styles.collapsedToggleRight + " bg-background/80 backdrop-blur-sm"}
        >
          <PanelRightClose className="h-4 w-4 rotate-180" />
        </Button>
      )}
    </div>
  );
}
