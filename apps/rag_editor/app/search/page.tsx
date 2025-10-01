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
import styles from "./page.module.scss";

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
      <div className={styles.searchPage}>
        {/* Search Header */}
        <div className={styles.searchHeader}>
          <div className={styles.searchHeaderContent}>
            <SearchInput
              placeholder="Search your knowledge base..."
              className={styles.searchInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.currentTarget.value);
                }
              }}
            />
            {!hasSearched && suggestedQueries.length > 0 && (
              <div className={styles.suggestionList}>
                {suggestedQueries.map((suggestion, index) => (
                  <Button
                    key={suggestion + index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(suggestion)}
                    className={styles.suggestionButton}
                  >
                    <Sparkles className={styles.suggestionIcon} />
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.searchBody}>
          {!hasSearched ? (
            /* Welcome State */
            <div className={styles.welcomeState}>
              <div className={styles.welcomeContent}>
                <div className={styles.welcomeText}>
                  <Display className={styles.welcomeHeadline}>
                    Semantic Search
                  </Display>
                  <BodyLarge className={styles.welcomeDescription}>
                    Find information across your knowledge base using natural
                    language. Our AI understands context and relationships
                    between ideas.
                  </BodyLarge>
                </div>

                {/* Trending Topics */}
                {trendingTopics.length > 0 && (
                  <div className={styles.trendingSection}>
                    <div className={styles.trendingHeader}>
                      <TrendingUp className={styles.trendingIcon} />
                      <Caption>Trending in your workspace</Caption>
                    </div>
                    <div className={styles.trendingList}>
                      {trendingTopics.map((topic, index) => (
                        <Button
                          key={index + topic.query}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearch(topic.query)}
                          className={styles.trendingButton}
                        >
                          {topic.query}
                          <span className={styles.trendCount}>
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
            <div className={styles.resultsContainer}>
              <div className={styles.resultsInner}>
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
