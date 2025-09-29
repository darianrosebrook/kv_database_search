"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { SearchInput } from "@/components/ui/search-input";
import { SearchResults } from "@/components/ui/search-results";
import { SearchFilters } from "@/components/ui/search-filters";
import { Display, BodyLarge, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { openSearchTab, openDocumentTab, tabs, addTab } = useAppState();

  // Create a search tab when the page loads
  useEffect(() => {
    const existingSearchTab = tabs.find(
      (tab) => tab.type === "search" && !tab.content?.query
    );
    if (!existingSearchTab) {
      addTab({
        title: "Search",
        type: "search",
        isActive: true,
      });
    }
  }, [tabs, addTab]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(true);

    // Open a search tab for this query
    openSearchTab(searchQuery);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
    }, 800);
  };

  // Generate suggested queries based on common patterns
  const suggestedQueries: string[] = [
    "How to implement authentication",
    "API design best practices",
    "Database optimization techniques",
    "React component patterns",
    "TypeScript advanced features",
    "Testing strategies",
    "Performance optimization",
    "Security considerations",
  ];

  // Generate trending topics based on simulated analytics
  const trendingTopics: Array<{ query: string; count: number }> = [
    { query: "React hooks", count: 45 },
    { query: "TypeScript", count: 38 },
    { query: "API design", count: 32 },
    { query: "Database queries", count: 29 },
    { query: "Testing", count: 27 },
    { query: "Performance", count: 24 },
    { query: "Security", count: 21 },
    { query: "Deployment", count: 18 },
  ];

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col">
        {/* Search Header */}
        <div className="p-6 border-b border-border">
          <div className="max-w-4xl mx-auto space-y-4">
            <SearchInput
              placeholder="Search your knowledge base..."
              className="text-lg py-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.currentTarget.value);
                }
              }}
            />
            {!hasSearched && suggestedQueries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggestion, index) => (
                  <Button
                    key={suggestion + index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(suggestion)}
                    className="gap-2 bg-transparent"
                  >
                    <Sparkles className="h-3 w-3" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!hasSearched ? (
            /* Welcome State */
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center space-y-8 max-w-2xl">
                <div className="space-y-4">
                  <Display className="text-4xl">Semantic Search</Display>
                  <BodyLarge className="text-muted-foreground">
                    Find information across your knowledge base using natural
                    language. Our AI understands context and relationships
                    between ideas.
                  </BodyLarge>
                </div>

                {/* Trending Topics */}
                {trendingTopics.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <Caption>Trending in your workspace</Caption>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {trendingTopics.map((topic, index) => (
                        <Button
                          key={index + topic.query}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearch(topic.query)}
                          className="gap-2"
                        >
                          {topic.query}
                          <span className="text-xs text-muted-foreground">
                            ({topic.count})
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                <SearchFilters />
                <SearchResults
                  results={[]}
                  query={query}
                  isLoading={isSearching}
                  onResultClick={(result) => {
                    console.log("Opening result:", result);
                    // Navigate to document or chat
                  }}
                  onViewDocument={(result) => {
                    // Open document as a tab
                    openDocumentTab(
                      result.source.path || result.id,
                      result.source.path,
                      result.title
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
