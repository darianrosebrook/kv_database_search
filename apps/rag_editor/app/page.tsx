"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { WorkspaceCard } from "@/components/ui/workspace-card";
import { Display, BodyLarge, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, PenTool, AlertCircle } from "lucide-react";
import { apiClient, ChatSession } from "@/lib/api-client";

export default function SplashScreen() {
  const [isMobile, setIsMobile] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<ChatSession[]>([]);
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
    const fetchRecentDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch recent chat sessions as a proxy for recent documents
        // In a real implementation, we might want to fetch recent document activity
        const chatHistory = await apiClient.getChatHistory();

        if (chatHistory.sessions && chatHistory.sessions.length > 0) {
          setRecentDocuments(chatHistory.sessions.slice(0, 3));
        } else {
          // Fallback to empty state if no chat sessions
          setRecentDocuments([]);
        }
      } catch (err) {
        console.error("Failed to fetch recent documents:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load recent documents"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentDocuments();
  }, []);

  // Transform chat sessions to document format for UI
  const transformedDocuments = recentDocuments.map((session) => ({
    id: session.id,
    title: session.title,
    description:
      session.messages.length > 0
        ? session.messages[0].content.substring(0, 100) +
          (session.messages[0].content.length > 100 ? "..." : "")
        : "Chat session",
    lastAccessed: new Date(session.updatedAt).toLocaleDateString(),
    isChat: true,
  }));

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
    // Check if it's a chat session or document
    const isChat = recentDocuments.some((session) => session.id === docId);
    if (isChat) {
      router.push(`/chat/${docId}`);
    } else {
      router.push(`/workspace/document/${docId}`);
    }
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
              <Caption>Recent Activity</Caption>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 border border-border rounded-lg animate-pulse"
                  >
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : transformedDocuments.length > 0 ? (
              <div className="grid gap-4">
                {transformedDocuments.map((doc, index) => (
                  <WorkspaceCard
                    key={index}
                    title={doc.title}
                    description={doc.description}
                    lastAccessed={doc.lastAccessed}
                    onClick={() => handleDocumentClick(doc.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Caption>No recent activity found</Caption>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
