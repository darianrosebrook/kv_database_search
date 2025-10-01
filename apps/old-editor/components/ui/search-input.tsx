"use client"

import type React from "react"

import { Search, Command } from "lucide-react"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showShortcut?: boolean
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, showShortcut = true, ...props }, ref) => {
    return (
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <input
          ref={ref}
          className={cn(
            "w-full pl-10 pr-16 py-3 bg-input border border-border rounded-lg",
            "text-body placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-all duration-200",
            className,
          )}
          {...props}
        />
        {showShortcut && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded border">
              <Command className="h-3 w-3 inline mr-1" />K
            </kbd>
          </div>
        )}
      </div>
    )
  },
)

SearchInput.displayName = "SearchInput"

export { SearchInput }
