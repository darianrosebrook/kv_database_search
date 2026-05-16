#!/usr/bin/env tsx

/**
 * Demo script showing the unified ingestion with image processing capabilities
 */

import { ImageLinkExtractor } from "../src/lib/markdown-image-extractor";
import { ImagePathResolver } from "../src/lib/path-resolver";

// Demo markdown content with various image link types
const demoMarkdown = `
# Sample Document with Images

This document demonstrates various image linking patterns:

## Obsidian Wikilinks
Here's a screenshot: ![[screenshot.png]]
And a diagram: ![[diagrams/architecture.svg]]

## Markdown Image Links
Standard markdown: ![Screenshot](images/screenshot.png)
With alt text: ![Complex diagram with many components](complex-diagram.jpg)

## Reference-style Links
Reference images: ![First image][img1]
![Second image][img2]

## Mixed Content
Here's some text with ![inline image](inline.jpg) and more text.

[img1]: images/screenshot.png
[img2]: diagrams/architecture.svg

## Edge Cases
Empty alt: ![]()
Special chars: ![Alt with [brackets] and (parens)](test.png)
`;

async function demoImageExtraction() {
  console.log("🖼️  IMAGE LINK EXTRACTION DEMO");
  console.log("=".repeat(50));

  const extractor = new ImageLinkExtractor();
  const result = extractor.extractImageLinks(demoMarkdown);

  console.log(`📊 Found ${result.links.length} image links:`);

  result.links.forEach((link, i) => {
    console.log(`\n${i + 1}. ${link.original}`);
    console.log(`   Alt: "${link.alt}"`);
    console.log(`   Src: "${link.src}"`);
    console.log(`   Type: ${link.isWikilink ? "Wikilink" : "Markdown"}`);
    console.log(`   Line: ${link.line}, Column: ${link.column}`);
  });

  console.log(`\n📈 Statistics:`);
  console.log(`   Total links: ${result.stats.totalLinks}`);
  console.log(`   Wikilinks: ${result.stats.wikilinks}`);
  console.log(`   Markdown links: ${result.stats.markdownLinks}`);
  console.log(`   Reference links: ${result.stats.referenceLinks}`);
  console.log(`   Unique paths: ${result.stats.uniquePaths}`);

  return result.links;
}

async function demoPathResolution(imageLinks: string[]) {
  console.log("\n🗺️  PATH RESOLUTION DEMO");
  console.log("=".repeat(50));

  const _resolver = new ImagePathResolver("/test-data/vault");
  const imagePaths = imageLinks.map((link) => link.src);

  console.log("Resolving paths:");
  imagePaths.forEach((path, i) => {
    console.log(`  ${i + 1}. "${path}"`);
  });

  // For demo purposes, we'll show what the resolution logic does
  console.log("\n🔍 Resolution Strategy:");
  console.log("1. Check if absolute path exists within vault");
  console.log("2. Check relative to source file directory");
  console.log(
    "3. Try common image directories (attachments/, assets/, images/)"
  );
  console.log("4. Try with common prefixes (attachments/, assets/)");
  console.log("5. Validate file size and type constraints");

  return imagePaths;
}

async function demoIngestion() {
  console.log("\n🚀 INGESTION DEMO");
  console.log("=".repeat(50));

  console.log("✅ Features implemented:");
  console.log("   • Image link extraction from markdown");
  console.log("   • Path resolution for relative images");
  console.log("   • OCR processing for text in images");
  console.log("   • Unified ingestion pipeline");
  console.log("   • Backwards compatibility with existing workflows");
  console.log("   • Comprehensive error handling");

  console.log("\n📝 Usage:");
  console.log("   npm run ingest                    # New unified ingestion");
  console.log("   npm run ingest -- --no-image-processing  # Text-only mode");
  console.log("   npm run ingest-markdown-only      # Legacy markdown-only");
  console.log("   npm run ingest-multi-modal        # Legacy multi-modal");

  console.log("\n🔧 Configuration:");
  console.log("   --enable-image-processing (default: true)");
  console.log("   --max-images-per-file (default: 10)");
  console.log("   --max-file-size (default: 50MB)");
  console.log("   --include/--exclude patterns");
}

async function main() {
  try {
    const imageLinks = await demoImageExtraction();
    await demoPathResolution(imageLinks);
    await demoIngestion();

    console.log("\n🎉 Demo completed successfully!");
    console.log("\nThe ingestion system now automatically:");
    console.log("• Discovers embedded images in markdown files");
    console.log("• Processes images with OCR for text extraction");
    console.log("• Links image content back to source documents");
    console.log("• Provides searchable text from visual content");
    console.log("• Maintains full backwards compatibility");
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
