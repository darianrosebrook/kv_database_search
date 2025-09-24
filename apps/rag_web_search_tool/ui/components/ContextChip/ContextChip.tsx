import React from "react";
import { X, FileText } from "lucide-react";
import { Button } from "../Button";
import { Badge } from "../../../src/components/ui/badge";
import styles from "./ContextChip.module.scss";

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  source: {
    type: "documentation" | "component" | "guideline";
    path: string;
    url: string;
  };
}

interface ContextChipProps {
  result: SearchResult;
  onRemove: () => void;
  className?: string;
}

export function ContextChip({
  result,
  onRemove,
  className = "",
}: ContextChipProps) {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case "component":
        return "🧩";
      case "guideline":
        return "📋";
      default:
        return "📖";
    }
  };

  return (
    <div className={`${styles.contextChip} ${className}`}>
      <div className={styles.content}>
        <span className={styles.sourceIcon}>
          {getSourceIcon(result.source.type)}
        </span>
        <FileText className={styles.fileIcon} />
        <span className={styles.title} title={result.title}>
          {result.title}
        </span>
        <Badge variant="outline" className={styles.badge}>
          Context
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className={styles.removeButton}
      >
        <X className={styles.removeIcon} />
      </Button>
    </div>
  );
}

export type { ContextChipProps };
export default ContextChip;
