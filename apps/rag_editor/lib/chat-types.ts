// Chat data types and interfaces for the RAG Editor
// Based on the implementation from rag_web_search_tool

export interface BaseMessage {
  id: string;
  type: "user" | "assistant" | "error" | "system";
  content: string;
  timestamp: Date;
}

export interface EnhancedMessage extends BaseMessage {
  entities?: any[]; // Could be extended for entity linking
  reasoning?: any; // Could be extended for reasoning results
  searchCount?: number;
  confidence?: number;
  provenance?: {
    operationId: string;
    qualityMetrics: Record<string, number>;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: BaseMessage[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  messageCount: number;
  topics?: string[];
}

export interface ChatHistoryResponse {
  sessions: ChatSession[];
}

export interface SaveChatRequest {
  title?: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  model?: string;
}

export interface SaveChatResponse {
  success: boolean;
  session_id?: string;
  error?: string;
}

// Hook state interface for chat management
export interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
}

// API service interface
export interface ChatApiService {
  getChatHistory(): Promise<ChatHistoryResponse>;
  loadChatSession(sessionId: string): Promise<ChatSession | null>;
  saveChatSession(chatData: SaveChatRequest): Promise<SaveChatResponse>;
  deleteChatSession(
    sessionId: string
  ): Promise<{ success: boolean; error?: string }>;
}
