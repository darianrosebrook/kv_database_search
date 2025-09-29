"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Badge } from "../badge";
import { Title, Body, Caption, Micro } from "../typography";
import {
  Send,
  Paperclip,
  MoreHorizontal,
  Bot,
  User,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useChatState } from "@/hooks/use-chat-state";
import { searchService } from "@/lib/services/search-service";
import { generateUniqueId } from "@/lib/utils";
import type { SearchResult, EnhancedMessage } from "@/lib/types";

// Use our standardized types
type Message = EnhancedMessage;

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string, attachments?: File[]) => void;
}

// TODO: Replace with actual sources from backend
const sourcesData: Source[] = [];

// Available AI models for chat
const models: Array<{
  id: string;
  name: string;
  provider: string;
  description?: string;
}> = [
  {
    id: "llama3.1",
    name: "Llama 3.1",
    provider: "Meta",
    description: "Latest Llama model with excellent reasoning capabilities",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Advanced GPT model for complex reasoning tasks",
  },
  {
    id: "claude-3",
    name: "Claude 3",
    provider: "Anthropic",
    description: "Safety-focused model with strong analysis capabilities",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Google's multimodal model for diverse tasks",
  },
];

// Quick action prompts for common chat scenarios
const quickActions: string[] = [
  "Explain this code snippet",
  "Help me debug this error",
  "Write unit tests for this function",
  "Optimize this code for performance",
  "Convert this to TypeScript",
  "Create API documentation",
  "Review this pull request",
  "Suggest design improvements",
];

export function ChatInterface({
  className,
  onSendMessage,
}: ChatInterfaceProps) {
  // Use our comprehensive chat state management
  const {
    sessions,
    currentSession,
    messages,
    isLoading,
    error,
    loadChatHistory,
    saveCurrentChat,
    addMessage,
    clearError,
  } = useChatState();

  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<{
    id: string;
    name: string;
    provider: string;
  } | null>({ id: "llama3.1", name: "Llama 3.1", provider: "Meta" });
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    // Add user message to state
    addMessage(userMessage);
    setInput("");

    try {
      // Use our enhanced chat service with dictionary integration
      const response = await searchService.enhancedChat(input, {
        useDictionary: true,
        enhanceWithDictionary: true,
        model: selectedModel?.id || "llama3.1",
      });

      const assistantMessage: Message = {
        id: generateUniqueId(),
        type: "assistant",
        content: response.response,
        timestamp: new Date(),
        entities: response.entities,
        searchResults: response.searchResults,
      };

      addMessage(assistantMessage);

      // Save conversation to history
      await saveCurrentChat(
        [...messages, userMessage, assistantMessage],
        selectedModel?.id
      );
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: generateUniqueId(),
        type: "error",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
      };

      addMessage(errorMessage);
    }

    onSendMessage?.(input, attachments);
    setAttachments([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-workspace-accent rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-workspace-accent-foreground" />
            </div>
            <div>
              <Title className="text-lg">AI Assistant</Title>
              <Caption>
                Powered by {selectedModel?.name || "No model selected"}
              </Caption>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {models.length > 0 && (
              <select
                value={selectedModel?.id || ""}
                onChange={(e) =>
                  setSelectedModel(
                    models.find((m) => m.id === e.target.value) || models[0]
                  )
                }
                className="px-3 py-1.5 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.type === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                message.type === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.type === "error"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-workspace-accent text-workspace-accent-foreground"
              )}
            >
              {message.type === "user" ? (
                <User className="h-4 w-4" />
              ) : message.type === "error" ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "flex-1 space-y-2",
                message.type === "user" && "flex flex-col items-end"
              )}
            >
              <div
                className={cn(
                  "max-w-3xl p-4 rounded-lg",
                  message.type === "user"
                    ? "bg-primary text-primary-foreground ml-12"
                    : message.type === "error"
                    ? "bg-destructive/10 border border-destructive/20 text-destructive mr-12"
                    : "bg-card border border-border mr-12"
                )}
              >
                <Body
                  className={cn(
                    "whitespace-pre-wrap",
                    message.type === "user" && "text-primary-foreground"
                  )}
                >
                  {message.content}
                </Body>
              </div>

              {/* Search Results */}
              {message.searchResults && message.searchResults.length > 0 && (
                <div className="max-w-3xl mr-12 space-y-2">
                  <Micro className="text-muted-foreground">Sources</Micro>
                  <div className="grid gap-2">
                    {message.searchResults.slice(0, 3).map((result) => (
                      <div
                        key={result.id}
                        className="p-3 bg-card border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium">
                            {result.title}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(result.confidenceScore * 100)}%
                          </Badge>
                        </div>
                        <Body className="text-sm text-muted-foreground line-clamp-2">
                          {result.summary}
                        </Body>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Actions */}
              {message.type === "assistant" && (
                <div className="flex items-center gap-2 mr-12">
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <Caption
                className={cn(
                  "text-xs",
                  message.role === "user" && "text-right mr-12"
                )}
              >
                {message.timestamp.toLocaleTimeString()}
              </Caption>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-workspace-accent rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-workspace-accent-foreground" />
            </div>
            <div className="flex-1">
              <div className="max-w-3xl p-4 bg-card border border-border rounded-lg mr-12">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-workspace-accent rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-workspace-accent rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-workspace-accent rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  <Caption>Thinking...</Caption>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && quickActions.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-workspace-accent" />
            <Micro className="text-muted-foreground">Quick Actions</Micro>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="bg-transparent"
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-accent rounded-md"
              >
                <span className="text-sm truncate max-w-32">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => removeAttachment(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your knowledge base..."
              className="w-full p-3 pr-12 bg-input border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 bottom-2 h-7 w-7 p-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0}
            className="h-11 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.md"
        />
      </div>
    </div>
  );
}
