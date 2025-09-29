// Chat API service for managing chat sessions
// This provides the client-side interface to chat storage endpoints

import type {
  ChatHistoryResponse,
  ChatSession,
  SaveChatRequest,
  SaveChatResponse,
  ChatApiService,
} from "./chat-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ChatApiServiceImpl implements ChatApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getChatHistory(): Promise<ChatHistoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/history`);

      if (!response.ok) {
        throw new Error(
          `Chat history request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Chat history API error:", error);
      throw new Error(
        `Failed to get chat history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async loadChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/session/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Load chat session failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.session || null;
    } catch (error) {
      console.error("Load chat session API error:", error);
      throw new Error(
        `Failed to load chat session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async saveChatSession(chatData: SaveChatRequest): Promise<SaveChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      });

      if (!response.ok) {
        throw new Error(
          `Save chat session failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Save chat session API error:", error);
      throw new Error(
        `Failed to save chat session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteChatSession(
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/chat/session/${sessionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Delete chat session failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Delete chat session API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const chatApiService = new ChatApiServiceImpl();
