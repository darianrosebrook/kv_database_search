import React from "react";
import { motion } from "motion/react";
import type { EnhancedMessage } from "../../../src/types";
import type {
  GraphRagEntity,
  GraphRagRelationship,
} from "../../../src/lib/graph-rag-api";
import { getMessageTypeIcon, getEntityTypeColor } from "../../../src/utils";

export interface MessageBubbleProps {
  message: EnhancedMessage;
  useGraphRag?: boolean;
  onExploreEntity?: (entity: GraphRagEntity) => void;
  onExploreRelationship?: (relationship: GraphRagRelationship) => void;
  className?: string;
}

export function MessageBubble({
  message,
  useGraphRag = false,
  onExploreEntity,
  onExploreRelationship,
  className = "",
}: MessageBubbleProps) {
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${
        message.type === "user" ? "justify-end" : "justify-start"
      } ${className}`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.type === "user"
            ? "bg-primary text-primary-foreground"
            : message.type === "error"
            ? "bg-destructive text-destructive-foreground"
            : message.type === "system"
            ? "bg-muted text-muted-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {/* Message Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{getMessageTypeIcon(message.type)}</span>
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {message.confidence && (
            <span className="text-xs bg-black/10 px-2 py-1 rounded">
              Confidence: {message.confidence.toFixed(2)}
            </span>
          )}
          {message.searchCount && (
            <span className="text-xs bg-black/10 px-2 py-1 rounded">
              {message.searchCount} results
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

        {/* Graph RAG Enhancements - Entities */}
        {useGraphRag && message.entities && message.entities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <p className="text-xs opacity-70 mb-2">
              Entities ({message.entities.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {message.entities.slice(0, 8).map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => onExploreEntity?.(entity)}
                  className={`text-xs px-2 py-1 rounded border transition-colors hover:shadow-sm ${getEntityTypeColor(
                    entity.type
                  )}`}
                  title={`${entity.name} (${
                    entity.type
                  }, confidence: ${entity.confidence.toFixed(2)})`}
                >
                  {entity.name}
                </button>
              ))}
              {message.entities.length > 8 && (
                <span className="text-xs opacity-70 px-2 py-1">
                  +{message.entities.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Graph RAG Enhancements - Entities (non-useGraphRag version) */}
        {!useGraphRag && message.entities && message.entities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <p className="text-xs opacity-70 mb-2">
              Entities ({message.entities.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {message.entities.slice(0, 8).map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => onExploreEntity?.(entity)}
                  className={`text-xs px-2 py-1 rounded border transition-colors hover:shadow-sm ${getEntityTypeColor(
                    entity.type
                  )}`}
                  title={`${entity.name} (${
                    entity.type
                  }, confidence: ${entity.confidence.toFixed(2)})`}
                >
                  {entity.name}
                </button>
              ))}
              {message.entities.length > 8 && (
                <span className="text-xs opacity-70 px-2 py-1">
                  +{message.entities.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reasoning Summary */}
        {message.reasoning && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <p className="text-xs opacity-70 mb-2">Reasoning:</p>
            <div className="text-xs space-y-1">
              <div>
                <span className="font-medium">Paths:</span>{" "}
                {message.reasoning.paths.length}
              </div>
              <div>
                <span className="font-medium">Confidence:</span>{" "}
                {message.reasoning.confidence.toFixed(3)}
              </div>
              {message.reasoning.bestPath && (
                <div>
                  <span className="font-medium">Best Path:</span>{" "}
                  {message.reasoning.bestPath.entities
                    .map((e) => e.name)
                    .join(" → ")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provenance */}
        {message.provenance && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <p className="text-xs opacity-70 mb-2">Quality Metrics:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(message.provenance.qualityMetrics).map(
                ([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span>{" "}
                    {value.toFixed(2)}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
