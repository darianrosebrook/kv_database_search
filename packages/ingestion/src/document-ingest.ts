import * as fs from "fs";
import * as path from "path";
import {
  createHash,
  extractLinks,
  extractTags,
  cleanMarkdown,
  generateDeterministicId,
  sleep,
} from "@kv/utils";

import {
  Document,
  DocumentFile,
  ChunkingOptions,
  DocumentSection,
} from "./types/document-models";
import {
  DocumentProcessingConfig,
  MARKDOWN_CONFIG,
  OBSIDIAN_CONFIG,
} from "./types/document-config";

/**
 * Structural interface for chunk storage. Callers pass any database-like
 * object that implements these methods (typically @kv/database's
 * DocumentDatabase).
 */
export interface DocumentDatabaseLike {
  getChunkById(id: string): Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upsertChunk(chunk: any): Promise<unknown>;
  getStats(): Promise<{ totalChunks: number; [key: string]: unknown }>;
  search(
    embedding: number[],
    options?: { limit?: number; [key: string]: unknown }
  ): Promise<
    Array<{
      id: string;
      text: string;
      meta: Record<string, unknown>;
    }>
  >;
}

/**
 * Structural interface for an embedding service. Callers pass any service
 * implementing these methods (typically @kv/database's DocumentEmbeddingService).
 */
export interface DocumentEmbeddingServiceLike {
  embed(text: string): Promise<number[]>;
  embedWithStrategy(
    text: string,
    contentType?: string,
    domainHint?: string
  ): Promise<{ embedding: number[]; [key: string]: unknown }>;
}

/**
 * Minimal metadata block produced by the ingestion pipeline. Callers can
 * extend this with their own concrete metadata type.
 */
export interface IngestionChunkMetadata {
  uri: string;
  section: string;
  breadcrumbs: string[];
  contentType: string;
  sourceType: string;
  sourceDocumentId: string;
  lang: string;
  acl: string;
  updatedAt: Date;
  createdAt?: Date;
  chunkIndex?: number;
  chunkCount?: number;
  obsidianFile?: {
    fileName: string;
    filePath: string;
    frontmatter: Record<string, unknown>;
    wikilinks: string[];
    tags: string[];
    checksum: string;
    stats: {
      wordCount: number;
      characterCount: number;
      lineCount: number;
    };
  };
  [key: string]: unknown;
}

export interface IngestionChunk {
  id: string;
  text: string;
  meta: IngestionChunkMetadata;
}

export interface IngestionResult {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  processedChunks: number;
  skippedChunks: number;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  sampleResults: Array<{
    id: string;
    textPreview: string;
    hasEmbedding: boolean;
    metadataValid: boolean;
    sourceMetadata?: unknown;
  }>;
}

/**
 * Parse YAML-like frontmatter from markdown content. Supports simple
 * key-value pairs and string-array values. Returns an empty record when no
 * frontmatter block is present or parsing fails.
 */
function parseFrontmatter(content: string): Record<string, unknown> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  if (!match) {
    return {};
  }

  try {
    const frontmatter: Record<string, unknown> = {};
    const lines = match[1].split("\n");
    let currentKey = "";
    let currentValue: string | string[] | null = null;
    let isArray = false;

    const flush = () => {
      if (!currentKey) return;
      frontmatter[currentKey] = currentValue;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.includes(":") && !line.startsWith("-")) {
        flush();
        const [key, ...valueParts] = line.split(":");
        if (key && key.trim() && valueParts.length > 0) {
          currentKey = key.trim();
          const value = valueParts.join(":").trim();
          if (value === "") {
            isArray = true;
            currentValue = [];
          } else {
            isArray = false;
            currentValue = value.replace(/^["']|["']$/g, "");
          }
        }
      } else if (line.startsWith("-")) {
        if (isArray && Array.isArray(currentValue)) {
          const item = line
            .substring(1)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (item) {
            currentValue.push(item);
          }
        }
      } else if (rawLine.startsWith("  ")) {
        if (typeof currentValue === "string") {
          currentValue += " " + line;
        }
      }
    }

    flush();
    return frontmatter;
  } catch {
    return {};
  }
}

