/**
 * Document Processing Configuration
 * Configurable settings for different document formats and knowledge management systems
 */

export interface LinkFormat {
  /** Regular expression to match links */
  pattern: RegExp;
  /** Function to extract target from match */
  extractTarget: (match: RegExpMatchArray) => string;
  /** Function to extract display text from match (optional) */
  extractDisplayText?: (match: RegExpMatchArray) => string | undefined;
}

export interface TagFormat {
  /** Regular expression to match tags */
  pattern: RegExp;
  /** Function to extract tag name from match */
  extractTag: (match: RegExpMatchArray) => string;
}

export interface ContentTypePattern {
  /** Folder path patterns for this content type */
  folderPatterns: string[];
  /** File name patterns for this content type */
  filePatterns?: string[];
  /** Content patterns to identify this type */
  contentPatterns?: RegExp[];
}

export interface DocumentProcessingConfig {
  /** System name (for branding/logging) */
  systemName: string;

  /** URI scheme for document references */
  uriScheme: string;

  /** Link formats to parse */
  linkFormats: LinkFormat[];

  /** Tag formats to parse */
  tagFormats: TagFormat[];

  /** Content type detection patterns */
  contentTypes: Record<string, ContentTypePattern>;

  /** Default content type when detection fails */
  defaultContentType: string;

  /** Frontmatter formats to support */
  frontmatterFormats: {
    yaml: boolean;
    toml: boolean;
    json: boolean;
  };

  /** File extensions to process */
  supportedExtensions: string[];

  /** Default chunking options */
  chunkingDefaults: {
    maxChunkSize: number;
    chunkOverlap: number;
    preserveStructure: boolean;
    includeContext: boolean;
    cleanContent: boolean;
  };
}

/**
 * Obsidian-specific configuration (as an example)
 */
export const OBSIDIAN_CONFIG: DocumentProcessingConfig = {
  systemName: "Obsidian",
  uriScheme: "obsidian",
  linkFormats: [
    {
      pattern: /\[\[([^\]]+)\]\]/g,
      extractTarget: (match) => match[1].split("|")[0],
      extractDisplayText: (match) => {
        const content = match[1];
        return content.includes("|") ? content.split("|")[1] : undefined;
      },
    },
  ],
  tagFormats: [
    {
      pattern: /#([a-zA-Z0-9_/-]+)/g,
      extractTag: (match) => match[1],
    },
  ],
  contentTypes: {
    moc: {
      folderPatterns: ["mocs", "maps", "maps-of-content"],
    },
    article: {
      folderPatterns: ["articles", "posts", "blog"],
    },
    conversation: {
      folderPatterns: ["chats", "conversations", "aichats"],
    },
    "book-note": {
      folderPatterns: ["books", "reading", "library"],
    },
    template: {
      folderPatterns: ["templates", "template"],
    },
  },
  defaultContentType: "note",
  frontmatterFormats: {
    yaml: true,
    toml: false,
    json: false,
  },
  supportedExtensions: [".md", ".canvas"],
  chunkingDefaults: {
    maxChunkSize: 800,
    chunkOverlap: 100,
    preserveStructure: true,
    includeContext: true,
    cleanContent: true,
  },
};

/**
 * Generic markdown configuration (for general use)
 */
export const MARKDOWN_CONFIG: DocumentProcessingConfig = {
  systemName: "Markdown",
  uriScheme: "file",
  linkFormats: [
    // Standard markdown links [text](url)
    {
      pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
      extractTarget: (match) => match[2],
      extractDisplayText: (match) => match[1],
    },
    // Wiki-style links [[target]]
    {
      pattern: /\[\[([^\]]+)\]\]/g,
      extractTarget: (match) => match[1].split("|")[0],
      extractDisplayText: (match) => {
        const content = match[1];
        return content.includes("|") ? content.split("|")[1] : undefined;
      },
    },
  ],
  tagFormats: [
    {
      pattern: /#([a-zA-Z0-9_-]+)/g,
      extractTag: (match) => match[1],
    },
  ],
  contentTypes: {
    documentation: {
      folderPatterns: ["docs", "documentation"],
    },
    tutorial: {
      folderPatterns: ["tutorials", "guides"],
    },
    reference: {
      folderPatterns: ["reference", "api"],
    },
    blog: {
      folderPatterns: ["blog", "posts", "articles"],
    },
  },
  defaultContentType: "document",
  frontmatterFormats: {
    yaml: true,
    toml: true,
    json: true,
  },
  supportedExtensions: [".md", ".mdx", ".txt"],
  chunkingDefaults: {
    maxChunkSize: 1000,
    chunkOverlap: 150,
    preserveStructure: true,
    includeContext: true,
    cleanContent: true,
  },
};

/**
 * Notion-style configuration (as another example)
 */
export const NOTION_CONFIG: DocumentProcessingConfig = {
  systemName: "Notion",
  uriScheme: "notion",
  linkFormats: [
    // Notion-style links (simplified)
    {
      pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
      extractTarget: (match) => match[2],
      extractDisplayText: (match) => match[1],
    },
  ],
  tagFormats: [
    {
      pattern: /@([a-zA-Z0-9_-]+)/g,
      extractTag: (match) => match[1],
    },
  ],
  contentTypes: {
    database: {
      folderPatterns: ["databases"],
    },
    template: {
      folderPatterns: ["templates"],
    },
    project: {
      folderPatterns: ["projects"],
    },
  },
  defaultContentType: "page",
  frontmatterFormats: {
    yaml: true,
    toml: false,
    json: true,
  },
  supportedExtensions: [".md", ".html"],
  chunkingDefaults: {
    maxChunkSize: 1200,
    chunkOverlap: 200,
    preserveStructure: true,
    includeContext: true,
    cleanContent: true,
  },
};
