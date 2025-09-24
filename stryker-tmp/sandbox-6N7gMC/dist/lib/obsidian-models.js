/**
 * Obsidian Data Contracts and API Specifications
 * Defines the data structures and contracts for Obsidian vault processing
 */
// @ts-nocheck

/**
 * Utility functions for Obsidian document processing
 */
export class ObsidianUtils {
    static cleanMarkdown(content) {
        return content
            .replace(/^---[\s\S]*?---\n?/m, "")
            .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, display) => display || target)
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/(\*\*|__)(.*?)\1/g, "$1")
            .replace(/(\*|_)(.*?)\1/g, "$1")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/~~(.*?)~~/g, "$1")
            .replace(/^#{1,6}\s+(.*)$/gm, "$1")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }
    static extractWikilinks(content) {
        const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
        const links = [];
        let match;
        while ((match = wikilinkRegex.exec(content)) !== null) {
            links.push(match[2] || match[1]);
        }
        return [...new Set(links)];
    }
    static extractTags(content) {
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;
        const tags = [];
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        return [...new Set(tags)];
    }
    static parseFrontmatter(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);
        if (!match)
            return {};
        try {
            // Simple YAML-like parsing (for now)
            const frontmatter = {};
            const lines = match[1].split("\n");
            for (const line of lines) {
                const [key, ...valueParts] = line.split(":");
                if (key && valueParts.length > 0) {
                    const value = valueParts.join(":").trim();
                    // Remove quotes if present
                    frontmatter[key.trim()] = value.replace(/^["']|["']$/g, "");
                }
            }
            return frontmatter;
        }
        catch {
            return {};
        }
    }
    static generateFileChecksum(content) {
        const crypto = require("crypto");
        return crypto.createHash("sha256").update(content).digest("hex");
    }
    static determineContentType(filePath, vaultPath, frontmatter) {
        const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");
        // Path-based classification
        if (relativePath.includes("MOCs/"))
            return "moc";
        if (relativePath.includes("Articles/"))
            return "article";
        if (relativePath.includes("AIChats/"))
            return "conversation";
        if (relativePath.includes("Books/"))
            return "book-note";
        if (relativePath.includes("templates/"))
            return "template";
        // Check frontmatter type
        if (frontmatter.type) {
            return frontmatter.type;
        }
        return "note";
    }
}
// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================
/**
 * Supported Obsidian content types
 */
export const OBSIDIAN_CONTENT_TYPES = [
    "note",
    "moc",
    "article",
    "conversation",
    "template",
    "book-note",
    "canvas",
    "dataview",
];