export class DocumentIngestionPipeline {
  protected db: DocumentDatabaseLike;
  protected embeddings: DocumentEmbeddingServiceLike;
  protected rootPath: string;
  protected config: DocumentProcessingConfig;

  constructor(
    database: DocumentDatabaseLike,
    embeddingService: DocumentEmbeddingServiceLike,
    rootPath: string,
    config: DocumentProcessingConfig = MARKDOWN_CONFIG
  ) {
    this.db = database;
    this.embeddings = embeddingService;
    this.rootPath = rootPath;
    this.config = config;
  }

  async ingestDocuments(
    options: {
      batchSize?: number;
      rateLimitMs?: number;
      skipExisting?: boolean;
      includePatterns?: string[];
      excludePatterns?: string[];
      chunkingOptions?: ChunkingOptions;
    } = {}
  ): Promise<IngestionResult> {
    const {
      batchSize = 5,
      rateLimitMs = 200,
      skipExisting = true,
      includePatterns = ["**/*.md"],
      excludePatterns = [
        "**/.git/**",
        "**/node_modules/**",
        "**/Attachments/**",
        "**/assets/**",
      ],
      chunkingOptions = {},
    } = options;

    console.log(`🚀 Starting document ingestion: ${this.rootPath}`);

    try {
      const markdownFiles = await this.discoverMarkdownFiles(
        includePatterns,
        excludePatterns
      );
      console.log(`📄 Found ${markdownFiles.length} markdown files`);

      let processedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      let skippedChunks = 0;
      const errors: string[] = [];

      for (let i = 0; i < markdownFiles.length; i += batchSize) {
        const batch = markdownFiles.slice(i, i + batchSize);
        console.log(
          `⚙️  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            markdownFiles.length / batchSize
          )}`
        );

        try {
          const batchResults = await this.processBatch(
            batch,
            skipExisting,
            chunkingOptions
          );

          processedFiles += batchResults.processedFiles;
          totalChunks += batchResults.totalChunks;
          processedChunks += batchResults.processedChunks;
          skippedChunks += batchResults.skippedChunks;
          errors.push(...batchResults.errors);

          if (i + batchSize < markdownFiles.length) {
            await sleep(rateLimitMs);
          }
        } catch (error) {
          const errorMsg = `Batch ${
            Math.floor(i / batchSize) + 1
          } failed: ${error}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const result: IngestionResult = {
        totalFiles: markdownFiles.length,
        processedFiles,
        totalChunks,
        processedChunks,
        skippedChunks,
        errors,
      };

      console.log(`✅ Document ingestion complete:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Document ingestion failed: ${error}`);
      throw new Error(`Document ingestion pipeline failed: ${error}`);
    }
  }

  async ingestFiles(
    filePaths: string[],
    options: {
      skipExisting?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<IngestionResult> {
    const { skipExisting = false, batchSize = 10 } = options;

    console.log(`🚀 Starting file ingestion for ${filePaths.length} files`);

    try {
      let processedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      let skippedChunks = 0;
      const errors: string[] = [];

      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);

        try {
          const batchResults = await this.processBatch(batch, skipExisting, {});

          processedFiles += batchResults.processedFiles;
          totalChunks += batchResults.totalChunks;
          processedChunks += batchResults.processedChunks;
          skippedChunks += batchResults.skippedChunks;
          errors.push(...batchResults.errors);
        } catch (error) {
          const errorMsg = `Batch ${
            Math.floor(i / batchSize) + 1
          } failed: ${error}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const result: IngestionResult = {
        totalFiles: filePaths.length,
        processedFiles,
        totalChunks,
        processedChunks,
        skippedChunks,
        errors,
      };

      console.log(`✅ File ingestion complete:`, result);
      return result;
    } catch (error) {
      console.error(`❌ File ingestion failed: ${error}`);
      throw new Error(`File ingestion pipeline failed: ${error}`);
    }
  }

  private async discoverMarkdownFiles(
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    const walkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.rootPath, fullPath);

        if (
          excludePatterns.some((pattern) =>
            this.matchesPattern(relativePath, pattern)
          )
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          if (
            includePatterns.some((pattern) =>
              this.matchesPattern(relativePath, pattern)
            )
          ) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(this.rootPath);
    return files;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob to regex by tokenizing into chars and emitting safe
    // substitutions. We translate "**/" as zero or more dir segments,
    // remaining "**" as ".*", "*" as "[^/]*", "?" as ".", and escape any
    // regex metacharacters (notably ".") that would otherwise mismatch.
    let regexPattern = "";
    for (let i = 0; i < pattern.length; i++) {
      const ch = pattern[i];
      if (ch === "*" && pattern[i + 1] === "*") {
        if (pattern[i + 2] === "/") {
          regexPattern += "(?:[^/]+/)*";
          i += 2;
        } else {
          regexPattern += ".*";
          i += 1;
        }
      } else if (ch === "*") {
        regexPattern += "[^/]*";
      } else if (ch === "?") {
        regexPattern += "[^/]";
      } else if (/[.+^${}()|[\]\\]/.test(ch)) {
        regexPattern += "\\" + ch;
      } else {
        regexPattern += ch;
      }
    }
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  private async processBatch(
    filePaths: string[],
    skipExisting: boolean,
    chunkingOptions: ChunkingOptions
  ): Promise<{
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
  }> {
    let processedFiles = 0;
    let totalChunks = 0;
    let processedChunks = 0;
    let skippedChunks = 0;
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        console.log(
          `📖 Processing: ${path.relative(this.rootPath, filePath)}`
        );

        const document = await this.parseDocumentFile(filePath);

        console.log(`✅ Successfully parsed file: ${document.fileName}`);

        if (!document.content.trim()) {
          console.log(`⏭️  Skipping empty file: ${document.fileName}`);
          continue;
        }

        const chunks = await this.chunkDocument(document, chunkingOptions);
        totalChunks += chunks.length;

        for (const chunk of chunks) {
          try {
            if (skipExisting) {
              const existing = await this.db.getChunkById(chunk.id);
              if (existing) {
                console.log(
                  `⏭️  Skipping existing chunk: ${chunk.id.slice(0, 8)}...`
                );
                skippedChunks++;
                continue;
              }
            }

            console.log(
              `🔮 Embedding chunk: ${chunk.id.slice(0, 8)}... (${
                chunk.text.length
              } chars)`
            );

            const embeddingResult = await this.embeddings.embedWithStrategy(
              chunk.text,
              chunk.meta.contentType,
              "knowledge-base"
            );

            await this.db.upsertChunk({
              ...chunk,
              embedding: embeddingResult.embedding,
            });

            processedChunks++;
          } catch (error) {
            console.error(`❌ Failed to process chunk ${chunk.id}: ${error}`);
            errors.push(`Chunk ${chunk.id}: ${error}`);
          }
        }

        processedFiles++;
      } catch (error) {
        console.error(`❌ Failed to process file ${filePath}: ${error}`);
        errors.push(`File ${filePath}: ${error}`);
      }
    }

    return {
      processedFiles,
      totalChunks,
      processedChunks,
      skippedChunks,
      errors,
    };
  }

  private async parseDocumentFile(filePath: string): Promise<Document> {
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }

    const frontmatter = parseFrontmatter(content);
    const body = content.replace(/^---[\s\S]*?---\n?/, "").trim();

    const links = extractLinks(body, this.config.linkFormats);
    const contentTags = extractTags(body, this.config.tagFormats);

    const frontmatterTags =
      frontmatter && frontmatter.tags
        ? Array.isArray(frontmatter.tags)
          ? (frontmatter.tags as string[])
          : typeof frontmatter.tags === "string"
          ? [frontmatter.tags]
          : []
        : [];
    const allTags = [...frontmatterTags, ...contentTags];

    let stats: fs.Stats;
    try {
      stats = fs.statSync(filePath);
    } catch (error) {
      throw new Error(`Failed to get stats for file ${filePath}: ${error}`);
    }

    const wordCount = body
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;
    const characterCount = body.length;
    const lineCount = body.split("\n").length;

    const sections = this.parseSections(body);
    const checksum = createHash("sha256", content);

    return {
      id: path.relative(this.rootPath, filePath),
      path: path.relative(this.rootPath, filePath),
      filePath,
      relativePath: path.relative(this.rootPath, filePath),
      name: path.basename(filePath, ".md"),
      fileName: path.basename(filePath, ".md"),
      extension: ".md",
      content: body,
      frontmatter,
      sections,
      stats: {
        wordCount,
        characterCount,
        lineCount,
        headingCount: sections?.length || 0,
        linkCount: links.length,
        tagCount: allTags.length,
        size: stats.size,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
      },
      relationships: {
        links:
          links?.map((link) => ({
            target: link,
            displayText: link,
            type: "document",
          })) || [],
        tags: allTags || [],
        backlinks: [],
      },
      metadata: {
        created: stats.birthtime,
        modified: stats.mtime,
        checksum,
        lastIndexed: new Date(),
        processingErrors: [],
      },
    };
  }

