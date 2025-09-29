"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { SearchInput } from "@/components/ui/search-input";
import { SearchResults } from "@/components/ui/search-results";
import { SearchFilters } from "@/components/ui/search-filters";
import { Display, BodyLarge, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { apiClient, SearchResponse } from "@/lib/api-client";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await apiClient.search({
        query: searchQuery,
        limit: 20,
        searchMode: "comprehensive",
        includeRelated: true,
      });
      setSearchResults(response);
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // Get trending topics from API on component mount
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        // For now, we'll use static suggestions until we implement trending topics API
        // const trending = await apiClient.getTrendingTopics()
        // setTrendingTopics(trending)
      } catch (err) {
        console.warn("Failed to fetch trending topics:", err);
      }
    };

    fetchTrendingTopics();
  }, []);

  const suggestedQueries = [
    "vector database implementation",
    "RAG architecture patterns",
    "semantic search optimization",
    "embedding strategies",
  ];

  const trendingTopics = [
    { query: "AI agent workflows", count: 12 },
    { query: "Vector similarity search", count: 8 },
    { query: "Knowledge graph integration", count: 6 },
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
            {!hasSearched && (
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggestion, index) => (
                  <Button
                    key={index}
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
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <Caption>Trending in your workspace</Caption>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {trendingTopics.map((topic, index) => (
                      <Button
                        key={index}
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
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                <SearchFilters />
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
                <SearchResults
                  results={searchResults?.results || []}
                  query={query}
                  isLoading={isSearching}
                  totalFound={searchResults?.totalFound || 0}
                  facets={searchResults?.facets}
                  graphInsights={searchResults?.graphInsights}
                  onResultClick={(result) => {
                    console.log("Opening result:", result);
                    // Navigate to document or chat
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
