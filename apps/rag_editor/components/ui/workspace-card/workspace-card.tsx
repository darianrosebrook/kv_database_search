"use client";

import { cn } from "@/lib/utils";
import { Body, Caption, Title } from "../typography";
import styles from "./workspace-card.module.scss";

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
        styles.workspaceCard,
        isActive && styles.active,
        className
      )}
    >
      <div className={styles.cardContent}>
        <Title className={styles.title}>
          {title}
        </Title>
        {description && (
          <Body className={styles.description}>
            {description}
          </Body>
        )}
        {lastAccessed && <Caption className={styles.lastAccessed}>Last accessed {lastAccessed}</Caption>}
      </div>
    </div>
  );
}
