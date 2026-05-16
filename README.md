# obsidian-rag

Multi-modal retrieval-augmented generation (RAG) and knowledge-graph engine. Originally built to make an Obsidian vault searchable, the substance is tool-neutral — it ingests markdown, PDFs, Office docs, audio, images, and video; embeds them with Ollama; stores vectors and a knowledge graph in PostgreSQL; and serves hybrid semantic + graph search through HTTP and WebSocket APIs.

The repository is a pnpm workspace. The application (`@kv/database`) sits in `apps/kv_database/`. The tool-neutral substance has been factored into reusable packages under `packages/`.

## Prerequisites

- **Node.js 22+** and **pnpm 10+** (the workspace uses `pnpm` exclusively; `npm install` will produce the wrong hoisting layout)
- **PostgreSQL 14+** with the **pgvector** extension
- **Ollama** running locally for embeddings + LLM (default models: `embeddinggemma` for embeddings, `llama3.1` for chat)
- **FFmpeg** for video and audio processing (`brew install ffmpeg`)
- **tesseract** (native binary) for OCR (`brew install tesseract`)
- **yt-dlp** for URL-based video ingestion (`brew install yt-dlp`) — optional

See [SYSTEM_DEPENDENCIES.md](./SYSTEM_DEPENDENCIES.md) for the full list and platform-specific notes.

## Install

```bash
pnpm install
cp .env.example .env  # then edit DATABASE_URL, OBSIDIAN_VAULT_PATH, etc.
pnpm --filter @kv/database run setup   # creates DB schema, verifies pgvector
```

## Common commands

| Command | What it does |
|---|---|
| `npm run server` | Start the HTTP + WebSocket server (port 3001 by default) |
| `npm run graph-rag-server` | Start the dedicated graph-rag service (port 3002) |
| `npm run ingest` | Ingest the configured Obsidian vault with image processing |
| `pnpm --filter @kv/database exec tsx src/scripts/ingest-generic.ts <db-url> <root-path> <obsidian\|markdown\|notion>` | Ingest any folder with a chosen config preset |
| `npm run search -- --query "your query"` | Semantic search against the indexed corpus |
| `pnpm --filter @kv/database run video-extract -- <file-or-url>` | Extract keyframes, audio, transcript from a video |
| `npm run typecheck` | Workspace-wide `tsc --noEmit` |
| `npm run lint` | ESLint over `apps/` and `packages/*/src` |
| `npm run test:unit` | Vitest unit suite (collects from all workspace packages) |
| `pnpm --filter @kv/<package> test` | Run a single package's tests |

## Workspace packages

| Package | Purpose | Key exports |
|---|---|---|
| [`@kv/utils`](./packages/utils) | Tool-neutral utilities: hashing, vector math, text helpers, link/tag extractors, logger, config reader, lightweight DI container | `createHash`, `cosineSimilarity`, `extractLinks`, `extractTags`, `cleanMarkdown`, `LoggerFactory` |
| [`@kv/types`](./packages/types) | Shared content-type vocabulary used across packages | `ContentType`, `MultiModalContentType`, `ContentMetadata` |
| [`@kv/media`](./packages/media) | Video and image processing: adaptive frame extraction, scene detection, perceptual hashing, ffmpeg wrappers | `AdaptiveFrameExtractor`, `SceneDetector` |
| [`@kv/processors`](./packages/processors) | Content processors for PDF, OCR, Office, speech/audio, image classification, video; pipelines and registries | `ContentProcessorRegistry`, `PDFProcessingPipeline`, `OCRProcessor`, `SpeechProcessor`, `ImageClassificationProcessor` |
| [`@kv/entities`](./packages/entities) | Rule-based entity extraction + ML-based entity linking (BERT/RoBERTa) | `EntityExtractor`, `MLEntityLinker` |
| [`@kv/knowledge-graph`](./packages/knowledge-graph) | Knowledge-graph manager, multi-hop reasoning, provenance tracking, query optimizer, result ranking, temporal reasoning | `KnowledgeGraph`, `MultiHopReasoningEngine`, `ProvenanceTracker`, `QueryOptimizer`, `TemporalReasoningSystem` |
| [`@kv/ingestion`](./packages/ingestion) | Config-driven document ingestion pipeline. Storage and embeddings are passed as structural interfaces, so the package has no runtime dep on `@kv/database` | `DocumentIngestionPipeline`, `OBSIDIAN_CONFIG`, `MARKDOWN_CONFIG`, `NOTION_CONFIG` |
| [`@kv/contracts`](./packages/contracts) | OpenAPI and GraphQL schemas — the canonical interface contracts | (schema files) |
| `@kv/database` (app, `apps/kv_database/`) | The Fastify server, scripts, CLI tools, and the database/embedding layer that wires everything together | `DocumentDatabase`, `DocumentEmbeddingService`, `MultiModalIngestionPipeline` |

