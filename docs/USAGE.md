# Document ingestion usage guide

`@kv/ingestion` provides a config-driven pipeline that walks a directory of markdown files, chunks them, generates embeddings, and writes the results to a database. Storage and embeddings are injected as structural interfaces so the package has no runtime dependency on `@kv/database` — you can wire it to any backend that satisfies the contract.

## Key capabilities

- **System-agnostic** — Obsidian vaults, generic markdown, Notion exports, or your own format via custom config
- **Configurable link parsing** — `[[wikilinks]]`, `[markdown](links)`, `{{custom}}`, or whatever regex you supply
- **Configurable tag parsing** — `#hashtags`, `@mentions`, or custom patterns
- **Folder-based content classification** — assign content types from path patterns or filename patterns
- **YAML frontmatter** — parsed automatically; `type:` field overrides folder-based classification
- **Glob include/exclude** — supports `**/`, `*`, `?`; root-level files match `**/*.md`
- **Structure-aware chunking** — splits on markdown headers, with sliding-window fallback
- **Skip-existing mode** — checks the database before re-embedding chunks (useful for incremental ingestion)

## Quick start

### Option 1 — ingest an Obsidian vault

```typescript
import { DocumentDatabase } from "@kv/database/src/lib/database";
import { DocumentEmbeddingService } from "@kv/database/src/lib/embeddings";
import { DocumentIngestionPipeline, OBSIDIAN_CONFIG } from "@kv/ingestion";

const database = new DocumentDatabase(process.env.DATABASE_URL!);
await database.initialize();

const embeddings = new DocumentEmbeddingService({
  model: "embeddinggemma",
  dimension: 768,
});

const pipeline = new DocumentIngestionPipeline(
  database,
  embeddings,
  "/path/to/vault",
  OBSIDIAN_CONFIG
);

const result = await pipeline.ingestDocuments({
  skipExisting: true,
  batchSize: 5,
  includePatterns: ["**/*.md"],
  excludePatterns: ["**/.obsidian/**", "**/Attachments/**"],
});

console.log(result); // { totalFiles, processedFiles, totalChunks, ... }
```

### Option 2 — ingest a generic markdown documentation tree

```typescript
import { DocumentIngestionPipeline, MARKDOWN_CONFIG } from "@kv/ingestion";

const pipeline = new DocumentIngestionPipeline(
  database,
  embeddings,
  "/path/to/docs",
  MARKDOWN_CONFIG
);

await pipeline.ingestDocuments({
  includePatterns: ["**/*.md", "**/*.mdx"],
  excludePatterns: ["**/node_modules/**", "**/.git/**"],
});
```

### Option 3 — Notion-style export

```typescript
import { DocumentIngestionPipeline, NOTION_CONFIG } from "@kv/ingestion";

const pipeline = new DocumentIngestionPipeline(
  database,
  embeddings,
  "/path/to/notion-export",
  NOTION_CONFIG
);

await pipeline.ingestDocuments();
```

### Option 4 — custom configuration

```typescript
import {
  DocumentIngestionPipeline,
  type DocumentProcessingConfig,
} from "@kv/ingestion";

const wikiConfig: DocumentProcessingConfig = {
  systemName: "MyWiki",
  uriScheme: "wiki",
  linkFormats: [
    {
      pattern: /\{\{([^}]+)\}\}/g, // {{TargetPage}}
      extractTarget: (m) => m[1],
    },
  ],
  tagFormats: [
    {
      pattern: /@([a-zA-Z0-9_-]+)/g, // @category
      extractTag: (m) => m[1],
    },
  ],
  contentTypes: {
    guide: { folderPatterns: ["guides", "tutorials"] },
    reference: { folderPatterns: ["reference", "api"] },
    meeting: {
      folderPatterns: ["meetings"],
      filePatterns: ["meeting-", "standup-"],
    },
  },
  defaultContentType: "page",
  frontmatterFormats: { yaml: true, toml: false, json: false },
  supportedExtensions: [".md"],
  chunkingDefaults: {
    maxChunkSize: 1000,
    chunkOverlap: 150,
    preserveStructure: true,
    includeContext: true,
    cleanContent: true,
  },
};

const pipeline = new DocumentIngestionPipeline(
  database,
  embeddings,
  "/path/to/wiki",
  wikiConfig
);
```

## CLI usage

The repo ships a generic CLI driver at `apps/kv_database/src/scripts/ingest-generic.ts`:

