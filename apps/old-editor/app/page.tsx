"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SearchInput } from "@/components/ui/search-input"
import { WorkspaceCard } from "@/components/ui/workspace-card"
import { Display, BodyLarge, Caption } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Clock, PenTool } from "lucide-react"

export default function SplashScreen() {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

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
      id: "project-architecture",
      title: "Project Architecture Notes",
      description: "System design and technical specifications for the new platform",
      lastAccessed: "2 hours ago",
    },
    {
      id: "meeting-notes-q1",
      title: "Meeting Notes - Q1 Planning",
      description: "Strategic planning session with key stakeholders and roadmap discussion",
      lastAccessed: "Yesterday",
    },
    {
      id: "research-vector-db",
      title: "Research: Vector Databases",
      description: "Comparative analysis of vector database solutions for semantic search",
      lastAccessed: "3 days ago",
    },
  ]

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement
      handleSearch(target.value)
    }
  }

  const handleNewDocument = () => {
    router.push("/workspace/document/new")
  }

  const handleNewWorkspace = () => {
    router.push("/workspace")
  }

  const handleDocumentClick = (docId: string) => {
    router.push(`/workspace/document/${docId}`)
  }

  // Redirect to mobile view on mobile devices
  if (isMobile) {
    window.location.href = "/mobile"
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-workspace-accent rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-workspace-accent-foreground" />
            </div>
            <span className="text-title font-medium font-sans">{"Knowledge Vector"}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewWorkspace}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <Display className="text-balance">
              Knowledge Without
              <br />
              Limitation
            </Display>
            <BodyLarge className="text-muted-foreground max-w-lg mx-auto">
              Transform your thoughts into interconnected knowledge with AI-powered insights and semantic search.
            </BodyLarge>
          </div>

          {/* Search */}
          <div className="space-y-4">
            <SearchInput
              placeholder="Search your knowledge base..."
              className="text-lg py-4"
              onKeyDown={handleSearchKeyDown}
            />
            <div className="h-px bg-border" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <Button
                onClick={handleNewDocument}
                size="lg"
                className="bg-workspace-accent hover:bg-workspace-accent/90 text-workspace-accent-foreground font-medium px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <PenTool className="h-5 w-5 mr-3" />
                Create New Document
              </Button>
            </div>
            <div className="h-px bg-border" />
          </div>

          {/* Recent Documents */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <Caption>Recently Accessed</Caption>
            </div>
            <div className="grid gap-4">
              {recentDocuments.map((doc, index) => (
                <WorkspaceCard
                  key={index}
                  title={doc.title}
                  description={doc.description}
                  lastAccessed={doc.lastAccessed}
                  onClick={() => handleDocumentClick(doc.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
