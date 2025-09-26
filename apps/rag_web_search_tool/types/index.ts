/**
 * UI Types for RAG Web Search Tool
 * @author @darianrosebrook
 */

// ============================================================================
// INTENT & STATUS TYPES
// ============================================================================

export type Intent = "info" | "success" | "warning" | "danger" | "neutral";

export type StatusIntent =
  | "active"
  | "inactive"
  | "pending"
  | "error"
  | "success";

/**
 * Normalizes status intent to standard intent values
 */
export function normalizeStatusIntent(status: StatusIntent): Intent {
  switch (status) {
    case "active":
    case "success":
      return "success";
    case "inactive":
    case "pending":
      return "info";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

// ============================================================================
// CONTROL SIZE TYPES
// ============================================================================

export type ControlSize = "sm" | "md" | "lg";

// ============================================================================
// DISMISSIBLE PROPS
// ============================================================================

export interface DismissibleProps {
  dismissible?: boolean;
  onDismiss?: (index?: number) => void;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  status?: StatusIntent;
}

// ============================================================================
// ARTICLE TYPES
// ============================================================================

export interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  tags: string[];
  status: "draft" | "published" | "archived";
}
