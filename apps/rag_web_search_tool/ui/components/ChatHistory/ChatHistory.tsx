import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  MessageSquare,
  Trash2,
  Plus,
  Calendar,
  Bot,
  User,
  Save,
  Clock,
} from "lucide-react";
import { Button } from "../Button";
import { ScrollArea } from "../ScrollArea";
import { apiService } from "../../../src/lib/api";
import styles from "./ChatHistory.module.scss";

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
  model?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  messageCount: number;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onToggle: () => void;
  onLoadSession: (session: ChatSession) => void;
  onNewChat: () => void;
  currentSessionId?: string;
  className?: string;
}

export function ChatHistory({
  isOpen,
  onToggle,
  onLoadSession,
  onNewChat,
  currentSessionId,
  className,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement actual API call when backend supports it
      // const response = await apiService.getChatHistory();

      // For now, use mock data
      const mockSessions: ChatSession[] = [
        {
          id: "1",
          title: "Sample Chat Session",
          messages: [
            {
              role: "user",
              content: "Hello, how can you help me?",
              timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            },
            {
              role: "assistant",
              content:
                "I can help you search through your knowledge base and answer questions about your documents.",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          model: "llama3.1",
          messageCount: 2,
        },
        {
          id: "2",
          title: "Design System Questions",
          messages: [
            {
              role: "user",
              content: "What are the main components in the design system?",
              timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            },
            {
              role: "assistant",
              content:
                "The design system includes Button, Input, Modal, Card, and many other components...",
              timestamp: new Date(Date.now() - 172800000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          model: "llama3.1",
          messageCount: 4,
        },
      ];

      setSessions(mockSessions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load chat history"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = (session: ChatSession) => {
    onLoadSession(session);
    onToggle(); // Close sidebar after loading
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // TODO: Implement actual delete functionality
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSaveCurrentChat = async () => {
    try {
      // TODO: Implement save functionality for current chat
      console.log("Save current chat");
    } catch (err) {
      console.error("Failed to save chat:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        return "Just now";
      }
      return `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSessionPreview = (session: ChatSession) => {
    const lastUserMessage = [...session.messages]
      .reverse()
      .find((msg) => msg.role === "user");

    return (
      lastUserMessage?.content.substring(0, 60) +
        (lastUserMessage && lastUserMessage.content.length > 60 ? "..." : "") ||
      "No messages"
    );
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.backdrop}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`${styles.chatHistory} ${className || ""}`}
          >
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <History className={styles.headerIcon} />
                <h3 className={styles.headerTitle}>Chat History</h3>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={onToggle}
                className={styles.closeButton}
              >
                ✕
              </Button>
            </div>

            <div className={styles.toolbar}>
              <Button
                variant="primary"
                size="small"
                onClick={onNewChat}
                className={styles.newChatButton}
              >
                <Plus className={styles.buttonIcon} />
                New Chat
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleSaveCurrentChat}
                className={styles.saveButton}
              >
                <Save className={styles.buttonIcon} />
                Save Current
              </Button>
            </div>

            <ScrollArea className={styles.content}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.loadingSpinner} />
                  <p>Loading chat history...</p>
                </div>
              ) : error ? (
                <div className={styles.error}>
                  <p className={styles.errorMessage}>{error}</p>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={loadChatHistory}
                  >
                    Retry
                  </Button>
                </div>
              ) : sessions.length === 0 ? (
                <div className={styles.empty}>
                  <MessageSquare className={styles.emptyIcon} />
                  <h4 className={styles.emptyTitle}>No chat history</h4>
                  <p className={styles.emptyDescription}>
                    Start a conversation to see your chat history here
                  </p>
                  <Button variant="primary" onClick={onNewChat}>
                    <Plus className={styles.buttonIcon} />
                    Start New Chat
                  </Button>
                </div>
              ) : (
                <div className={styles.sessionsList}>
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${styles.sessionItem} ${
                        currentSessionId === session.id ? styles.active : ""
                      }`}
                    >
                      <div
                        className={styles.sessionContent}
                        onClick={() => handleLoadSession(session)}
                      >
                        <div className={styles.sessionHeader}>
                          <h4 className={styles.sessionTitle}>
                            {session.title}
                          </h4>
                          <div className={styles.sessionMeta}>
                            <span className={styles.messageCount}>
                              {session.messageCount} messages
                            </span>
                            <span className={styles.sessionDate}>
                              {formatDate(session.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <p className={styles.sessionPreview}>
                          {getSessionPreview(session)}
                        </p>

                        <div className={styles.sessionFooter}>
                          <div className={styles.modelInfo}>
                            <Bot className={styles.modelIcon} />
                            <span className={styles.modelName}>
                              {session.model || "Unknown model"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className={styles.deleteButton}
                          >
                            <Trash2 className={styles.deleteIcon} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatHistory;
