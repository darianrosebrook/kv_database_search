"use client"

import { useState } from "react"
import { Button  } from "../button"
import { cn } from "@/lib/utils"
import { Home, Search, MessageSquare, FileText, User } from "lucide-react"

interface MobileNavigationProps {
  className?: string
}

const navigationItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
  { id: "documents", label: "Docs", icon: FileText, href: "/workspace" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
]

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [activeItem, setActiveItem] = useState("home")

  return (
    <nav className={cn("bg-card border-t border-border", className)}>
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveItem(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-3",
              activeItem === item.id && "text-workspace-accent",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  )
}
