"use client"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Title, Body, Caption, Micro } from "./typography"
import { FileText, MessageSquare, Lightbulb, ExternalLink, Clock, Zap } from "lucide-react"
import { Badge } from "./badge"

interface SearchResult {
  id: string
  title: string
  type: "document" | "chat" | "insight"
  excerpt: string
  confidence: number
  lastModified?: string
  highlights?: string[]
  path?: string
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  isLoading?: boolean
  className?: string
  onResultClick?: (result: SearchResult) => void
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Vector Database Implementation Guide",
    type: "document",
    excerpt:
      "Comprehensive guide to implementing vector databases for semantic search. Covers Pinecone, Weaviate, and Chroma with performance comparisons and integration examples.",
    confidence: 0.94,
    lastModified: "2 days ago",
    highlights: ["vector database", "semantic search", "Pinecone"],
    path: "/Projects/Research/Vector Databases.md",
  },
  {
    id: "2",
    title: "RAG Architecture Discussion",
    type: "chat",
    excerpt:
      "In-depth conversation about Retrieval Augmented Generation patterns, embedding strategies, and context window optimization for knowledge management systems.",
    confidence: 0.91,
    highlights: ["RAG", "embedding strategies", "context window"],
  },
  {
    id: "3",
    title: "Semantic Search Best Practices",
    type: "insight",
    excerpt:
      "Key insights on implementing effective semantic search: chunking strategies, embedding models, similarity thresholds, and result ranking algorithms.",
    confidence: 0.87,
    lastModified: "1 week ago",
    highlights: ["semantic search", "chunking strategies", "similarity"],
    path: "/Personal/Learning/AI Search.md",
  },
  {
    id: "4",
    title: "OpenAI Embeddings Integration",
    type: "document",
    excerpt:
      "Step-by-step implementation of OpenAI's text-embedding-ada-002 model for document vectorization and similarity search in TypeScript applications.",
    confidence: 0.83,
    lastModified: "3 days ago",
    highlights: ["OpenAI", "text-embedding-ada-002", "vectorization"],
    path: "/Projects/Implementation/Embeddings.md",
  },
  {
    id: "5",
    title: "Knowledge Graph vs Vector Search",
    type: "document",
    excerpt:
      "Comparative analysis of knowledge graphs and vector search approaches for information retrieval, including hybrid solutions and use case recommendations.",
    confidence: 0.79,
    lastModified: "5 days ago",
    highlights: ["knowledge graph", "vector search", "information retrieval"],
    path: "/Research/Comparisons/Search Methods.md",
  },
]

export function SearchResults({
  results = mockResults,
  query,
  isLoading = false,
  className,
  onResultClick,
}: SearchResultsProps) {
  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "chat":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "insight":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-500/20 text-green-700 dark:text-green-300"
    if (confidence >= 0.8) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
    return "bg-orange-500/20 text-orange-700 dark:text-orange-300"
  }

  const highlightText = (text: string, highlights: string[] = []) => {
    if (!highlights.length) return text

    let highlightedText = text
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight})`, "gi")
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-search-highlight/30 text-search-highlight-foreground px-1 rounded">$1</mark>',
      )
    })

    return highlightedText
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-full mb-1" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-workspace-accent" />
          <Caption>
            Found {results.length} results for "{query}" in 0.12s
          </Caption>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          Sort by relevance
        </Button>
      </div>

      {/* Results */}
      {results.map((result) => (
        <div
          key={result.id}
          className="p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-all duration-200 group"
          onClick={() => onResultClick?.(result)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {getIcon(result.type)}
              <div className="min-w-0 flex-1">
                <Title className="text-base truncate group-hover:text-workspace-accent transition-colors">
                  {result.title}
                </Title>
                {result.path && <Caption className="truncate">{result.path}</Caption>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className={cn("text-xs font-mono", getConfidenceColor(result.confidence))}>
                {Math.round(result.confidence * 100)}%
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Body
            className="text-muted-foreground mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightText(result.excerpt, result.highlights),
            }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {result.highlights && result.highlights.length > 0 && (
                <div className="flex items-center gap-1">
                  <Micro className="text-muted-foreground">Highlights:</Micro>
                  <div className="flex gap-1">
                    {result.highlights.slice(0, 3).map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {result.lastModified && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <Caption>{result.lastModified}</Caption>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
