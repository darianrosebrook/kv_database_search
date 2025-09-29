"use client";

import { cn } from "@/lib/utils";
import { Body, Caption, Title } from "../typography";

interface WorkspaceCardProps {
  title: string;
  description?: string;
  lastAccessed?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function WorkspaceCard({
  title,
  description,
  lastAccessed,
  isActive = false,
  onClick,
  className,
}: WorkspaceCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border border-border bg-card hover:bg-accent/50",
        "cursor-pointer transition-all duration-200 group",
        "workspace-indicator",
        isActive && "active bg-accent",
        className
      )}
    >
      <div className="space-y-2">
        <Title className="group-hover:text-foreground transition-colors">
          {title}
        </Title>
        {description && (
          <Body className="text-muted-foreground line-clamp-2">
            {description}
          </Body>
        )}
        {lastAccessed && <Caption>Last accessed {lastAccessed}</Caption>}
      </div>
    </div>
  );
}
