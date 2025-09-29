"use client"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { X, Plus, FileText, MessageSquare } from "lucide-react"
import { useState } from "react"

interface Tab {
  id: string
  title: string
  type: "document" | "chat"
  isActive?: boolean
  isDirty?: boolean
}

interface TabBarProps {
  className?: string
}

export function TabBar({ className }: TabBarProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Architecture Notes.md", type: "document", isActive: true, isDirty: true },
    { id: "2", title: "Vector Search Chat", type: "chat", isActive: false },
    { id: "3", title: "System Design.md", type: "document", isActive: false },
  ])

  const closeTab = (tabId: string) => {
    setTabs(tabs.filter((tab) => tab.id !== tabId))
  }

  const setActiveTab = (tabId: string) => {
    setTabs(tabs.map((tab) => ({ ...tab, isActive: tab.id === tabId })))
  }

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "Untitled",
      type: "document",
      isActive: true,
      isDirty: false,
    }
    setTabs([...tabs.map((tab) => ({ ...tab, isActive: false })), newTab])
  }

  return (
    <div className={cn("flex items-center bg-card border-b border-border", className)}>
      <div className="flex items-center overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-r border-border cursor-pointer",
              "hover:bg-accent/50 transition-colors group min-w-0",
              tab.isActive && "bg-background border-b-2 border-b-workspace-accent",
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.type === "document" ? (
              <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <span className="text-sm truncate max-w-32">
              {tab.title}
              {tab.isDirty && <span className="text-workspace-accent ml-1">•</span>}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="ml-2 mr-4" onClick={addNewTab}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
