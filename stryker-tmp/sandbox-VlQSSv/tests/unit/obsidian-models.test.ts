// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import {
  ObsidianUtils,
  ObsidianDocument,
  Wikilink,
  Backlink,
  OBSIDIAN_CONTENT_TYPES,
  ObsidianContentType,
} from "../../src/lib/obsidian-models.js";

// Mock crypto module
vi.mock("crypto", () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => "mocked-hash"),
  })),
}));

describe("ObsidianUtils", () => {
  describe("cleanMarkdown", () => {
    it("should remove frontmatter", () => {
      const content = `---
title: Test Document
tags: [test, markdown]
---

This is the content.`;

      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("This is the content.");
    });

    it("should convert wikilinks to plain text", () => {
      const content = "This links to [[Another Note]] and [[Note|Display Text]].";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("This links to Another Note and Display Text.");
    });

    it("should convert markdown links to plain text", () => {
      const content = "Check out [this link](https://example.com) for more info.";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("Check out this link for more info.");
    });

    it("should remove bold and italic formatting", () => {
      const content = "This is **bold** and *italic* and __underline__.";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("This is bold and italic and underline.");
    });

    it("should remove inline code formatting", () => {
      const content = "Use the `console.log()` function.";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("Use the console.log() function.");
    });

    it("should remove strikethrough formatting", () => {
      const content = "This is ~~strikethrough~~ text.";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("This is strikethrough text.");
    });

    it("should remove headers", () => {
      const content = `# Main Title
## Subtitle
### Sub-subtitle

Content here.`;
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("Main Title\nSubtitle\nSub-subtitle\n\nContent here.");
    });

    it("should clean up excessive whitespace", () => {
      const content = "Line 1\n\n\n\n\nLine 2\n\n\n\nLine 3";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("Line 1\n\nLine 2\n\nLine 3");
    });

    it("should trim whitespace", () => {
      const content = "  \n\n  Content with spaces  \n\n  ";
      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toBe("Content with spaces");
    });

    it("should handle complex markdown", () => {
      const content = `---
title: Complex Document
---

# Introduction

This document contains [[complex links]] and **formatting** with \`code\` and ~~strikes~~.

## Section

More [links](url) and *italics*.
`;

      const result = ObsidianUtils.cleanMarkdown(content);
      expect(result).toContain("Introduction");
      expect(result).toContain("complex links");
      expect(result).toContain("formatting");
      expect(result).toContain("code");
      expect(result).toContain("strikes");
      expect(result).toContain("Section");
      expect(result).toContain("links");
      expect(result).toContain("italics");
      expect(result).not.toContain("---");
      expect(result).not.toContain("**");
      expect(result).not.toContain("`");
      expect(result).not.toContain("~~");
    });
  });

  describe("extractWikilinks", () => {
    it("should extract simple wikilinks", () => {
      const content = "This is a [[Simple Link]] in the text.";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual(["Simple Link"]);
    });

    it("should extract wikilinks with display text", () => {
      const content = "Check out [[Real Page|Display Text]] for more info.";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual(["Real Page"]);
    });

    it("should extract multiple wikilinks", () => {
      const content = "Links: [[Page1]], [[Page2|Display]], and [[Page3]].";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual(["Page1", "Page2", "Page3"]);
    });

    it("should remove duplicates", () => {
      const content = "Duplicate: [[Same Page]] and [[Same Page|Again]].";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual(["Same Page"]);
    });

    it("should handle nested brackets", () => {
      const content = "Complex: [[Page with [brackets]]] and [[Normal]].";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual(["Page with [brackets", "Normal"]);
    });

    it("should handle headings and blocks", () => {
      const content = "Links to [[Page#Heading]] and [[Page#^block]].";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual(["Page#Heading", "Page#^block"]);
    });

    it("should handle empty content", () => {
      const result = ObsidianUtils.extractWikilinks("");
      expect(result).toEqual([]);
    });

    it("should handle content without wikilinks", () => {
      const content = "This is regular text without any links.";
      const result = ObsidianUtils.extractWikilinks(content);
      expect(result).toEqual([]);
    });

    it("should handle malformed wikilinks", () => {
      const content = "Broken: [[Incomplete and [[Nested [[Broken]].";
      const result = ObsidianUtils.extractWikilinks(content);
      // Should extract what's possible from valid wikilink syntax
      expect(result).toEqual(["Incomplete and [[Nested [[Broken"]);
    });
  });

  describe("extractTags", () => {
    it("should extract simple hashtags", () => {
      const content = "This is a #tag in the text.";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual(["tag"]);
    });

    it("should extract multiple tags", () => {
      const content = "Tags: #tag1, #tag2, and #tag3.";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should extract tags with underscores and dashes", () => {
      const content = "Complex: #tag_name, #tag-name, and #tag123.";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual(["tag_name", "tag-name", "tag123"]);
    });

    it("should remove duplicates", () => {
      const content = "Duplicate: #same and #same again.";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual(["same"]);
    });

    it("should handle empty content", () => {
      const result = ObsidianUtils.extractTags("");
      expect(result).toEqual([]);
    });

    it("should handle content without tags", () => {
      const content = "This is regular text without any tags.";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual([]);
    });

    it("should not extract tags within words", () => {
      const content = "Email: test@example.com and #valid.";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual(["valid"]);
    });

    it("should handle tags at beginning and end", () => {
      const content = "#start tag in middle #end";
      const result = ObsidianUtils.extractTags(content);
      expect(result).toEqual(["start", "end"]);
    });
  });

  describe("parseFrontmatter", () => {
    it("should parse simple frontmatter", () => {
      const content = `---
title: Test Document
tags: [tag1, tag2]
status: draft
---

Content here.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({
        title: "Test Document",
        tags: "[tag1, tag2]",
        status: "draft",
      });
    });

    it("should handle quoted values", () => {
      const content = `---
title: "Quoted Title"
description: 'Single quotes'
---

Content.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({
        title: "Quoted Title",
        description: "Single quotes",
      });
    });

    it("should handle empty frontmatter", () => {
      const content = `---

---

Content.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({});
    });

    it("should handle missing frontmatter", () => {
      const content = "Just content without frontmatter.";
      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({});
    });

    it("should handle malformed frontmatter gracefully", () => {
      const content = `---
title: Missing closing
Content without proper closing.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({});
    });

    it("should handle complex values", () => {
      const content = `---
date: 2024-01-01
count: 42
flag: true
list: [1, 2, 3]
---

Content.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({
        date: "2024-01-01",
        count: "42",
        flag: "true",
        list: "[1, 2, 3]",
      });
    });

    it("should handle empty lines in frontmatter", () => {
      const content = `---
title: Test

tags: [tag1, tag2]

status: published
---

Content.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({
        title: "Test",
        tags: "[tag1, tag2]",
        status: "published",
      });
    });

    it("should handle lines without colons", () => {
      const content = `---
title: Valid Line
Invalid Line Without Colon
another: valid
---

Content.`;

      const result = ObsidianUtils.parseFrontmatter(content);
      expect(result).toEqual({
        title: "Valid Line",
        another: "valid",
      });
    });
  });

  describe("generateFileChecksum", () => {
    it("should generate checksum for content", () => {
      const content = "Test content for checksum";
      const result = ObsidianUtils.generateFileChecksum(content);
      expect(result).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
      expect(typeof result).toBe("string");
    });

    it("should generate consistent checksums", () => {
      const content = "Same content";
      const result1 = ObsidianUtils.generateFileChecksum(content);
      const result2 = ObsidianUtils.generateFileChecksum(content);
      expect(result1).toBe(result2);
    });

    it("should handle empty content", () => {
      const result = ObsidianUtils.generateFileChecksum("");
      expect(result).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash of empty string
    });
  });

  describe("determineContentType", () => {
    it("should detect MOC content type", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/MOCs/test.md",
        "/vault",
        {}
      );
      expect(result).toBe("moc");
    });

    it("should detect article content type", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/Articles/test.md",
        "/vault",
        {}
      );
      expect(result).toBe("article");
    });

    it("should detect conversation content type", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/AIChats/test.md",
        "/vault",
        {}
      );
      expect(result).toBe("conversation");
    });

    it("should detect book-note content type", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/Books/test.md",
        "/vault",
        {}
      );
      expect(result).toBe("book-note");
    });

    it("should detect template content type", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/templates/test.md",
        "/vault",
        {}
      );
      expect(result).toBe("template");
    });

    it("should use frontmatter type when available", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/test.md",
        "/vault",
        { type: "custom-type" }
      );
      expect(result).toBe("custom-type");
    });

    it("should default to note type", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/random/test.md",
        "/vault",
        {}
      );
      expect(result).toBe("note");
    });

    it("should handle vault path with trailing slash", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/MOCs/test.md",
        "/vault/",
        {}
      );
      expect(result).toBe("moc");
    });

    it("should handle file path without leading slash", () => {
      const result = ObsidianUtils.determineContentType(
        "vault/MOCs/test.md",
        "vault",
        {}
      );
      expect(result).toBe("moc");
    });

    it("should prioritize frontmatter over path detection", () => {
      const result = ObsidianUtils.determineContentType(
        "/vault/MOCs/test.md",
        "/vault",
        { type: "override" }
      );
      expect(result).toBe("override");
    });
  });
});

describe("OBSIDIAN_CONTENT_TYPES", () => {
  it("should contain all expected content types", () => {
    expect(OBSIDIAN_CONTENT_TYPES).toEqual([
      "note",
      "moc",
      "article",
      "conversation",
      "template",
      "book-note",
      "canvas",
      "dataview",
    ]);
  });

  it("should be readonly", () => {
    // TypeScript should prevent modification
    expect(() => {
      (OBSIDIAN_CONTENT_TYPES as any).push("new-type");
    }).toThrow();
  });
});

describe("ObsidianContentType", () => {
  it("should accept valid content types", () => {
    const validTypes: ObsidianContentType[] = [
      "note",
      "moc",
      "article",
      "conversation",
      "template",
      "book-note",
      "canvas",
      "dataview",
    ];

    validTypes.forEach(type => {
      expect(OBSIDIAN_CONTENT_TYPES).toContain(type);
    });
  });
});
