"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
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
import styles from "./search-results.module.scss";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  className?: string;
  onResultClick?: (result: SearchResult) => void;
  onViewDocument?: (result: SearchResult) => void;
}

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
        return (
          <FileText className={cn(styles.resultIcon, styles.documentation)} />
        );
      case "component":
        return <FileText className={cn(styles.resultIcon, styles.component)} />;
      case "guideline":
        return (
          <Lightbulb className={cn(styles.resultIcon, styles.guideline)} />
        );
      case "note":
        return <MessageSquare className={cn(styles.resultIcon, styles.note)} />;
      case "article":
        return <FileText className={cn(styles.resultIcon, styles.article)} />;
      case "book":
        return <FileText className={cn(styles.resultIcon, styles.book)} />;
      case "conversation":
        return (
          <MessageSquare
            className={cn(styles.resultIcon, styles.conversation)}
          />
        );
      case "moc":
        return <Lightbulb className={cn(styles.resultIcon, styles.moc)} />;
      default:
        return <FileText className={styles.resultIcon} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return styles.high;
    if (confidence >= 0.8) return styles.medium;
    return styles.low;
  };

  const highlightText = (text: string, highlights: string[] = []): ReactNode => {
    if (!highlights.length) return text;

    const normalizedHighlights = highlights
      .filter((highlight) => highlight && highlight.trim().length > 0)
      .map((highlight) => highlight.toLowerCase());

    if (!normalizedHighlights.length) return text;

    const source = text.toLowerCase();
    const matches: Array<{ start: number; end: number }> = [];

    normalizedHighlights.forEach((highlight) => {
      let index = 0;
      while (index < source.length) {
        const foundIndex = source.indexOf(highlight, index);
        if (foundIndex === -1) break;
        matches.push({ start: foundIndex, end: foundIndex + highlight.length });
        index = foundIndex + highlight.length;
      }
    });

    if (!matches.length) return text;

    matches.sort((a, b) => a.start - b.start);

    const merged: Array<{ start: number; end: number }> = [];
    matches.forEach((match) => {
      const last = merged[merged.length - 1];
      if (last && match.start <= last.end) {
        last.end = Math.max(last.end, match.end);
      } else {
        merged.push({ ...match });
      }
    });

    const segments: ReactNode[] = [];
    let currentIndex = 0;

    merged.forEach((match, index) => {
      if (match.start > currentIndex) {
        segments.push(text.slice(currentIndex, match.start));
      }

      segments.push(
        <mark key={`${match.start}-${match.end}-${index}`}>
          {text.slice(match.start, match.end)}
        </mark>
      );

      currentIndex = match.end;
    });

    if (currentIndex < text.length) {
      segments.push(text.slice(currentIndex));
    }

    return segments;
  };

  const getHighlightsForDisplay = (result: SearchResult): string[] => {
    return result.highlights || [];
  };

  if (isLoading) {
    return (
      <div className={cn(styles.searchResults, className)}>
        <div className={styles.loadingState}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.loadingItem}>
              <div className={cn(styles.loadingLine, styles.size4x3quarter)} />
              <div className={cn(styles.loadingLine, styles.size3xFull)} />
              <div className={cn(styles.loadingLine, styles.size3x2quarter)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className={cn(styles.searchResults, className)}>
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>No results found for "{query}"</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.searchResults, className)}>
      {/* Search Stats */}
      <div className={styles.searchStats}>
        <div className={styles.statsInfo}>
          <Zap className={styles.statsIcon} />
          <Caption className={styles.statsText}>
            Found {results.length} results for "{query}" in 0.12s
          </Caption>
        </div>
        <Button variant="ghost" size="sm" className={styles.sortButton}>
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
            className={styles.resultItem}
            onClick={() => onResultClick?.(result)}
          >
            <div className={styles.resultHeader}>
              <div className={styles.resultInfo}>
                {getIcon(result.source.type)}
                <div className={styles.resultDetails}>
                  <Title className={styles.resultTitle}>{result.title}</Title>
                  <Caption className={styles.resultPath}>
                    {result.source.path}
                  </Caption>
                </div>
              </div>
              <div className={styles.resultActions}>
                <Badge
                  variant="secondary"
                  className={cn(
                    styles.confidenceBadge,
                    getConfidenceColor(result.confidenceScore)
                  )}
                >
                  {Math.round(result.confidenceScore * 100)}%
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.viewButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocument?.(result);
                  }}
                >
                  <FileText className={styles.size3x3} />
                </Button>
              </div>
            </div>

            <div className={styles.resultContent}>
              {highlightText(displayText, highlights)}
            </div>

            <div className={styles.resultFooter}>
              <div className={styles.resultMetadata}>
                {highlights.length > 0 && (
                  <div className={styles.metadataSection}>
                    <Micro className={styles.metadataLabel}>Highlights:</Micro>
                    <div className={styles.badgeList}>
                      {highlights.slice(0, 3).map((highlight, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className={styles.textXs}
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div className={styles.metadataSection}>
                    <Micro className={styles.metadataLabel}>Tags:</Micro>
                    <div className={styles.badgeList}>
                      {result.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className={styles.textXs}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {result.lastUpdated && (
                <div className={styles.resultDate}>
                  <Clock className={styles.size3x3} />
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
