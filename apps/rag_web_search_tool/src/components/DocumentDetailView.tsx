import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  ExternalLink,
  Clock,
  Tag,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { apiService } from "../lib/api";

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
  text?: string; // Full document text
}

interface DocumentDetailViewProps {
  result: SearchResult;
  query: string;
  onBack: () => void;
  onAddToContext: (result: SearchResult) => void;
}

interface DocumentSummary {
  overview: string;
  keyPoints: string[];
  relevantSections: string[];
  usageGuidelines?: string[];
  relatedComponents?: string[];
}

export function DocumentDetailView({
  result,
  query,
  onBack,
  onAddToContext,
}: DocumentDetailViewProps) {
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [fullText, setFullText] = useState<string>("");
  const [isLoadingText, setIsLoadingText] = useState(true);

  useEffect(() => {
    generateDocumentSummary();
    loadFullDocumentText();
  }, [result.id]);

  const generateDocumentSummary = async () => {
    setIsLoadingSummary(true);
    try {
      // Call LLM to generate a comprehensive summary
      const response = await apiService.chat(
        `Analyze this document and provide a comprehensive summary. Focus on:
        1. Overview of what this document covers
        2. Key points and main concepts
        3. Relevant sections for the query "${query}"
        4. Usage guidelines if applicable
        5. Related components or concepts mentioned
        
        Document: ${result.title}
        Content: ${result.summary}
        
        Provide a structured response with clear sections.`,
        {
          searchResults: [result],
          originalQuery: query,
        }
      );

      // Parse the response into structured summary
      const summaryData = parseDocumentSummary(response.response);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to generate document summary:", error);
      // Fallback summary
      setSummary({
        overview: result.summary,
        keyPoints: result.highlights,
        relevantSections: [result.title],
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadFullDocumentText = async () => {
    setIsLoadingText(true);
    try {
      // In a real implementation, this would fetch the full document
      // For now, we'll use the available text or simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFullText(
        result.text ||
          result.summary + "\n\n[Full document content would be loaded here...]"
      );
    } catch (error) {
      console.error("Failed to load full document:", error);
      setFullText(result.summary);
    } finally {
      setIsLoadingText(false);
    }
  };

  const parseDocumentSummary = (response: string): DocumentSummary => {
    // Simple parsing - in production, this could be more sophisticated
    const lines = response.split("\n").filter((line) => line.trim());

    return {
      overview:
        lines
          .find((line) => line.includes("overview") || line.includes("covers"))
          ?.replace(/^\d+\.\s*/, "") ||
        lines[0] ||
        result.summary,
      keyPoints: lines
        .filter((line) => line.includes("•") || line.match(/^\d+\./))
        .map((line) => line.replace(/^[\d\.\s•-]+/, "").trim())
        .slice(0, 5),
      relevantSections: [result.title],
      usageGuidelines: lines
        .filter(
          (line) =>
            line.toLowerCase().includes("usage") ||
            line.toLowerCase().includes("guideline")
        )
        .map((line) => line.replace(/^[\d\.\s•-]+/, "").trim()),
    };
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full bg-card border border-border rounded-xl shadow-sm flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSourceIcon(result.source.type)}</span>
            <h3 className="font-semibold line-clamp-1">{result.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Badge variant="outline">
            {Math.round(result.confidenceScore * 100)}% match
          </Badge>
          <span>•</span>
          <span>{result.source.path}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{result.lastUpdated}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddToContext(result)}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Add to Context
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(result.source.url, "_blank")}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Original
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* AI-Generated Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h4 className="font-medium">AI Summary</h4>
            </div>

            {isLoadingSummary ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing document...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Overview</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary.overview}
                  </p>
                </div>

                {summary.keyPoints.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Key Points</h5>
                    <ul className="space-y-1">
                      {summary.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.usageGuidelines &&
                  summary.usageGuidelines.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">
                        Usage Guidelines
                      </h5>
                      <ul className="space-y-1">
                        {summary.usageGuidelines.map((guideline, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-green-500 mt-1">•</span>
                            <span>{guideline}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : null}
          </div>

          {/* Search Relevance */}
          <div>
            <h4 className="font-medium mb-3">Search Relevance</h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Why this matches your query
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.rationale}
              </p>
            </div>
          </div>

          {/* Highlights */}
          <div>
            <h4 className="font-medium mb-3">Key Highlights</h4>
            <div className="space-y-2">
              {result.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 p-3 rounded-r"
                >
                  <p className="text-sm">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {result.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Full Content Preview */}
          <div>
            <h4 className="font-medium mb-3">Document Content</h4>
            {isLoadingText ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/6" />
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {fullText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}




