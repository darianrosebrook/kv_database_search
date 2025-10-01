"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Title, Caption, Micro } from "./typography"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  MessageSquare,
  Settings,
  User,
  Plus,
  Search,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SidebarProps {
  className?: string
}

interface FileTreeItem {
  id: string
  name: string
  type: "folder" | "file" | "chat"
  children?: FileTreeItem[]
  isOpen?: boolean
}

const mockFileTree: FileTreeItem[] = [
  {
    id: "1",
    name: "Projects",
    type: "folder",
    isOpen: true,
    children: [
      { id: "1-1", name: "Architecture Notes.md", type: "file" },
      { id: "1-2", name: "System Design.md", type: "file" },
      {
        id: "1-3",
        name: "Research",
        type: "folder",
        children: [
          { id: "1-3-1", name: "Vector Databases.md", type: "file" },
          { id: "1-3-2", name: "AI Models Comparison.md", type: "file" },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Meeting Notes",
    type: "folder",
    children: [
      { id: "2-1", name: "Q1 Planning.md", type: "file" },
      { id: "2-2", name: "Team Sync.md", type: "file" },
    ],
  },
  {
    id: "3",
    name: "Personal",
    type: "folder",
    children: [
      { id: "3-1", name: "Ideas.md", type: "file" },
      { id: "3-2", name: "Learning Goals.md", type: "file" },
    ],
  },
]

const recentChats = [
  { id: "chat-1", name: "Vector Search Implementation", type: "chat" as const },
  { id: "chat-2", name: "Architecture Discussion", type: "chat" as const },
  { id: "chat-3", name: "Research Analysis", type: "chat" as const },
]

function FileTreeNode({ item, level = 0 }: { item: FileTreeItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(item.isOpen || false)

  const handleToggle = () => {
    if (item.type === "folder") {
      setIsOpen(!isOpen)
    }
  }

  const Icon = item.type === "folder" ? (isOpen ? FolderOpen : Folder) : item.type === "chat" ? MessageSquare : FileText

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer",
          "hover:bg-accent/50 transition-colors group",
          "text-sm",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {item.type === "folder" && (
          <button className="p-0.5 hover:bg-accent rounded">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        <Icon
          className={cn("h-4 w-4 flex-shrink-0", item.type === "folder" ? "text-folder" : "text-muted-foreground")}
        />
        <span className="truncate text-foreground group-hover:text-foreground">{item.name}</span>
      </div>
      {item.type === "folder" && isOpen && item.children && (
        <div className="animate-in">
          {item.children.map((child) => (
            <FileTreeNode key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search-chat?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className={cn("w-64 bg-card border-r border-border flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Title className="text-lg">Workspace</Title>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search files..."
            className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-2">
            <Micro className="text-muted-foreground">Files</Micro>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {mockFileTree.map((item) => (
              <FileTreeNode key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="p-2 border-t border-border">
          <div className="flex items-center justify-between px-2 py-2">
            <Micro className="text-muted-foreground">Recent Chats</Micro>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {recentChats.map((chat) => (
              <FileTreeNode key={chat.id} item={chat} />
            ))}
          </div>
        </div>
      </div>

      {/* User Menu */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-workspace-accent rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-workspace-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">John Doe</div>
            <Caption className="truncate">john@example.com</Caption>
          </div>
        </div>
      </div>
    </div>
  )
}