For configuration-driven ingestion against an arbitrary folder structure, see [docs/USAGE.md](./docs/USAGE.md).

---

## 🏗️ Architecture

This project uses a **microservices architecture** with the following services:

- **Main Server** (Port 3001): Handles search, chat, vault operations, ingestion, and acts as a proxy for Graph RAG requests
- **Graph RAG Server** (Port 3002): Specialized service for Graph RAG operations including entity extraction, relationship analysis, and reasoning

### 🧠 RAG (Retrieval Augmented Generation) System

#### How Documents Are Embedded
- **Document Ingestion**: Documents are processed through `DocumentIngestionPipeline` which chunks text and generates embeddings
- **Embedding Model**: Uses `embeddinggemma` (768-dimensional vectors) via Ollama for consistent semantic representation
- **Storage**: Embeddings stored in PostgreSQL with pgvector extension in `obsidian_chunks` table
- **Chunking Strategy**: Intelligent text chunking preserves context while maintaining optimal embedding quality

#### How Searches Are Handled
- **Query Embedding**: User queries are embedded using the same `embeddinggemma` model
- **Vector Similarity**: Uses cosine similarity (`v <=> query_embedding`) for semantic matching
- **Multi-Strategy Search**: Combines vector search, entity extraction, graph traversal, and multi-modal analysis
- **Advanced Features**:
  - **Entity Linking**: Extracts entities and finds related content
  - **Graph Traversal**: Uses entity relationships for expanded search
  - **Multi-Modal Search**: Searches across text, images, audio, and video content
  - **Result Fusion**: Combines results from multiple strategies using algorithms like Reciprocal Rank Fusion (RRF)

#### LLM Integration for Aligned Answers
- **Context Retrieval**: Search results provide relevant document chunks as context
- **Chat Sessions**: Conversations stored with embeddings for similarity-based retrieval
- **Answer Generation**: LLM uses retrieved context to generate responses aligned with document content
- **Quality Assurance**: Multiple scoring mechanisms ensure answer relevance and accuracy

#### Current System Capabilities
- **21,555+ Document Chunks**: Large knowledge base with semantic search capability
- **Multi-Modal Support**: Text, images, audio, video, and PDF processing
- **Graph RAG**: Advanced entity relationship understanding
- **Real-time Ingestion**: Automatic document processing and embedding updates

### ⚙️ Configuration

#### Environment Variables

**Main Server (Port 3001):**
```bash
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag
EMBEDDING_MODEL=embeddinggemma
EMBEDDING_DIMENSION=768
LLM_MODEL=llama3.1
OBSIDIAN_VAULT_PATH=/path/to/vault
```

**Graph RAG Server (Port 3002):**
```bash
GRAPH_RAG_PORT=3002
GRAPH_RAG_HOST=localhost
DB_HOST=localhost
DB_PORT=5432
DB_NAME=obsidian_rag
DB_USER=postgres
DB_PASSWORD=password
EMBEDDING_MODEL=embeddinggemma
EMBEDDING_DIMENSION=768
```

**Frontend Clients:**
```bash
# Main API (search, chat, vault operations)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Graph RAG API (entity analysis, reasoning)
NEXT_PUBLIC_GRAPH_RAG_API_URL=http://localhost:3002
```

---

## 🆕 Enhanced: Image Classification & Scene Description

### Beyond OCR: True Visual Understanding

The system now goes beyond simple text extraction to provide **AI-powered scene understanding** that describes what's actually happening in images and videos.

### 🎯 What It Does

#### 🔍 **OCR + Scene Classification**
- **OCR Text Extraction**: Extracts readable text from images (existing)
- **Scene Description**: AI describes the scene, objects, and context
- **Combined Search**: Both text and visual content become searchable

#### 📹 **Video Frame Analysis**
- **Keyframe Extraction**: Pulls representative frames from videos
- **Scene Classification**: Describes each frame's content
- **Audio-Independent**: Works even when videos have no audio track

#### 🎨 **Visual Feature Detection**
- **Object Recognition**: Detects people, objects, diagrams, charts
- **Scene Types**: Meeting rooms, diagrams, whiteboards, landscapes
- **Visual Analysis**: Colors, composition, lighting, style

### 🚀 **Real-World Examples**

