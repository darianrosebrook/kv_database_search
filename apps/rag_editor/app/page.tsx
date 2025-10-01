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
import styles from "./page.module.scss";

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
    <div className={styles.splash}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <FileText className={styles.brandLogo} />
            </div>
            <span className={styles.brandName}>{"Knowledge Vector"}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewWorkspace}>
            <Plus />
            New Workspace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.mainContent}>
          {/* Hero Section */}
          <div className={styles.hero}>
            <Display className={styles.heroTitle}>
              Knowledge Without
              <br />
              Limitation
            </Display>
            <BodyLarge className={styles.heroDescription}>
              Transform your thoughts into interconnected knowledge with
              AI-powered insights and semantic search.
            </BodyLarge>
          </div>

          {/* Search */}
          <div className={styles.searchSection}>
            <SearchInput
              placeholder="Search your knowledge base..."
              className={styles.searchInput}
              onKeyDown={handleSearchKeyDown}
            />
            <div className={styles.divider} />
          </div>

          <div className={styles.ctaSection}>
            <div className={styles.ctaActions}>
              <Button
                onClick={handleNewDocument}
                size="lg"
                className={styles.createButton}
              >
                <PenTool className={styles.ctaButtonIcon} />
                Create New Document
              </Button>
            </div>
            <div className={styles.divider} />
          </div>

          {/* Recent Documents */}
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <Clock className={styles.recentIcon} />
              <Caption>Recently Accessed</Caption>
            </div>

            {isLoading && (
              <div className={styles.loadingList}>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className={styles.skeletonCard} />
                ))}
              </div>
            )}

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle className={styles.errorIcon} />
                <div>
                  <Caption className={styles.errorTitle}>
                    Failed to load recent documents
                  </Caption>
                  <Caption className={styles.errorMessage}>{error}</Caption>
                </div>
              </div>
            )}

            {!isLoading && !error && recentDocuments.length === 0 && (
              <div className={styles.emptyState}>
                <FileText className={styles.emptyIcon} />
                <Caption className={styles.emptyTitle}>
                  No recent documents found
                </Caption>
                <Caption className={styles.emptySubtitle}>
                  Start by creating or importing some documents
                </Caption>
              </div>
            )}

            {!isLoading && !error && recentDocuments.length > 0 && (
              <div className={styles.recentList}>
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
