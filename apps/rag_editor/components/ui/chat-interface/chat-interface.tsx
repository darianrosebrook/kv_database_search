"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Badge } from "../badge";
import { Title, Body, Caption, Micro } from "../typography";
import styles from "./chat-interface.module.scss";
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
    <div className={cn(styles.chatInterface, className)}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.botAvatar}>
              <Bot className={styles.botIcon} />
            </div>
            <div className={styles.botInfo}>
              <Title className={styles.botTitle}>AI Assistant</Title>
              <Caption className={styles.botSubtitle}>
                Powered by {selectedModel?.name || "No model selected"}
              </Caption>
            </div>
          </div>
          <div className={styles.headerRight}>
            {models.length > 0 && (
              <select
                value={selectedModel?.id || ""}
                onChange={(e) =>
                  setSelectedModel(
                    models.find((m) => m.id === e.target.value) || models[0]
                  )
                }
                className={styles.modelSelector}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className={styles.iconMd} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              styles.message,
              message.type === "user" && styles.user
            )}
          >
            <div
              className={cn(
                styles.messageAvatar,
                message.type === "user" && styles.user,
                message.type === "error" &&
                  "bg-destructive text-destructive-foreground",
                message.type === "assistant" && styles.assistant
              )}
            >
              {message.type === "user" ? (
                <User className={styles.messageIcon} />
              ) : message.type === "error" ? (
                <RefreshCw className={styles.messageIcon} />
              ) : (
                <Bot className={styles.messageIcon} />
              )}
            </div>
            <div className={styles.messageContent}>
              <div
                className={cn(
                  styles.messageContent,
                  message.type === "user" && styles.user,
                  message.type === "error" &&
                    "bg-destructive/10 border border-destructive/20 text-destructive",
                  message.type === "assistant" && styles.assistant
                )}
              >
                <Body className="whitespace-pre-wrap">{message.content}</Body>
              </div>

              {/* Search Results */}
              {message.searchResults && message.searchResults.length > 0 && (
                <div className={styles.messageSources}>
                  <Micro className={styles.sourcesHeader}>Sources</Micro>
                  <div className={styles.sourcesGrid}>
                    {message.searchResults.slice(0, 3).map((result) => (
                      <div key={result.id} className={styles.sourceCard}>
                        <div className={styles.sourceHeader}>
                          <span className={styles.sourceTitle}>
                            {result.title}
                          </span>
                          <Badge variant="secondary" className={styles.textXs}>
                            {Math.round(result.confidenceScore * 100)}%
                          </Badge>
                        </div>
                        <Body className={styles.textSm}>{result.summary}</Body>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Actions */}
              {message.type === "assistant" && (
                <div className={styles.messageActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.buttonIconSm}
                  >
                    <Copy className={styles.iconSm} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.buttonIconSm}
                  >
                    <ThumbsUp className={styles.iconSm} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.buttonIconSm}
                  >
                    <ThumbsDown className={styles.iconSm} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.buttonIconSm}
                  >
                    <RefreshCw className={styles.iconSm} />
                  </Button>
                </div>
              )}

              <Caption className={styles.textXs}>
                {message.timestamp.toLocaleTimeString()}
              </Caption>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={styles.message}>
            <div className={cn(styles.messageAvatar, styles.assistant)}>
              <Bot className={styles.messageIcon} />
            </div>
            <div className={styles.messageContent}>
              <div className={cn(styles.messageContent, styles.assistant)}>
                <div className={styles.flexCenter + " " + styles.gap2}>
                  <div className={styles.loadingDots}>
                    <div className={styles.loadingDot} />
                    <div className={styles.loadingDot} />
                    <div className={styles.loadingDot} />
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
        <div className={styles.quickActions}>
          <div className={styles.flexCenter + " gap-2 mb-2"}>
            <Sparkles className={styles.iconMd} />
            <Micro className="text-muted-foreground">Quick Actions</Micro>
          </div>
          <div className={styles.flexWrap + " gap-2"}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className={styles.quickActionButton}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        {/* Attachments */}
        {attachments.length > 0 && (
          <div
            className={styles.mb3 + " " + styles.flexWrap + " " + styles.gap2}
          >
            {attachments.map((file, index) => (
              <div
                key={index}
                className={
                  styles.flexCenter +
                  " " +
                  styles.gap2 +
                  " " +
                  styles.px3 +
                  " " +
                  styles.py1 +
                  " bg-accent rounded-md"
                }
              >
                <span
                  className={
                    styles.textSm + " " + styles.truncate + " " + styles.maxW32
                  }
                >
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.h5 + " " + styles.w5 + " p-0"}
                  onClick={() => removeAttachment(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputContainer}>
          <div className={styles.relative}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your knowledge base..."
              className={styles.inputField}
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
              className={
                styles.absolute +
                " " +
                styles.right2 +
                " " +
                styles.bottom2 +
                " " +
                styles.buttonIcon
              }
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className={styles.iconMd} />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0}
            className={styles.sendButton}
          >
            <Send className={styles.iconMd} />
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
