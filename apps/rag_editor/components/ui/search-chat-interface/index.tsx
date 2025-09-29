"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button  } from "../button"
import { Title, Body, Caption  } from "../typography"
import { Send, Paperclip, Mic, ChevronDown, Sparkles, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchChatInterfaceProps {
  searchQuery?: string
  searchResults?: any[]
  onAddContext?: (resultId: string) => void
  onRemoveContext?: (resultId: string) => void
  selectedContext?: string[]
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: string[]
}

const suggestedRefinements = [
  "Show me recent documents",
  "Focus on Q4 2024 data",
  "Include financial metrics",
  "Add competitive analysis",
  "Show implementation details",
]

export function SearchChatInterface({
  searchQuery = "",
  searchResults = [],
  onAddContext,
  onRemoveContext,
  selectedContext = [],
}: SearchChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-4")
  const [welcomeInitialized, setWelcomeInitialized] = useState(false)

  useEffect(() => {
    if (searchQuery && !welcomeInitialized && searchResults.length > 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `I found ${searchResults.length} documents related to "${searchQuery}". I can help you analyze these results, answer questions about the content, or help you refine your search. What would you like to know?`,
          timestamp: new Date(),
          sources: searchResults.slice(0, 3).map((r) => r.title),
        },
      ])
      setWelcomeInitialized(true)
    }
  }, [searchQuery, searchResults, welcomeInitialized])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on the search results for "${searchQuery}", I can see that ${selectedContext.length} documents are currently selected as context. ${inputValue.includes("revenue") ? "The financial documents show strong quarterly growth trends with revenue increasing 23% year-over-year." : "Let me analyze the available documents to provide you with relevant insights."}`,
        timestamp: new Date(),
        sources: searchResults
          .filter((r) => selectedContext.includes(r.id))
          .map((r) => r.title)
          .slice(0, 2),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedRefinement = (refinement: string) => {
    setInputValue(refinement)
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <Title className="text-lg">AI Assistant</Title>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              <ChevronDown className="h-3 w-3 ml-1" />
              {selectedModel.toUpperCase()}
            </Button>
          </div>
        </div>

        {/* Context Status */}
        {selectedContext.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-workspace-accent">
              <FileText className="h-3 w-3" />
              <span>{selectedContext.length} documents as context</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role === "assistant" && (
              <div className="w-8 h-8 bg-workspace-accent rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-workspace-accent-foreground" />
              </div>
            )}

            <div className={cn("max-w-[80%] space-y-2", message.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "px-4 py-3 rounded-lg",
                  message.role === "user" ? "bg-workspace-accent text-workspace-accent-foreground ml-auto" : "bg-muted",
                )}
              >
                <Body className="text-sm leading-relaxed">{message.content}</Body>
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.sources.map((source, idx) => (
                    <Caption key={idx} className="px-2 py-1 bg-accent rounded text-xs">
                      {source}
                    </Caption>
                  ))}
                </div>
              )}

              <Caption className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Caption>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-workspace-accent rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-workspace-accent-foreground animate-pulse" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Refinements */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-border">
          <Caption className="text-xs text-muted-foreground mb-2">Suggested questions:</Caption>
          <div className="flex flex-wrap gap-2">
            {suggestedRefinements.map((refinement, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-transparent"
                onClick={() => handleSuggestedRefinement(refinement)}
              >
                {refinement}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask questions about your search results..."
            className="w-full pl-4 pr-20 py-3 bg-input border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-32"
            rows={1}
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
