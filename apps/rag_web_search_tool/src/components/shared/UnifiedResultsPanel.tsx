// Unified Results Panel - Consolidates traditional and Graph RAG results functionality
// This component eliminates duplication between ResultsPanel and GraphRagResultsPanel

import React, { useState } from "react";
import { motion } from "motion/react";
import { Filter, ArrowUpDown, BookOpen, Search, FileX } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { KnowledgeGraph } from "../KnowledgeGraph";
import { ResultCard } from "../ResultCard";
import { DocumentDetailView } from "../DocumentDetailView";
import type {
  SearchResult,
  SuggestedAction,
} from "../../types";
import type {
  GraphRagSearchResult,
  GraphRagEntity,
  GraphRagRelationship,
  ReasoningResult,
} from "../../lib/graph-rag-api";
import { getEntityTypeColor, getRelationshipTypeColor } from "../../utils";

interface UnifiedResultsPanelProps {
  // Core props
  results: SearchResult[];
  isLoading: boolean;
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
  onViewDocument: (url: string) => void;
  query?: string;

  // Traditional results handlers
  onAddToContext?: (result: SearchResult) => void;
  onAskFollowUp?: (question: string, context: SearchResult) => void;
  onRefineSearch?: (refinedQuery: string) => void;

  // Graph RAG specific (optional)
  useGraphRag?: boolean;
  graphRagResults?: GraphRagSearchResult[];
  selectedGraphRagResult?: GraphRagSearchResult | null;
  reasoningResults?: ReasoningResult;
  allEntities?: GraphRagEntity[];
  onSelectGraphRagResult?: (result: GraphRagSearchResult) => void;
  onExploreEntity?: (entity: GraphRagEntity) => void;
  onExploreRelationship?: (relationship: GraphRagRelationship) => void;
  onReasonAbout?: (entities: GraphRagEntity[]) => void;
}

type SortOption = "relevance" | "date" | "title" | "confidence";
type FilterOption = "all" | "documentation" | "component" | "guideline";

