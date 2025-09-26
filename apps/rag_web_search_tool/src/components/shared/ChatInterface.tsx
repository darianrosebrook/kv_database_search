import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "../../../ui/components/Button";
import { ChatInput } from "../../../ui/components/ChatInput";
import { MessageBubble } from "../../../ui/components/MessageBubble";
import type { EnhancedMessage, SuggestedAction } from "../../../types";
import type { GraphRagEntity } from "../../lib/graph-rag-api";

interface ChatInterfaceProps {
  initialQuery: string;
  messages: EnhancedMessage[];
  onSendMessage: (message: string, options?) => void;
  isLoading: boolean;
  resultsCount: number;
  selectedModel: string;
  contextResults;
  onRemoveContext: (result) => void;
  suggestedActions: SuggestedAction[];
  onSuggestedAction: (action: SuggestedAction) => void;
  currentSession;
  useGraphRag: boolean;
  onExploreEntity: (entity: GraphRagEntity) => void;
  onExploreRelationship: (relationship) => void;
  onReasonAbout: (entities: GraphRagEntity[]) => void;
}

export function ChatInterface({
  initialQuery,
  messages,
  onSendMessage,
  isLoading,
  resultsCount,
  selectedModel,
  contextResults,
  onRemoveContext,
  suggestedActions,
  onSuggestedAction,
  currentSession,
  useGraphRag,
  onExploreEntity,
  onExploreRelationship,
  onReasonAbout,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Chat</h2>
          {resultsCount > 0 && (
            <span className="text-sm text-muted-foreground">
              ({resultsCount} results)
            </span>
          )}
        </div>
        {useGraphRag && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
            Knowledge Graph
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation about your knowledge base</p>
            <p className="text-sm mt-2">
              {useGraphRag
                ? "Ask questions about entities, relationships, and reasoning"
                : "Ask questions about your documents and components"}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MessageBubble
                message={message}
                onExploreEntity={onExploreEntity}
                onExploreRelationship={onExploreRelationship}
                onReasonAbout={onReasonAbout}
                showEntityActions={useGraphRag}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Context Results */}
      {contextResults.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Context ({contextResults.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => contextResults.forEach(onRemoveContext)}
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {contextResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 bg-secondary rounded text-sm"
              >
                <span className="truncate">{result.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveContext(result)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Suggested Actions</span>
          </div>
          <div className="space-y-2">
            {suggestedActions.slice(0, 3).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onSuggestedAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSend}
          onKeyPress={handleKeyPress}
          placeholder={
            useGraphRag
              ? "Ask about entities, relationships, or reasoning..."
              : "Ask about your knowledge base..."
          }
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {selectedModel} • {messages.length} messages
          </span>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
              Thinking...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
