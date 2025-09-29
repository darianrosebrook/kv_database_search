"use client";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Title, Caption, Body } from "../typography";
import {
  X,
  ExternalLink,
  Lightbulb,
  FileText,
  MessageSquare,
} from "lucide-react";

interface RelatedItem {
  id: string;
  title: string;
  type: "document" | "chat" | "insight";
  excerpt: string;
  confidence: number;
  lastModified?: string;
}

interface RelatedContentAsideProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  relatedItems?: RelatedItem[];
  className?: string;
}

const mockRelatedItems: RelatedItem[] = [];

export function RelatedContentAside({
  isOpen,
  onClose,
  selectedText,
  relatedItems = [],
  className,
}: RelatedContentAsideProps) {
  if (!isOpen) return null;

  const getIcon = (type: RelatedItem["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      case "insight":
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-500";
    if (confidence >= 0.8) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div
      className={cn(
        "w-80 bg-card border-l border-border flex flex-col animate-in",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Title className="text-lg">Related Content</Title>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {selectedText && (
          <div className="mt-2 p-2 bg-accent/50 rounded-md">
            <Caption className="text-xs uppercase tracking-wide mb-1">
              Selected Text
            </Caption>
            <Body className="text-sm italic">"{selectedText}"</Body>
          </div>
        )}
      </div>

      {/* Related Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {relatedItems.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getIcon(item.type)}
                <span className="text-sm font-medium truncate">
                  {item.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-mono",
                    getConfidenceColor(item.confidence)
                  )}
                >
                  {Math.round(item.confidence * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Body className="text-sm text-muted-foreground line-clamp-3 mb-2">
              {item.excerpt}
            </Body>
            {item.lastModified && (
              <Caption>Modified {item.lastModified}</Caption>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          Search for More
        </Button>
      </div>
    </div>
  );
}
