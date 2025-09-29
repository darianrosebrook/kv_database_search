"use client";

import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Title, Body, Caption, Micro } from "../typography";
import {
  FileText,
  MessageSquare,
  Lightbulb,
  ExternalLink,
  Clock,
  Zap,
} from "lucide-react";
import { Badge } from "../badge";
import type { SearchResult } from "@/lib/types";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
  onViewDocument?: (result: SearchResult) => void;
}

// TODO: Remove this mock data - results should come from props only

export function SearchResults({
  results,
  query,
  isLoading = false,
  className,
  onResultClick,
  onViewDocument,
}: SearchResultsProps) {
  const getIcon = (sourceType: SearchResult["source"]["type"]) => {
    switch (sourceType) {
      case "documentation":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "component":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "guideline":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "note":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "article":
        return <FileText className="h-4 w-4 text-cyan-500" />;
      case "book":
        return <FileText className="h-4 w-4 text-orange-500" />;
      case "conversation":
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case "moc":
        return <Lightbulb className="h-4 w-4 text-pink-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9)
      return "bg-green-500/20 text-green-700 dark:text-green-300";
    if (confidence >= 0.8)
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
    return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  };

  const highlightText = (text: string, highlights: string[] = []) => {
    if (!highlights.length) return text;

    let highlightedText = text;
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-search-highlight/30 text-search-highlight-foreground px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  };

  // Extract highlights from the result for display
  const getHighlightsForDisplay = (result: SearchResult): string[] => {
    return result.highlights || [];
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border border-border animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-full mb-1" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No results found for "{query}"
          </div>
        </div>
      </div>
    );
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
      {results.map((result) => {
        const highlights = getHighlightsForDisplay(result);
        const displayText = result.text || result.summary;

        return (
          <div
            key={result.id}
            className="p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-all duration-200 group"
            onClick={() => onResultClick?.(result)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getIcon(result.source.type)}
                <div className="min-w-0 flex-1">
                  <Title className="text-base truncate group-hover:text-workspace-accent transition-colors">
                    {result.title}
                  </Title>
                  <Caption className="truncate">{result.source.path}</Caption>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-mono",
                    getConfidenceColor(result.confidenceScore)
                  )}
                >
                  {Math.round(result.confidenceScore * 100)}%
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocument?.(result);
                  }}
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div
              className="text-muted-foreground mb-3 line-clamp-2 text-sm"
              dangerouslySetInnerHTML={{
                __html: highlightText(displayText, highlights),
              }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {highlights.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Micro className="text-muted-foreground">Highlights:</Micro>
                    <div className="flex gap-1">
                      {highlights.slice(0, 3).map((highlight, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Micro className="text-muted-foreground">Tags:</Micro>
                    <div className="flex gap-1">
                      {result.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {result.lastUpdated && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <Caption>
                    {new Date(result.lastUpdated).toLocaleDateString()}
                  </Caption>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
