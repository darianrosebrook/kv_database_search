import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageBubble } from "../../ui/components/MessageBubble";
import {
  GraphRagEntity,
  GraphRagRelationship,
  ReasoningResult,
} from "../lib/graph-rag-api";

interface GraphRagMessage {
  id: string;
  type: "user" | "assistant" | "error" | "system";
  content: string;
  timestamp: Date;
  entities?: GraphRagEntity[];
  reasoning?: ReasoningResult;
  searchCount?: number;
  confidence?: number;
  provenance?: {
    operationId: string;
    qualityMetrics: Record<string, number>;
  };
}

interface GraphRagSuggestedAction {
  type:
    | "refine_search"
    | "new_search"
    | "filter"
    | "explore"
    | "reason"
    | "find_similar";
  label: string;
  query?: string;
  entityIds?: string[];
  filters?: any;
  reasoning?: {
    question: string;
    type: "exploratory" | "targeted" | "comparative" | "causal";
  };
}

interface GraphRagChatInterfaceProps {
  initialQuery: string;
  messages: GraphRagMessage[];
  onSendMessage: (
    message: string,
    options?: {
      contextResults?: any[];
      pastedContent?: string;
      queryType?:
        | "component"
        | "pattern"
        | "token"
        | "general"
        | "reasoning"
        | "exploration";
      autoSearch?: boolean;
      enableReasoning?: boolean;
      entityIds?: string[];
    }
  ) => void;
  isLoading: boolean;
  resultsCount: number;
  contextResults: any[];
  onRemoveContext: (resultId: string) => void;
  suggestedActions: GraphRagSuggestedAction[];
  onSuggestedAction: (action: GraphRagSuggestedAction) => void;
  selectedModel: string;
  currentSession: any;
  onExploreEntity?: (entity: GraphRagEntity) => void;
  onExploreRelationship?: (relationship: GraphRagRelationship) => void;
  onReasonAbout?: (entities: GraphRagEntity[]) => void;
}

export function GraphRagChatInterface({
  initialQuery,
  messages,
  onSendMessage,
  isLoading,
  resultsCount,
  contextResults,
  onRemoveContext,
  suggestedActions,
  onSuggestedAction,
  selectedModel,
  currentSession,
  onExploreEntity,
  onExploreRelationship,
  onReasonAbout,
}: GraphRagChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [queryType, setQueryType] = useState<
    "general" | "reasoning" | "exploration"
  >("general");
  const [enableReasoning, setEnableReasoning] = useState(true);
  const [pastedContent, setPastedContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    onSendMessage(inputMessage, {
      queryType,
      autoSearch: true,
      enableReasoning,
      pastedContent: pastedContent || undefined,
    });

    setInputMessage("");
    setPastedContent("");
    setShowAdvancedOptions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length > 100) {
      setPastedContent(pastedText);
      setShowAdvancedOptions(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Graph RAG Chat</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered conversation with knowledge graph reasoning
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resultsCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {resultsCount} results
              </span>
            )}
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {selectedModel}
            </span>
          </div>
        </div>
      </div>

      {/* Context Results */}
      {contextResults.length > 0 && (
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">
              Context ({contextResults.length})
            </h3>
            <button
              onClick={() =>
                contextResults.forEach((r) => onRemoveContext(r.id))
              }
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {contextResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-2 bg-muted text-muted-foreground px-2 py-1 rounded text-xs"
              >
                <span className="truncate max-w-32">{result.title}</span>
                <button
                  onClick={() => onRemoveContext(result.id)}
                  className="hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="font-medium text-foreground mb-2">
              Start a Graph RAG Conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ask questions about your knowledge base. I can search
              semantically, identify entities, explore relationships, and
              perform multi-hop reasoning across your content.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() =>
                  setInputMessage(
                    "What are the main concepts in my knowledge base?"
                  )
                }
                className="text-xs bg-muted text-muted-foreground px-3 py-2 rounded hover:bg-muted/80"
              >
                Explore concepts
              </button>
              <button
                onClick={() =>
                  setInputMessage("Find relationships between entities")
                }
                className="text-xs bg-muted text-muted-foreground px-3 py-2 rounded hover:bg-muted/80"
              >
                Find relationships
              </button>
              <button
                onClick={() =>
                  setInputMessage(
                    "Show me recent documents and their connections"
                  )
                }
                className="text-xs bg-muted text-muted-foreground px-3 py-2 rounded hover:bg-muted/80"
              >
                Recent connections
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message as any} // GraphRagMessage is compatible with EnhancedMessage
                useGraphRag={true}
                onExploreEntity={onExploreEntity}
                onExploreRelationship={onExploreRelationship}
              />
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary text-secondary-foreground rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span className="text-sm">Thinking with Graph RAG...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Suggested actions:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onSuggestedAction(action)}
                className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded hover:bg-muted/80 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      <AnimatePresence>
        {showAdvancedOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border p-3 bg-muted/50"
          >
            <div className="space-y-3">
              {/* Query Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Query Type:
                </label>
                <div className="flex gap-2">
                  {(["general", "reasoning", "exploration"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setQueryType(type)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${
                          queryType === type
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Enable Reasoning */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableReasoning"
                  checked={enableReasoning}
                  onChange={(e) => setEnableReasoning(e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="enableReasoning"
                  className="text-xs text-muted-foreground"
                >
                  Enable multi-hop reasoning
                </label>
              </div>

              {/* Pasted Content */}
              {pastedContent && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Pasted Content:
                  </label>
                  <div className="bg-background border rounded p-2 text-xs max-h-20 overflow-auto">
                    {pastedContent.substring(0, 200)}
                    {pastedContent.length > 200 && "..."}
                  </div>
                  <button
                    onClick={() => setPastedContent("")}
                    className="text-xs text-muted-foreground hover:text-foreground mt-1"
                  >
                    Remove pasted content
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Ask about your knowledge base... (supports entities, relationships, and reasoning)"
              className="w-full resize-none border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "..." : "Send"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
              title="Advanced options"
            >
              ⚙️
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
