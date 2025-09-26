# Generic Document Processing System

This system has been generalized to work with any folder structure and knowledge management system, not just Obsidian.

## Key Features

✅ **System Agnostic** - Works with Obsidian, generic Markdown, Notion, or custom formats  
✅ **Configurable Link Formats** - Support for `[[wikilinks]]`, `[markdown](links)`, or custom patterns  
✅ **Configurable Tag Formats** - Support for `#hashtags`, `@mentions`, or custom patterns  
✅ **Flexible Content Types** - Configurable folder-based content classification  
✅ **Multiple Frontmatter Formats** - YAML, TOML, JSON support  
✅ **Backward Compatible** - Existing Obsidian code continues to work  

## Quick Start

### Option 1: Generic Markdown Documents
```typescript
import { DocumentDatabase, DocumentEmbeddingService, DocumentIngestionPipeline } from "./lib";
import { MARKDOWN_CONFIG } from "./lib/types/document-config";

const database = new DocumentDatabase(connectionString);
const embeddings = new DocumentEmbeddingService(embeddingConfig);
const pipeline = new DocumentIngestionPipeline(database, embeddings, "/path/to/docs", MARKDOWN_CONFIG);

await pipeline.ingestDocuments({
  includePatterns: ["**/*.md", "**/*.mdx"],
  excludePatterns: ["**/node_modules/**", "**/.git/**"]
});
```

### Option 2: Obsidian Vault (backward compatible)
```typescript
import { ObsidianDatabase, ObsidianEmbeddingService, ObsidianIngestionPipeline } from "./lib";

// This still works exactly as before
const database = new ObsidianDatabase(connectionString);
const embeddings = new ObsidianEmbeddingService(embeddingConfig);
const pipeline = new ObsidianIngestionPipeline(database, embeddings, vaultPath);

await pipeline.ingestVault();
```

### Option 3: Custom Configuration
```typescript
import { DocumentProcessingConfig } from "./lib/types/document-config";

const myCustomConfig: DocumentProcessingConfig = {
  systemName: "My Wiki",
  uriScheme: "wiki",
  linkFormats: [
    {
      pattern: /\{\{([^}]+)\}\}/g,  // {{link}} format
      extractTarget: (match) => match[1],
    }
  ],
  tagFormats: [
    {
      pattern: /@([a-zA-Z0-9_-]+)/g,  // @tag format
      extractTag: (match) => match[1],
    }
  ],
  contentTypes: {
    "guide": { folderPatterns: ["guides", "tutorials"] },
    "reference": { folderPatterns: ["ref", "reference"] },
  },
  defaultContentType: "document",
  // ... other config
};

const pipeline = new DocumentIngestionPipeline(database, embeddings, rootPath, myCustomConfig);
```

## CLI Usage

```bash
# Ingest Obsidian vault
node ingest-generic.js "postgresql://..." "/path/to/vault" obsidian

# Ingest markdown documentation
node ingest-generic.js "postgresql://..." "/path/to/docs" markdown

# Ingest with custom patterns
node ingest-generic.js "postgresql://..." "/path/to/files" markdown \
  --include "**/*.md" --include "**/*.mdx" \
  --exclude "**/node_modules/**" --exclude "**/.git/**"
```

## Supported Configurations

### Built-in Configurations

| System | Link Format | Tag Format | Content Types |
|--------|-------------|------------|---------------|
| **Obsidian** | `[[wikilinks]]` | `#tags` | moc, article, conversation, book-note, template |
| **Markdown** | `[text](url)`, `[[wikilinks]]` | `#tags` | documentation, tutorial, reference, blog |
| **Notion** | `[text](url)` | `@tags` | database, template, project |

### Custom Configuration

You can define your own link formats, tag formats, and content type detection:

```typescript
const customConfig: DocumentProcessingConfig = {
  systemName: "Custom System",
  uriScheme: "custom",
  linkFormats: [
    // Multiple link formats supported
    { pattern: /\[\[([^\]]+)\]\]/g, extractTarget: (m) => m[1] },
    { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, extractTarget: (m) => m[2] }
  ],
  tagFormats: [
    // Multiple tag formats supported  
    { pattern: /#([a-zA-Z0-9_/-]+)/g, extractTag: (m) => m[1] },
    { pattern: /@([a-zA-Z0-9_-]+)/g, extractTag: (m) => m[1] }
  ],
  contentTypes: {
    "meeting": { folderPatterns: ["meetings", "calls"] },
    "project": { folderPatterns: ["projects"], filePatterns: ["project-"] },
    "note": { folderPatterns: ["notes", "thoughts"] }
  },
  defaultContentType: "document"
};
```

## Migration Guide

### From Obsidian-specific to Generic

**Before (Obsidian-specific):**
```typescript
import { ObsidianDatabase, ObsidianIngestionPipeline } from "./lib";
```

**After (Generic, but still works):**
```typescript
// Option 1: No changes needed (backward compatible)
import { ObsidianDatabase, ObsidianIngestionPipeline } from "./lib";

// Option 2: Use generic classes
import { DocumentDatabase, DocumentIngestionPipeline } from "./lib";
import { OBSIDIAN_CONFIG } from "./lib/types/document-config";
```

All existing Obsidian code continues to work unchanged.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Document Processing System                   │
├─────────────────────────────────────────────────────────────┤
│  DocumentDatabase          │  DocumentEmbeddingService      │
│  DocumentIngestionPipeline │  DocumentSearchService         │
├─────────────────────────────────────────────────────────────┤
│                Configuration Layer                          │
│  DocumentProcessingConfig  │  LinkFormats │ TagFormats     │
├─────────────────────────────────────────────────────────────┤
│              Backward Compatibility Layer                   │
│  ObsidianDatabase         │  ObsidianIngestionPipeline     │
│  (extends DocumentDatabase) │  (extends DocumentPipeline)   │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Flexible**: Works with any knowledge management system
2. **Configurable**: Customize link formats, tag formats, content types
3. **Backward Compatible**: Existing Obsidian code works unchanged
4. **Extensible**: Easy to add new formats and systems
5. **Type Safe**: Full TypeScript support with proper types
