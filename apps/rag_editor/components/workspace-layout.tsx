"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Sidebar } from "./ui/sidebar";
import { TabBar } from "./ui/tab-bar";
import { Button } from "./ui/button";
import { SearchResults } from "./ui/search-results";
import { Menu, X, FileText, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/hooks/use-app-state";
import styles from "./workspace-layout.module.scss";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { activeTabId, tabs } = useAppState();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Find the active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Render content based on active tab
  const renderTabContent = () => {
    if (!activeTab) {
      return children; // Default page content
    }

    // If this is a page-level tab (no specific content), show the default children
    if (
      !activeTab.content ||
      (!activeTab.content.query &&
        !activeTab.content.sessionId &&
        !activeTab.content.documentId &&
        !activeTab.content.workspaceId)
    ) {
      return children; // Page content for search, chat, etc.
    }

    // Handle content-specific tabs
    switch (activeTab.type) {
      case "search": {
        const SearchTabContent = () => {
          const [searchResults, setSearchResults] = useState<any[]>([]);
          const [isLoading, setIsLoading] = useState(false);
          const [error, setError] = useState<string | null>(null);
          const query = activeTab.content?.query || "";

          useEffect(() => {
            if (query) {
              performSearch(query);
            }
          }, [query]);

          const performSearch = async (searchQuery: string) => {
            if (!searchQuery.trim()) return;

            setIsLoading(true);
            setError(null);

            try {
              const response = await fetch(
                `${
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
                }/search`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    query: searchQuery,
                    limit: 20,
                    mode: "comprehensive",
                  }),
                }
              );

              if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
              }

              const data = await response.json();

              // Convert search results to the format expected by SearchResults component
              const formattedResults = (data.results || []).map(
                (result: any) => ({
                  id: result.id || result.filePath || `result-${Math.random()}`,
                  title: result.title || result.fileName || "Untitled Document",
                  summary:
                    result.summary ||
                    result.text?.substring(0, 200) + "..." ||
                    "",
                  highlights: [], // TODO: Add highlight extraction when text selection feature is implemented
                  confidenceScore: result.score || 0.5,
                  rationale: `Found in ${result.filePath || "document"}`,
                  tags: result.tags || [],
                  lastUpdated: result.lastModified || new Date().toISOString(),
                  source: {
                    type:
                      result.contentType === "text"
                        ? "documentation"
                        : result.contentType === "code"
                        ? "component"
                        : result.contentType === "web"
                        ? "article"
                        : "note",
                    path: result.filePath || "",
                    url: result.uri || result.filePath || "",
                  },
                  text: result.text || result.content || "",
                  meta: result.meta,
                })
              );

              setSearchResults(formattedResults);
            } catch (err) {
              console.error("Search error:", err);
              setError(err instanceof Error ? err.message : "Search failed");
              setSearchResults([]);
            } finally {
              setIsLoading(false);
            }
          };

          const handleResultClick = (result: any) => {
            // Open the document in a new tab
            const { openDocumentTab } = useAppState.getState();
            openDocumentTab(result.id, result.title);
          };

          return (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <div className={cn(styles.tabIcon, styles.tabIconSearch)}>
                  <FileText />
                </div>
                <div className={styles.tabHeaderContent}>
                  <h1 className={styles.tabTitle}>{activeTab.title}</h1>
                  <p className={styles.tabMeta}>
                    {searchResults.length} results for "{query}"
                  </p>
                </div>
              </div>

              <div className={styles.tabBody}>
                {isLoading ? (
                  <div className={styles.centerContent}>
                    <div className={styles.loadingIndicator}>
                      <Loader2 className={styles.loadingSpinner} />
                      <span>Searching...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className={styles.centerContent}>
                    <div className={styles.errorMessage}>
                      <span className={styles.placeholderEmphasis}>
                        Search failed
                      </span>
                      <span className={styles.errorDetails}>{error}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.tabScroll}>
                    <SearchResults
                      results={searchResults}
                      query={query}
                      isLoading={false}
                      onResultClick={handleResultClick}
                      onViewDocument={handleResultClick}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        };

        return <SearchTabContent />;
      }

      case "chat":
        return (
          <div className={styles.panelContent}>
            <div className={styles.panelHeaderBlock}>
              <div className={cn(styles.tabIcon, styles.tabIconChat)}>
                <MessageSquare />
              </div>
              <h1 className={styles.panelHeadingLarge}>{activeTab.title}</h1>
            </div>
            <div className={styles.panelBodyLarge}>
              {/* TODO: Implement chat tab content when chat feature is developed */}
              <div className={styles.panelPlaceholder}>
                Chat tab content for session:{" "}
                {activeTab.content?.sessionId || "New session"}
              </div>
            </div>
          </div>
        );

      case "document":
        return (
          <div className={styles.panelContent}>
            <div className={styles.panelHeaderBlock}>
              <div className={cn(styles.tabIcon, styles.tabIconDocument)}>
                <FileText />
              </div>
              <h1 className={styles.panelHeadingLarge}>{activeTab.title}</h1>
            </div>
            <div className={styles.panelBodyLarge}>
              {/* TODO: Implement document tab content when document viewer is developed */}
              <div className={styles.panelPlaceholder}>
                Document content for:{" "}
                {activeTab.content?.documentPath ||
                  activeTab.content?.documentId ||
                  "New document"}
              </div>
            </div>
          </div>
        );

      case "workspace":
        return (
          <div className={styles.panelContent}>
            <div className={styles.panelHeaderBlock}>
              <div className={cn(styles.tabIcon, styles.tabIconWorkspace)}>
                <FileText />
              </div>
              <h1 className={styles.panelHeadingLarge}>{activeTab.title}</h1>
            </div>
            <div className={styles.panelBodyLarge}>
              {/* TODO: Implement workspace tab content when workspace management is developed */}
              <div className={styles.panelPlaceholder}>
                Workspace content for:{" "}
                {activeTab.content?.workspaceId || "Default workspace"}
              </div>
            </div>
          </div>
        );

      default:
        return children;
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          styles.sidebarWrapper,
          isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
          isMobile &&
            (isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed)
        )}
      >
        <Sidebar className={cn(isMobile && styles.sidebarShadow)} />
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Mobile Header */}
        {isMobile && (
          <div className={styles.mobileHeader}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
            <span className={styles.mobileTitle}>Obsidian Editor</span>
            <div className={styles.headerSpacer} />
          </div>
        )}

        <TabBar className={styles.desktopTabBar} />
        <main className={styles.tabArea}>{renderTabContent()}</main>
      </div>
    </div>
  );
}
