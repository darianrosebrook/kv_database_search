# Obsidian RAG - Knowledge Base Search & Discovery

A powerful semantic search and knowledge graph system specifically designed for Obsidian vaults. Transform your personal knowledge base into an intelligent, searchable system using vector embeddings and graph relationships.

## Features

### 🔍 **Intelligent Search**
- **Semantic Search**: Find content by meaning, not just keywords
- **Hybrid Ranking**: Combines semantic similarity with lexical matching
- **Context-Aware**: Understands Obsidian's wikilinks, tags, and structure
- **Multi-Modal**: Handles different content types (MOCs, articles, conversations, notes)

### 🧠 **Knowledge Graph**
- **Relationship Discovery**: Automatically maps connections between notes
- **Concept Clustering**: Groups related knowledge areas
- **Graph Insights**: Reveals hidden patterns in your knowledge base
- **Backlink Analysis**: Understands bidirectional relationships

### 📊 **Obsidian-Specific Features**
- **Frontmatter Support**: Leverages YAML metadata
- **Wikilink Processing**: Understands `[[Internal Links]]`
- **Tag Integration**: Semantic search across `#tags`
- **Folder Structure**: Respects your organizational hierarchy
- **Content Type Detection**: Automatically categorizes MOCs, articles, conversations

### ⚡ **Performance & Scalability**
- **PostgreSQL + pgvector**: Efficient vector storage and retrieval
- **Ollama Integration**: Local embedding generation
- **Batch Processing**: Handles large vaults efficiently
- **Incremental Updates**: Only processes changed files

## Quick Start

### Prerequisites

1. **PostgreSQL with pgvector**
   ```bash
   # Install PostgreSQL and pgvector extension
   # Create a database for the project
   createdb obsidian_rag
   ```

2. **Ollama with embedding model**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama service
   ollama serve
   
   # Pull embedding model
   ollama pull embeddinggemma
   ```

### Installation

1. **Clone and install dependencies**
   ```bash
   cd obsidian-rag
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your settings:
   # - DATABASE_URL: PostgreSQL connection string
   # - OBSIDIAN_VAULT_PATH: Path to your Obsidian vault
   ```

3. **Initialize the system**
   ```bash
   npm run setup
   ```

4. **Ingest your Obsidian vault**
   ```bash
   npm run ingest
   ```

5. **Test search functionality**
   ```bash
   npm run search "design systems"
   ```

## Usage

### Command Line Interface

**Search your knowledge base:**
```bash
# Basic search
npm run search "design thinking process"

# Search MOCs specifically
npm run search "MOC"

# Search by tags
npm run search "#accessibility"

# Search conversations
npm run search "AI chat productivity"
```

**Manage your data:**
```bash
# Setup and validate system
npm run setup

# Ingest vault content
npm run ingest

# Clear all data
npm run clear-db

# Validate ingestion
npm run validate
```

### Programmatic API

```typescript
import { ObsidianSearchService, ObsidianDatabase, ObsidianEmbeddingService } from './src/lib';

// Initialize services
const database = new ObsidianDatabase(DATABASE_URL);
const embeddings = new ObsidianEmbeddingService({ model: 'embeddinggemma', dimension: 768 });
const search = new ObsidianSearchService(database, embeddings);

// Perform searches
const results = await search.search("design systems", {
  searchMode: "comprehensive",
  includeRelated: true,
  fileTypes: ["moc", "article"],
  tags: ["design"],
  limit: 10
});

// Specialized searches
const mocs = await search.searchMOCs("productivity");
const conversations = await search.searchConversations("AI tools");
const related = await search.findRelatedNotes("Design Systems MOC");
```

## Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag

# Obsidian Configuration
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault

# Embedding Configuration
EMBEDDING_MODEL=embeddinggemma        # or nomic-embed-text
EMBEDDING_DIMENSION=768

# Server Configuration (for web interface)
PORT=3001
HOST=localhost

# Optional Features
ENABLE_KNOWLEDGE_GRAPH=true
ENABLE_GRAPH_RAG=true
ENABLE_MULTI_MODAL=true
ENABLE_HYBRID_RANKING=true
```

### Ingestion Options

