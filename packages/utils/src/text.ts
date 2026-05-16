/**
 * Normalize text for consistent embedding and caching
 */
export function normalize(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .trim();
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length / 0.75);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Detect language from text using simple heuristics
 */
export function detectLanguage(text: string): string {
  if (!text || text.length === 0) return "unknown";

  const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
  const spanishWords =
    /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
  const frenchWords =
    /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;

  const englishMatches = (text.match(englishWords) || []).length;
  const spanishMatches = (text.match(spanishWords) || []).length;
  const frenchMatches = (text.match(frenchWords) || []).length;

  const maxMatches = Math.max(englishMatches, spanishMatches, frenchMatches);

  if (maxMatches === 0) return "unknown";
  if (maxMatches === englishMatches) return "en";
  if (maxMatches === spanishMatches) return "es";
  if (maxMatches === frenchMatches) return "fr";

  return "unknown";
}

/**
 * Determine content type based on file extension
 */
export function determineContentType(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "md":
      return "markdown";
    case "txt":
      return "text";
    case "json":
      return "json";
    case "pdf":
      return "pdf";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    default:
      return "unknown";
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentTypeFromFrontmatter(
  filePath: string,
  vaultPath: string,
  frontmatter: Record<string, unknown>
): string {
  const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");

  const lowerPath = relativePath.toLowerCase();
  if (lowerPath.includes("mocs") || lowerPath.includes("maps")) return "moc";
  if (lowerPath.includes("articles") || lowerPath.includes("posts"))
    return "article";
  if (
    lowerPath.includes("chats") ||
    lowerPath.includes("conversations") ||
    lowerPath.includes("aichats")
  )
    return "conversation";
  if (lowerPath.includes("books") || lowerPath.includes("reading"))
    return "book-note";
  if (lowerPath.includes("templates")) return "template";

  if (typeof frontmatter.type === "string") {
    return frontmatter.type;
  }

  return "note";
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(
  filePath: string,
  vaultPath: string
): string[] {
  const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");
  const pathParts = relativePath.split("/");
  pathParts.pop();
  return pathParts.length > 0 ? pathParts : ["Root"];
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  return (
    text
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/\[\[([^\]]+)\]\]/g, (_match, content) => {
        return content.includes("|") ? content.split("|")[1] : content;
      })
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .replace(/^#+\s+/gm, "")
      .replace(/\n\s*\n/g, "\n\n")
      .trim()
  );
}
