// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { Send, Code, Search, Sparkles, Clipboard } from "lucide-react";
import { Button } from "../Button";
import { Textarea } from "../../../src/components/ui/textarea";
import { Badge } from "../../../src/components/ui/badge";
import styles from "./ChatInput.module.scss";

interface ChatInputProps {
  onSendMessage: (
    message: string,
    options?: {
      pastedContent?: string;
      queryType?: "component" | "pattern" | "token" | "general";
      autoSearch?: boolean;
    }
  ) => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  placeholder = "Ask about components, paste code, or describe what you need...",
  className = "",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [detectedType, setDetectedType] = useState<
    "component" | "pattern" | "token" | "general"
  >("general");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect content type from pasted content
  const analyzeContent = (content: string) => {
    const htmlRegex = /<[^>]+>/;
    const cssClassRegex = /class\s*=\s*["'][^"']*["']/;
    const cssTokenRegex = /--[\w-]+/;
    const componentRegex =
      /\b(button|input|modal|card|form|nav|header|footer)\b/i;

    if (htmlRegex.test(content) || cssClassRegex.test(content)) {
      return "component";
    } else if (cssTokenRegex.test(content)) {
      return "token";
    } else if (componentRegex.test(content)) {
      return "pattern";
    }
    return "general";
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.length > 50) {
      // Likely code/markup
      setPastedContent(pasted);
      setDetectedType(analyzeContent(pasted));
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || pastedContent) {
      onSendMessage(message || "Analyze this content", {
        pastedContent: pastedContent || undefined,
        queryType: detectedType,
        autoSearch: !message.trim() && !!pastedContent, // Auto-search if only pasted content
      });
      setMessage("");
      setPastedContent("");
      setDetectedType("general");
    }
  };

  const quickActions = [
    {
      label: "Component usage",
      query: "How do I use this component?",
      icon: Code,
    },
    {
      label: "Find similar",
      query: "Find similar components or patterns",
      icon: Search,
    },
    {
      label: "Best practices",
      query: "What are the best practices for this?",
      icon: Sparkles,
    },
  ];

  return (
    <div className={`${styles.chatInput} ${className}`}>
      {/* Pasted content preview */}
      {pastedContent && (
        <div className={styles.pastedContentPreview}>
          <div className={styles.pastedContentHeader}>
            <Clipboard className={styles.pastedContentIcon} />
            <span className={styles.pastedContentLabel}>Pasted Content</span>
            <Badge variant="outline" className={styles.pastedContentBadge}>
              {detectedType}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPastedContent("");
                setDetectedType("general");
              }}
              className={styles.pastedContentCloseButton}
            >
              ×
            </Button>
          </div>
          <pre className={styles.pastedContentCode}>
            <code>{pastedContent}</code>
          </pre>
        </div>
      )}

      {/* Main input form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputContainer}>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className={styles.textarea}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={(!message.trim() && !pastedContent) || isLoading}
            className={styles.submitButton}
          >
            <Send className={styles.submitIcon} />
          </Button>
        </div>

        {/* Quick actions for pasted content */}
        {pastedContent && (
          <div className={styles.quickActions}>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessage(action.query);
                  setTimeout(
                    () => handleSubmit(new Event("submit") as any),
                    100
                  );
                }}
                className={styles.quickActionButton}
              >
                <action.icon className={styles.quickActionIcon} />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Query suggestions when empty */}
        {!message && !pastedContent && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>Try asking:</p>
            <div className={styles.suggestionsGrid}>
              {[
                "Tell me about our button component",
                "What's our primary color token?",
                "How do I implement a search filter?",
                "Show me form validation patterns",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessage(suggestion)}
                  className={styles.suggestionButton}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export type { ChatInputProps };
export default ChatInput;
