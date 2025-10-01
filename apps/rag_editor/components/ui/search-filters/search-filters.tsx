"use client";

import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Badge } from "../badge";
import { Micro } from "../typography";
import {
  Filter,
  X,
  Calendar,
  FileText,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";
import styles from "./search-filters.module.scss";

interface SearchFiltersProps {
  className?: string;
  onFiltersChange?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  types: string[];
  dateRange: string;
  confidence: number;
}

const contentTypes = [
  { id: "document", label: "Documents", icon: FileText, count: 24 },
  { id: "chat", label: "Chats", icon: MessageSquare, count: 12 },
  { id: "insight", label: "Insights", icon: Lightbulb, count: 8 },
];

const dateRanges = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
];

export function SearchFilters({
  className,
  onFiltersChange,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    dateRange: "all",
    confidence: 0.7,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange?.(updated);
  };

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    updateFilters({ types: newTypes });
  };

  const clearFilters = () => {
    const cleared = { types: [], dateRange: "all", confidence: 0.7 };
    setFilters(cleared);
    onFiltersChange?.(cleared);
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.dateRange !== "all" ||
    filters.confidence !== 0.7;

  return (
    <div className={cn(styles.filters, className)}>
      {/* Filter Toggle */}
      <div className={styles.toggleRow}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleButton}
        >
          <Filter className={styles.iconMd} />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className={styles.toggleBadge}>
              {filters.types.length +
                (filters.dateRange !== "all" ? 1 : 0) +
                (filters.confidence !== 0.7 ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className={styles.clearButton}
          >
            <X className={styles.iconSmall} />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          {filters.types.map((type) => {
            const typeConfig = contentTypes.find((t) => t.id === type);
            return (
              <Badge key={type} variant="secondary" className={styles.activeBadge}>
                {typeConfig && <typeConfig.icon className={styles.iconSmall} />}
                {typeConfig?.label}
                <button
                  type="button"
                  onClick={() => toggleType(type)}
                  className={styles.badgeRemove}
                >
                  <X className={styles.iconSmall} />
                </button>
              </Badge>
            );
          })}
          {filters.dateRange !== "all" && (
            <Badge variant="secondary" className={styles.activeBadge}>
              <Calendar className={styles.iconSmall} />
              {dateRanges.find((d) => d.id === filters.dateRange)?.label}
              <button
                type="button"
                onClick={() => updateFilters({ dateRange: "all" })}
                className={styles.badgeRemove}
              >
                <X className={styles.iconSmall} />
              </button>
            </Badge>
          )}
          {filters.confidence !== 0.7 && (
            <Badge variant="secondary" className={styles.activeBadge}>
              Confidence: {Math.round(filters.confidence * 100)}%+
              <button
                type="button"
                onClick={() => updateFilters({ confidence: 0.7 })}
                className={styles.badgeRemove}
              >
                <X className={styles.iconSmall} />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className={styles.expandedPanel}>
          {/* Content Types */}
          <div className={styles.section}>
            <Micro className={styles.sectionLabel}>Content Type</Micro>
            <div className={styles.optionGroup}>
              {contentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={
                    filters.types.includes(type.id) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleType(type.id)}
                  className={styles.contentButton}
                >
                  <type.icon className={styles.iconSmall} />
                  {type.label}
                  <Badge variant="secondary" className={styles.optionBadge}>
                    {type.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className={styles.section}>
            <Micro className={styles.sectionLabel}>Date Range</Micro>
            <div className={styles.optionGroup}>
              {dateRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={
                    filters.dateRange === range.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => updateFilters({ dateRange: range.id })}
                  className={styles.contentButton}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className={styles.section}>
            <Micro className={styles.sectionLabel}>
              Minimum Confidence: {Math.round(filters.confidence * 100)}%
            </Micro>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={filters.confidence}
              onChange={(e) =>
                updateFilters({ confidence: Number.parseFloat(e.target.value) })
              }
              className={styles.slider}
            />
            <div className={styles.sliderMarks}>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
