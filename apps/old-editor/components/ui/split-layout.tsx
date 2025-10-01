"use client"

import React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { PanelLeftClose, PanelRightClose } from "lucide-react"

interface SplitLayoutProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
  className?: string
}

export function SplitLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
  className,
}: SplitLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const container = document.getElementById("split-container")
    if (!container) return

    const rect = container.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100

    if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
      setLeftWidth(newLeftWidth)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging])

  return (
    <div id="split-container" className={cn("h-full flex", className)}>
      {/* Left Panel */}
      <div
        className={cn("flex flex-col transition-all duration-200", isLeftCollapsed ? "w-0" : `w-[${leftWidth}%]`)}
        style={{ width: isLeftCollapsed ? 0 : `${leftWidth}%` }}
      >
        {!isLeftCollapsed && (
          <>
            <div className="flex-1 overflow-hidden">{leftPanel}</div>
            <div className="absolute top-4 right-4 z-10">
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
          className="w-1 bg-border hover:bg-workspace-accent cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Right Panel */}
      <div
        className={cn(
          "flex flex-col transition-all duration-200 relative",
          isRightCollapsed ? "w-0" : isLeftCollapsed ? "w-full" : `w-[${100 - leftWidth}%]`,
        )}
      >
        {!isRightCollapsed && (
          <>
            <div className="flex-1 overflow-hidden">{rightPanel}</div>
            {!isLeftCollapsed && (
              <div className="absolute top-4 right-4 z-10">
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
          className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
        >
          <PanelLeftClose className="h-4 w-4 rotate-180" />
        </Button>
      )}

      {isRightCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRightCollapsed(false)}
          className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
        >
          <PanelRightClose className="h-4 w-4 rotate-180" />
        </Button>
      )}
    </div>
  )
}
