"use client";

import { WorkspaceLayout } from "@/components/workspace-layout";
import { SearchChatInterface } from "@/components/ui/search-chat-interface";
import { SplitLayout } from "@/components/ui/split-layout";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  FileSpreadsheet,
  ImageIcon,
  File,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Zap,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Title, Caption } from "@/components/ui/typography";
import { searchService } from "@/lib/services/search-service";
import { SearchResult } from "@/lib/types";

// Generate refinement options based on search query
const getRefinementOptions = (query: string): string[] => {
  if (!query.trim()) return [];

  const baseOptions = ["examples", "tutorial", "guide", "documentation"];

  // Add query-specific refinements
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const specificOptions = queryWords
    .map((word) => `${word} examples`)
    .slice(0, 2);

  return [...baseOptions, ...specificOptions];
};

export default function SearchChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedContext, setSelectedContext] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  const lastProcessedQuery = useRef<string>("");

  useEffect(() => {
    const query = searchParams.get("q");
    if (query && query !== lastProcessedQuery.current) {
      lastProcessedQuery.current = query;
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Use our enhanced search service with dictionary integration
      const searchResponse = await searchService.enhancedSearch(query, {
        useDictionary: true,
        expandSynonyms: true,
        canonicalizeEntities: false, // Enable when Graph RAG is ready
      });

      setSearchResults(searchResponse.results);
      setSearchTime(Date.now() - startTime);

      // Auto-select top results for context (up to 3)
      const topResults = searchResponse.results
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 3)
        .map((result) => result.id);

      setSelectedContext(topResults);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setSelectedContext([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "csv":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const highlightText = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) return text;

    const parts = [];
    let lastIndex = 0;

    highlights.forEach(({ start, end }, index) => {
      parts.push(text.slice(lastIndex, start));
      parts.push(
        <mark
          key={text.slice(start, end) + index}
          className="bg-workspace-accent/30 text-workspace-accent-foreground px-0.5 rounded"
        >
          {text.slice(start, end)}
        </mark>
      );
      lastIndex = end;
    });
    parts.push(text.slice(lastIndex));

    return parts;
  };

  const handleAddContext = (resultId: string) => {
    setSelectedContext((prev) => [...prev, resultId]);
  };

  const handleRemoveContext = (resultId: string) => {
    setSelectedContext((prev) => prev.filter((id) => id !== resultId));
  };

  const handleOpenDocument = (result: any) => {
    // Navigate to document editor
    router.push(`/workspace/document/${result.id}`);
  };

  const handleRefineSearch = (refinement: string) => {
    const newQuery = `${searchQuery} ${refinement}`;
    router.push(`/search-chat?q=${encodeURIComponent(newQuery)}`);
  };

  const searchResultsPanel = (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Title className="text-lg">Search Results</Title>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {searchResults.length} results
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {(searchTime / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
        <div className="font-mono text-sm text-muted-foreground mb-4">
          {searchQuery}
        </div>

        {/* Refinement Options */}
        <div className="space-y-2">
          <Caption className="text-xs uppercase tracking-wider text-muted-foreground">
            Refine
          </Caption>
          <div className="flex flex-wrap gap-2">
            {getRefinementOptions(searchQuery).map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-transparent"
                onClick={() => handleRefineSearch(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-32" />
            ))}
          </div>
        ) : (
          searchResults.map((result) => (
            <div
              key={result.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-border-hover transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-muted-foreground">
                    {getFileIcon(result.source.type)}
                  </div>
                  <div className="flex-1">
                    <Title className="text-base mb-1">{result.title}</Title>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>{result.source.path}</span>
                      {result.lastUpdated && (
                        <>
                          <span>·</span>
                          <span>
                            {new Date(result.lastUpdated).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confidence & Context Toggle */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-light">
                      {Math.round(result.confidenceScore * 100)}
                    </div>
                    <Caption className="text-xs uppercase tracking-wider">
                      Match
                    </Caption>
                  </div>
                  <Button
                    variant={
                      selectedContext.includes(result.id)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      selectedContext.includes(result.id)
                        ? handleRemoveContext(result.id)
                        : handleAddContext(result.id)
                    }
                  >
                    {selectedContext.includes(result.id) ? (
                      <Minus className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="mb-3 p-3 bg-muted border border-border rounded font-mono text-xs text-muted-foreground leading-relaxed">
                {highlightText(
                  result.text || result.summary,
                  result.highlights || []
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDocument(result)}
                  className="gap-2"
                >
                  Open
                  <ArrowUpRight className="w-3 h-3" />
                </Button>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const chatPanel = (
    <SearchChatInterface
      searchQuery={searchQuery}
      searchResults={searchResults}
      selectedContext={selectedContext}
      onAddContext={handleAddContext}
      onRemoveContext={handleRemoveContext}
    />
  );

  return (
    <WorkspaceLayout>
      <SplitLayout
        leftPanel={searchResultsPanel}
        rightPanel={chatPanel}
        defaultLeftWidth={60}
        minLeftWidth={40}
        maxLeftWidth={80}
      />
    </WorkspaceLayout>
  );
}
