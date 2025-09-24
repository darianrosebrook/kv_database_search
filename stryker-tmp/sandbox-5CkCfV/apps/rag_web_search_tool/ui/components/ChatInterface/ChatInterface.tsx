// @ts-nocheck
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  User,
  Send,
  MessageCircle,
  Search,
  Filter,
  Lightbulb,
  AlertCircle,
  Code,
} from "lucide-react";
import { Button } from "../Button";
import { ScrollArea } from "../../../src/components/ui/scroll-area";
import { ContextChip } from "../ContextChip";
import { ChatInput } from "../ChatInput";
import { MessageContent } from "../../../src/components/MessageContent";
import { LoadingSkeleton } from "../../../src/components/LoadingSkeleton";
import styles from "./ChatInterface.module.scss";

interface Message {
  id: string;
  type: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
}

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

interface ChatInterfaceProps {
  initialQuery: string;
  messages: Message[];
  onSendMessage: (
    message: string,
    options?: {
      contextResults?: SearchResult[];
      pastedContent?: string;
      queryType?: "component" | "pattern" | "token" | "general";
      autoSearch?: boolean;
    }
  ) => void;
  isLoading: boolean;
  resultsCount?: number;
  contextResults?: SearchResult[];
  onRemoveContext?: (resultId: string) => void;
  suggestedActions?: Array<{
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    filters?: any;
  }>;
  onSuggestedAction?: (action: {
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    filters?: any;
  }) => void;
}

export function ChatInterface({
  initialQuery,
  messages,
  onSendMessage,
  isLoading,
  resultsCount,
  contextResults = [],
  onRemoveContext,
  suggestedActions = [],
  onSuggestedAction,
}: ChatInterfaceProps) {
  const [currentMessage, setCurrentMessage] = useState("");

  const handleEnhancedMessage = (
    message: string,
    options?: {
      pastedContent?: string;
      queryType?: "component" | "pattern" | "token" | "general";
      autoSearch?: boolean;
    }
  ) => {
    onSendMessage(message, {
      contextResults,
      ...options,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      handleEnhancedMessage(currentMessage);
      setCurrentMessage("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={styles.chatInterface}
      role="region"
      aria-label="Chat interface"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Search Context</h3>
        <p className={styles.subtitle}>Ask questions about the results</p>

        {/* Context chips */}
        {contextResults.length > 0 && (
          <div className={styles.contextSection}>
            <p className={styles.contextLabel}>
              Document context ({contextResults.length}):
            </p>
            <div className={styles.contextChips}>
              {contextResults.map((result) => (
                <div key={result.id}>
                  <ContextChip
                    result={result}
                    onRemove={() => onRemoveContext?.(result.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className={styles.scrollArea}>
        <div className={styles.messagesList}>
          {/* Show empty state if no messages */}
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <MessageCircle className={styles.iconInner} />
              </div>
              <div className={styles.emptyStateContent}>
                <h4 className={styles.title}>
                  {resultsCount && resultsCount > 0
                    ? "Ask questions about the results"
                    : "Start a conversation"}
                </h4>
                <p className={styles.description}>
                  {resultsCount && resultsCount > 0
                    ? `I found ${resultsCount} relevant documentation sections. Ask me questions about them or click on results to add them to context.`
                    : "Ask about components, paste code, or describe what you need to get started."}
                </p>
              </div>
            </div>
          ) : null}

          {/* Messages */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.message}
            >
              <div
                className={`${styles.messageAvatar} ${styles[message.type]}`}
              >
                {message.type === "user" ? (
                  <User className={styles.avatarIcon} />
                ) : message.type === "error" ? (
                  <AlertCircle className={styles.avatarIcon} />
                ) : (
                  <Bot className={styles.avatarIcon} />
                )}
              </div>
              <div className={styles.messageContent}>
                <div
                  className={`${styles.messageBubble} ${styles[message.type]}`}
                >
                  <MessageContent
                    content={message.content}
                    type={message.type}
                  />
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && <LoadingSkeleton lines={3} showAvatar={true} />}

          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <div className={styles.suggestionsContainer}>
              <div className={styles.suggestionsHeader}>
                <Lightbulb className={styles.suggestionsIcon} />
                <span className={styles.suggestionsTitle}>Suggestions</span>
              </div>
              <div className={styles.suggestionsGrid}>
                {suggestedActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="small"
                    onClick={() => onSuggestedAction?.(action)}
                  >
                    {action.type === "new_search" ||
                    action.type === "refine_search" ? (
                      <Search />
                    ) : action.type === "filter" ? (
                      <Filter />
                    ) : (
                      <Lightbulb />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className={styles.footer}>
        <ChatInput
          onSendMessage={handleEnhancedMessage}
          isLoading={isLoading}
          placeholder={
            contextResults.length > 0
              ? "Ask about the selected documents or paste code to analyze..."
              : "Ask about components, paste code, or describe what you need..."
          }
        />
      </div>
    </motion.div>
  );
}

export default ChatInterface;
