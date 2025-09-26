// Refactored App.tsx - Using unified chat service architecture
// Simplified and maintainable with clean separation of concerns

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { SearchInput } from "../ui/components/SearchInput";
import { ChatInterface } from "./components/shared/ChatInterface";
import { ResultsPanel } from "./components/shared/ResultsPanel";
import ResultCard from "../ui/components/ResultCard";
import ModelSelector from "../ui/components/ModelSelector";
import ChatHistory from "../ui/components/ChatHistory";
import { TestIntegration } from "./test-integration";
import MultiModalInterface from "./components/MultiModalInterface";

// Hooks and Services
import { useAppState } from "./hooks/useAppState";
import { searchService } from "./services/SearchService";

// Types
import type {
  SearchResult,
  EnhancedMessage,
  SuggestedAction,
  SearchOptions,
} from "./types";
import type {
  GraphRagSearchResult,
  GraphRagEntity,
  GraphRagRelationship,
} from "./lib/graph-rag-api";

export default function App() {
  // Centralized state management
  const {
    // State
    query,
    hasSearched,
    isLoading,
    results,
    selectedResult,
    contextResults,
    messages,
    chatContext,
    suggestedActions,
    showTestMode,
    showChatHistory,
    selectedModel,
    currentSession,
    useGraphRag,
    graphRagResults,
    selectedGraphRagResult,
    reasoningResults,
    allEntities,

    // Multi-modal state
    showMultiModalInterface,

    // Computed values
    currentResults,
    currentMessages,
    hasResults,
    hasContext,
    hasEntities,
    hasReasoning,

    // Actions
    setQuery,
    setIsLoading,
    startSearch,
    completeSearch,
    handleSearchError,
    addMessage,
    setMessages,
    setChatContext,
    setSuggestedActions,
    setShowTestMode,
    setShowChatHistory,
    setSelectedModel,
    setCurrentSession,
    toggleGraphRag,
    setSelectedResult,
    setSelectedGraphRagResult,
    addToContext,
    removeFromContext,
    clearContext,
    resetChat,
    setShowMultiModalInterface,
  } = useAppState();

  // ============================================================================
  // SEARCH HANDLERS
  // ============================================================================

  const handleSearch = async () => {
    if (!query.trim()) return;

    startSearch(query);

    try {
      const searchResponse = await searchService.search(query, {
        useGraphRag,
        maxResults: 10,
        includeReasoning: useGraphRag,
        searchStrategy: "hybrid",
      });

      completeSearch(
        searchResponse.results,
        searchResponse.graphRagResults,
        searchResponse.entities
      );
    } catch (error) {
      console.error("Search failed:", error);
      handleSearchError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  // ============================================================================
  // CHAT HANDLERS
  // ============================================================================

  const handleSendMessage = async (
    message: string,
    options?: SearchOptions
  ) => {
    const newMessage: EnhancedMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    addMessage(newMessage);
    setIsLoading(true);

    try {
      const chatResponse = await searchService.chat(message, {
        useGraphRag,
        context: chatContext,
        model: selectedModel,
        searchOptions: options,
      });

      const aiResponse: EnhancedMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: chatResponse.response,
        timestamp: new Date(),
        entities: chatResponse.entities,
        reasoning: chatResponse.reasoningResults,
        searchCount:
          (chatResponse.searchResults?.length || 0) +
          (chatResponse.graphRagResults?.length || 0),
        confidence: chatResponse.explanation?.confidenceScore,
      };

      addMessage(aiResponse);
      setChatContext(chatResponse.context);
      setSuggestedActions(chatResponse.suggestedActions);

      // Update search results if found
      if (chatResponse.searchResults && chatResponse.searchResults.length > 0) {
        completeSearch(
          chatResponse.searchResults,
          chatResponse.graphRagResults,
          chatResponse.entities
        );
      }
    } catch (error) {
      console.error("Chat failed:", error);
      const errorMessage: EnhancedMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // GRAPH RAG HANDLERS
  // ============================================================================

  const handleExploreEntity = async (entity: GraphRagEntity) => {
    console.log("🔍 Exploring entity:", entity.name);
    setQuery(`Tell me more about ${entity.name}`);
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleExploreRelationship = async (
    relationship: GraphRagRelationship
  ) => {
    console.log("🔗 Exploring relationship:", relationship.type);
    if (relationship.sourceNode && relationship.targetNode) {
      setQuery(
        `How are ${relationship.sourceNode.name} and ${relationship.targetNode.name} related?`
      );
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  };

  const handleReasonAbout = async (entities: GraphRagEntity[]) => {
    if (entities.length < 2) return;

    console.log(
      "🧠 Reasoning about entities:",
      entities.map((e) => e.name).join(", ")
    );

    try {
      setIsLoading(true);
      const chatResponse = await searchService.chat(
        `How are ${entities.map((e) => e.name).join(" and ")} related?`,
        {
          useGraphRag: true,
          context: chatContext,
          model: selectedModel,
          searchOptions: {
            enableReasoning: true,
          },
        }
      );

      if (chatResponse.reasoningResults) {
        const reasoningMessage: EnhancedMessage = {
          id: Date.now().toString(),
          type: "assistant",
          content: chatResponse.response,
          timestamp: new Date(),
          entities: entities,
          reasoning: chatResponse.reasoningResults,
        };
        addMessage(reasoningMessage);
        setChatContext(chatResponse.context);
        setSuggestedActions(chatResponse.suggestedActions);
      }
    } catch (error) {
      console.error("Reasoning failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // UI HANDLERS
  // ============================================================================

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const handleSelectGraphRagResult = (result: GraphRagSearchResult) => {
    setSelectedGraphRagResult(result);

    // Also set the transformed result for compatibility
    const transformedResult: SearchResult = {
      id: result.id,
      title: result.metadata.section || "Document",
      summary:
        result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
      highlights: [
        result.text.substring(0, 100) + (result.text.length > 100 ? "..." : ""),
        `Source: ${result.metadata.sourceFile}`,
        `Type: ${result.metadata.contentType}`,
      ],
      confidenceScore: result.score,
      source: {
        type:
          result.metadata.contentType === "code"
            ? "component"
            : "documentation",
        path: result.metadata.sourceFile,
        url: result.metadata.url || `#${result.id}`,
      },
      rationale:
        result.explanation || `Graph RAG score: ${result.score.toFixed(3)}`,
      tags: [
        result.metadata.contentType,
        ...result.entities.slice(0, 2).map((e) => e.type),
      ],
      lastUpdated:
        result.metadata.updatedAt || new Date().toISOString().split("T")[0],
    };

    setSelectedResult(transformedResult);
  };

  const handleViewDocument = (url: string) => {
    window.open(url, "_blank");
  };

  const handleAskFollowUp = (question: string, context: SearchResult) => {
    addToContext(context);
    handleSendMessage(question, { contextResults: [context] });
  };

  const handleRefineSearch = (refinedQuery: string) => {
    setQuery(refinedQuery);
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    switch (action.type) {
      case "explore":
        if (action.query) {
          setQuery(action.query);
          setTimeout(() => {
            handleSearch();
          }, 100);
        }
        break;
      case "reason":
        if (action.entityIds && action.reasoning) {
          handleSendMessage(action.reasoning.question, {
            queryType: "reasoning",
            enableReasoning: true,
            entityIds: action.entityIds,
          });
        }
        break;
      case "refine_search":
      case "new_search":
        if (action.query) {
          handleRefineSearch(action.query);
        }
        break;
      default:
        console.log("Unhandled action:", action);
    }
  };

  const handleLoadChatSession = (session: any) => {
    setCurrentSession(session);
    setMessages(session.messages || []);
  };

  const handleNewChat = () => {
    resetChat();
  };

  const handleMultiModalProcessingComplete = (result: any) => {
    // Add the processed content to the current search results
    console.log("Multi-modal processing completed:", result);
    // You could add this to the knowledge base or trigger a new search
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Test Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowTestMode(!showTestMode)}
          className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          {showTestMode ? "Hide" : "Show"} Test Mode
        </button>
      </div>

      {/* Graph RAG Toggle */}
      <div className="fixed top-4 left-4 z-50">
        <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <label
            htmlFor="graphRagToggle"
            className="text-sm font-medium text-foreground"
          >
            Knowledge Graph
          </label>
          <input
            id="graphRagToggle"
            type="checkbox"
            checked={useGraphRag}
            onChange={(e) => toggleGraphRag()}
            className="rounded"
          />
          {useGraphRag && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
              🧠 Advanced
            </span>
          )}
        </div>
      </div>

      {/* Multi-Modal Interface Toggle */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <label
            htmlFor="graphRagToggle"
            className="text-sm font-medium text-foreground"
          >
            Knowledge Graph
          </label>
          <input
            id="graphRagToggle"
            type="checkbox"
            checked={useGraphRag}
            onChange={(e) => toggleGraphRag()}
            className="rounded"
          />
          {useGraphRag && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
              🧠 Advanced
            </span>
          )}
        </div>
        <button
          onClick={() => setShowMultiModalInterface(true)}
          className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          title="Multi-Modal Processing - Upload and process various file types"
        >
          <span>📁</span>
          <span>Multi-Modal</span>
        </button>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistory
        isOpen={showChatHistory}
        onToggle={() => setShowChatHistory(!showChatHistory)}
        onLoadSession={handleLoadChatSession}
        onNewChat={handleNewChat}
        currentSessionId={currentSession?.id}
      />

      {/* Test Integration */}
      <AnimatePresence>
        {showTestMode && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 top-16 bottom-4 w-96 z-40"
          >
            <TestIntegration />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!hasSearched ? (
          // Initial Search View
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
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Knowledge Search
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {useGraphRag ? (
                    <>
                      Advanced AI-powered search with knowledge graph reasoning,
                      entity extraction, and relationship mapping across your
                      vault.
                    </>
                  ) : (
                    <>
                      AI-powered semantic search through your knowledge base
                      with intelligent reasoning and contextual understanding.
                    </>
                  )}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SearchInput
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder={
                    useGraphRag
                      ? "Ask about your knowledge base..."
                      : "Search your knowledge base..."
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex items-center justify-center gap-4"
              >
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Results View
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-border bg-background/95 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-4">
                <SearchInput
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder={
                    useGraphRag
                      ? "Ask about your knowledge base..."
                      : "Search your knowledge base..."
                  }
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              {/* Chat Interface */}
              <ChatInterface
                initialQuery={query}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                resultsCount={
                  useGraphRag ? graphRagResults.length : results.length
                }
                selectedModel={selectedModel}
                contextResults={contextResults}
                onRemoveContext={removeFromContext}
                suggestedActions={suggestedActions}
                onSuggestedAction={handleSuggestedAction}
                currentSession={currentSession}
                useGraphRag={useGraphRag}
                onExploreEntity={handleExploreEntity}
                onExploreRelationship={handleExploreRelationship}
                onReasonAbout={handleReasonAbout}
              />

              {/* Results Panel */}
              <ResultsPanel
                results={results}
                isLoading={isLoading}
                selectedResult={selectedResult}
                onSelectResult={handleSelectResult}
                onViewDocument={handleViewDocument}
                query={query}
                onAddToContext={addToContext}
                onAskFollowUp={handleAskFollowUp}
                onRefineSearch={handleRefineSearch}
                useGraphRag={useGraphRag}
                graphRagResults={graphRagResults}
                selectedGraphRagResult={selectedGraphRagResult}
                reasoningResults={reasoningResults}
                allEntities={allEntities}
                onSelectGraphRagResult={handleSelectGraphRagResult}
                onExploreEntity={handleExploreEntity}
                onExploreRelationship={handleExploreRelationship}
                onReasonAbout={handleReasonAbout}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Modal Interface */}
      <MultiModalInterface
        isOpen={showMultiModalInterface}
        onClose={() => setShowMultiModalInterface(false)}
        onProcessingComplete={handleMultiModalProcessingComplete}
      />
    </div>
  );
}
