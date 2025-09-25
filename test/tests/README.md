# Test Scripts

This directory contains test scripts for evaluating and demonstrating the multi-modal processing capabilities of the KV Database Search system.

## Current Tests

### `test-graph-rag-video-analysis.ts`
A comprehensive test script that processes the Graph RAG video presentation (`../test-files/vector-graph-search-video.mp4`) to demonstrate:

- **Video Processing**: Audio extraction and transcription using Whisper.cpp
- **OCR Processing**: Text extraction from video frames
- **Entity Extraction**: Identification of technical concepts, people, and organizations
- **Relationship Mapping**: Connections between entities and concepts
- **Topic Detection**: Automatic categorization of content themes
- **Semantic Chunking**: Intelligent content segmentation
- **Graph RAG Analysis**: Extraction of Graph RAG methodologies and implementation patterns

**Usage:**
```bash
npx tsx test/tests/test-graph-rag-video-analysis.ts
```

**Expected Output:**
- Detailed analysis of Graph RAG concepts and methodologies
- Technical implementation recommendations
- Entity and relationship mappings
- Content quality metrics and insights

## Test Files

The `../test-files/` directory contains various file types for testing multi-modal processing:

- **Videos**: `.mp4`, `.mov` files for video processing tests
- **Audio**: `.mp3` files for audio transcription tests  
- **Documents**: `.pdf`, `.docx`, `.pptx` files for document processing
- **Images**: `.png`, `.jpg`, `.gif` files for OCR and image analysis
- **Data**: `.csv` files for structured data processing
- **Web Content**: `.html`, `.md` files for web content processing

## Integration Tests

For comprehensive integration testing of the multi-modal pipeline, see:
- `apps/kv_database/tests/integration/real-file-evaluation.test.ts`
- `apps/kv_database/tests/integration/comprehensive-search.test.ts`

These tests use the Vitest framework and provide full pipeline validation with real files.