#### Business Meeting Screenshot
```
OCR Text: "Q4 Sales Goals - Increase revenue by 25%"
Scene: "Meeting room with 6 people around conference table, projector screen showing presentation"
Searchable: "Q4 sales meeting room conference table presentation"
```

#### Architecture Diagram
```
OCR Text: "Load Balancer → Web Server → Database"
Scene: "Technical architecture diagram with layered components"
Searchable: "architecture diagram load balancer web server database"
```

#### Whiteboard Session
```
OCR Text: "User Stories: As user want to login, search, save bookmarks"
Scene: "Whiteboard filled with development tasks and sticky notes"
Searchable: "whiteboard brainstorming user stories login search bookmarks"
```

### ⚙️ **Configuration Options**

```bash
# Enable both OCR and scene classification
npm run ingest -- --enable-classification

# OCR only (faster, text-focused)
npm run ingest -- --enable-ocr-only

# Classification only (no text extraction)
npm run ingest -- --enable-scene-only

# Advanced options
npm run ingest \
  -- --classification-confidence 0.7 \
  --max-objects 10 \
  --model-preference local \
  --frame-interval 5 \
  --max-keyframes 20
```

### 🔧 **Technical Features**

#### Multi-Model Support
- **Local Models**: BLIP-2, Hugging Face Transformers (faster, private)
- **API Models**: OpenAI Vision, Google Cloud Vision (accurate, cloud-based)
- **Hybrid**: Automatic fallback between local and API

#### Video Processing Pipeline (`@kv/media`)
1. **Adaptive Frame Extraction**: Scene-based extraction using perceptual hashing and scene detection (not fixed intervals)
2. **Scene Analysis**: Classify each frame's content
3. **Frame Deduplication**: Remove visually similar frames using perceptual hashing
4. **Content Indexing**: Make visual content searchable via OCR and scene classification

#### Quality Controls
- **Confidence Scoring**: Rate description quality (0-1 scale)
- **Object Limits**: Control processing intensity
- **Processing Timeouts**: Prevent hanging on complex images
- **Error Recovery**: Graceful handling of processing failures

### 📊 **Performance Impact**

| Feature | Processing Time | File Size Impact | Search Enhancement |
|---------|----------------|------------------|-------------------|
| OCR Only | ~1-3 seconds | Minimal | Text search only |
| Scene Classification | ~2-5 seconds | Moderate | Visual search |
| Combined | ~3-8 seconds | Moderate | Full multi-modal |

### 🎯 **Search Enhancements**

#### Visual Concept Search
```bash
# Find all meeting-related content
"meeting room" OR "conference table" OR "presentation"

# Find technical diagrams
"architecture diagram" OR "system design" OR "flowchart"

# Find planning sessions
"whiteboard" OR "brainstorming" OR "sticky notes"
```

#### Scene-Based Discovery
```bash
# Business contexts
"meeting with charts" OR "presentation slides"

# Technical content
"code on screen" OR "terminal window"

# Collaborative work
"whiteboard session" OR "planning meeting"
```

#### Video Content Search
```bash
# Videos by visual content
"video tutorial" OR "screen recording"

# Presentations and demos
"powerpoint slide" OR "demo video"

# Meetings and discussions
"video conference" OR "team meeting"
```

### 🔄 **Backwards Compatibility**

- ✅ **Existing OCR functionality** unchanged and enhanced
- ✅ **All current features** continue to work
- ✅ **Gradual rollout** - classification is additive
- ✅ **Configurable** - can be disabled if not needed

### 📈 **Benefits Summary**

1. **🔍 Enhanced Discovery**: Search by visual concepts, not just text
2. **📹 Video Accessibility**: Search video content without transcripts
3. **🎯 Scene Understanding**: Know what's in images without viewing them
4. **🔗 Multi-Modal Search**: Combine text, OCR, and scene understanding
5. **📊 Knowledge Extraction**: Turn visual information into structured data
6. **🚀 Comprehensive Coverage**: All file types with appropriate processing

### 💡 **Use Cases**

#### Knowledge Management
- **Meeting Documentation**: Find specific meetings by visual content
- **Technical Documentation**: Search diagrams and architecture docs
- **Project Planning**: Locate planning sessions and whiteboards

#### Research & Analysis
- **Document Review**: Search contracts and legal documents by content
- **Data Analysis**: Find charts and graphs by visual type
- **Content Discovery**: Locate relevant images without manual review

#### Education & Training
- **Learning Materials**: Search tutorial videos by visual content
- **Study Notes**: Find relevant diagrams and examples
- **Reference Materials**: Locate specific types of visual aids

The enhanced system transforms your visual content from **unsearchable assets** to **fully discoverable knowledge**! 🎉✨