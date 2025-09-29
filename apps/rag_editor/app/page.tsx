"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { WorkspaceCard } from "@/components/ui/workspace-card";
import { Display, BodyLarge, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, PenTool, AlertCircle } from "lucide-react";
import {
  fetchRecentDocuments,
  formatRelativeTime,
  type RecentDocument,
} from "@/lib/api";

export default function SplashScreen() {
  const [isMobile, setIsMobile] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const loadRecentDocuments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchRecentDocuments();
        if (response.error) {
          setError(response.error);
        } else {
          setRecentDocuments(response.documents);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load recent documents"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentDocuments();
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  const handleNewDocument = () => {
    router.push("/workspace/document/new");
  };

  const handleNewWorkspace = () => {
    router.push("/workspace");
  };

  const handleDocumentClick = (docId: string) => {
    // URL encode the document ID to handle special characters and paths
    const encodedId = encodeURIComponent(docId);
    router.push(`/workspace/document/${encodedId}`);
  };

  // Redirect to mobile view on mobile devices
  if (isMobile) {
    window.location.href = "/mobile";
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-workspace-accent rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-workspace-accent-foreground" />
            </div>
            <span className="text-title font-medium font-sans">
              {"Knowledge Vector"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewWorkspace}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <Display className="text-balance">
              Knowledge Without
              <br />
              Limitation
            </Display>
            <BodyLarge className="text-muted-foreground max-w-lg mx-auto">
              Transform your thoughts into interconnected knowledge with
              AI-powered insights and semantic search.
            </BodyLarge>
          </div>

          {/* Search */}
          <div className="space-y-4">
            <SearchInput
              placeholder="Search your knowledge base..."
              className="text-lg py-4"
              onKeyDown={handleSearchKeyDown}
            />
            <div className="h-px bg-border" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <Button
                onClick={handleNewDocument}
                size="lg"
                className="bg-workspace-accent hover:bg-workspace-accent/90 text-workspace-accent-foreground font-medium px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <PenTool className="h-5 w-5 mr-3" />
                Create New Document
              </Button>
            </div>
            <div className="h-px bg-border" />
          </div>

          {/* Recent Documents */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <Caption>Recently Accessed</Caption>
            </div>

            {isLoading && (
              <div className="grid gap-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <Caption className="text-destructive font-medium">
                    Failed to load recent documents
                  </Caption>
                  <Caption className="text-destructive/80">{error}</Caption>
                </div>
              </div>
            )}

            {!isLoading && !error && recentDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <Caption>No recent documents found</Caption>
                <Caption className="text-sm">
                  Start by creating or importing some documents
                </Caption>
              </div>
            )}

            {!isLoading && !error && recentDocuments.length > 0 && (
              <div className="grid gap-4">
                {recentDocuments.map((doc, index) => (
                  <WorkspaceCard
                    key={doc.id || index}
                    title={doc.title}
                    description={doc.description}
                    lastAccessed={formatRelativeTime(doc.lastAccessed)}
                    onClick={() => handleDocumentClick(doc.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
