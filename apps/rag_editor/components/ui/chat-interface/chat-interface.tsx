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
import { getModels, type OllamaModel } from "@/lib/api";

// Use our standardized types
type Message = EnhancedMessage;

interface ChatInterfaceProps {
  className?: string;
  onSendMessage?: (message: string, attachments?: File[]) => void;
}

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
    isLoading: isSaving,
    error,
    loadChatHistory,
    saveCurrentChat,
    clearError,
  } = useChatState();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available models from Ollama
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        setModelsError(null);
        const response = await getModels();

        if (response.error) {
          setModelsError(response.error);
        } else {
          setModels(response.models);
          // Set first model as default if available
          if (response.models.length > 0 && !selectedModel) {
            setSelectedModel(response.models[0].name);
          }
        }
      } catch (err) {
        setModelsError(
          err instanceof Error ? err.message : "Failed to load models"
        );
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

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
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use our enhanced chat service with dictionary integration
      const response = await searchService.enhancedChat(input, {
        useDictionary: true,
        enhanceWithDictionary: true,
        model: selectedModel || models[0]?.name || "llama3.1",
      });

      const assistantMessage: Message = {
        id: generateUniqueId(),
        type: "assistant",
        content: response.response,
        timestamp: new Date(),
        entities: response.entities,
        ...(response.searchResults && response.searchResults.length > 0
          ? { searchResults: response.searchResults }
          : {}),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save conversation to history
      await saveCurrentChat(
        [...messages, userMessage, assistantMessage],
        selectedModel
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

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
                {loadingModels
                  ? "Loading models..."
                  : modelsError
                  ? "Model loading failed"
                  : selectedModel
                  ? `Powered by ${selectedModel}`
                  : "No model selected"}
              </Caption>
            </div>
          </div>
          <div className={styles.headerRight}>
            {loadingModels ? (
              <Loader2 className={cn(styles.iconMd, styles.spinner)} />
            ) : modelsError ? (
              <Caption className={cn(styles.destructiveText, styles.textSm)}>
                ⚠️ {modelsError}
              </Caption>
            ) : models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={styles.modelSelector}
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            ) : (
              <Caption className={cn(styles.mutedText, styles.textSm)}>
                No models available
              </Caption>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className={styles.iconMd} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.map((message: Message) => (
          <div
            key={message.id}
            className={cn(
              styles.message,
              message.type === "user" && styles.messageUser,
              message.type === "assistant" && styles.messageAssistant,
              message.type === "error" && styles.messageError
            )}
          >
            <div
              className={cn(
                styles.messageAvatar,
                message.type === "user" && styles.messageAvatarUser,
                message.type === "assistant" && styles.messageAvatarAssistant,
                message.type === "error" && styles.messageAvatarError
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
            <div className={styles.messageBody}>
              <div
                className={cn(
                  styles.messageBubble,
                  message.type === "user" && styles.messageBubbleUser,
                  message.type === "assistant" && styles.messageBubbleAssistant,
                  message.type === "error" && styles.messageBubbleError
                )}
              >
                <Body className={styles.preWrap}>{message.content}</Body>
              </div>

              {/* Search Results */}
              {message.searchResults && message.searchResults.length > 0 && (
                <div className={styles.messageSources}>
                  <Micro className={styles.sourcesHeader}>Sources</Micro>
                  <div className={styles.sourcesGrid}>
                    {message.searchResults
                      .slice(0, 3)
                      .map((result: SearchResult) => (
                        <div key={result.id} className={styles.sourceCard}>
                          <div className={styles.sourceHeader}>
                            <span className={styles.sourceTitle}>
                              {result.title}
                            </span>
                            <Badge
                              variant="secondary"
                              className={styles.textXs}
                            >
                              {Math.round((result.confidenceScore ?? 0) * 100)}%
                            </Badge>
                          </div>
                          <Body className={styles.textSm}>
                            {result.summary}
                          </Body>
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
          <div className={cn(styles.message, styles.messageAssistant)}>
            <div className={cn(styles.messageAvatar, styles.messageAvatarAssistant)}>
              <Bot className={styles.messageIcon} />
            </div>
            <div className={styles.messageBody}>
              <div className={cn(styles.messageBubble, styles.messageBubbleAssistant)}>
                <div className={styles.loadingState}>
                  <div className={styles.loadingDots}>
                    <div className={styles.loadingDot} />
                    <div className={styles.loadingDot} />
                    <div className={styles.loadingDot} />
                  </div>
                  <Caption className={styles.mutedText}>Thinking...</Caption>
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
          <div className={styles.quickActionsHeader}>
            <Sparkles className={styles.iconMd} />
            <Micro className={styles.mutedText}>Quick Actions</Micro>
          </div>
          <div className={styles.quickActionsList}>
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
          <div className={styles.attachmentList}>
            {attachments.map((file, index) => (
              <div key={index} className={styles.attachmentChip}>
                <span className={styles.attachmentName}>
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.removeAttachmentButton}
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
                styles.absolute,
                styles.right2,
                styles.bottom2,
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
          className={styles.hiddenInput}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.md"
        />
      </div>
    </div>
  );
}
