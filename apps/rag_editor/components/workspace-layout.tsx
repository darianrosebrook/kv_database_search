"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sidebar } from "./ui/sidebar"
import { TabBar } from "./ui/tab-bar"
import { Button } from "./ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="h-screen flex bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "transition-transform duration-200 ease-in-out z-50",
          isMobile
            ? cn("fixed left-0 top-0 h-full", isSidebarOpen ? "translate-x-0" : "-translate-x-full")
            : "relative",
        )}
      >
        <Sidebar className={cn(isMobile && "shadow-lg")} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-border md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <span className="text-title font-medium">Obsidian Editor</span>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        )}

        <TabBar className="hidden md:flex" />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
