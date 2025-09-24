# Obsidian RAG Data Contracts

This directory contains the comprehensive data contracts and API specifications for the Obsidian RAG system, defining the structure and behavior of all data exchanged between components.

## 📋 Overview

The Obsidian RAG system processes Obsidian vault content to provide semantic search and knowledge graph capabilities. These contracts ensure type safety, API compatibility, and data integrity across all system components.

## 📁 Files

- **`api.yaml`** - OpenAPI 3.0.3 specification for REST API endpoints
- **`data-contracts.schema.json`** - JSON Schema definitions for core data structures
- **`README.md`** - This documentation file

## 🏗️ Core Data Structures

### ObsidianDocument

Represents a complete Obsidian document with all metadata:

```typescript
interface ObsidianDocument {
  id: string;                    // Unique identifier (relative path)
  path: string;                  // File path from vault root
  name: string;                  // Filename without extension
  extension: 'md' | 'canvas';    // File type
  content: string;               // Raw markdown content
  frontmatter: Record<string, any>; // Parsed YAML frontmatter
  stats: DocumentStats;          // Content statistics
  relationships: DocumentRelationships; // Links and references
  metadata: DocumentMetadata;    // Processing metadata
}
```

### DocumentChunk

Represents a processed chunk of document content for search:

```typescript
interface DocumentChunk {
  id: string;
  text: string;
  meta: {
    section: string;
    contentType: ContentType;
    breadcrumbs: string[];
  };
  embedding?: number[];
}
```

### Wikilink & Backlink

Define relationships between documents:

```typescript
interface Wikilink {
  target: string;        // Target document path
  display?: string;      // Display text override
  type: 'document' | 'heading' | 'block';
  position: Position;    // Location in source document
  context: string;       // Surrounding text
}

interface Backlink {
  source: string;        // Source document
  context: string;       // Reference context
  position: Position;    // Location in source
}
```

## 🔌 API Endpoints

### Search API

**POST** `/search`
- Semantic search across vault content
- Supports filtering by content type, tags, folders
- Returns ranked results with relevance scores

**Request:**
```json
{
  "query": "design system components",
  "options": {
    "contentTypes": ["moc", "article"],
    "tags": ["design"],
    "limit": 20,
    "searchMode": "comprehensive"
  }
}
```

**Response:**
```json
{
  "query": "design system components",
  "results": [...],
  "totalFound": 42,
  "performance": {
    "totalTime": 0.123,
    "searchTime": 0.089,
    "processingTime": 0.034
  },
  "facets": {...},
  "graphInsights": {...}
}
```

### Document Management

**GET** `/documents/{documentId}`
- Retrieve detailed document information
- Includes relationships and metadata

**GET** `/documents/{documentId}/chunks`
- Get all chunks for a document
- Supports pagination

### Ingestion API

**POST** `/ingest`
- Trigger vault content ingestion
- Supports incremental and full reprocessing

### Analytics API

**GET** `/analytics`
- Comprehensive vault analytics
- Network analysis, temporal patterns, quality metrics

## 📊 Content Types

The system recognizes these Obsidian content types:

- **`note`** - Regular markdown notes
- **`moc`** - Maps of Content
- **`article`** - Published articles
- **`conversation`** - Chat logs, transcripts
- **`template`** - Note templates
- **`book-note`** - Book summaries and notes
- **`canvas`** - Canvas files
- **`dataview`** - Dataview queries

## 🏷️ Frontmatter Schema

Standard frontmatter fields supported:

```yaml
---
title: "Document Title"
created: "2024-01-01"
updated: "2024-01-15"
tags: ["tag1", "tag2"]
aliases: ["Alternative Title"]
category: "Documentation"
status: "published" | "draft" | "archived"
priority: "high" | "medium" | "low"
project: "Project Name"
related: ["Related Doc 1", "Related Doc 2"]
---
```

## 🔍 Search Features

### Search Modes

- **`semantic`** - Pure vector similarity
- **`lexical`** - Text matching
- **`hybrid`** - Combined semantic + lexical
- **`graph`** - Knowledge graph traversal
- **`comprehensive`** - All techniques combined

### Filtering Options

- **Content Types**: Filter by document classification
- **Tags**: Obsidian tag filtering
- **Folders**: Path-based filtering
- **Date Ranges**: Temporal filtering
- **Link Relationships**: Graph-based filtering

### Result Enrichment

- **Highlights**: Query term highlighting
- **Related Documents**: Graph-based recommendations
- **Graph Context**: Knowledge network insights
- **Facets**: Aggregation statistics

## 📈 Analytics & Insights

### Overview Metrics

- Total documents, words, links, tags
- Vault age and activity patterns

### Network Analysis

- Hub documents (most connected)
- Knowledge clusters
- Orphaned documents
- Link health metrics

### Quality Metrics

- Average document length
- Link density
- Tag consistency
- Formatting consistency

## 🛡️ Data Validation

All data structures are validated against JSON Schema definitions:

- **Input validation** for API requests
- **Output validation** for responses
- **Document validation** during ingestion
- **Chunk validation** before storage

## 🔄 Versioning

- **API versioning**: Semantic versioning (v1.0.0)
- **Schema evolution**: Backward-compatible changes
- **Migration support**: Data transformation pipelines

## 🧪 Testing

Data contracts include:

- **Unit tests** for validation logic
- **Integration tests** for API compliance
- **Contract tests** for API compatibility
- **Schema validation** for data integrity

## 📝 Usage Guidelines

### For API Consumers

1. **Validate inputs** against request schemas
2. **Handle all response fields** gracefully
3. **Respect rate limits** and pagination
4. **Cache appropriately** based on modification timestamps

### For API Providers

1. **Validate responses** against output schemas
2. **Include all required fields** in responses
3. **Provide meaningful error messages**
4. **Maintain backward compatibility**

### For Data Producers

1. **Follow content type classifications**
2. **Include comprehensive metadata**
3. **Validate relationships** before storage
4. **Handle processing errors** gracefully

## 🔗 Related Documentation

- [API Reference](./api.yaml) - Complete OpenAPI specification
- [Schema Definitions](./data-contracts.schema.json) - JSON Schema validation
- [Architecture Overview](../../README.md) - System architecture
- [Ingestion Guide](../../docs/INGESTION.md) - Data ingestion processes
