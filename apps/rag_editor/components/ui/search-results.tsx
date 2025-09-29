"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Title, Body, Caption, Micro } from "./typography";
import {
  FileText,
  MessageSquare,
  Lightbulb,
  ExternalLink,
  Clock,
  Zap,
  Globe,
  Hash,
} from "lucide-react";
import { Badge } from "./badge";
import { SearchResult as ApiSearchResult } from "@/lib/api-client";
import styles from "./search-results.module.scss";

interface SearchResult extends ApiSearchResult {
  // Keep compatibility with existing UI expectations
  title: string;
  type: "document" | "chat" | "insight" | "web";
  excerpt: string;
  confidence: number;
  lastModified?: string;
  highlights?: string[];
  path?: string;
}

interface SearchResultsProps {
  results: ApiSearchResult[];
  query: string;
  isLoading?: boolean;
  totalFound?: number;
  facets?: Record<string, unknown>;
  graphInsights?: {
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: string[];
    webResults?: number;
    chatSessions?: number;
    hasChatResults?: boolean;
  };
  className?: string;
  onResultClick?: (result: ApiSearchResult) => void;
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
];

export function SearchResults({
  results = [],
  query,
  isLoading = false,
  totalFound = 0,
  facets,
  graphInsights,
  className,
  onResultClick,
}: SearchResultsProps) {
  // Transform API results to UI format
  const transformedResults: SearchResult[] = results.map((result) => ({
    ...result,
    title:
      result.meta?.section ||
      result.text?.substring(0, 50) + "..." ||
      "Untitled",
    type:
      result.meta?.contentType === "chat_session"
        ? "chat"
        : result.source?.type === "web"
        ? "web"
        : result.meta?.contentType === "code"
        ? "document"
        : "document",
    excerpt:
      result.text?.substring(0, 200) +
        (result.text?.length > 200 ? "..." : "") || "",
    confidence: result.cosineSimilarity || 0.5,
    lastModified: result.meta?.updatedAt
      ? new Date(result.meta.updatedAt).toLocaleDateString()
      : result.meta?.createdAt
      ? new Date(result.meta.createdAt).toLocaleDateString()
      : undefined,
    highlights: [], // TODO: Extract highlights from search query
    path: result.meta?.uri || result.source?.url,
  }));

  const getIcon = (type: SearchResult["type"]) => {
    const iconProps = { className: "h-4 w-4" };
    switch (type) {
      case "document":
        return (
          <FileText className={cn(iconProps.className, styles.iconDocument)} />
        );
      case "chat":
        return (
          <MessageSquare className={cn(iconProps.className, styles.iconChat)} />
        );
      case "web":
        return <Globe className={cn(iconProps.className, styles.iconWeb)} />;
      case "insight":
        return (
          <Lightbulb className={cn(iconProps.className, styles.iconInsight)} />
        );
      default:
        return (
          <FileText className={cn(iconProps.className, styles.iconDefault)} />
        );
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return styles.high;
    if (confidence >= 0.8) return styles.medium;
    return styles.low;
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

  if (isLoading) {
    return (
      <div className={cn(styles.loadingContainer, className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.loadingSkeleton}>
            <div className={cn(styles.skeletonLine, styles.short)} />
            <div className={cn(styles.skeletonLine, styles.medium)} />
            <div className={cn(styles.skeletonLine, styles.long)} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(styles.searchResults, className)}>
      {/* Search Stats */}
      <div className={styles.searchStats}>
        <div className={styles.statsContent}>
          <Zap className={cn("h-4 w-4", styles.iconWorkspaceAccent)} />
          <Caption>
            Found {totalFound} results for "{query}" in 0.12s
          </Caption>
        </div>
        <Button variant="ghost" size="sm" className={styles.sortButton}>
          Sort by relevance
        </Button>
      </div>

      {/* Graph Insights */}
      {graphInsights &&
        (graphInsights.queryConcepts.length > 0 ||
          graphInsights.relatedConcepts.length > 0) && (
          <div className={styles.graphInsights}>
            <div className={styles.insightsHeader}>
              <Hash className={cn("h-4 w-4", styles.iconMutedForeground)} />
              <Caption className={cn(styles.headerText)}>
                Related Concepts
              </Caption>
            </div>
            <div className={styles.conceptsContainer}>
              {graphInsights.queryConcepts.slice(0, 5).map((concept, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(styles.conceptBadge)}
                >
                  {concept}
                </Badge>
              ))}
              {graphInsights.relatedConcepts
                .slice(0, 3)
                .map((concept, index) => (
                  <Badge
                    key={`related-${index}`}
                    variant="outline"
                    className={cn(styles.conceptBadge, styles.related)}
                  >
                    {concept}
                  </Badge>
                ))}
            </div>
          </div>
        )}

      {/* Results */}
      {transformedResults.map((result) => (
        <div
          key={result.id}
          className={cn(styles.resultCard, "group")}
          onClick={() => onResultClick?.(result)}
        >
          <div className={styles.resultHeader}>
            <div className={styles.resultMain}>
              <div className={styles.resultIcon}>{getIcon(result.type)}</div>
              <div className={styles.resultContent}>
                <Title className={cn(styles.resultTitle)}>{result.title}</Title>
                {result.path && (
                  <Caption className={styles.resultPath}>{result.path}</Caption>
                )}
              </div>
            </div>
            <div className={styles.resultActions}>
              <Badge
                variant="secondary"
                className={cn(
                  styles.confidenceBadge,
                  getConfidenceColor(result.confidence)
                )}
              >
                {Math.round(result.confidence * 100)}%
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className={styles.externalLinkButton}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Body
            className={cn(styles.resultExcerpt)}
            dangerouslySetInnerHTML={{
              __html: highlightText(result.excerpt, result.highlights),
            }}
          />

          <div className={styles.resultFooter}>
            <div className={styles.highlightsSection}>
              {result.highlights && result.highlights.length > 0 && (
                <>
                  <Micro className={styles.highlightsLabel}>Highlights:</Micro>
                  <div className={styles.highlightsContainer}>
                    {result.highlights.slice(0, 3).map((highlight, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={styles.highlightBadge}
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
            {result.lastModified && (
              <div className={styles.timestampSection}>
                <Clock className={styles.timestampIcon} />
                <Caption>{result.lastModified}</Caption>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