  private parseSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split("\n");

    let currentSection: DocumentSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        if (currentSection) {
          currentSection.endLine = i - 1;
          sections.push(currentSection);
        }

        const level = headerMatch[1].length;
        const title = headerMatch[2];

        currentSection = {
          level,
          title,
          content: "",
          startLine: i,
          endLine: i,
          links: [],
          tags: [],
        };
      } else if (currentSection) {
        currentSection.content += line + "\n";
        currentSection.links.push(
          ...extractLinks(line, this.config.linkFormats)
        );
        currentSection.tags.push(...extractTags(line, this.config.tagFormats));
      }
    }

    if (currentSection) {
      currentSection.endLine = lines.length - 1;
      sections.push(currentSection);
    }

    sections.forEach((section) => {
      section.links = Array.from(new Set(section.links));
      section.tags = Array.from(new Set(section.tags));
    });

    return sections;
  }

  private async chunkDocument(
    document: Document,
    options: ChunkingOptions
  ): Promise<IngestionChunk[]> {
    const {
      maxChunkSize = 800,
      chunkOverlap = 100,
      preserveStructure = true,
      includeContext = true,
      cleanContent = true,
    } = options;

    const chunks: IngestionChunk[] = [];

    const contentType = this.determineContentType(
      document.filePath || document.path,
      document.frontmatter
    );

    const docPath = document.relativePath || document.path || "unknown";
    const docName = document.fileName || document.name || "untitled";
    const baseMetadata: IngestionChunkMetadata = {
      uri: `${this.config.uriScheme}://${docPath}`,
      section: docName,
      breadcrumbs: this.generateBreadcrumbs(docPath),
      contentType,
      sourceType: this.config.systemName.toLowerCase(),
      sourceDocumentId: docName,
      lang: "en",
      acl: "public",
      updatedAt: document.stats.updatedAt || new Date(),
      createdAt: document.stats.createdAt || new Date(),
      chunkIndex: 0,
      chunkCount: 1,
      obsidianFile: {
        fileName: docName,
        filePath: docPath,
        frontmatter: document.frontmatter,
        wikilinks: document.relationships.links?.map((w) => w.target) || [],
        tags: document.relationships.tags || [],
        checksum: document.metadata.checksum,
        stats: {
          wordCount: document.stats.wordCount,
          characterCount: document.stats.characterCount,
          lineCount: document.stats.lineCount,
        },
      },
    };

    if (preserveStructure) {
      const file: DocumentFile = {
        filePath: document.filePath || document.path || "unknown",
        fileName: docName,
        content: document.content,
        frontmatter: document.frontmatter,
        stats: document.stats,
      };
      chunks.push(
        ...this.chunkByStructure(
          file,
          baseMetadata,
          maxChunkSize,
          includeContext,
          cleanContent,
          document.relationships.links?.map((w) => w.target) || [],
          document.relationships.tags || []
        )
      );
    } else {
      chunks.push(
        ...this.chunkBySize(
          document.content,
          baseMetadata,
          maxChunkSize,
          chunkOverlap,
          cleanContent
        )
      );
    }

    return chunks;
  }

  private chunkByStructure(
    file: DocumentFile,
    baseMetadata: IngestionChunkMetadata,
    maxChunkSize: number,
    includeContext: boolean,
    cleanContent: boolean,
    links: string[],
    tags: string[]
  ): IngestionChunk[] {
    const chunks: IngestionChunk[] = [];
    const lines = file.content.split("\n");

    let currentChunk = "";
    let currentSection = file.fileName;
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        if (currentChunk.trim()) {
          chunks.push(
            this.createChunk(
              file,
              currentChunk.trim(),
              currentSection,
              baseMetadata,
              chunkIndex++,
              includeContext,
              cleanContent,
              links,
              tags
            )
          );
        }

        currentSection = headerMatch[2];
        currentChunk = line + "\n";
      } else {
        currentChunk += line + "\n";

        if (currentChunk.length > maxChunkSize) {
          chunks.push(
            this.createChunk(
              file,
              currentChunk.trim(),
              currentSection,
              baseMetadata,
              chunkIndex++,
              includeContext,
              cleanContent,
              links,
              tags
            )
          );
          currentChunk = "";
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(
          file,
          currentChunk.trim(),
          currentSection,
          baseMetadata,
          chunkIndex++,
          includeContext,
          cleanContent,
          links,
          tags
        )
      );
    }

    return chunks;
  }

  private chunkBySize(
    content: string,
    baseMetadata: IngestionChunkMetadata,
    maxChunkSize: number,
    chunkOverlap: number,
    cleanContent: boolean
  ): IngestionChunk[] {
    const chunks: IngestionChunk[] = [];
    const processedContent = cleanContent ? cleanMarkdown(content) : content;
    const words = processedContent.split(/\s+/);

    let chunkIndex = 0;
    for (let i = 0; i < words.length; i += maxChunkSize - chunkOverlap) {
      const chunkWords = words.slice(i, i + maxChunkSize);
      const chunkText = chunkWords.join(" ");

      if (chunkText.trim()) {
        const chunkId = this.generateChunkId(
          baseMetadata.sourceDocumentId,
          chunkIndex
        );

        chunks.push({
          id: chunkId,
          text: chunkText.trim(),
          meta: {
            ...baseMetadata,
            section: `${baseMetadata.section} (Part ${chunkIndex + 1})`,
            chunkIndex,
            chunkCount: Math.ceil(words.length / (maxChunkSize - chunkOverlap)),
          },
        });

        chunkIndex++;
      }
    }

    return chunks;
  }

  private createChunk(
    file: DocumentFile,
    text: string,
    section: string,
    baseMetadata: IngestionChunkMetadata,
    chunkIndex: number,
    includeContext: boolean,
    cleanContent: boolean,
    links: string[],
    tags: string[]
  ): IngestionChunk {
    const chunkId = this.generateChunkId(file.fileName, chunkIndex);

    let processedText = cleanContent ? cleanMarkdown(text) : text;

    if (includeContext) {
      const contextParts: string[] = [];

      const title = file.frontmatter.title;
      if (typeof title === "string" && title !== file.fileName) {
        contextParts.push(`Title: ${title}`);
      }

      if (tags.length > 0) {
        contextParts.push(`Tags: ${tags.slice(0, 5).join(", ")}`);
      }

      if (links.length > 0) {
        contextParts.push(`Related: ${links.slice(0, 3).join(", ")}`);
      }

      if (contextParts.length > 0) {
        processedText = `${contextParts.join(" | ")}\n\n${processedText}`;
      }
    }

    return {
      id: chunkId,
      text: processedText,
      meta: {
        ...baseMetadata,
        section,
        chunkIndex,
      },
    };
  }

  private generateChunkId(fileName: string, chunkIndex: number): string {
    const hash = generateDeterministicId(fileName, chunkIndex);
    return `${this.config.uriScheme}_${fileName}_${chunkIndex}_${hash}`;
  }

  async validateIngestion(sampleSize = 5): Promise<ValidationResult> {
    const issues: string[] = [];
    const sampleResults: ValidationResult["sampleResults"] = [];

    try {
      const stats = await this.db.getStats();
      console.log(`📊 Database stats:`, stats);

      if (stats.totalChunks === 0) {
        issues.push("No chunks found in database");
        return { isValid: false, issues, sampleResults };
      }

      const testQueries = [
        "design system",
        "MOC",
        "accessibility",
        "components",
      ];

      for (const query of testQueries) {
        try {
          const testEmbedding = await this.embeddings.embed(query);
          const searchResults = await this.db.search(testEmbedding, {
            limit: sampleSize,
          });

          for (const result of searchResults.slice(0, 2)) {
            const metadataValid = this.validateMetadata(result.meta);
            sampleResults.push({
              id: result.id,
              textPreview: result.text.slice(0, 150) + "...",
              hasEmbedding: true,
              metadataValid,
              sourceMetadata: (result.meta as IngestionChunkMetadata)
                .obsidianFile,
            });

            if (!metadataValid) {
              issues.push(`Invalid metadata for chunk ${result.id}`);
            }
          }
        } catch (error) {
          issues.push(`Search test failed for query "${query}": ${error}`);
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        sampleResults,
      };
    } catch (error) {
      issues.push(`Validation failed: ${error}`);
      return { isValid: false, issues, sampleResults };
    }
  }

  private validateMetadata(meta: Record<string, unknown>): boolean {
    const required = ["uri", "section", "sourceType", "sourceDocumentId"];
    return required.every((field) =>
      Object.prototype.hasOwnProperty.call(meta, field)
    );
  }

  private generateBreadcrumbs(relativePath: string): string[] {
    const parts = relativePath
      .split(path.sep)
      .filter((part) => part && part !== ".");
    const breadcrumbs: string[] = [];

    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts.slice(0, i + 1).join("/");
      breadcrumbs.push(segment);
    }

    return breadcrumbs;
  }

  private determineContentType(
    filePath: string,
    frontmatter: Record<string, unknown>
  ): string {
    if (frontmatter.type && typeof frontmatter.type === "string") {
      return frontmatter.type;
    }

    const relativePath = path.relative(this.rootPath, filePath).toLowerCase();

    for (const [contentType, pattern] of Object.entries(
      this.config.contentTypes
    )) {
      if (
        pattern.folderPatterns.some((folderPattern) =>
          relativePath.includes(folderPattern.toLowerCase())
        )
      ) {
        return contentType;
      }

      if (pattern.filePatterns) {
        const fileName = path.basename(filePath).toLowerCase();
        if (
          pattern.filePatterns.some((filePattern) =>
            fileName.includes(filePattern.toLowerCase())
          )
        ) {
          return contentType;
        }
      }
    }

    return this.config.defaultContentType;
  }
}

/**
 * Backward compatibility chunking options for Obsidian-flavored callers.
 */
export interface ObsidianChunkingOptions extends ChunkingOptions {
  includeFrontmatter?: boolean;
  includeTags?: boolean;
  includeWikilinks?: boolean;
  sectionChunking?: boolean;
  headingChunking?: boolean;
}

/**
 * Backward compatibility class for Obsidian-specific usage. Uses
 * OBSIDIAN_CONFIG by default.
 *
 * @deprecated Use DocumentIngestionPipeline with OBSIDIAN_CONFIG instead.
 */
export class ObsidianIngestionPipeline extends DocumentIngestionPipeline {
  constructor(
    database: DocumentDatabaseLike,
    embeddingService: DocumentEmbeddingServiceLike,
    vaultPath: string
  ) {
    super(database, embeddingService, vaultPath, OBSIDIAN_CONFIG);
  }

  async ingestVault(options = {}) {
    return this.ingestDocuments(options);
  }
}
