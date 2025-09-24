import { describe, it, expect } from "vitest";
import {
  ImageLinkExtractor,
  ImageLink,
  ImageLinkExtractionResult,
} from "../../src/lib/image-link-extractor";

describe("ImageLinkExtractor", () => {
  let extractor: ImageLinkExtractor;

  beforeEach(() => {
    extractor = new ImageLinkExtractor();
  });

  describe("extractImageLinks", () => {
    it("should extract wikilinks", () => {
      const content = `
# Test Document

This is a test with an embedded image ![[screenshot.png]].

Another image: ![[diagrams/architecture.svg]].

End of document.
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(2);
      expect(result.stats.wikilinks).toBe(2);
      expect(result.stats.totalLinks).toBe(2);

      const firstLink = result.links[0];
      expect(firstLink.original).toBe("![[screenshot.png]]");
      expect(firstLink.alt).toBe("screenshot.png");
      expect(firstLink.src).toBe("screenshot.png");
      expect(firstLink.isWikilink).toBe(true);
      expect(firstLink.line).toBe(4); // Line numbers are 1-based
    });

    it("should extract markdown image links", () => {
      const content = `
# Test Document

Here's a screenshot: ![Screenshot](images/screenshot.png)

And a diagram: ![Architecture](diagrams/architecture.svg)

With alt text: ![Complex diagram with many components](complex-diagram.jpg)
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(3);
      expect(result.stats.markdownLinks).toBe(3);
      expect(result.stats.totalLinks).toBe(3);

      expect(result.links[0].alt).toBe("Screenshot");
      expect(result.links[0].src).toBe("images/screenshot.png");

      expect(result.links[2].alt).toBe("Complex diagram with many components");
      expect(result.links[2].src).toBe("complex-diagram.jpg");
    });

    it("should extract reference-style image links", () => {
      const content = `
# Test Document

Here are some images:

![First image][img1]
![Second image][img2]
![Third image][img3]

[img1]: images/screenshot.png
[img2]: diagrams/architecture.svg
[img3]: photos/complex-diagram.jpg
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(3);
      expect(result.stats.referenceLinks).toBe(3);

      expect(result.links[0].isReference).toBe(true);
      expect(result.links[0].referenceLabel).toBe("img1");
      expect(result.links[0].src).toBe("");
    });

    it("should handle mixed link types", () => {
      const content = `
# Mixed Content

Wikilink: ![[wiki-image.png]]
Markdown: ![Markdown image](markdown-image.jpg)
Reference: ![Ref image][ref1]

[ref1]: reference-image.gif
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(3);
      expect(result.stats.wikilinks).toBe(1);
      expect(result.stats.markdownLinks).toBe(1);
      expect(result.stats.referenceLinks).toBe(1);
    });

    it("should track line numbers correctly", () => {
      const content = `Line 1
![Image on line 2](test.png)
Line 3
![[Wikilink on line 4]]
Line 5`;

      const result = extractor.extractImageLinks(content);

      expect(result.links[0].line).toBe(2);
      expect(result.links[1].line).toBe(4);
    });

    it("should calculate statistics correctly", () => {
      const content = `
![Markdown](md1.png)
![[Wiki]](wiki1.png)
![Markdown 2](md2.jpg)
![[Wiki 2]](wiki2.gif)
![Ref][ref1]

[ref1]: ref.png
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.stats.totalLinks).toBe(5);
      expect(result.stats.wikilinks).toBe(2);
      expect(result.stats.markdownLinks).toBe(2);
      expect(result.stats.referenceLinks).toBe(1);
      expect(result.stats.uniquePaths).toBe(5); // All different paths
    });

    it("should handle empty content", () => {
      const result = extractor.extractImageLinks("");

      expect(result.links).toHaveLength(0);
      expect(result.stats.totalLinks).toBe(0);
    });

    it("should handle content without images", () => {
      const content = `
# Just text
No images here.
Just regular markdown content.
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(0);
      expect(result.stats.totalLinks).toBe(0);
    });
  });

  describe("isImagePath", () => {
    it("should identify valid image extensions", () => {
      const validPaths = [
        "image.png",
        "image.jpg",
        "image.jpeg",
        "image.gif",
        "image.bmp",
        "image.tiff",
        "image.webp",
        "image.svg",
        "path/to/image.PNG",
        "PATH/TO/IMAGE.JPG",
      ];

      validPaths.forEach((path) => {
        expect(extractor.isImagePath(path)).toBe(true);
      });
    });

    it("should reject non-image paths", () => {
      const invalidPaths = [
        "document.pdf",
        "spreadsheet.xlsx",
        "text.txt",
        "video.mp4",
        "audio.mp3",
        "",
        "noextension",
        "image.unknown",
      ];

      invalidPaths.forEach((path) => {
        expect(extractor.isImagePath(path)).toBe(false);
      });
    });
  });

  describe("filterValidImageLinks", () => {
    it("should filter to only valid image paths", () => {
      const links: ImageLink[] = [
        {
          original: "![valid](image.png)",
          alt: "valid",
          src: "image.png",
          line: 1,
          column: 0,
          isWikilink: false,
          isReference: false,
        },
        {
          original: "![invalid](document.pdf)",
          alt: "invalid",
          src: "document.pdf",
          line: 2,
          column: 0,
          isWikilink: false,
          isReference: false,
        },
      ];

      const filtered = extractor.filterValidImageLinks(links);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].src).toBe("image.png");
    });
  });

  describe("groupBySource", () => {
    it("should group links by source path", () => {
      const links: ImageLink[] = [
        {
          original: "![img1](same.png)",
          alt: "img1",
          src: "same.png",
          line: 1,
          column: 0,
          isWikilink: false,
          isReference: false,
        },
        {
          original: "![img2](same.png)",
          alt: "img2",
          src: "same.png",
          line: 2,
          column: 0,
          isWikilink: false,
          isReference: false,
        },
        {
          original: "![different](other.jpg)",
          alt: "different",
          src: "other.jpg",
          line: 3,
          column: 0,
          isWikilink: false,
          isReference: false,
        },
      ];

      const grouped = extractor.groupBySource(links);

      expect(grouped.size).toBe(2);
      expect(grouped.get("same.png")).toHaveLength(2);
      expect(grouped.get("other.jpg")).toHaveLength(1);
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in alt text", () => {
      const content = `![Alt with [brackets] and (parens)](test.png)`;
      const result = extractor.extractImageLinks(content);

      expect(result.links[0].alt).toBe("Alt with [brackets] and (parens)");
      expect(result.links[0].src).toBe("test.png");
    });

    it("should handle empty alt text", () => {
      const content = `![]() and ![alt](image.png)`;
      const result = extractor.extractImageLinks(content);

      expect(result.links[0].alt).toBe("");
      expect(result.links[1].alt).toBe("alt");
    });

    it("should handle complex markdown with code blocks", () => {
      const content = `
# Document

Regular image: ![test](test.png)

\`\`\`markdown
![This is in a code block](should-be-ignored.png)
\`\`\`

Another image: ![another](another.png)
      `;

      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(2);
      expect(result.links[0].src).toBe("test.png");
      expect(result.links[1].src).toBe("another.png");
    });

    it("should handle multiple links on same line", () => {
      const content = `Line with ![first](first.png) and ![second](second.jpg) images`;
      const result = extractor.extractImageLinks(content);

      expect(result.links).toHaveLength(2);
      expect(result.links[0].src).toBe("first.png");
      expect(result.links[1].src).toBe("second.jpg");
    });
  });
});
