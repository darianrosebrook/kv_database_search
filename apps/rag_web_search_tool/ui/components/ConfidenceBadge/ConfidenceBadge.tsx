/**
 * Confidence badge component
 */
import React from "react";
import { Badge } from "../Badge";
import styles from "./ConfidenceBadge.module.scss";

export interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
  showPercentage?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  className = "",
  showPercentage = true,
}) => {
  const getVariant = (
    confidence: number
  ): "default" | "status" | "counter" | "tag" => {
    if (confidence >= 0.8) return "default";
    if (confidence >= 0.6) return "status";
    return "default";
  };

  const getLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const percentage = Math.round(confidence * 100);
  const label = showPercentage
    ? `${getLabel(confidence)} (${percentage}%)`
    : getLabel(confidence);

  return (
    <Badge
      variant={getVariant(confidence)}
      size="small"
      className={`${styles.confidenceBadge} ${className}`}
    >
      {label}
    </Badge>
  );
};

export default ConfidenceBadge;
