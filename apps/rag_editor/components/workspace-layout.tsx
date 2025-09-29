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
                  highlights: [], // TODO: Add highlight extraction
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
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 p-6 border-b border-border">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold">{activeTab.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} results for "{query}"
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-destructive">
                      <p className="font-medium">Search failed</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                ) : (
                  <SearchResults
                    results={searchResults}
                    query={query}
                    isLoading={false}
                    onResultClick={handleResultClick}
                    onViewDocument={handleResultClick}
                  />
                )}
              </div>
            </div>
          );
        };

        return <SearchTabContent />;
      }

      case "chat":
        return (
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-green-600" />
              </div>
              <h1 className="text-2xl font-semibold">{activeTab.title}</h1>
            </div>
            <div className="flex-1">
              {/* TODO: Implement chat tab content */}
              <div className="text-center text-muted-foreground py-12">
                Chat tab content for session:{" "}
                {activeTab.content?.sessionId || "New session"}
              </div>
            </div>
          </div>
        );

      case "document":
        return (
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <h1 className="text-2xl font-semibold">{activeTab.title}</h1>
            </div>
            <div className="flex-1">
              {/* TODO: Implement document tab content */}
              <div className="text-center text-muted-foreground py-12">
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
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <h1 className="text-2xl font-semibold">{activeTab.title}</h1>
            </div>
            <div className="flex-1">
              {/* TODO: Implement workspace tab content */}
              <div className="text-center text-muted-foreground py-12">
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
    <div className="h-screen flex bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "transition-transform duration-200 ease-in-out z-50",
          isMobile
            ? cn(
                "fixed left-0 top-0 h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              )
            : "relative"
        )}
      >
        <Sidebar className={cn(isMobile && "shadow-lg")} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-border md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
            <span className="text-title font-medium">Obsidian Editor</span>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        )}

        <TabBar className="hidden md:flex" />
        <main className="flex-1 overflow-hidden">{renderTabContent()}</main>
      </div>
    </div>
  );
}
