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
import styles from "./page.module.scss";

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
        return <FileText className={styles.fileIcon} />;
      case "csv":
        return <FileSpreadsheet className={styles.fileIcon} />;
      case "image":
        return <ImageIcon className={styles.fileIcon} />;
      default:
        return <File className={styles.fileIcon} />;
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
          className={styles.previewHighlight}
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
    <div className={styles.resultsPanel}>
      {/* Header */}
      <div className={styles.resultsHeader}>
        <div className={styles.resultsHeaderTop}>
          <Title className={styles.resultsTitle}>Search Results</Title>
          <div className={styles.resultsMeta}>
            <span className={styles.resultsMetaItem}>
              <Zap className={styles.metaIcon} />
              {searchResults.length} results
            </span>
            <span className={styles.resultsMetaItem}>
              <Clock className={styles.metaIcon} />
              {(searchTime / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
        <div className={styles.queryPreview}>
          {searchQuery}
        </div>

        {/* Refinement Options */}
        <div className={styles.refinementSection}>
          <Caption className={styles.refinementLabel}>
            Refine
          </Caption>
          <div className={styles.refinementList}>
            {getRefinementOptions(searchQuery).map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className={styles.refinementButton}
                onClick={() => handleRefineSearch(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={styles.resultsContent}>
        {isLoading ? (
          <div className={styles.loadingList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.loadingItem} />
            ))}
          </div>
        ) : (
          searchResults.map((result) => (
            <div
              key={result.id}
              className={styles.resultCard}
            >
              {/* Header */}
              <div className={styles.resultHeader}>
                <div className={styles.resultInfo}>
                  {getFileIcon(result.source.type)}
                  <div className={styles.resultDetails}>
                    <Title className={styles.resultTitle}>{result.title}</Title>
                    <div className={styles.resultMeta}>
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
                <div className={styles.resultConfidence}>
                  <div className={styles.confidenceBlock}>
                    <div className={styles.confidenceValue}>
                      {Math.round(result.confidenceScore * 100)}
                    </div>
                    <Caption className={styles.confidenceLabel}>
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
                    className={styles.contextToggle}
                    onClick={() =>
                      selectedContext.includes(result.id)
                        ? handleRemoveContext(result.id)
                        : handleAddContext(result.id)
                    }
                  >
                    {selectedContext.includes(result.id) ? (
                      <Minus className={styles.contextToggleIcon} />
                    ) : (
                      <Plus className={styles.contextToggleIcon} />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className={styles.preview}>
                {highlightText(
                  result.text || result.summary,
                  result.highlights || []
                )}
              </div>

              {/* Actions */}
              <div className={styles.resultFooter}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDocument(result)}
                  className={styles.openButton}
                >
                  Open
                  <ArrowUpRight className={styles.openIcon} />
                </Button>

                <div className={styles.feedbackGroup}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.feedbackButton}
                  >
                    <ThumbsUp className={styles.feedbackIcon} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.feedbackButton}
                  >
                    <ThumbsDown className={styles.feedbackIcon} />
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
