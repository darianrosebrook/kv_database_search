// Centralized utility functions for the RAG Web Search Tool
// This file consolidates all shared utility functions to eliminate duplication

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  SearchResult,
  EntityTypeColorMap,
  RelationshipTypeColorMap,
  TransformationOptions,
} from "../types";
import type {
  GraphRagSearchResult,
  GraphRagEntity,
} from "../lib/graph-rag-api";

// ============================================================================
// CSS UTILITIES
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// ENTITY & RELATIONSHIP STYLING
// ============================================================================

export const ENTITY_TYPE_COLORS: EntityTypeColorMap = {
  PERSON: "bg-blue-100 text-blue-800 border-blue-200",
  ORGANIZATION: "bg-green-100 text-green-800 border-green-200",
  CONCEPT: "bg-purple-100 text-purple-800 border-purple-200",
  DOCUMENT: "bg-orange-100 text-orange-800 border-orange-200",
  TECHNOLOGY: "bg-cyan-100 text-cyan-800 border-cyan-200",
  LOCATION: "bg-red-100 text-red-800 border-red-200",
  EVENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PROCESS: "bg-indigo-100 text-indigo-800 border-indigo-200",
  METRIC: "bg-pink-100 text-pink-800 border-pink-200",
  PRODUCT: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const RELATIONSHIP_TYPE_COLORS: RelationshipTypeColorMap = {
  MENTIONS: "text-blue-600",
  CONTAINS: "text-green-600",
  RELATES_TO: "text-purple-600",
  DEPENDS_ON: "text-orange-600",
  CAUSES: "text-red-600",
  PART_OF: "text-cyan-600",
  SIMILAR_TO: "text-indigo-600",
  OPPOSITE_OF: "text-pink-600",
  TEMPORAL_BEFORE: "text-yellow-600",
  TEMPORAL_AFTER: "text-emerald-600",
};

export function getEntityTypeColor(type: string): string {
  return (
    ENTITY_TYPE_COLORS[type] || "bg-gray-100 text-gray-800 border-gray-200"
  );
}

export function getRelationshipTypeColor(type: string): string {
  return RELATIONSHIP_TYPE_COLORS[type] || "text-gray-600";
}

// ============================================================================
// MESSAGE & CHAT UTILITIES
// ============================================================================

export function getMessageTypeIcon(type: string): string {
  switch (type) {
    case "user":
      return "👤";
    case "assistant":
      return "🤖";
    case "error":
      return "❌";
    case "system":
      return "ℹ️";
    default:
      return "💬";
  }
}

export function generateMessageId(): string {
  return Date.now().toString();
}

export function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

export function transformGraphRagToSearchResult(
  result: GraphRagSearchResult,
  options: TransformationOptions = {}
): SearchResult {
  const {
    maxSummaryLength = 200,
    maxHighlights = 3,
    includeMetadata = true,
  } = options;

  return {
    id: result.id,
    title: result.metadata.section || "Document",
    summary: truncateText(result.text, maxSummaryLength),
    highlights: [
      truncateText(result.text, 100),
      `Source: ${result.metadata.sourceFile}`,
      `Type: ${result.metadata.contentType}`,
    ].slice(0, maxHighlights),
    confidenceScore: result.score,
    source: {
      type:
        result.metadata.contentType === "code" ? "component" : "documentation",
      path: result.metadata.sourceFile,
      url: result.metadata.url || `#${result.id}`,
    },
    rationale:
      result.explanation || `Graph RAG score: ${result.score.toFixed(3)}`,
    tags: [
      result.metadata.contentType,
      ...result.entities.slice(0, 2).map((e) => e.type),
    ],
    lastUpdated:
      result.metadata.updatedAt || new Date().toISOString().split("T")[0],
    ...(includeMetadata && {
      text: result.text,
      meta: {
        contentType: result.metadata.contentType,
        section: result.metadata.section || "",
        breadcrumbs: [],
        uri: result.metadata.url,
      },
    }),
  };
}

export function transformApiToSearchResult(
  result: any,
  options: TransformationOptions = {}
): SearchResult {
  const {
    maxSummaryLength = 200,
    maxHighlights = 3,
    includeMetadata = true,
  } = options;

  return {
    id: result.id,
    title: result.meta.section || "Documentation",
    summary: truncateText(result.text, maxSummaryLength),
    highlights: [
      truncateText(result.text, 100),
      `Section: ${result.meta.section}`,
      `Type: ${result.meta.contentType}`,
    ].slice(0, maxHighlights),
    confidenceScore: calculateCompositeScore(result),
    source: {
      type: determineSourceType(result.meta.contentType),
      path:
        result.meta.breadcrumbs?.join(" > ") ||
        result.meta.section ||
        "Unknown",
      url: result.source?.url || result.meta.uri || `#${result.id}`,
    },
    rationale: generateDetailedRationale(result),
    tags: [result.meta.contentType, ...result.meta.breadcrumbs.slice(0, 2)],
    lastUpdated:
      result.meta.updatedAt ||
      result.meta.createdAt ||
      new Date().toISOString().split("T")[0],
    ...(includeMetadata && {
      text: result.text,
      meta: result.meta,
    }),
  };
}

// ============================================================================
// TEXT PROCESSING UTILITIES
// ============================================================================

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.replace(regex, "<mark>$1</mark>");
}

