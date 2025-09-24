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
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import {
  ExplanationService,
  type ResultExplanation,
} from "../lib/explanation-service";

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

interface ResultCardProps {
  result: SearchResult;
  index: number;
  query: string;
  isSelected?: boolean;
  onViewDocument: (url: string) => void;
  onSelectResult: (result: SearchResult) => void;
  onAskFollowUp: (question: string, context: SearchResult) => void;
  onRefineSearch: (refinedQuery: string) => void;
}

// Use the explanation service types

export function ResultCard({
  result,
  index,
  query,
  isSelected = false,
  onViewDocument,
  onSelectResult,
  onAskFollowUp,
  onRefineSearch,
}: ResultCardProps) {
  const [explanation, setExplanation] = useState<ResultExplanation | null>(
    null
  );
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Generate LLM explanation for why this result matches
  const generateExplanation = async () => {
    if (explanation || isLoadingExplanation) return;

    setIsLoadingExplanation(true);

    try {
      const explanationService = ExplanationService.getInstance();
      const resultExplanation = await explanationService.explainResult(
        result,
        query,
        { totalResults: 10, rank: index + 1 }
      );

      setExplanation(resultExplanation);
    } catch (error) {
      console.error("Failed to generate explanation:", error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  // Load explanation when card becomes visible
  useEffect(() => {
    const timer = setTimeout(() => {
      generateExplanation();
    }, index * 500); // Stagger loading

    return () => clearTimeout(timer);
  }, [index]);

  // Helper functions for UI interactions

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "component":
        return "🧩";
      case "guideline":
        return "📋";
      default:
        return "📖";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
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
        '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  };

  const contentPreview = result.text || result.summary;
  const truncatedContent =
    contentPreview.length > 300
      ? contentPreview.substring(0, 300) + "..."
      : contentPreview;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Card
        className={`hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? "border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-500/20 dark:ring-blue-400/20"
            : "border-border/50 hover:border-border group-hover:shadow-md"
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg flex-shrink-0">
                  {getSourceIcon(result.source.type)}
                </span>
                <h4 className="font-medium line-clamp-1 text-base">
                  {result.title}
                </h4>
                <Badge
                  variant="outline"
                  className="ml-auto flex-shrink-0 text-xs"
                >
                  #{index + 1}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span className={getConfidenceColor(result.confidenceScore)}>
                    {Math.round(result.confidenceScore * 100)}% match
                  </span>
                </div>

                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {result.meta?.contentType || result.source.type}
                  </Badge>
                  {result.meta?.section && (
                    <Badge variant="outline" className="text-xs">
                      {result.meta.section}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground truncate">
                📍 {result.source.path}
              </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocument(result.source.url);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className="space-y-4"
          onClick={() => onSelectResult(result)}
        >
          {/* Content Preview with Highlighting */}
          <div className="space-y-3">
            <div className="relative">
              <div
                className="text-sm leading-relaxed bg-muted/30 p-3 rounded-lg border-l-4 border-blue-500/30"
                dangerouslySetInnerHTML={{
                  __html: highlightText(
                    showFullContent ? contentPreview : truncatedContent,
                    query
                  ),
                }}
              />

              {contentPreview.length > 300 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullContent(!showFullContent);
                  }}
                  className="mt-2 text-xs h-6"
                >
                  {showFullContent ? "Show less" : "Show more"}
                  <ChevronRight
                    className={`w-3 h-3 ml-1 transition-transform ${
                      showFullContent ? "rotate-90" : ""
                    }`}
                  />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyText(contentPreview);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>

              {copiedText === contentPreview && (
                <div className="absolute top-2 right-10 text-xs text-green-600 dark:text-green-400">
                  Copied!
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* LLM-Powered Explanation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Why this matches</span>
              {isLoadingExplanation && (
                <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>

            {isLoadingExplanation ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : explanation ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {explanation.whyMatches}
                </p>

                {explanation.keyInsights.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium">Key insights:</span>
                    </div>
                    <ul className="space-y-1">
                      {explanation.keyInsights.map((insight, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {result.rationale}
              </p>
            )}
          </div>

          <Separator />

          {/* Follow-up Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Quick actions</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {explanation?.suggestedFollowUps
                .slice(0, 2)
                .map((followUp, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskFollowUp(followUp, result);
                    }}
                    className="justify-start text-xs h-8 text-left"
                  >
                    <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{followUp}</span>
                  </Button>
                )) || (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskFollowUp(
                        `Tell me more about ${result.title}`,
                        result
                      );
                    }}
                    className="justify-start text-xs h-8"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Ask more
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefineSearch(
                        `${query} ${result.meta?.section || result.title}`
                      );
                    }}
                    className="justify-start text-xs h-8"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    Refine
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex gap-1">
              {result.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{result.tags.length - 2}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {result.lastUpdated}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectResult(result);
                }}
                className="h-6 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