export function UnifiedResultsPanel({
  results,
  isLoading,
  selectedResult,
  onSelectResult,
  onViewDocument,
  query = "",
  onAddToContext,
  onAskFollowUp,
  onRefineSearch,
  useGraphRag = false,
  graphRagResults = [],
  selectedGraphRagResult,
  reasoningResults,
  allEntities = [],
  onSelectGraphRagResult,
  onExploreEntity,
  onExploreRelationship,
  onReasonAbout,
}: UnifiedResultsPanelProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showDetailView, setShowDetailView] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "entities" | "reasoning">("results");

  // Use Graph RAG results if available, otherwise use traditional results
  const currentResults = useGraphRag && graphRagResults.length > 0 ? 
    graphRagResults.map(transformGraphRagToSearchResult) : results;

  // Transform Graph RAG result to SearchResult for compatibility
  function transformGraphRagToSearchResult(result: GraphRagSearchResult): SearchResult {
    return {
      id: result.id,
      title: result.metadata.section || "Document",
      summary: result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
      highlights: [
        result.text.substring(0, 100) + (result.text.length > 100 ? "..." : ""),
        `Source: ${result.metadata.sourceFile}`,
        `Type: ${result.metadata.contentType}`,
      ],
      confidenceScore: result.score,
      source: {
        type: result.metadata.contentType === "code" ? "component" : "documentation",
        path: result.metadata.sourceFile,
        url: result.metadata.url || `#${result.id}`,
      },
      rationale: result.explanation || `Graph RAG score: ${result.score.toFixed(3)}`,
      tags: [
        result.metadata.contentType,
        ...result.entities.slice(0, 2).map((e) => e.type),
      ],
      lastUpdated: result.metadata.updatedAt || new Date().toISOString().split("T")[0],
    };
  }

  // Sort and filter results
  const processedResults = React.useMemo(() => {
    let filtered = currentResults;

    // Apply filters
    if (filterBy !== "all") {
      filtered = filtered.filter((result) => result.source.type === filterBy);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return b.confidenceScore - a.confidenceScore;
        case "date":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "confidence":
          return b.confidenceScore - a.confidenceScore;
        default:
          return 0;
      }
    });
  }, [currentResults, sortBy, filterBy]);

  // Group entities by type for Graph RAG mode
  const entitiesByType = React.useMemo(() => {
    if (!useGraphRag || !allEntities.length) return {};
    
    return allEntities.reduce((acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, GraphRagEntity[]>);
  }, [allEntities, useGraphRag]);

  const handleResultSelect = (result: SearchResult) => {
    onSelectResult(result);
    
    // If Graph RAG mode and we have a corresponding Graph RAG result, select it too
    if (useGraphRag && onSelectGraphRagResult) {
      const graphRagResult = graphRagResults.find(gr => gr.id === result.id);
      if (graphRagResult) {
        onSelectGraphRagResult(graphRagResult);
      }
    }
  };

  const handleViewDocument = (url: string) => {
    if (selectedResult) {
      setShowDetailView(true);
    } else {
      onViewDocument(url);
    }
  };

  if (showDetailView && selectedResult) {
    return (
      <DocumentDetailView
        result={selectedResult}
        query={query}
        onBack={() => setShowDetailView(false)}
        onAddToContext={onAddToContext || (() => {})}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {useGraphRag ? "Graph RAG Results" : "Search Results"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {processedResults.length} results found
              {query && ` for "${query}"`}
            </p>
          </div>
          
          {useGraphRag && (
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("results")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === "results"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Results ({processedResults.length})
              </button>
              <button
                onClick={() => setActiveTab("entities")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === "entities"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entities ({allEntities.length})
              </button>
              <button
                onClick={() => setActiveTab("reasoning")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === "reasoning"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Reasoning {reasoningResults ? `(${reasoningResults.paths.length})` : "(0)"}
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="confidence">Confidence</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="component">Components</SelectItem>
              <SelectItem value="guideline">Guidelines</SelectItem>
            </SelectContent>
          </Select>

          {onRefineSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefineSearch(query)}
              className="ml-auto"
            >
              <Search className="h-4 w-4 mr-2" />
              Refine Search
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!useGraphRag || activeTab === "results" ? (
          // Results Tab
          <ScrollArea className="h-full p-4">
            {isLoading && processedResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {useGraphRag ? "Searching knowledge graph..." : "Searching..."}
                </p>
              </div>
            ) : processedResults.length === 0 ? (
              <div className="text-center py-8">
                <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {processedResults.map((result, index) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    index={index}
                    query={query}
                    isSelected={selectedResult?.id === result.id}
                    onViewDocument={handleViewDocument}
                    onSelectResult={handleResultSelect}
                    onAskFollowUp={onAskFollowUp || (() => {})}
                    onRefineSearch={onRefineSearch || (() => {})}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        ) : activeTab === "entities" ? (
          // Entities Tab (Graph RAG only)
          <ScrollArea className="h-full p-4">
            {Object.keys(entitiesByType).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No entities found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(entitiesByType).map(([type, entities]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="font-medium text-foreground">{type} ({entities.length})</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {entities.map((entity) => (
                        <div
                          key={entity.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs rounded border ${getEntityTypeColor(entity.type)}`}
                            >
                              {entity.type}
                            </span>
                            <span className="font-medium">{entity.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({entity.confidence.toFixed(2)})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {onExploreEntity && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onExploreEntity(entity)}
                              >
                                Explore
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          // Reasoning Tab (Graph RAG only)
          <ScrollArea className="h-full p-4">
            {!reasoningResults || reasoningResults.paths.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reasoning paths found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Select entities to explore their relationships
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-accent/20">
                  <h3 className="font-medium mb-2">Reasoning Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Paths Found:</span> {reasoningResults.paths.length}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {reasoningResults.confidence.toFixed(3)}
                    </div>
                  </div>
                </div>

                {reasoningResults.bestPath && (
                  <div className="border-2 border-primary rounded-lg p-4">
                    <h3 className="font-medium text-primary mb-2">Best Reasoning Path</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {reasoningResults.bestPath.entities.map((entity, index) => (
                          <React.Fragment key={entity.id}>
                            <span
                              className={`px-2 py-1 text-xs rounded border cursor-pointer ${getEntityTypeColor(entity.type)}`}
                              onClick={() => onExploreEntity?.(entity)}
                              title={`${entity.name} (${entity.type})`}
                            >
                              {entity.name}
                            </span>
                            {index < reasoningResults.bestPath!.entities.length - 1 && (
                              <span className="text-muted-foreground">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reasoningResults.bestPath.explanation}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-medium">All Reasoning Paths</h3>
                  {reasoningResults.paths.map((path, index) => (
                    <div key={path.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">
                        Path {index + 1} (Confidence: {path.confidence.toFixed(3)}, Depth: {path.depth})
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {path.entities.map((entity, entityIndex) => (
                            <React.Fragment key={entity.id}>
                              <span
                                className={`px-2 py-1 text-xs rounded border cursor-pointer ${getEntityTypeColor(entity.type)}`}
                                onClick={() => onExploreEntity?.(entity)}
                                title={`${entity.name} (${entity.type})`}
                              >
                                {entity.name}
                              </span>
                              {entityIndex < path.entities.length - 1 && (
                                <span className="text-muted-foreground">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        {path.explanation && (
                          <p className="text-sm text-muted-foreground">{path.explanation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Knowledge Graph Visualization */}
      {!useGraphRag && processedResults.length > 0 && (
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Knowledge Graph</h3>
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              View Full Graph
            </Button>
          </div>
          <div className="h-32 bg-muted rounded border">
            <KnowledgeGraph results={processedResults} />
          </div>
        </div>
      )}
    </div>
  );
}
