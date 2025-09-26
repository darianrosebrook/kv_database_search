import React from "react";
import { Badge } from "../../../src/components/ui/badge";

export interface ConfidenceBadgeProps {
  score: number;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  precision?: number;
  className?: string;
}

const getConfidenceColor = (score: number) => {
  if (score >= 0.8) return "text-green-600 dark:text-green-400";
  if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
  return "text-orange-600 dark:text-orange-400";
};

const getConfidenceLevel = (score: number) => {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
};

const getConfidenceIcon = (score: number) => {
  if (score >= 0.8) return "✓";
  if (score >= 0.6) return "~";
  return "!";
};

export function ConfidenceBadge({
  score,
  variant = "outline",
  size = "md",
  showIcon = false,
  precision = 0,
  className = "",
}: ConfidenceBadgeProps) {
  const percentage = Math.round(score * 100);
  const colorClass = getConfidenceColor(score);
  const level = getConfidenceLevel(score);
  const icon = getConfidenceIcon(score);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const content =
    precision > 0
      ? `${(score * 100).toFixed(precision)}% match`
      : `${percentage}% match`;

  return (
    <Badge
      variant={variant}
      className={`${sizeClasses[size]} ${colorClass} ${className}`}
      title={`Confidence level: ${level} (${content})`}
      data-confidence-level={level}
    >
      {showIcon && <span className="mr-1">{icon}</span>}
      {content}
    </Badge>
  );
}
