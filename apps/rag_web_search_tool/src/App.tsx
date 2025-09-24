import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SearchInput } from "../ui/components/SearchInput";
import { ChatInterface } from "../ui/components/ChatInterface";
import { ResultsPanel } from "./components/ResultsPanel";
import { ModelSelector } from "../ui/components/ModelSelector";
import { ChatHistory } from "../ui/components/ChatHistory";
import {
  apiService,
  SearchResult as ApiSearchResult,
  SearchResponse,
} from "./lib/api";
import { EnhancedChatService } from "./lib/enhanced-chat";
import { TestIntegration } from "./test-integration";

// UI SearchResult interface for the components
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
}

interface Message {
  id: string;
  type: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  messageCount: number;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null
  );
  const [contextResults, setContextResults] = useState<SearchResult[]>([]);
  const [showTestMode, setShowTestMode] = useState(false);
  const [chatContext, setChatContext] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [suggestedActions, setSuggestedActions] = useState<
    Array<{
      type: "refine_search" | "new_search" | "filter" | "explore";
      label: string;
      query?: string;
      filters?: any;
    }>
  >([]);
  const [searchStartTime, setSearchStartTime] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<string>("llama3.1");
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );

  // Calculate composite confidence score from multiple factors
  const calculateCompositeScore = (result: any): number => {
    let score = 0;
    let weightSum = 0;

    // Semantic similarity (40% weight)
    if (result.cosineSimilarity !== undefined) {
      const semanticScore = Math.min(1.0, result.cosineSimilarity / 2); // Normalize to 0-1
      score += semanticScore * 0.4;
      weightSum += 0.4;
    }

    // Content type relevance (20% weight)
    if (result.contentType) {
      const contentScore =
        result.contentType === "code"
          ? 0.9
          : result.contentType === "text"
          ? 0.7
          : result.contentType === "table"
          ? 0.8
          : 0.6;
      score += contentScore * 0.2;
      weightSum += 0.2;
    }

    // Modality scores (20% weight)
    if (result.modalityScores) {
      const modalityAvg =
        result.modalityScores.text * 0.3 +
        result.modalityScores.code * 0.3 +
        result.modalityScores.visual * 0.2 +
        result.modalityScores.semantic * 0.2;
      score += modalityAvg * 0.2;
      weightSum += 0.2;
    }

    // Metadata quality (10% weight)
    if (result.metadata) {
      let metadataScore = 0;
      if (result.metadata.language && result.metadata.language !== "unknown")
        metadataScore += 0.3;
      if (result.metadata.technicalLevel) metadataScore += 0.3;
      if (result.metadata.readabilityScore) metadataScore += 0.4;
      score += metadataScore * 0.1;
      weightSum += 0.1;
    }

    // Graph context bonus (10% weight)
    if (result.graphContext) {
      score += 0.1;
      weightSum += 0.1;
    }

    return weightSum > 0 ? score / weightSum : result.cosineSimilarity || 0;
  };

  // Generate detailed rationale with multiple scoring factors
  const generateDetailedRationale = (result: any): string => {
    const factors: string[] = [];

    // Semantic similarity
    if (result.cosineSimilarity) {
      factors.push(
        `semantic similarity: ${(result.cosineSimilarity * 100).toFixed(1)}%`
      );
    }

    // Content type
    if (result.contentType) {
      factors.push(`content type: ${result.contentType}`);
    }

    // Modality scores
    if (result.modalityScores) {
      const modalityDetails: string[] = [];
      if (result.modalityScores.text > 0.5)
        modalityDetails.push("text-focused");
      if (result.modalityScores.code > 0.5)
        modalityDetails.push("code-focused");
      if (result.modalityScores.visual > 0.5)
        modalityDetails.push("visual-focused");
      if (result.modalityScores.semantic > 0.8)
        modalityDetails.push("high semantic match");

      if (modalityDetails.length > 0) {
        factors.push(`modality: ${modalityDetails.join(", ")}`);
      }
    }

    // Metadata insights
    if (result.metadata) {
      if (result.metadata.language && result.metadata.language !== "unknown") {
        factors.push(`language: ${result.metadata.language}`);
      }
      if (result.metadata.technicalLevel) {
        factors.push(`level: ${result.metadata.technicalLevel}`);
      }
      if (result.metadata.readabilityScore) {
        factors.push(
          `readability: ${(result.metadata.readabilityScore * 100).toFixed(0)}%`
        );
      }
    }

    // Graph context
    if (result.graphContext) {
      factors.push("graph-enhanced context");
    }

    const factorString =
      factors.length > 0 ? factors.join(", ") : "high relevance";
    return `Strong match with ${factorString}. Located in ${
      result.meta.section || "documentation"
    } section.`;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchStartTime(Date.now());

    try {
      // Call the real RAG API
      const searchResponse = await apiService.search(query, {
        limit: 10,
        rerank: true,
        minSimilarity: 0.1,
      });

      const searchTime = Date.now() - searchStartTime;

      // Transform the API response to match our UI expectations
      const transformedResults = searchResponse.results.map(
        (result, index) => ({
          id: result.id,
          title: result.meta.section || "Documentation",
          summary:
            result.text.substring(0, 200) +
            (result.text.length > 200 ? "..." : ""),
          highlights: [
            result.text.substring(0, 100) +
              (result.text.length > 100 ? "..." : ""),
            `Section: ${result.meta.section}`,
            `Type: ${result.meta.contentType}`,
          ],
          confidenceScore: calculateCompositeScore(result),
          source: {
            type:
              result.meta.contentType === "code"
                ? "component"
                : result.meta.contentType === "heading"
                ? "guideline"
                : "documentation",
            path:
              result.meta.breadcrumbs?.join(" > ") ||
              result.meta.section ||
              "Unknown",
            url: result.source?.url || result.meta.uri || `#${result.id}`,
          },
          rationale: generateDetailedRationale(result),
          tags: [
            result.meta.contentType,
            ...result.meta.breadcrumbs.slice(0, 2),
          ],
          lastUpdated:
            result.meta.updatedAt ||
            result.meta.createdAt ||
            new Date().toISOString().split("T")[0],
        })
      );

      setResults(transformedResults);

      // Clear messages for fresh search - let user ask questions about results
      setMessages([]);
    } catch (error) {
      console.error("Search failed:", error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: `Sorry, I encountered an error while searching: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (
    message: string,
    options?: {
      contextResults?: SearchResult[];
      pastedContent?: string;
      queryType?: "component" | "pattern" | "token" | "general";
      autoSearch?: boolean;
    }
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Use enhanced chat service for better handling
      const chatResponse = await EnhancedChatService.chat(message, {
        pastedContent: options?.pastedContent,
        queryType: options?.queryType,
        autoSearch:
          options?.autoSearch ||
          (!options?.contextResults?.length && results.length === 0),
        context: chatContext,
        model: selectedModel,
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: chatResponse.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setChatContext(chatResponse.context); // Update conversation context
      setSuggestedActions(chatResponse.suggestedActions || []); // Update suggested actions

      // If auto-search found results, update the results state
      if (chatResponse.searchResults && chatResponse.searchResults.length > 0) {
        const transformedResults = chatResponse.searchResults.map(
          (result, index) => ({
            id: result.id,
            title: result.meta.section || "Documentation",
            summary:
              result.text.substring(0, 200) +
              (result.text.length > 200 ? "..." : ""),
            highlights: [
              result.text.substring(0, 100) +
                (result.text.length > 100 ? "..." : ""),
              `Section: ${result.meta.section}`,
              `Type: ${result.meta.contentType}`,
            ],
            confidenceScore: calculateCompositeScore(result),
            source: {
              type:
                result.meta.contentType === "code"
                  ? "component"
                  : result.meta.contentType === "heading"
                  ? "guideline"
                  : "documentation",
              path:
                result.meta.breadcrumbs?.join(" > ") ||
                result.meta.section ||
                "Unknown",
              url: result.source?.url || result.meta.uri || `#${result.id}`,
            },
            rationale: generateDetailedRationale(result),
            tags: [
              result.meta.contentType,
              ...result.meta.breadcrumbs.slice(0, 2),
            ],
            lastUpdated:
              result.meta.updatedAt ||
              result.meta.createdAt ||
              new Date().toISOString().split("T")[0],
          })
        );

        setResults(transformedResults);
        setHasSearched(true);
      }
    } catch (error) {
      console.error("Failed to generate chat response:", error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: `Sorry, I encountered an error while processing your message: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);

    // Add to context if not already present
    if (!contextResults.find((r) => r.id === result.id)) {
      setContextResults((prev) => [...prev, result]);
    }
  };

  const handleRemoveContext = (resultId: string) => {
    setContextResults((prev) => prev.filter((r) => r.id !== resultId));

    // If the removed result was selected, clear selection
    if (selectedResult?.id === resultId) {
      setSelectedResult(null);
    }
  };

  const handleViewDocument = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSuggestedAction = (action: {
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    filters?: any;
  }) => {
    if (action.type === "new_search" || action.type === "refine_search") {
      if (action.query) {
        setQuery(action.query);
        // Automatically trigger search
        setTimeout(() => {
          handleSearch();
        }, 100);
      }
    } else if (action.type === "filter") {
      // For now, just show a message about filtering
      const filterMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: `I'd recommend filtering by ${
          action.filters?.type || "the suggested criteria"
        }. This feature will be available in the filter controls above the results.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, filterMessage]);
    }
  };

  const handleAskFollowUp = (question: string, context: SearchResult) => {
    // Add the follow-up question as a user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };

    // Add context about which result this relates to
    const contextMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: `I'll help you with "${question}" based on the information from "${context.title}". Let me provide more details...`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, contextMessage]);
    setSelectedResult(context); // Select the relevant result
  };

  const handleRefineSearch = (refinedQuery: string) => {
    setQuery(refinedQuery);
    // Automatically trigger the refined search
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleLoadChatSession = (session: ChatSession) => {
    // Convert API session format to internal Message format
    const loadedMessages: Message[] = session.messages.map((msg, index) => ({
      id: `${session.id}-${index}`,
      type:
        msg.role === "user"
          ? "user"
          : msg.role === "assistant"
          ? "assistant"
          : "error",
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));

    setMessages(loadedMessages);
    setCurrentSession(session);
    setHasSearched(true); // Show the chat interface
    setQuery(""); // Clear search query when loading a chat
  };

  const handleNewChat = () => {
    // Clear current session and messages
    setMessages([]);
    setCurrentSession(null);
    setHasSearched(false);
    setQuery("");
    setResults([]);
    setContextResults([]);
    setChatContext([]);
    setSuggestedActions([]);
    setShowChatHistory(false);
  };

  // Show test mode if enabled
  if (showTestMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">RAG Integration Test</h1>
            <button
              onClick={() => setShowTestMode(false)}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
            >
              Back to Main Interface
            </button>
          </div>
        </div>
        <TestIntegration />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Test mode toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowTestMode(true)}
          className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
        >
          Test Mode
        </button>
      </div>

      {/* Model selector */}
      <div className="absolute top-4 left-4 z-20">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Chat history sidebar */}
      <ChatHistory
        isOpen={showChatHistory}
        onToggle={() => setShowChatHistory(!showChatHistory)}
        onLoadSession={handleLoadChatSession}
        onNewChat={handleNewChat}
        currentSessionId={currentSession?.id}
      />

      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div
            key="initial"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="size-full flex items-center justify-center p-8"
          >
            <div className="w-full max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
              >
                <h1 className="mb-4">
                  Obsidian RAG - Knowledge Base Search & Discovery
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  AI-powered semantic search through your Obsidian vault with
                  vector embeddings, knowledge graph relationships, and
                  intelligent reasoning across your personal knowledge base.
                </p>
              </motion.div>

              <div className="flex justify-center">
                <SearchInput
                  isInitial={true}
                  query={query}
                  onQueryChange={setQuery}
                  onSubmit={handleSearch}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="split"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-screen flex flex-col"
          >
            <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <SearchInput
                      isInitial={false}
                      query={query}
                      onQueryChange={setQuery}
                      onSubmit={handleSearch}
                      isLoading={isLoading}
                    />
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setShowChatHistory(true)}
                      className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2"
                      title="Chat History"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      History
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-6 p-6 min-h-0 overflow-hidden">
              <div className="w-1/2 min-w-0 flex flex-col">
                <ChatInterface
                  initialQuery={query}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  resultsCount={results.length}
                  contextResults={contextResults}
                  onRemoveContext={handleRemoveContext}
                  suggestedActions={suggestedActions}
                  onSuggestedAction={handleSuggestedAction}
                  selectedModel={selectedModel}
                  currentSession={currentSession}
                />
              </div>

              <div className="w-1/2 min-w-0 flex flex-col">
                <ResultsPanel
                  results={results}
                  isLoading={isLoading}
                  selectedResult={selectedResult}
                  onSelectResult={handleSelectResult}
                  onViewDocument={handleViewDocument}
                  onAddToContext={handleSelectResult}
                  onAskFollowUp={handleAskFollowUp}
                  onRefineSearch={handleRefineSearch}
                  query={query}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
