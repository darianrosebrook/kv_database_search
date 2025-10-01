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
import styles from "./page.module.scss";

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
      <div className={styles.desktopNotice}>
        <div className={styles.desktopContent}>
          <Display className={styles.desktopTitle}>Mobile View</Display>
          <BodyLarge className={styles.desktopDescription}>
            Resize your browser to mobile width to see the mobile interface.
          </BodyLarge>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mobilePage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <div className={styles.brandIcon} />
            <span className={styles.brandName}>Obsidian</span>
          </div>
          <Button variant="ghost" size="sm">
            <Plus />
          </Button>
        </div>
        <SearchInput placeholder="Search..." showShortcut={false} />
      </header>

      {/* Main Content */}
      <main className={styles.content}>
        {/* Welcome */}
        <div className={styles.welcome}>
          <Display className={styles.welcomeTitle}>Welcome Back</Display>
          <BodyLarge className={styles.welcomeSubtitle}>
            Continue where you left off
          </BodyLarge>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Button
            variant="outline"
            className={styles.quickActionButton}
          >
            <Plus className={styles.quickActionIcon} />
            <span className={styles.quickActionLabel}>New Doc</span>
          </Button>
          <Button
            variant="outline"
            className={styles.quickActionButton}
          >
            <TrendingUp className={styles.quickActionIcon} />
            <span className={styles.quickActionLabel}>Trending</span>
          </Button>
        </div>

        {/* Recent Documents */}
        <div className={styles.recentSection}>
          <div className={styles.recentHeader}>
            <Clock className={styles.recentIcon} />
            <Caption>Recent</Caption>
          </div>

          {isLoading && (
            <div className={styles.loadingList}>
              {[...Array(2)].map((_, index) => (
                <div key={index} className={styles.loadingItem} />
              ))}
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle className={styles.errorIcon} />
              <Caption className={styles.errorText}>
                Failed to load documents
              </Caption>
            </div>
          )}

          {!isLoading && !error && recentDocuments.length === 0 && (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyIcon} />
              <Caption className={styles.emptyLabel}>No recent documents</Caption>
            </div>
          )}

          {!isLoading && !error && recentDocuments.length > 0 && (
            <div className={styles.loadingList}>
              {recentDocuments.map((doc, index) => (
                <WorkspaceCard
                  key={doc.id || index}
                  title={doc.title}
                  description={doc.description}
                  lastAccessed={formatRelativeTime(doc.lastAccessed)}
                  className={styles.cardCompact}
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