```bash
# Ingest an Obsidian vault
pnpm --filter @kv/database exec tsx src/scripts/ingest-generic.ts \
  "postgresql://user:pass@localhost:5432/obsidian_rag" \
  "/path/to/vault" \
  obsidian

# Ingest a markdown documentation tree with custom patterns
pnpm --filter @kv/database exec tsx src/scripts/ingest-generic.ts \
  "postgresql://..." \
  "/path/to/docs" \
  markdown \
  --include "**/*.md" --include "**/*.mdx" \
  --exclude "**/node_modules/**" --exclude "**/.git/**" \
  --batch-size 10

# Print help and exit
pnpm --filter @kv/database exec tsx src/scripts/ingest-generic.ts
```

For the image-aware Obsidian pipeline (OCR + scene classification on embedded images), use `npm run ingest` instead — that drives `apps/kv_database/src/scripts/ingest.ts`, which composes the ingestion pipeline with `@kv/processors`.

## Built-in configurations

| Preset | Link format | Tag format | Content types |
|---|---|---|---|
| `OBSIDIAN_CONFIG` | `[[wikilinks]]` | `#tag` | `moc`, `article`, `conversation`, `book-note`, `template` |
| `MARKDOWN_CONFIG` | `[text](url)`, `[[wikilinks]]` | `#tag` | `documentation`, `tutorial`, `reference`, `blog` |
| `NOTION_CONFIG` | `[text](url)` | `@tag` | `database`, `template`, `project` |

The `uriScheme` field determines the URI prefix written to chunk metadata (`obsidian://`, `file://`, `notion://`), and `systemName` becomes the `sourceType` field.

## Custom database + embedding backends

`DocumentIngestionPipeline` accepts any object satisfying these structural interfaces:

```typescript
interface DocumentDatabaseLike {
  getChunkById(id: string): Promise<unknown>;
  upsertChunk(chunk: any): Promise<unknown>;
  getStats(): Promise<{ totalChunks: number; [key: string]: unknown }>;
  search(
    embedding: number[],
    options?: { limit?: number; [key: string]: unknown }
  ): Promise<Array<{ id: string; text: string; meta: Record<string, unknown> }>>;
}

interface DocumentEmbeddingServiceLike {
  embed(text: string): Promise<number[]>;
  embedWithStrategy(
    text: string,
    contentType?: string,
    domainHint?: string
  ): Promise<{ embedding: number[]; [key: string]: unknown }>;
}
```

The bundled `DocumentDatabase` (PostgreSQL + pgvector) and `DocumentEmbeddingService` (Ollama) satisfy these. Swap in your own — e.g. an in-memory store for tests, or a different vector backend — without modifying `@kv/ingestion`.

## Backward compatibility

`ObsidianIngestionPipeline` is preserved as a thin subclass that defaults to `OBSIDIAN_CONFIG` and exposes `ingestVault(options)` as an alias for `ingestDocuments(options)`. New code should prefer `DocumentIngestionPipeline` with an explicit config; the subclass is kept so existing scripts continue to work.

```typescript
import { ObsidianIngestionPipeline } from "@kv/ingestion";

const pipeline = new ObsidianIngestionPipeline(database, embeddings, vaultPath);
await pipeline.ingestVault(); // == ingestDocuments() with OBSIDIAN_CONFIG
```

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       @kv/ingestion                            │
├────────────────────────────────────────────────────────────────┤
│  DocumentIngestionPipeline                                     │
│  ├─ discoverMarkdownFiles (glob include/exclude)               │
│  ├─ parseDocumentFile (frontmatter, links, tags, sections)     │
│  ├─ chunkDocument (structure-aware or sliding window)          │
│  └─ batched embed + upsert via injected interfaces             │
├────────────────────────────────────────────────────────────────┤
│  DocumentProcessingConfig                                      │
│  └─ OBSIDIAN_CONFIG │ MARKDOWN_CONFIG │ NOTION_CONFIG │ custom │
├────────────────────────────────────────────────────────────────┤
│  Structural interfaces (injected by caller)                    │
│  DocumentDatabaseLike  │  DocumentEmbeddingServiceLike         │
├────────────────────────────────────────────────────────────────┤
│  Depends only on @kv/utils                                     │
└────────────────────────────────────────────────────────────────┘
                              ↑
              ┌───────────────┴───────────────┐
              │       @kv/database (app)      │
              │  DocumentDatabase (PG+pgvector)│
              │  DocumentEmbeddingService (Ollama)│
              └───────────────────────────────┘
```
