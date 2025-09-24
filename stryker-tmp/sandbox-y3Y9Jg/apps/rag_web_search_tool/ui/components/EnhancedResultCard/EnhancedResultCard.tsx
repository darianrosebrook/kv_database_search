// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ExternalLink,
  Star,
  ChevronRight,
  MessageSquare,
  Search,
  Lightbulb,
  Copy,
  RefreshCw,
  ArrowRight,
  Quote,
  Sparkles,
  Eye,
  BookOpen,
} from "lucide-react";
import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../Button";
import { Card, CardContent, CardHeader } from "../../../src/components/ui/card";
import { Skeleton } from "../../../src/components/ui/skeleton";
import { Separator } from "../../../src/components/ui/separator";
import {
  ExplanationService,
  type ResultExplanation,
} from "../../../src/lib/explanation-service";
import styles from "./EnhancedResultCard.module.scss";

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  confidenceScore: number;
  source: {
    type: "documentation" | "component" | "guideline";
    path: string;
    url: string;
  };
  rationale: string;
  tags: string[];
  lastUpdated: string;
  // Additional data from the actual API
  text?: string;
  meta?: {
    contentType: string;
    section: string;
    breadcrumbs: string[];
    uri?: string;
  };
}

interface EnhancedResultCardProps {
  result: SearchResult;
  index: number;
  query: string;
  isSelected: boolean;
  onSelect: (result: SearchResult) => void;
  onAddToContext: (result: SearchResult) => void;
  className?: string;
}

export function EnhancedResultCard({
  result,
  index,
  query,
  isSelected,
  onSelect,
  onAddToContext,
  className = "",
}: EnhancedResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [explanation, setExplanation] = useState<ResultExplanation | null>(
    null
  );
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const explanationService = new ExplanationService();

  useEffect(() => {
    if (isExpanded && !explanation && !isLoadingExplanation) {
      loadExplanation();
    }
  }, [isExpanded]);

  const loadExplanation = async () => {
    setIsLoadingExplanation(true);
    try {
      const exp = await explanationService.explainResult(result, query);
      setExplanation(exp);
    } catch (error) {
      console.error("Failed to load explanation:", error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "documentation":
        return "📚";
      case "component":
        return "🧩";
      case "guideline":
        return "📋";
      default:
        return "📖";
    }
  };

  const getConfidenceLevel = (score: number): "high" | "medium" | "low" => {
    if (score >= 0.8) return "high";
    if (score >= 0.6) return "medium";
    return "low";
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const queryWords = query
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2);
    let highlightedText = text;

    queryWords.forEach((word) => {
      const regex = new RegExp(`(${word})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<span class="' + styles.highlight + '">$1</span>'
      );
    });

    return highlightedText;
  };

  const contentPreview = result.text || result.summary;
  const truncatedContent =
    contentPreview.length > 300
      ? contentPreview.substring(0, 300) + "..."
      : contentPreview;

  const confidenceLevel = getConfidenceLevel(result.confidenceScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`${styles.enhancedResultCard} ${className}`}
    >
      <Card
        className={`${styles.card} ${isSelected ? styles.selected : ""}`}
        onClick={() => onSelect(result)}
      >
        <CardHeader className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.sourceIcon}>
              {getSourceIcon(result.source.type)}
            </span>
            <h3 className={styles.title}>{result.title}</h3>
            <Badge variant="secondary" className={styles.badge}>
              {Math.round(result.confidenceScore * 100)}%
            </Badge>
          </div>

          <div className={styles.metadata}>
            <div
              className={`${styles.confidenceScore} ${styles[confidenceLevel]}`}
            >
              <Star className={styles.confidenceIcon} />
              <span>{Math.round(result.confidenceScore * 100)}%</span>
            </div>

            <div className={styles.badgeGroup}>
              <Badge variant="outline" size="sm">
                {result.source.type}
              </Badge>
              {result.meta?.section && (
                <Badge variant="outline" size="sm">
                  {result.meta.section}
                </Badge>
              )}
            </div>

            <span className={styles.pathText}>{result.source.path}</span>

            <Button
              variant="ghost"
              size="sm"
              className={`${styles.actionButton} ${
                isSelected ? styles.visible : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToContext(result);
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className={styles.content}>
          <div className={styles.contentPreview}>
            <div className={styles.previewBox}>
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightText(truncatedContent, query),
                }}
              />

              <Button
                variant="ghost"
                size="sm"
                className={`${styles.copyButton} ${
                  isSelected ? styles.visible : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(contentPreview, "content");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>

              {copiedText === "content" && (
                <span className={styles.copiedIndicator}>Copied!</span>
              )}
            </div>

            {contentPreview.length > 300 && (
              <Button
                variant="ghost"
                size="sm"
                className={styles.expandButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? "Show Less" : "Show More"}
                <ChevronRight
                  className={`w-4 h-4 ml-1 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </Button>
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.separator} />

                {isLoadingExplanation ? (
                  <div className={styles.skeleton}>
                    <Skeleton className={`${styles.skeletonLine} w-full`} />
                    <Skeleton className={`${styles.skeletonLine} w-3/4`} />
                    <Skeleton className={`${styles.skeletonLine} w-1/2`} />
                  </div>
                ) : explanation ? (
                  <div className={styles.explanation}>
                    <div className={styles.explanationHeader}>
                      <Lightbulb className={styles.explanationIcon} />
                      <h4 className={styles.explanationTitle}>
                        Why this result matches
                      </h4>
                    </div>

                    <div className={styles.explanationContent}>
                      <p className={styles.explanationText}>
                        {explanation.reasoning}
                      </p>

                      {explanation.keyInsights.length > 0 && (
                        <div className={styles.insights}>
                          <div className={styles.insightsHeader}>
                            <Sparkles className={styles.insightsIcon} />
                            <span className={styles.insightsTitle}>
                              Key Insights
                            </span>
                          </div>
                          <div className={styles.insightsList}>
                            {explanation.keyInsights.map((insight, idx) => (
                              <div key={idx} className={styles.insightItem}>
                                <span className={styles.insightBullet}>•</span>
                                <span>{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {explanation.suggestedActions.length > 0 && (
                        <div className={styles.actions}>
                          <div className={styles.actionsHeader}>
                            <ArrowRight className={styles.actionsIcon} />
                            <span className={styles.actionsTitle}>
                              Suggested Actions
                            </span>
                          </div>
                          <div className={styles.actionsGrid}>
                            {explanation.suggestedActions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className={styles.actionButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle action
                                }}
                              >
                                <Search className={styles.actionIcon} />
                                {action}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {(result.tags.length > 0 || result.lastUpdated) && (
          <>
            <Separator />
            <div className={styles.footer}>
              <div className={styles.footerContent}>
                <div className={styles.tagGroup}>
                  {result.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      size="sm"
                      className={styles.tag}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {result.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className={styles.tagOverflow}
                    >
                      +{result.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className={styles.footerMeta}>
                  {result.lastUpdated && (
                    <span className={styles.lastUpdated}>
                      Updated{" "}
                      {new Date(result.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.viewButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(result.source.url, "_blank");
                    }}
                  >
                    <Eye className={styles.viewButtonIcon} />
                    View
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}

export type { EnhancedResultCardProps };
export default EnhancedResultCard;
