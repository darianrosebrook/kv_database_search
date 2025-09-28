/**
 * Context chip component
 */
import React from "react";
import { Badge } from "../Badge";
import { Button } from "../Button";
import styles from "./ContextChip.module.scss";

export interface ContextChipProps {
  label: string;
  onRemove?: () => void;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export const ContextChip: React.FC<ContextChipProps> = ({
  label,
  onRemove,
  className = "",
  variant = "default",
}) => {
  return (
    <div className={`${styles.contextChip} ${className}`}>
      <Badge variant="default" size="small">
        {label}
      </Badge>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className={styles.removeButton}
          aria-label={`Remove ${label}`}
        >
          ×
        </Button>
      )}
    </div>
  );
};

export default ContextChip;
