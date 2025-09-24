// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  normalize,
  createContentHash,
  normalizeVector,
  cosineSimilarity,
  estimateTokens,
  extractWikilinks,
  extractHashtags,
  cleanMarkdown,
  generateBreadcrumbs,
  determineContentType,
} from "../../src/lib/utils.js";

describe("normalize", () => {
  it("should normalize basic text", () => {
    const input = "  Hello   World  ";
    const expected = "Hello World";
    expect(normalize(input)).toBe(expected);
  });
});

describe("createContentHash", () => {
  it("should create consistent hashes for same content", () => {
    const content1 = "Hello World";
    const content2 = "Hello World";
    expect(createContentHash(content1)).toBe(createContentHash(content2));
  });
});

describe("normalizeVector", () => {
  it("should normalize a vector to unit length", () => {
    const vector = [3, 4]; // Should normalize to [0.6, 0.8]
    const normalized = normalizeVector(vector);
    const magnitude = Math.sqrt(normalized.reduce((sum, x) => sum + x * x, 0));
    expect(magnitude).toBeCloseTo(1.0, 10);
  });
});

describe("cosineSimilarity", () => {
  it("should calculate similarity between identical vectors", () => {
    const vec = [1, 2, 3];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 10);
  });
});

describe("estimateTokens", () => {
  it("should estimate tokens based on word count", () => {
    const text = "This is a test sentence";
    const words = text.split(/\s+/).length; // 5 words
    const expectedTokens = Math.ceil(words / 0.75); // ceil(5 / 0.75) = 7
    expect(estimateTokens(text)).toBe(expectedTokens);
  });

  it("should handle empty text", () => {
    expect(estimateTokens("")).toBe(2); // Empty string splits to [""] which has length 1
  });

  it("should handle single word", () => {
    expect(estimateTokens("word")).toBe(Math.ceil(1 / 0.75));
  });
});

describe("extractWikilinks", () => {
  it("should extract wikilinks from text", () => {
    const text = "This is a [[link]] and another [[link2]]";
    expect(extractWikilinks(text)).toEqual(["link", "link2"]);
  });

  it("should remove duplicates", () => {
    const text = "This is a [[link]] and another [[link]]";
    expect(extractWikilinks(text)).toEqual(["link"]);
  });

  it("should handle text without wikilinks", () => {
    const text = "This is regular text";
    expect(extractWikilinks(text)).toEqual([]);
  });

  it("should handle empty text", () => {
    expect(extractWikilinks("")).toEqual([]);
  });
});

describe("extractHashtags", () => {
  it("should extract hashtags from text", () => {
    const text = "This is a #tag and another #tag2";
    expect(extractHashtags(text)).toEqual(["tag", "tag2"]);
  });

  it("should remove duplicates", () => {
    const text = "This is a #tag and another #tag";
    expect(extractHashtags(text)).toEqual(["tag"]);
  });

  it("should handle text without hashtags", () => {
    const text = "This is regular text";
    expect(extractHashtags(text)).toEqual([]);
  });

  it("should handle complex hashtags", () => {
    const text = "#tag_with_underscores #tag-with-dashes #tag123";
    expect(extractHashtags(text)).toEqual([
      "tag_with_underscores",
      "tag-with-dashes",
      "tag123",
    ]);
  });

  it("should handle empty text", () => {
    expect(extractHashtags("")).toEqual([]);
  });
});

describe("cleanMarkdown", () => {
  it("should remove frontmatter", () => {
    const text = `---
title: Test
---
This is content`;
    expect(cleanMarkdown(text)).toBe("This is content");
  });

  it("should remove wikilinks but keep text", () => {
    const text = "This is a [[link]] in text";
    expect(cleanMarkdown(text)).toBe("This is a link in text");
  });

  it("should remove markdown links but keep text", () => {
    const text = "This is a [link](url) in text";
    expect(cleanMarkdown(text)).toBe("This is a link in text");
  });

  it("should remove markdown formatting", () => {
    const text = "*bold* _italic_ `code` ~strikethrough~";
    expect(cleanMarkdown(text)).toBe("bold italic code strikethrough");
  });

  it("should remove headers", () => {
    const text = "# Header\n## Subheader\nContent";
    expect(cleanMarkdown(text)).toBe("Header\nSubheader\nContent");
  });

  it("should clean up extra whitespace", () => {
    const text = "Line 1\n\n\nLine 2";
    expect(cleanMarkdown(text)).toBe("Line 1\n\nLine 2");
  });
});

describe("generateBreadcrumbs", () => {
  it("should generate breadcrumbs from file path", () => {
    const result = generateBreadcrumbs("/vault/folder/file.md", "/vault");
    expect(result).toEqual(["folder"]);
  });

  it("should handle root level files", () => {
    const result = generateBreadcrumbs("/vault/file.md", "/vault");
    expect(result).toEqual(["Root"]);
  });

  it("should handle deeply nested files", () => {
    const result = generateBreadcrumbs("/vault/a/b/c/file.md", "/vault");
    expect(result).toEqual(["a", "b", "c"]);
  });
});

describe("determineContentType", () => {
  it("should detect MOC content type", () => {
    const result = determineContentType("/vault/MOCs/file.md", "/vault", {});
    expect(result).toBe("moc");
  });

  it("should detect article content type", () => {
    const result = determineContentType(
      "/vault/Articles/file.md",
      "/vault",
      {}
    );
    expect(result).toBe("article");
  });

  it("should detect conversation content type", () => {
    const result = determineContentType("/vault/AIChats/file.md", "/vault", {});
    expect(result).toBe("conversation");
  });

  it("should detect book-note content type", () => {
    const result = determineContentType("/vault/Books/file.md", "/vault", {});
    expect(result).toBe("book-note");
  });

  it("should detect template content type", () => {
    const result = determineContentType(
      "/vault/templates/file.md",
      "/vault",
      {}
    );
    expect(result).toBe("template");
  });

  it("should use frontmatter type if available", () => {
    const result = determineContentType("/vault/file.md", "/vault", {
      type: "custom",
    });
    expect(result).toBe("custom");
  });

  it("should default to note type", () => {
    const result = determineContentType("/vault/file.md", "/vault", {});
    expect(result).toBe("note");
  });
});
