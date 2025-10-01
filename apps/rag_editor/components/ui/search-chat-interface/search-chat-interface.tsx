"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { Button } from "../button";
import { Title, Body, Caption } from "../typography";
import {
  Send,
  Paperclip,
  Mic,
  ChevronDown,
  Sparkles,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dictionaryClient } from "@/lib/services/dictionary-client";
import { getModels } from "@/lib/api";
import styles from "./search-chat-interface.module.scss";

interface SearchChatInterfaceProps {
  searchQuery?: string;
  searchResults?: any[];
  onAddContext?: (resultId: string) => void;
  onRemoveContext?: (resultId: string) => void;
  selectedContext?: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

// Function to generate intelligent refinement suggestions using dictionary service
function useSuggestedRefinements(searchQuery: string, searchResults: any[]) {
  const [refinements, setRefinements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (!searchQuery.trim()) {
        setRefinements([]);
        return;
      }

      setIsLoading(true);
      try {
        const suggestions = await generateIntelligentRefinements(
          searchQuery,
          searchResults
        );
        setRefinements(suggestions);
      } catch (error) {
        console.error("Failed to generate refinement suggestions:", error);
        // Fallback to generic suggestions
        setRefinements([
          "Show me more details",
          "Include related topics",
          "Focus on recent information",
          "Compare with alternatives",
          "Show examples",
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [searchQuery, searchResults]);

  return { refinements, isLoading };
}

// Generate intelligent refinement suggestions using dictionary service
async function generateIntelligentRefinements(
  searchQuery: string,
  searchResults: any[]
): Promise<string[]> {
  const suggestions: string[] = [];
  const keyTerms = extractKeyTerms(searchQuery);

  // Get dictionary expansions for key terms
  const dictionarySuggestions = await getDictionaryBasedSuggestions(keyTerms);

  // Get context-based suggestions from search results
  const contextSuggestions = getContextBasedSuggestions(
    searchQuery,
    searchResults
  );

  // Combine and deduplicate suggestions
  const allSuggestions = [...dictionarySuggestions, ...contextSuggestions];
  const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 6);

  return uniqueSuggestions.length > 0
    ? uniqueSuggestions
    : [
        "Show more details",
        "Include related topics",
        "Focus on recent information",
        "Compare with alternatives",
        "Show examples",
      ];
}

// Extract key terms from search query
function extractKeyTerms(query: string): string[] {
  // Simple extraction: split by spaces and filter out common words
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "how",
    "what",
    "when",
    "where",
    "why",
    "who",
  ]);

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word))
    .slice(0, 3); // Limit to top 3 terms
}

// Get dictionary-based suggestions
async function getDictionaryBasedSuggestions(
  keyTerms: string[]
): Promise<string[]> {
  const suggestions: string[] = [];

  for (const term of keyTerms) {
    try {
      // Expand the term using dictionary service
      const expansions = await dictionaryClient.expandSearchTerms({
        queryTerms: [term],
        expansionTypes: ["synonyms", "hypernyms"],
        maxExpansionsPerTerm: 2,
      });

      // Generate suggestions based on expansions
      const expandedTerms = expansions.flatMap((expansion) =>
        expansion.expandedTerms.slice(0, 2)
      );

      for (const expandedTerm of expandedTerms) {
        suggestions.push(`Include ${expandedTerm}`);
        suggestions.push(`Focus on ${expandedTerm}`);
        suggestions.push(`Compare with ${expandedTerm}`);
      }
    } catch (error) {
      console.warn(`Failed to expand term "${term}":`, error);
    }
  }

  return suggestions;
}

// Get context-based suggestions from search results
function getContextBasedSuggestions(
  query: string,
  searchResults: any[]
): string[] {
  const suggestions: string[] = [];

  if (searchResults.length === 0) {
    return suggestions;
  }

  // Analyze result types and content for contextual suggestions
  const hasDocuments = searchResults.some(
    (result) => result.source?.type === "document" || result.type === "document"
  );
  const hasCode = searchResults.some(
    (result) =>
      result.source?.type === "code" ||
      result.content?.includes("function") ||
      result.content?.includes("class")
  );
  const hasMetrics = searchResults.some(
    (result) =>
      result.content?.match(/\d+(\.\d+)?%/) ||
      result.content?.includes("metric")
  );

  // Add contextual suggestions based on result types
  if (hasDocuments) {
    suggestions.push("Show document sources");
    suggestions.push("Include file metadata");
  }

  if (hasCode) {
    suggestions.push("Show code examples");
    suggestions.push("Include implementation details");
  }

  if (hasMetrics) {
    suggestions.push("Show performance metrics");
    suggestions.push("Include trend analysis");
  }

  // Add temporal suggestions
  const currentYear = new Date().getFullYear();
  suggestions.push(`Focus on ${currentYear} data`);
  suggestions.push("Show recent updates");
  suggestions.push("Include historical context");

  return suggestions;
}

