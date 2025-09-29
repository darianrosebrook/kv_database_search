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
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Title, Caption } from "@/components/ui/typography";
import { apiClient, SearchResponse, ChatResponse } from "@/lib/api-client";

// Extract refinement options from search results
const getRefinementOptions = (results: SearchResponse["results"]) => {
  const options = new Set<string>();

  results.forEach((result) => {
    // Extract key terms from metadata
    if (result.meta?.section) options.add(result.meta.section);
    if (result.meta?.contentType) options.add(result.meta.contentType);
    if (result.meta?.author) options.add(`by ${result.meta.author}`);

    // Extract terms from text content
    const words = (result.text || "").split(/\s+/);
    words.forEach((word) => {
      if (word.length > 4 && word.match(/^[a-zA-Z]+$/)) {
        options.add(word);
      }
    });
  });

  return Array.from(options).slice(0, 5);
};

export default function SearchChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [selectedContext, setSelectedContext] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.combinedSearch({
        query,
        limit: 10,
        includeChatSessions: true,
        includeWebResults: true,
      });

      setSearchResults(response);

      // Auto-select top 2 results for context
      if (response.results.length > 0) {
        setSelectedContext(response.results.slice(0, 2).map((r) => r.id));
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (result: any) => {
    const contentType = result.meta?.contentType;
    const sourceType = result.source?.type;

    if (sourceType === "web") {
      return <ImageIcon className="w-4 h-4 text-purple-500" />;
    }

    switch (contentType) {
      case "code":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "text":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "chat_session":
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const highlightText = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) return text;

    const parts = [];
    let lastIndex = 0;

    highlights.forEach(({ start, end }) => {
      parts.push(text.slice(lastIndex, start));
      parts.push(
        <mark
          key={start}
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

  // Transform API results to UI format
  const transformedResults =
    searchResults?.results.map((result) => ({
      id: result.id,
      title:
        result.meta?.section ||
        result.text?.substring(0, 50) + "..." ||
        "Untitled",
      type:
        result.meta?.contentType === "chat_session"
          ? "chat"
          : result.source?.type === "web"
          ? "web"
          : result.meta?.contentType || "document",
      confidence: result.cosineSimilarity || 0.5,
      preview:
        result.text?.substring(0, 200) +
          (result.text?.length > 200 ? "..." : "") || "",
      matchedText: searchQuery,
      highlights: [], // TODO: Extract highlights from search
      metadata: {
        author: result.meta?.author,
        date: result.meta?.updatedAt
          ? new Date(result.meta.updatedAt).toLocaleDateString()
          : undefined,
        path: result.meta?.uri || result.source?.url,
        pages: result.meta?.characterCount
          ? Math.ceil(result.meta.characterCount / 500)
          : undefined,
        section: result.meta?.section,
        dimensions:
          result.meta?.contentType === "image" ? "Unknown" : undefined,
        format: result.meta?.contentType,
        rows: result.meta?.contentType === "csv" ? "Unknown" : undefined,
        columns: result.meta?.contentType === "csv" ? "Unknown" : undefined,
        size: result.meta?.characterCount
          ? `${result.meta.characterCount} chars`
          : undefined,
        modified: result.meta?.updatedAt
          ? new Date(result.meta.updatedAt).toLocaleDateString()
          : undefined,
      },
    })) || [];

  const refinementOptions = getRefinementOptions(searchResults?.results || []);

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
              {searchResults?.totalFound || 0} results
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              0.34s
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
            {refinementOptions.map((option, idx) => (
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
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-32" />
            ))}
          </div>
        ) : (
          transformedResults.map((result) => (
            <div
              key={result.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-border-hover transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-muted-foreground">
                    {getFileIcon(result)}
                  </div>
                  <div className="flex-1">
                    <Title className="text-base mb-1">{result.title}</Title>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      {result.metadata.author && (
                        <span>{result.metadata.author}</span>
                      )}
                      {result.metadata.author && result.metadata.date && (
                        <span>·</span>
                      )}
                      {result.metadata.date && (
                        <span>{result.metadata.date}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confidence & Context Toggle */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-light">
                      {(result.confidence * 100).toFixed(0)}
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
                {highlightText(result.preview, result.highlights)}
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
      searchResults={transformedResults}
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
