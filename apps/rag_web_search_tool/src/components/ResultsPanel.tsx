import React, { useState } from "react";
import { motion } from "motion/react";
import { Filter, ArrowUpDown, BookOpen, Search, FileX } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { ResultCard } from "./ResultCard";
import { DocumentDetailView } from "./DocumentDetailView";
import type { SearchResult } from "../types";

interface ResultsPanelProps {
  results: SearchResult[];
  isLoading: boolean;
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
  onViewDocument: (url: string) => void;
  onAddToContext?: (result: SearchResult) => void;
  onAskFollowUp?: (question: string, context: SearchResult) => void;
  onRefineSearch?: (refinedQuery: string) => void;
  query?: string;
}

export function ResultsPanel({
  results,
  isLoading,
  selectedResult,
  onSelectResult,
  onViewDocument,
  onAddToContext,
  onAskFollowUp,
  onRefineSearch,
  query = "",
}: ResultsPanelProps) {
  const [viewingDetails, setViewingDetails] = useState<SearchResult | null>(
    null
  );
  const displayResults = results;

  const handleViewDetails = (result: SearchResult) => {
    setViewingDetails(result);
  };

  const handleBackToResults = () => {
    setViewingDetails(null);
  };

  const handleAddToContext = (result: SearchResult) => {
    onAddToContext?.(result);
    onSelectResult(result); // Also select the result
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full flex items-center justify-center bg-card border border-border rounded-xl shadow-sm"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="font-medium">Searching your vault...</h3>
            <p className="text-muted-foreground text-sm">
              Analyzing relevance and ranking results
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Empty state when no results found
  if (displayResults.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full flex items-center justify-center bg-card border border-border rounded-xl shadow-sm"
      >
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <FileX className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">No results found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Try adjusting your search terms or check for typos. You can also
              try broader keywords.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <p>
              💡 <strong>Tips:</strong>
            </p>
            <ul className="text-left space-y-1 max-w-xs">
              <li>
                • Use broader terms like "button" instead of
                "primary-button-variant"
              </li>
              <li>• Try synonyms or related concepts</li>
              <li>• Check spelling and remove special characters</li>
            </ul>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show document detail view if viewing details
  if (viewingDetails) {
    return (
      <DocumentDetailView
        result={viewingDetails}
        query={query}
        onBack={handleBackToResults}
        onAddToContext={handleAddToContext}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full bg-card border border-border rounded-xl shadow-sm flex flex-col"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h3>Search Results</h3>
            <span className="text-muted-foreground">
              ({displayResults.length})
            </span>
          </div>

          <div className="flex gap-2">
            <Select defaultValue="relevance">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <KnowledgeGraph
          currentDoc={
            selectedResult?.title ||
            displayResults[0]?.title ||
            "Search Results"
          }
          relatedDocs={displayResults.slice(1, 4).map((r) => r.title)}
        />
      </div>

      <ScrollArea className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 pb-4">
          {displayResults.map((result, index) => (
            <ResultCard
              key={result.id}
              result={result}
              index={index}
              query={query}
              isSelected={selectedResult?.id === result.id}
              onViewDocument={onViewDocument}
              onSelectResult={onSelectResult}
              onAskFollowUp={onAskFollowUp || (() => {})}
              onRefineSearch={onRefineSearch || (() => {})}
            />
          ))}
          {/* Add some bottom padding for better scrolling */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </motion.div>
  );
}
