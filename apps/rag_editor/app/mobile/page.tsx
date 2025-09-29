"use client"

import { useState, useEffect } from "react"
import { SearchInput } from "@/components/ui/search-input"
import { WorkspaceCard } from "@/components/ui/workspace-card"
import { MobileNavigation } from "@/components/ui/mobile-navigation"
import { Display, BodyLarge, Caption } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Plus, Clock, TrendingUp } from "lucide-react"

export default function MobilePage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const recentDocuments = [
    {
      title: "Project Notes",
      description: "Architecture and implementation details",
      lastAccessed: "2 hours ago",
    },
    {
      title: "Meeting Summary",
      description: "Q1 planning discussion points",
      lastAccessed: "Yesterday",
    },
    {
      title: "Research Findings",
      description: "Vector database comparison study",
      lastAccessed: "3 days ago",
    },
  ]

  if (!isMobile) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Display className="text-2xl">Mobile View</Display>
          <BodyLarge className="text-muted-foreground">
            Resize your browser to mobile width to see the mobile interface.
          </BodyLarge>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-workspace-accent rounded-md" />
            <span className="text-lg font-medium">Obsidian</span>
          </div>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <SearchInput placeholder="Search..." showShortcut={false} />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <Display className="text-2xl">Welcome Back</Display>
          <BodyLarge className="text-muted-foreground">Continue where you left off</BodyLarge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
            <Plus className="h-5 w-5" />
            <span className="text-sm">New Doc</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Trending</span>
          </Button>
        </div>

        {/* Recent Documents */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Caption>Recent</Caption>
          </div>
          <div className="space-y-3">
            {recentDocuments.map((doc, index) => (
              <WorkspaceCard
                key={index}
                title={doc.title}
                description={doc.description}
                lastAccessed={doc.lastAccessed}
                className="p-3"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}