export function extractKeywords(
  text: string,
  maxKeywords: number = 5
): string[] {
  // Simple keyword extraction - could be enhanced with NLP
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter(
      (word) =>
        ![
          "this",
          "that",
          "with",
          "have",
          "will",
          "from",
          "they",
          "been",
          "were",
        ].includes(word)
    );

  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// ============================================================================
// SCORING & ANALYSIS UTILITIES
// ============================================================================

export function calculateCompositeScore(result: any): number {
  let score = 0;
  let weightSum = 0;

  // Semantic similarity (40% weight)
  if (result.cosineSimilarity !== undefined) {
    const semanticScore = Math.min(1.0, result.cosineSimilarity / 2);
    score += semanticScore * 0.4;
    weightSum += 0.4;
  }

  // Content type relevance (20% weight)
  if (result.contentType) {
    const contentScore = getContentTypeScore(result.contentType);
    score += contentScore * 0.2;
    weightSum += 0.2;
  }

  // Modality scores (20% weight)
  if (result.modalityScores) {
    const modalityAvg = calculateModalityAverage(result.modalityScores);
    score += modalityAvg * 0.2;
    weightSum += 0.2;
  }

  // Metadata quality (10% weight)
  if (result.metadata) {
    const metadataScore = calculateMetadataScore(result.metadata);
    score += metadataScore * 0.1;
    weightSum += 0.1;
  }

  // Graph context bonus (10% weight)
  if (result.graphContext) {
    score += 0.1;
    weightSum += 0.1;
  }

  return weightSum > 0 ? score / weightSum : result.cosineSimilarity || 0;
}

export function generateDetailedRationale(result: any): string {
  const factors: string[] = [];

  if (result.cosineSimilarity) {
    factors.push(
      `semantic similarity: ${(result.cosineSimilarity * 100).toFixed(1)}%`
    );
  }

  if (result.contentType) {
    factors.push(`content type: ${result.contentType}`);
  }

  if (result.modalityScores) {
    const modalityDetails = getModalityDetails(result.modalityScores);
    if (modalityDetails.length > 0) {
      factors.push(`modality: ${modalityDetails.join(", ")}`);
    }
  }

  if (result.metadata) {
    const metadataDetails = getMetadataDetails(result.metadata);
    factors.push(...metadataDetails);
  }

  if (result.graphContext) {
    factors.push("graph-enhanced context");
  }

  const factorString =
    factors.length > 0 ? factors.join(", ") : "high relevance";
  return `Strong match with ${factorString}. Located in ${
    result.meta?.section || "documentation"
  } section.`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineSourceType(
  contentType: string
): SearchResult["source"]["type"] {
  switch (contentType) {
    case "code":
      return "component";
    case "heading":
      return "guideline";
    default:
      return "documentation";
  }
}

function getContentTypeScore(contentType: string): number {
  switch (contentType) {
    case "code":
      return 0.9;
    case "text":
      return 0.7;
    case "table":
      return 0.8;
    default:
      return 0.6;
  }
}

function calculateModalityAverage(modalityScores: any): number {
  return (
    modalityScores.text * 0.3 +
    modalityScores.code * 0.3 +
    modalityScores.visual * 0.2 +
    modalityScores.semantic * 0.2
  );
}

function calculateMetadataScore(metadata: any): number {
  let score = 0;
  if (metadata.language && metadata.language !== "unknown") score += 0.3;
  if (metadata.technicalLevel) score += 0.3;
  if (metadata.readabilityScore) score += 0.4;
  return score;
}

function getModalityDetails(modalityScores: any): string[] {
  const details: string[] = [];
  if (modalityScores.text > 0.5) details.push("text-focused");
  if (modalityScores.code > 0.5) details.push("code-focused");
  if (modalityScores.visual > 0.5) details.push("visual-focused");
  if (modalityScores.semantic > 0.8) details.push("high semantic match");
  return details;
}

function getMetadataDetails(metadata: any): string[] {
  const details: string[] = [];
  if (metadata.language && metadata.language !== "unknown") {
    details.push(`language: ${metadata.language}`);
  }
  if (metadata.technicalLevel) {
    details.push(`level: ${metadata.technicalLevel}`);
  }
  if (metadata.readabilityScore) {
    details.push(
      `readability: ${(metadata.readabilityScore * 100).toFixed(0)}%`
    );
  }
  return details;
}

// ============================================================================
// CLIPBOARD & UI UTILITIES
// ============================================================================

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text:", error);
    return false;
  }
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function isValidSearchResult(result: any): result is SearchResult {
  return (
    result &&
    typeof result.id === "string" &&
    typeof result.title === "string" &&
    typeof result.summary === "string" &&
    Array.isArray(result.highlights) &&
    typeof result.confidenceScore === "number" &&
    result.source &&
    typeof result.source.type === "string" &&
    typeof result.source.path === "string" &&
    typeof result.source.url === "string"
  );
}

export function isValidGraphRagEntity(entity: any): entity is GraphRagEntity {
  return (
    entity &&
    typeof entity.id === "string" &&
    typeof entity.name === "string" &&
    typeof entity.type === "string" &&
    typeof entity.confidence === "number"
  );
}