export function SearchChatInterface({
  searchQuery = "",
  searchResults = [],
  onAddContext,
  onRemoveContext,
  selectedContext = [],
}: SearchChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Generate intelligent refinement suggestions
  const { refinements: suggestedRefinements, isLoading: isLoadingRefinements } =
    useSuggestedRefinements(searchQuery, searchResults);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [welcomeInitialized, setWelcomeInitialized] = useState(false);

  // Load available models from Ollama
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await getModels();
        if (response.models.length > 0 && !selectedModel) {
          setSelectedModel(response.models[0].name);
        }
      } catch (err) {
        console.error("Failed to load models:", err);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    if (searchQuery && !welcomeInitialized && searchResults.length > 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `I found ${searchResults.length} documents related to "${searchQuery}". I can help you analyze these results, answer questions about the content, or help you refine your search. What would you like to know?`,
          timestamp: new Date(),
          sources: searchResults.slice(0, 3).map((r) => r.title),
        },
      ]);
      setWelcomeInitialized(true);
    }
  }, [searchQuery, searchResults, welcomeInitialized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on the search results for "${searchQuery}", I can see that ${
          selectedContext.length
        } documents are currently selected as context. ${
          inputValue.includes("revenue")
            ? "The financial documents show strong quarterly growth trends with revenue increasing 23% year-over-year."
            : "Let me analyze the available documents to provide you with relevant insights."
        }`,
        timestamp: new Date(),
        sources: searchResults
          .filter((r) => selectedContext.includes(r.id))
          .map((r) => r.title)
          .slice(0, 2),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedRefinement = (refinement: string) => {
    setInputValue(refinement);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Title className={styles.title}>AI Assistant</Title>
          <div className={styles.modelGroup}>
            <Button variant="outline" size="sm" className={styles.modelButton}>
              <ChevronDown className={styles.modelIcon} />
              {selectedModel.toUpperCase()}
            </Button>
          </div>
        </div>

        {/* Context Status */}
        {selectedContext.length > 0 && (
          <div className={styles.contextInfo}>
            <div className={styles.contextBadge}>
              <FileText className={styles.contextIcon} />
              <span>{selectedContext.length} documents as context</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              styles.messageRow,
              message.role === "user" && styles.messageRowUser
            )}
          >
            {message.role === "assistant" && (
              <div className={styles.avatar}>
                <Sparkles className={styles.avatarIcon} />
              </div>
            )}

            <div
              className={cn(
                styles.messageContent,
                message.role === "user" && styles.messageContentUser
              )}
            >
              <div
                className={cn(
                  styles.bubble,
                  message.role === "user" && styles.bubbleUser
                )}
              >
                <Body className={styles.messageText}>{message.content}</Body>
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className={styles.sourceList}>
                  {message.sources.map((source, idx) => (
                    <Caption key={idx} className={styles.sourceBadge}>
                      {source}
                    </Caption>
                  ))}
                </div>
              )}

              <Caption className={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Caption>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={styles.typingRow}>
            <div className={cn(styles.avatar, styles.avatarPulse)}>
              <Sparkles className={styles.avatarIcon} />
            </div>
            <div className={styles.typingBubble}>
              <div className={styles.typingDots}>
                <div className={styles.dot} />
                <div className={styles.dot} />
                <div className={styles.dot} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Refinements */}
      {messages.length <= 1 && (
        <div className={styles.refinementSection}>
          <Caption className={styles.refinementLabel}>
            Suggested questions:
          </Caption>
          <div className={styles.refinementList}>
            {isLoadingRefinements ? (
              // Loading state
              <div className={styles.refinementSkeleton}>
                <div className={styles.refinementDot} />
                <div className={styles.refinementDot} />
                <div className={styles.refinementDot} />
                <span>Generating suggestions...</span>
              </div>
            ) : (
              // Render suggestions
              suggestedRefinements.map((refinement, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className={styles.refinementButton}
                  onClick={() => handleSuggestedRefinement(refinement)}
                >
                  {refinement}
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask questions about your search results or request refinements..."
            className={styles.inputField}
            rows={1}
          />
          <div className={styles.inputActions}>
            <Button variant="ghost" size="sm" className={styles.actionButton}>
              <Paperclip className={styles.actionIcon} />
            </Button>
            <Button variant="ghost" size="sm" className={styles.actionButton}>
              <Mic className={styles.actionIcon} />
            </Button>
            <Button
              size="sm"
              className={styles.actionButton}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className={styles.actionIcon} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
