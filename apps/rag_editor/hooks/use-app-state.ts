// Centralized state management hook for the RAG Editor
// This hook consolidates all app state to reduce prop drilling and improve maintainability

import { useState, useCallback } from "react";
import type {
  AppState,
  SearchResult,
  EnhancedMessage,
  ChatSession,
  SuggestedAction,
  SearchOptions,
  ChatContext,
  AppTab,
} from "../lib/types";
import type {
  GraphRagSearchResult,
  GraphRagEntity,
  ReasoningResult,
} from "../lib/types";

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppState = {
  // Search state
  query: "",
  hasSearched: false,
  isLoading: false,
  searchStartTime: 0,

  // Results state
  results: [],
  selectedResult: null,
  contextResults: [],

  // Chat state
  messages: [],
  chatContext: [],
  suggestedActions: [],

  // UI state
  showTestMode: false,
  showChatHistory: false,
  showMultiModalInterface: false,
  selectedModel: "llama3.1",
  currentSession: null,

  // Graph RAG state
  useGraphRag: true,
  graphRagResults: [],
  selectedGraphRagResult: null,
  reasoningResults: undefined,
  allEntities: [],

  // Tab state
  tabs: [],
  activeTabId: null,
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  // ============================================================================
  // SEARCH STATE ACTIONS
  // ============================================================================

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const setHasSearched = useCallback((hasSearched: boolean) => {
    setState((prev) => ({ ...prev, hasSearched }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setSearchStartTime = useCallback((searchStartTime: number) => {
    setState((prev) => ({ ...prev, searchStartTime }));
  }, []);

  // ============================================================================
  // RESULTS STATE ACTIONS
  // ============================================================================

  const setResults = useCallback((results: SearchResult[]) => {
    setState((prev) => ({ ...prev, results }));
  }, []);

  const setSelectedResult = useCallback(
    (selectedResult: SearchResult | null) => {
      setState((prev) => ({ ...prev, selectedResult }));
    },
    []
  );

  const addToContext = useCallback((result: SearchResult) => {
    setState((prev) => ({
      ...prev,
      contextResults: prev.contextResults.find((r) => r.id === result.id)
        ? prev.contextResults
        : [...prev.contextResults, result],
    }));
  }, []);

  const removeFromContext = useCallback((resultId: string) => {
    setState((prev) => ({
      ...prev,
      contextResults: prev.contextResults.filter((r) => r.id !== resultId),
      selectedResult:
        prev.selectedResult?.id === resultId ? null : prev.selectedResult,
    }));
  }, []);

  const clearContext = useCallback(() => {
    setState((prev) => ({ ...prev, contextResults: [] }));
  }, []);

  // ============================================================================
  // CHAT STATE ACTIONS
  // ============================================================================

  const addMessage = useCallback((message: EnhancedMessage) => {
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  }, []);

  const setMessages = useCallback((messages: EnhancedMessage[]) => {
    setState((prev) => ({ ...prev, messages }));
  }, []);

  const setChatContext = useCallback((chatContext: ChatContext[]) => {
    setState((prev) => ({ ...prev, chatContext }));
  }, []);

  const setSuggestedActions = useCallback(
    (suggestedActions: SuggestedAction[]) => {
      setState((prev) => ({ ...prev, suggestedActions }));
    },
    []
  );

  // ============================================================================
  // UI STATE ACTIONS
  // ============================================================================

  const setShowTestMode = useCallback((showTestMode: boolean) => {
    setState((prev) => ({ ...prev, showTestMode }));
  }, []);

  const setShowChatHistory = useCallback((showChatHistory: boolean) => {
    setState((prev) => ({ ...prev, showChatHistory }));
  }, []);

  const setShowMultiModalInterface = useCallback(
    (showMultiModalInterface: boolean) => {
      setState((prev) => ({ ...prev, showMultiModalInterface }));
    },
    []
  );

  const setSelectedModel = useCallback((selectedModel: string) => {
    setState((prev) => ({ ...prev, selectedModel }));
  }, []);

  const setCurrentSession = useCallback(
    (currentSession: ChatSession | null) => {
      setState((prev) => ({ ...prev, currentSession }));
    },
    []
  );

  // ============================================================================
  // GRAPH RAG STATE ACTIONS
  // ============================================================================

  const setUseGraphRag = useCallback((useGraphRag: boolean) => {
    setState((prev) => ({ ...prev, useGraphRag }));
  }, []);

  const setGraphRagResults = useCallback(
    (graphRagResults: GraphRagSearchResult[]) => {
      setState((prev) => ({ ...prev, graphRagResults }));
    },
    []
  );

  const setSelectedGraphRagResult = useCallback(
    (selectedGraphRagResult: GraphRagSearchResult | null) => {
      setState((prev) => ({ ...prev, selectedGraphRagResult }));
    },
    []
  );

  const setReasoningResults = useCallback(
    (reasoningResults: ReasoningResult | undefined) => {
      setState((prev) => ({ ...prev, reasoningResults }));
    },
    []
  );

  const setAllEntities = useCallback((allEntities: GraphRagEntity[]) => {
    setState((prev) => ({ ...prev, allEntities }));
  }, []);

  // ============================================================================
  // TAB STATE ACTIONS
  // ============================================================================

  const setTabs = useCallback((tabs: AppTab[]) => {
    setState((prev) => ({ ...prev, tabs }));
  }, []);

  const setActiveTabId = useCallback((activeTabId: string | null) => {
    setState((prev) => ({ ...prev, activeTabId }));
  }, []);

  const addTab = useCallback((tab: Omit<AppTab, "id" | "openTime">) => {
    const newTab: AppTab = {
      ...tab,
      id: Date.now().toString(),
      openTime: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id, // Make new tab active
    }));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState((prev) => {
      const newTabs = prev.tabs.filter((tab) => tab.id !== tabId);
      let newActiveTabId = prev.activeTabId;

      // If we're closing the active tab, switch to another tab
      if (prev.activeTabId === tabId) {
        const remainingTabs = newTabs;
        if (remainingTabs.length > 0) {
          // Find the tab that was opened most recently
          const mostRecentTab = remainingTabs.reduce((mostRecent, current) =>
            current.openTime > mostRecent.openTime ? current : mostRecent
          );
          newActiveTabId = mostRecentTab.id;
        } else {
          newActiveTabId = null;
        }
      }

      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  }, []);

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newTabs = [...prev.tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return {
        ...prev,
        tabs: newTabs,
      };
    });
  }, []);

  const closeOtherTabs = useCallback((keepTabId: string) => {
    setState((prev) => {
      const keptTab = prev.tabs.find((tab) => tab.id === keepTabId);
      return {
        ...prev,
        tabs: keptTab ? [keptTab] : [],
        activeTabId: keptTab ? keptTab.id : null,
      };
    });
  }, []);

  const closeTabsToTheRight = useCallback((tabId: string) => {
    setState((prev) => {
      const tabIndex = prev.tabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex === -1) return prev;

      const newTabs = prev.tabs.slice(0, tabIndex + 1);
      return {
        ...prev,
        tabs: newTabs,
      };
    });
  }, []);

  const switchToTab = useCallback((tabId: string) => {
    setState((prev) => ({
      ...prev,
      activeTabId: tabId,
      tabs: prev.tabs.map((tab) => ({
        ...tab,
        isActive: tab.id === tabId,
      })),
    }));
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<AppTab>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }));
  }, []);

  // ============================================================================
  // COMPOUND ACTIONS
  // ============================================================================

  const startSearch = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      query,
      isLoading: true,
      hasSearched: true,
      searchStartTime: Date.now(),
    }));
  }, []);

  const completeSearch = useCallback(
    (
      results: SearchResult[],
      graphRagResults?: GraphRagSearchResult[],
      entities?: GraphRagEntity[]
    ) => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        results,
        ...(graphRagResults && { graphRagResults }),
        ...(entities && { allEntities: entities }),
        messages: [], // Clear messages for fresh search
      }));
    },
    []
  );

  const handleSearchError = useCallback((error: string) => {
    const errorMessage: EnhancedMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: `Sorry, I encountered an error while searching: ${error}. Please try again.`,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      isLoading: false,
      messages: [errorMessage],
    }));
  }, []);

  const resetChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      currentSession: null,
      hasSearched: false,
      query: "",
      results: [],
      graphRagResults: [],
      contextResults: [],
      chatContext: [],
      suggestedActions: [],
      showChatHistory: false,
      reasoningResults: undefined,
      allEntities: [],
    }));
  }, []);

  const toggleGraphRag = useCallback(() => {
    setState((prev) => ({
      ...prev,
      useGraphRag: !prev.useGraphRag,
      // Clear results when switching modes
      results: [],
      graphRagResults: [],
      messages: [],
      allEntities: [],
      reasoningResults: undefined,
    }));
  }, []);

  // ============================================================================
  // TAB HELPER ACTIONS
  // ============================================================================

  const openSearchTab = useCallback(
    (query: string) => {
      const tabTitle =
        query.length > 20 ? `${query.substring(0, 17)}...` : query;
      addTab({
        title: `Search: ${tabTitle}`,
        type: "search",
        isActive: true,
        isDirty: false,
        content: { query },
      });
    },
    [addTab]
  );

  const openChatTab = useCallback(
    (sessionId?: string, title?: string) => {
      addTab({
        title: title || "New Chat",
        type: "chat",
        isActive: true,
        isDirty: false,
        content: { sessionId },
      });
    },
    [addTab]
  );

  const openDocumentTab = useCallback(
    (documentId: string, documentPath?: string, title?: string) => {
      addTab({
        title: title || "Document",
        type: "document",
        isActive: true,
        isDirty: false,
        content: { documentId, documentPath },
      });
    },
    [addTab]
  );

  const openWorkspaceTab = useCallback(
    (workspaceId: string, title?: string) => {
      addTab({
        title: title || "Workspace",
        type: "workspace",
        isActive: true,
        isDirty: false,
        content: { workspaceId },
      });
    },
    [addTab]
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const currentResults = state.useGraphRag
    ? state.graphRagResults
    : state.results;
  const currentMessages = state.messages;
  const hasResults = currentResults.length > 0;
  const hasContext = state.contextResults.length > 0;
  const hasEntities = state.allEntities.length > 0;
  const hasReasoning = !!state.reasoningResults;

  // ============================================================================
  // RETURN OBJECT
  // ============================================================================

  return {
    // State
    ...state,

    // Computed values
    currentResults,
    currentMessages,
    hasResults,
    hasContext,
    hasEntities,
    hasReasoning,

    // Actions
    setQuery,
    setHasSearched,
    setIsLoading,
    setSearchStartTime,
    setResults,
    setSelectedResult,
    addToContext,
    removeFromContext,
    clearContext,
    addMessage,
    setMessages,
    setChatContext,
    setSuggestedActions,
    setShowTestMode,
    setShowChatHistory,
    setShowMultiModalInterface,
    setSelectedModel,
    setCurrentSession,
    setUseGraphRag,
    setGraphRagResults,
    setSelectedGraphRagResult,
    setReasoningResults,
    setAllEntities,

    // Tab actions
    setTabs,
    setActiveTabId,
    addTab,
    closeTab,
    switchToTab,
    updateTab,
    reorderTabs,
    closeOtherTabs,
    closeTabsToTheRight,
    openSearchTab,
    openChatTab,
    openDocumentTab,
    openWorkspaceTab,

    // Compound actions
    startSearch,
    completeSearch,
    handleSearchError,
    resetChat,
    toggleGraphRag,
  };
}
