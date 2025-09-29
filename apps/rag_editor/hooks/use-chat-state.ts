// Custom hook for managing chat state in the RAG Editor

import { useState, useCallback, useEffect } from "react";
import { chatApiService } from "@/lib/chat-api";
import type {
  ChatSession,
  ChatState,
  BaseMessage,
  SaveChatRequest,
} from "@/lib/chat-types";

const initialState: ChatState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
};

export function useChatState() {
  const [state, setState] = useState<ChatState>(initialState);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await chatApiService.getChatHistory();
      setState((prev) => ({
        ...prev,
        sessions: response.sessions,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load chat history",
        isLoading: false,
      }));
    }
  }, []);

  // Load a specific chat session
  const loadChatSession = useCallback(async (sessionId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const session = await chatApiService.loadChatSession(sessionId);
      if (session) {
        setState((prev) => ({
          ...prev,
          currentSession: session,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: "Chat session not found",
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load chat session",
        isLoading: false,
      }));
    }
  }, []);

  // Save current chat as a new session
  const saveCurrentChat = useCallback(
    async (messages: BaseMessage[], model?: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const saveData: SaveChatRequest = {
          messages: messages.map((msg) => ({
            role: msg.type,
            content: msg.content,
          })),
          model,
        };

        const response = await chatApiService.saveChatSession(saveData);

        if (response.success) {
          // Reload chat history to include the new session
          await loadChatHistory();
          setState((prev) => ({ ...prev, isLoading: false }));
        } else {
          setState((prev) => ({
            ...prev,
            error: response.error || "Failed to save chat",
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to save chat",
          isLoading: false,
        }));
      }
    },
    [loadChatHistory]
  );

  // Delete a chat session
  const deleteChatSession = useCallback(async (sessionId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await chatApiService.deleteChatSession(sessionId);

      if (response.success) {
        // Remove from local state
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => s.id !== sessionId),
          currentSession:
            prev.currentSession?.id === sessionId ? null : prev.currentSession,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.error || "Failed to delete chat session",
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete chat session",
        isLoading: false,
      }));
    }
  }, []);

  // Set current session
  const setCurrentSession = useCallback((session: ChatSession | null) => {
    setState((prev) => ({ ...prev, currentSession: session }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Get recent chats (limited number for sidebar)
  const getRecentChats = useCallback(
    (limit: number = 10) => {
      return state.sessions
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, limit);
    },
    [state.sessions]
  );

  return {
    // State
    ...state,

    // Actions
    loadChatHistory,
    loadChatSession,
    saveCurrentChat,
    deleteChatSession,
    setCurrentSession,
    clearError,
    getRecentChats,
  };
}
