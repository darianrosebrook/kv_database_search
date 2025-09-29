# Web Search Setup Guide

Your Obsidian RAG system now includes web search functionality! Returns proper empty states when no API keys are configured.

## 🚀 Getting Real Web Search

### Option 1: Serper (Recommended - Free Tier Available)

1. **Sign up for Serper**: Visit [https://serper.dev/](https://serper.dev/)
2. **Get your API key**: Sign up for a free account (2500 searches/month)
3. **Update your `.env` file**:
   ```bash
   # Add this line to your .env file
   SERPER_API_KEY=your_actual_api_key_from_serper
   ```
4. **Restart your server** and web search will use real results!

### Option 2: Google Custom Search

1. **Get Google API credentials**: Visit [Google Custom Search API](https://developers.google.com/custom-search/v1/introducing)
2. **Create a Custom Search Engine**: Set up your search engine at [cse.google.com](https://cse.google.com)
3. **Update your `.env` file**:
   ```bash
   GOOGLE_SEARCH_API_KEY=your_google_api_key
   GOOGLE_SEARCH_CX=your_search_engine_id
   ```

### Option 3: SearXNG (Self-hosted, Free)

1. **Install Docker** (if not already installed)
2. **Run SearXNG**:
   ```bash
   docker run -d -p 8888:8080 --name searxng searxng/searxng:latest
   ```
3. **Update your `.env` file**:
   ```bash
   SEARXNG_URL=http://localhost:8888
   ```

## 🎯 Current Status

- ✅ **Web search endpoint**: `POST /search/web` - Working!
- ✅ **Empty states**: Returns empty arrays when no API keys configured (proper empty states)
- ✅ **Embedding integration**: Web results get embedded for semantic search
- ✅ **Combined search**: Web results can be included in regular searches via `includeWebResults: true`

## 🔍 Testing Web Search

```bash
# Test with curl
curl -X POST http://localhost:3001/search/web \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "maxResults": 3}'
```

## 🌟 Features

- **Multiple providers**: Serper, Google, SearXNG support
- **Empty states**: Proper empty arrays when APIs unavailable
- **Embedding integration**: Web results are semantically searchable
- **Caching**: Results cached for 24 hours
- **Rate limiting**: Built-in rate limiting per provider
- **Relevance scoring**: Results ranked by relevance

## 🔗 Integration Points

- **Combined search**: Web + document results together
- **Chat context**: Web results can provide context to AI chat
- **Enhanced search**: Web results augment knowledge base searches

Enjoy exploring the web with your knowledge base! 🌐