```typescript
const ingestionOptions = {
  batchSize: 3,                    // Files processed per batch
  rateLimitMs: 300,               // Delay between batches
  skipExisting: true,             // Skip already processed files
  
  includePatterns: ["**/*.md"],   // Files to include
  excludePatterns: [              // Files to exclude
    "**/.obsidian/**",
    "**/Attachments/**",
    "**/node_modules/**"
  ],
  
  chunkingOptions: {
    maxChunkSize: 800,            // Maximum chunk size in characters
    chunkOverlap: 100,            // Overlap between chunks
    preserveStructure: true,      // Respect heading structure
    includeContext: true,         // Include frontmatter context
    cleanContent: true            // Clean markdown formatting
  }
};
```

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Obsidian      │    │   Ingestion      │    │   PostgreSQL    │
│   Vault         │───▶│   Pipeline       │───▶│   + pgvector    │
│   (.md files)   │    │                  │    │   (Vector DB)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Search        │    │   Embedding      │    │   Ollama        │
│   Interface     │◀───│   Service        │◀───│   (Local LLM)   │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Ingestion**: Markdown files → Parsed content → Chunks → Embeddings → Vector DB
2. **Search**: Query → Embedding → Vector search → Results → Enhancement → Response
3. **Knowledge Graph**: Content → Entity extraction → Relationship mapping → Graph insights

### Content Processing

```
Obsidian File (.md)
├── Frontmatter (YAML) → Metadata extraction
├── Content (Markdown) → Text processing & chunking
├── Wikilinks [[...]] → Relationship mapping
├── Tags #... → Concept categorization
└── Structure (Headers) → Hierarchical chunking
```

## Advanced Features

### Search Modes

- **Semantic**: Pure vector similarity search
- **Hybrid**: Combines semantic + lexical matching
- **Graph**: Leverages knowledge graph relationships
- **Comprehensive**: All features enabled

### Content Type Detection

The system automatically categorizes your content:

- **MOC**: Maps of Content (from MOCs/ folder)
- **Article**: Long-form articles (from Articles/ folder)
- **Conversation**: AI chats (from AIChats/ folder)
- **Book Note**: Book summaries (from Books/ folder)
- **Template**: Reusable templates (from templates/ folder)
- **Note**: General notes (everything else)

### Knowledge Graph Features

- **Entity Extraction**: Identifies key concepts and entities
- **Relationship Discovery**: Maps connections between notes
- **Concept Clustering**: Groups related knowledge areas
- **Centrality Analysis**: Identifies important hub concepts
- **Path Finding**: Discovers indirect relationships

## Performance Tips

### Optimization

1. **Chunk Size**: Smaller chunks (800 chars) for better semantic precision
2. **Batch Processing**: Process 3-5 files at once to balance speed and memory
3. **Rate Limiting**: 300ms delays prevent overwhelming Ollama
4. **Incremental Updates**: Only reprocess changed files

### Scaling

- **Large Vaults**: Use exclude patterns to skip unnecessary files
- **Memory Usage**: Adjust batch sizes based on available RAM
- **Disk Space**: Vector embeddings require ~3KB per chunk
- **Processing Time**: ~2-3 seconds per file with embedding generation

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -d obsidian_rag -c "SELECT version();"

# Install pgvector extension
psql -d obsidian_rag -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Embedding Service Failed**
```bash
# Check Ollama is running
curl http://localhost:11434/api/version

# Verify model is available
ollama list | grep embeddinggemma

# Pull model if missing
ollama pull embeddinggemma
```

**No Search Results**
- Verify content has been ingested: `npm run setup`
- Check file paths in exclude patterns
- Try broader search terms
- Validate embedding model is working

### Performance Issues

- Reduce batch size if running out of memory
- Increase rate limiting if Ollama is overwhelmed
- Use exclude patterns to skip large binary files
- Consider using a faster embedding model

## Development

### Project Structure

```
obsidian-rag/
├── src/
│   ├── lib/                    # Core libraries
│   │   ├── database.ts         # PostgreSQL + pgvector
│   │   ├── embeddings.ts       # Ollama integration
│   │   ├── obsidian-ingest.ts  # Ingestion pipeline
│   │   ├── obsidian-search.ts  # Search service
│   │   └── utils.ts           # Utility functions
│   ├── scripts/               # CLI tools
│   │   ├── setup.ts           # System initialization
│   │   ├── ingest-obsidian.ts # Vault ingestion
│   │   └── search.ts          # Search interface
│   └── types/                 # TypeScript definitions
├── apps/
│   └── web/                   # Web interface (future)
└── package.json
```

### Building and Testing

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built on the excellent DS RAG foundation
- Powered by Ollama for local embeddings
- Uses pgvector for efficient vector storage
- Designed specifically for Obsidian workflows