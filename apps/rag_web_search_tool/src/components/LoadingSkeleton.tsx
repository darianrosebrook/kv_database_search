import React from "react";
import { Skeleton } from "./ui/skeleton";

interface LoadingSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export function LoadingSkeleton({
  lines = 3,
  showAvatar = false,
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {showAvatar && (
        <div className="w-8 h-8 rounded-full flex-shrink-0">
          <Skeleton className="w-full h-full rounded-full" />
        </div>
      )}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-4 ${index === lines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

