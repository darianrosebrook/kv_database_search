"use client";

import type React from "react";

import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import styles from "./search-input.module.scss";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showShortcut?: boolean;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, showShortcut = true, ...props }, ref) => {
    return (
      <div className={styles.searchInput}>
        <Search className={styles.searchIcon} />
        <input
          ref={ref}
          className={cn(styles.searchInputField, className)}
          {...props}
        />
        {showShortcut && (
          <div className={styles.searchActions}>
            <kbd className={styles.kbd}>
              <Command className={styles.kbdIcon} />K
            </kbd>
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
