// @ts-nocheck
import React from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import styles from "./SearchInput.module.scss";

interface SearchInputProps {
  isInitial: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  isInitial,
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  placeholder = "Search your Obsidian knowledge base...",
  className = "",
}: SearchInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit();
    }
  };

  const containerClass = `${styles.searchInput} ${
    isInitial ? styles.initial : styles.compact
  } ${className}`;

  return (
    <motion.div
      layout
      className={containerClass}
      initial={isInitial ? { scale: 1 } : false}
      animate={isInitial ? { scale: 1 } : { scale: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      role="search"
      aria-label="Search your Obsidian knowledge base"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            aria-label="Search query"
          />
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!query.trim() || isLoading}
            aria-label={isLoading ? "Searching..." : "Submit search"}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {isInitial && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.description}
        >
          <p>
            Search through your Obsidian knowledge base with AI-powered semantic
            search scoring
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchInput;
