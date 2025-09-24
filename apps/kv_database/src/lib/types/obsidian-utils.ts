/**
 * Obsidian Utility Functions
 * Collection of utility functions for processing Obsidian markdown files
 */

import {
  extractWikilinks,
  extractObsidianTags,
  cleanMarkdown,
  detectLanguage,
  createHash,
} from "../utils";

/**
 * Utility functions for Obsidian document processing
 */
export class ObsidianUtils {
  static extractTags(content: string): string[] {
    return extractObsidianTags(content);
  }

  static parseFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    body: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      // No frontmatter found, return empty frontmatter and full content as body
      return { frontmatter: {}, body: content };
    }

    try {
      // Extract the body content (everything after the frontmatter)
      const body = content.substring(match[0].length);

      // Simple YAML-like parsing (for now)
      const frontmatter: Record<string, any> = {};
      const lines = match[1].split("\n");
      let currentKey = "";
      let currentValue: any = null;
      let isArray = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.includes(":")) {
          // Save previous key-value pair if exists
          if (currentKey) {
            if (isArray && Array.isArray(currentValue)) {
              frontmatter[currentKey] = currentValue;
            } else if (typeof currentValue === "string") {
              frontmatter[currentKey] = currentValue;
            } else {
              frontmatter[currentKey] = currentValue;
            }
          }

          // Parse new key-value pair
          const [key, ...valueParts] = line.split(":");
          if (key && key.trim() && valueParts.length > 0) {
            currentKey = key.trim();
            const value = valueParts.join(":").trim();

            if (value === "") {
              // This might be an array
              isArray = true;
              currentValue = [];
            } else {
              // Simple value
              isArray = false;
              currentValue = value.replace(/^["']|["']$/g, "");
            }
          }
        } else if (line.startsWith("-")) {
          // Array item
          if (isArray && currentValue && Array.isArray(currentValue)) {
            const item = line
              .substring(1)
              .trim()
              .replace(/^["']|["']$/g, "");
            if (item) {
              currentValue.push(item);
            }
          }
        } else if (line.startsWith("  ")) {
          // Continuation of previous value
          if (currentValue !== null && typeof currentValue === "string") {
            currentValue += " " + line.trim();
          }
        }
      }

      // Save the last key-value pair
      if (currentKey) {
        if (isArray && Array.isArray(currentValue)) {
          frontmatter[currentKey] = currentValue;
        } else if (typeof currentValue === "string") {
          frontmatter[currentKey] = currentValue;
        } else {
          frontmatter[currentKey] = currentValue;
        }
      }

      return { frontmatter, body };
    } catch (error) {
      // If frontmatter parsing fails, treat the whole content as body
      const fallbackBody = content.substring(match[0].length);
      return { frontmatter: {}, body: fallbackBody };
    }
  }

  static generateFileChecksum(content: string): string {
    return createHash("sha256", content);
  }

  static determineContentType(
    filePath: string,
    vaultPath: string,
    frontmatter: Record<string, any>
  ): string {
    // Check frontmatter type first (prioritize explicit type)
    if (frontmatter.type) {
      return frontmatter.type;
    }

    const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");

    // Content-based classification (more flexible for zettelkasten)
    // Check frontmatter first (allows explicit type declaration)
    if (frontmatter.type) {
      const explicitType = frontmatter.type.toLowerCase();
      if (
        ["moc", "article", "conversation", "book", "template"].includes(
          explicitType
        )
      ) {
        return explicitType;
      }
    }

    // Structure-based classification (fallback to content analysis)
    if (relativePath.includes("mocs") || relativePath.includes("maps"))
      return "moc";
    if (relativePath.includes("articles") || relativePath.includes("posts"))
      return "article";
    if (
      relativePath.includes("chats") ||
      relativePath.includes("conversations")
    )
      return "conversation";
    if (relativePath.includes("books") || relativePath.includes("reading"))
      return "book";
    if (relativePath.includes("templates")) return "template";

    return "note";
  }
}
