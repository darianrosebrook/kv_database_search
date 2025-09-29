"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { WorkspaceCard } from "@/components/ui/workspace-card";
import { MobileNavigation } from "@/components/ui/mobile-navigation";
import { Display, BodyLarge, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus, Clock, TrendingUp, AlertCircle, FileText } from "lucide-react";
import {
  fetchRecentDocuments,
  formatRelativeTime,
  type RecentDocument,
} from "@/lib/api";

export default function MobilePage() {
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

  const handleDocumentClick = (docId: string) => {
    // URL encode the document ID to handle special characters and paths
    const encodedId = encodeURIComponent(docId);
    router.push(`/workspace/document/${encodedId}`);
  };

  if (!isMobile) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Display className="text-2xl">Mobile View</Display>
          <BodyLarge className="text-muted-foreground">
            Resize your browser to mobile width to see the mobile interface.
          </BodyLarge>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-workspace-accent rounded-md" />
            <span className="text-lg font-medium">Obsidian</span>
          </div>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <SearchInput placeholder="Search..." showShortcut={false} />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <Display className="text-2xl">Welcome Back</Display>
          <BodyLarge className="text-muted-foreground">
            Continue where you left off
          </BodyLarge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2 bg-transparent"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">New Doc</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2 bg-transparent"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Trending</span>
          </Button>
        </div>

        {/* Recent Documents */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Caption>Recent</Caption>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <Caption className="text-destructive text-sm">
                Failed to load documents
              </Caption>
            </div>
          )}

          {!isLoading && !error && recentDocuments.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <Caption className="text-sm">No recent documents</Caption>
            </div>
          )}

          {!isLoading && !error && recentDocuments.length > 0 && (
            <div className="space-y-3">
              {recentDocuments.map((doc, index) => (
                <WorkspaceCard
                  key={doc.id || index}
                  title={doc.title}
                  description={doc.description}
                  lastAccessed={formatRelativeTime(doc.lastAccessed)}
                  className="p-3"
                  onClick={() => handleDocumentClick(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}
