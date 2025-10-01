"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
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
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./rag-search-results.module.scss";

interface RAGSearchResultsProps {
  query?: string;
  onQueryChange?: (query: string) => void;
  onViewDocument?: (result: any) => void;
}

export function RAGSearchResults({
  query: initialQuery = "quarterly revenue growth",
  onQueryChange,
  onViewDocument,
}: RAGSearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // TODO: Replace with actual search results from backend
  const searchResultsData: any[] = [];

  // TODO: Replace with actual refinement options from backend
  const refinementOptions: string[] = [];

  useEffect(() => {
    setResults([]);
    setAnimationComplete(false);
    const timer = setTimeout(() => {
      setResults(searchResultsData);
      setTimeout(() => setAnimationComplete(true), 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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

  const highlightText = (
    text: string,
    highlights: Array<{ start: number; end: number }> = []
  ): ReactNode => {
    if (!highlights?.length) return text;

    const segments: ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach(({ start, end }, index) => {
      const boundedStart = Math.max(0, start);
      const boundedEnd = Math.min(text.length, end);

      if (boundedStart > lastIndex) {
        segments.push(text.slice(lastIndex, boundedStart));
      }

      segments.push(
        <mark key={`${boundedStart}-${boundedEnd}-${index}`} className={styles.highlight}>
          {text.slice(boundedStart, boundedEnd)}
        </mark>
      );

      lastIndex = boundedEnd;
    });

    if (lastIndex < text.length) {
      segments.push(text.slice(lastIndex));
    }

    return segments;
  };

  const handleFeedback = (resultId: string | number, type: string) => {
    const key = String(resultId);
    setFeedback((prev) => ({
      ...prev,
      [key]: type,
    }));
  };

  const handleRefine = (refinement: string) => {
    const newQuery = `${query} ${refinement}`;
    setQuery(newQuery);
    onQueryChange?.(newQuery);
  };

  const openDocument = (result: any) => {
    onViewDocument?.(result);
  };

  return (
    <div className={cn(styles.searchResults, isDarkMode && styles.dark)}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Search Results</h1>
            <div className={styles.headerStats}>
              <span className={styles.statItem}>
                <Zap className={styles.statIcon} />
                {results.length} results
              </span>
              <span className={styles.statItem}>
                <Clock className={styles.statIcon} />
                0.34s
              </span>
              <button
                type="button"
                className={styles.themeToggle}
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? (
                  <Sun className={styles.themeIcon} />
                ) : (
                  <Moon className={styles.themeIcon} />
                )}
              </button>
            </div>
          </div>
          <div className={styles.queryText}>{query}</div>
        </div>

        {/* Refinement Options */}
        {animationComplete && refinementOptions.length > 0 && (
          <div className={styles.refineSection}>
            <div className={styles.refineLabel}>Refine</div>
            <div className={styles.refineOptions}>
              {refinementOptions.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.refineButton}
                  onClick={() => handleRefine(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className={styles.resultsList}>
          {results.map((result, idx) => {
            const feedbackKey = String(result.id);

            return (
              <div
                key={result.id ?? idx}
                className={styles.resultWrapper}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={styles.resultCard}>
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <div className={styles.headerInfo}>
                        {getFileIcon(result.type)}
                        <div className={styles.cardDetails}>
                          <h3 className={styles.cardTitle}>{result.title}</h3>
                          <div className={styles.cardMeta}>
                            {result.metadata?.author && <span>{result.metadata.author}</span>}
                            {result.metadata?.author && result.metadata?.date && <span>·</span>}
                            {result.metadata?.date && <span>{result.metadata.date}</span>}
                            {(result.metadata?.author || result.metadata?.date) &&
                              result.metadata?.path && <span>·</span>}
                            {result.metadata?.path && <span>{result.metadata.path}</span>}
                          </div>
                        </div>
                      </div>

                      <div className={styles.confidence}>
                        <div>
                          <div className={styles.confidenceValue}>
                            {(result.confidence * 100).toFixed(0)}
                          </div>
                          <div className={styles.confidenceLabel}>Match</div>
                        </div>
                        <div className={styles.confidenceBar} />
                      </div>
                    </div>

                    <div className={styles.preview}>
                      {highlightText(result.preview ?? "", result.highlights ?? [])}
                    </div>

                    <div className={styles.metadata}>
                      {Object.entries(result.metadata ?? {})
                        .filter(([key]) => !["author", "date", "path"].includes(key))
                        .map(([key, value]) => (
                          <span key={key} className={styles.metadataTag}>
                            {key}: {String(value)}
                          </span>
                        ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.openButton}
                        onClick={() => openDocument(result)}
                      >
                        Open
                        <ArrowUpRight className={styles.openIcon} />
                      </button>

                      <div className={styles.feedbackGroup}>
                        <button
                          type="button"
                          className={cn(
                            styles.feedbackButton,
                            feedback[feedbackKey] === "up" && styles.feedbackActiveUp
                          )}
                          onClick={() => handleFeedback(result.id, "up")}
                        >
                          <ThumbsUp className={styles.feedbackIcon} />
                        </button>
                        <button
                          type="button"
                          className={cn(
                            styles.feedbackButton,
                            feedback[feedbackKey] === "down" && styles.feedbackActiveDown
                          )}
                          onClick={() => handleFeedback(result.id, "down")}
                        >
                          <ThumbsDown className={styles.feedbackIcon} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RAGSearchResults;
