"use client";

import { useState, useEffect } from "react";
import { SearchInput } from "../search-input";
import { SearchResults } from "../search-results";
import { SearchFilters } from "../search-filters";
import { SplitLayout } from "../split-layout";
import { ChatInterface } from "../chat-interface";
import { Button } from "../button";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./responsive-search.module.scss";

interface ResponsiveSearchProps {
  className?: string;
}

export function ResponsiveSearch({ className }: ResponsiveSearchProps) {
  const [query, setQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setIsSearching(true);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
    }, 800);
  };

  const searchPanel = (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <SearchInput
          placeholder="Search your knowledge base..."
          className={styles.searchInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(e.currentTarget.value);
            }
          }}
        />
        <SearchFilters />
      </div>

      {/* Search Results */}
      <div className={styles.searchBody}>
        <SearchResults
          results={[]}
          query={query}
          isLoading={isSearching}
          onResultClick={(result) => {
            console.log("Opening result:", result);
          }}
        />
      </div>
    </div>
  );

  const chatPanel = (
    <div className={styles.chatPanel}>
      <ChatInterface
        onSendMessage={(message, attachments) => {
          console.log("Chat message:", message, attachments);
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div className={cn(styles.mobileContainer, className)}>
        {!isChatOpen ? (
          <div className={styles.container}>
            {searchPanel}
            <div className={styles.mobileActions}>
              <Button
                onClick={() => setIsChatOpen(true)}
                className={styles.mobileButton}
              >
                <MessageSquare />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.mobileHeader}>
              <span className={styles.mobileTitle}>AI Assistant</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className={styles.chatContent}>{chatPanel}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(styles.desktopContainer, className)}>
      <SplitLayout
        leftPanel={searchPanel}
        rightPanel={chatPanel}
        defaultLeftWidth={60}
        minLeftWidth={40}
        maxLeftWidth={80}
      />
    </div>
  );
}
