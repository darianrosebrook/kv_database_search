import React from "react";
import { motion } from "motion/react";
import ResultCard from "../../../ui/components/ResultCard";
import type { SearchResult } from "../../../types";
import type { GraphRagSearchResult } from "../../lib/graph-rag-api";

interface ResultsPanelProps {
  results: SearchResult[];
  isLoading: boolean;
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
  onViewDocument: (url: string) => void;
  query: string;
  onAddToContext: (result: SearchResult) => void;
  onAskFollowUp: (question: string, context: SearchResult) => void;
  onRefineSearch: (refinedQuery: string) => void;
  useGraphRag: boolean;
  graphRagResults: GraphRagSearchResult[];
  selectedGraphRagResult: GraphRagSearchResult | null;
  reasoningResults: any;
  allEntities: any[];
  onSelectGraphRagResult: (result: GraphRagSearchResult) => void;
  onExploreEntity: (entity: any) => void;
  onExploreRelationship: (relationship: any) => void;
  onReasonAbout: (entities: any[]) => void;
}

export function ResultsPanel({
  results,
  isLoading,
  selectedResult,
  onSelectResult,
  onViewDocument,
  query,
  onAddToContext,
  onAskFollowUp,
  onRefineSearch,
  useGraphRag,
  graphRagResults,
  selectedGraphRagResult,
  reasoningResults,
  allEntities,
  onSelectGraphRagResult,
  onExploreEntity,
  onExploreRelationship,
  onReasonAbout,
}: ResultsPanelProps) {
  const displayResults = useGraphRag ? graphRagResults : results;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {useGraphRag ? "Knowledge Graph Results" : "Search Results"}
        </h2>
        <span className="text-sm text-muted-foreground">
          {displayResults.length} results
        </span>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : displayResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No results found</p>
            <p className="text-sm mt-2">Try adjusting your search terms</p>
          </div>
        ) : (
          displayResults.map((result, index) => (
            <ResultCard
              key={result.id}
              result={result}
              index={index}
              query={query}
              isSelected={
                result.id === (selectedResult?.id || selectedGraphRagResult?.id)
              }
              onSelect={useGraphRag ? onSelectGraphRagResult : onSelectResult}
              onAddToContext={onAddToContext}
            />
          ))
        )}
      </div>

      {/* Footer Actions */}
      {displayResults.length > 0 && (
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onRefineSearch(query)}
              className="flex-1 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
            >
              Refine Search
            </button>
            {useGraphRag && allEntities.length > 0 && (
              <button
                onClick={() => onReasonAbout(allEntities.slice(0, 2))}
                className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Find Relationships
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
