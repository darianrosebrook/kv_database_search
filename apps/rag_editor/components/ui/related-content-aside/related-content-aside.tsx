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
  Loader2,
} from "lucide-react";
import styles from "./related-content-aside.module.scss";

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
  isLoading?: boolean;
  className?: string;
}

// Related items should come from props - this component displays contextual suggestions

export function RelatedContentAside({
  isOpen,
  onClose,
  selectedText,
  relatedItems = [],
  isLoading = false,
  className,
}: RelatedContentAsideProps) {
  if (!isOpen) return null;

  const getIcon = (type: RelatedItem["type"]) => {
    switch (type) {
      case "document":
        return <FileText className={styles.itemIcon} />;
      case "chat":
        return <MessageSquare className={styles.itemIcon} />;
      case "insight":
        return <Lightbulb className={styles.itemIcon} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return styles.confidenceHigh;
    if (confidence >= 0.8) return styles.confidenceMedium;
    return styles.confidenceLow;
  };

  return (
    <div className={cn(styles.aside, className)}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Title className={styles.headerTitle}>Related Content</Title>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X />
          </Button>
        </div>
        {selectedText && (
          <div className={styles.selectedContainer}>
            <Caption className={styles.selectedLabel}>
              Selected Text
            </Caption>
            <Body className={styles.selectedText}>"{selectedText}"</Body>
          </div>
        )}
      </div>

      {/* Related Items */}
      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingIndicator}>
              <Loader2 className={styles.loadingSpinner} />
              <span>Finding related content...</span>
            </div>
          </div>
        ) : relatedItems.length > 0 ? (
          <div className={styles.itemList}>
            {relatedItems.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemMeta}>
                    {getIcon(item.type)}
                  <span className={styles.itemTitle}>
                    {item.title}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <span
                    className={cn(
                      styles.confidence,
                      getConfidenceColor(item.confidence)
                    )}
                  >
                    {Math.round(item.confidence * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.itemActionButton}
                  >
                    <ExternalLink className={styles.itemActionIcon} />
                  </Button>
                </div>
              </div>
              <Body className={styles.itemExcerpt}>
                {item.excerpt}
              </Body>
              {item.lastModified && (
                <Caption className={styles.itemFooter}>
                  Modified {item.lastModified}
                </Caption>
              )}
            </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>No related content found</div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Button
          variant="outline"
          size="sm"
          className={styles.footerButton}
        >
          Search for More
        </Button>
      </div>
    </div>
  );
}
