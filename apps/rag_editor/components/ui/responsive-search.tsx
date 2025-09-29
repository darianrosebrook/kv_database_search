"use client"

import { useState, useEffect } from "react"
import { SearchInput } from "./search-input"
import { SearchResults } from "./search-results"
import { SearchFilters } from "./search-filters"
import { SplitLayout } from "./split-layout"
import { ChatInterface } from "./chat-interface"
import { Button } from "./button"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResponsiveSearchProps {
  className?: string
}

export function ResponsiveSearch({ className }: ResponsiveSearchProps) {
  const [query, setQuery] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setIsSearching(true)

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)
    }, 800)
  }

  const searchPanel = (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <SearchInput
          placeholder="Search your knowledge base..."
          className="mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(e.currentTarget.value)
            }
          }}
        />
        <SearchFilters />
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        <SearchResults
          results={[]}
          query={query}
          isLoading={isSearching}
          onResultClick={(result) => {
            console.log("Opening result:", result)
          }}
        />
      </div>
    </div>
  )

  const chatPanel = (
    <div className="h-full">
      <ChatInterface
        onSendMessage={(message, attachments) => {
          console.log("Chat message:", message, attachments)
        }}
      />
    </div>
  )

  if (isMobile) {
    return (
      <div className={cn("h-full", className)}>
        {!isChatOpen ? (
          <div className="h-full flex flex-col">
            {searchPanel}
            <div className="p-4 border-t border-border">
              <Button onClick={() => setIsChatOpen(true)} className="w-full gap-2">
                <MessageSquare className="h-4 w-4" />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-title font-medium">AI Assistant</span>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">{chatPanel}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("h-full", className)}>
      <SplitLayout
        leftPanel={searchPanel}
        rightPanel={chatPanel}
        defaultLeftWidth={60}
        minLeftWidth={40}
        maxLeftWidth={80}
      />
    </div>
  )
}
