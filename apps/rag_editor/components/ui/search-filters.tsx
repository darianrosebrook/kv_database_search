"use client"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Badge } from "./badge"
import { Micro } from "./typography"
import { Filter, X, Calendar, FileText, MessageSquare, Lightbulb } from "lucide-react"
import { useState } from "react"

interface SearchFiltersProps {
  className?: string
  onFiltersChange?: (filters: SearchFilters) => void
}

interface SearchFilters {
  types: string[]
  dateRange: string
  confidence: number
}

const contentTypes = [
  { id: "document", label: "Documents", icon: FileText, count: 24 },
  { id: "chat", label: "Chats", icon: MessageSquare, count: 12 },
  { id: "insight", label: "Insights", icon: Lightbulb, count: 8 },
]

const dateRanges = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
]

export function SearchFilters({ className, onFiltersChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    dateRange: "all",
    confidence: 0.7,
  })
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange?.(updated)
  }

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type]
    updateFilters({ types: newTypes })
  }

  const clearFilters = () => {
    const cleared = { types: [], dateRange: "all", confidence: 0.7 }
    setFilters(cleared)
    onFiltersChange?.(cleared)
  }

  const hasActiveFilters = filters.types.length > 0 || filters.dateRange !== "all" || filters.confidence !== 0.7

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 text-muted-foreground"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {filters.types.length + (filters.dateRange !== "all" ? 1 : 0) + (filters.confidence !== 0.7 ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.types.map((type) => {
            const typeConfig = contentTypes.find((t) => t.id === type)
            return (
              <Badge key={type} variant="secondary" className="gap-1">
                {typeConfig && <typeConfig.icon className="h-3 w-3" />}
                {typeConfig?.label}
                <button onClick={() => toggleType(type)} className="ml-1 hover:bg-muted rounded">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
          {filters.dateRange !== "all" && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {dateRanges.find((d) => d.id === filters.dateRange)?.label}
              <button onClick={() => updateFilters({ dateRange: "all" })} className="ml-1 hover:bg-muted rounded">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.confidence !== 0.7 && (
            <Badge variant="secondary" className="gap-1">
              Confidence: {Math.round(filters.confidence * 100)}%+
              <button onClick={() => updateFilters({ confidence: 0.7 })} className="ml-1 hover:bg-muted rounded">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 p-4 bg-card border border-border rounded-lg animate-in">
          {/* Content Types */}
          <div>
            <Micro className="text-muted-foreground mb-2">Content Type</Micro>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={filters.types.includes(type.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType(type.id)}
                  className="gap-2 bg-transparent"
                >
                  <type.icon className="h-3 w-3" />
                  {type.label}
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {type.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Micro className="text-muted-foreground mb-2">Date Range</Micro>
            <div className="flex flex-wrap gap-2">
              {dateRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={filters.dateRange === range.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilters({ dateRange: range.id })}
                  className="bg-transparent"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div>
            <Micro className="text-muted-foreground mb-2">
              Minimum Confidence: {Math.round(filters.confidence * 100)}%
            </Micro>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={filters.confidence}
              onChange={(e) => updateFilters({ confidence: Number.parseFloat(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
