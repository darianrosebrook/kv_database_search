
 # Obsidian RAG - Web Interface

This is the web interface for the Obsidian RAG (Retrieval-Augmented Generation) system - a powerful semantic search and knowledge discovery tool specifically designed for Obsidian vaults.

## Overview

The web interface provides an intuitive way to search through your Obsidian knowledge base using advanced AI-powered features:

- **Semantic Search**: Find content by meaning, not just keywords
- **Knowledge Graph Integration**: Discover relationships between notes
- **Multi-Modal Search**: Handle different content types (MOCs, articles, conversations)
- **Interactive Chat**: Ask questions and get contextual answers from your knowledge base
- **Source Citations**: Every response includes direct links to source material
- **Context Management**: Build conversations with relevant context from your vault

## Features

### Search Capabilities
- **Vector Embeddings**: Uses advanced embedding models for semantic understanding
- **Hybrid Ranking**: Combines semantic similarity with lexical matching
- **Context-Aware Results**: Understands Obsidian's wikilinks, tags, and structure
- **Multi-Content Types**: Searches across MOCs, articles, conversations, and notes

### User Experience
- **Real-time Search**: Instant results as you type
- **Interactive Chat Interface**: Natural language conversations about your knowledge
- **Source Validation**: Direct links to original content in your vault
- **Context Building**: Add relevant results to conversation context
- **Follow-up Questions**: Ask targeted questions about specific content

### Technical Features
- **Responsive Design**: Works seamlessly across desktop and mobile
- **Real-time Updates**: Live search results and chat responses
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance Optimized**: Fast search with efficient caching

## Prerequisites

Before running the web interface, ensure you have:

1. **Obsidian RAG Backend**: The core system must be running and configured
2. **Database**: PostgreSQL with pgvector extension
3. **Embedding Service**: Ollama with embedding model (e.g., embeddinggemma)
4. **Environment Configuration**: Proper `.env` file with database and vault paths

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Make sure your `.env` file includes:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag
   OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault
   EMBEDDING_MODEL=embeddinggemma
   PORT=3001
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   The interface will be available at `http://localhost:3001`

## Usage

### Basic Search
1. Enter your search query in the main search box
2. View semantic search results with confidence scores
3. Click on results to view detailed information
4. Use the chat interface to ask follow-up questions

### Advanced Features
- **Context Management**: Add relevant results to your conversation context
- **Refine Searches**: Use suggested actions to narrow down results
- **Follow-up Questions**: Ask specific questions about particular content
- **Source Navigation**: Click through to view original content in your vault

### Search Examples
- `"learning strategies"` - Find content about effective learning techniques
- `"MOC productivity"` - Search for Maps of Content related to productivity
- `"AI tools"` - Discover notes about artificial intelligence tools
- `"#learning"` - Search content tagged with learning topics

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run tokens:build` - Build design tokens
- `npm run a11y:validate` - Run accessibility validation

### Project Structure
```
src/
├── components/          # UI components
├── lib/                # Core functionality
├── types/              # TypeScript definitions
└── App.tsx             # Main application component
```

### Customization
The interface uses modern web technologies:
- **Radix UI** components for accessibility
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Custom theming** for consistent visual design

## Integration

This web interface connects to the main Obsidian RAG system:

1. **API Integration**: Uses the search and chat APIs from the core system
2. **Real-time Updates**: Maintains connection for live search results
3. **Context Sharing**: Shares conversation context with the backend
4. **Source Linking**: Provides direct links to content in your Obsidian vault

## Troubleshooting

### Common Issues

**Connection Failed**
- Verify the backend API is running on the correct port
- Check DATABASE_URL configuration
- Ensure PostgreSQL and pgvector are properly set up

**No Search Results**
- Confirm your Obsidian vault has been ingested
- Check vault path configuration
- Verify embedding service is available

**Performance Issues**
- Reduce batch size in ingestion settings
- Check available memory for embedding generation
- Optimize chunk size for your content types

## Contributing

This interface is part of the Obsidian RAG project. For contributions:

1. Follow the main project's coding standards
2. Ensure accessibility compliance
3. Test across different screen sizes
4. Maintain consistent design patterns

## License

MIT License - part of the Obsidian RAG project.
  