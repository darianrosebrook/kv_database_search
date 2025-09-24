# 🌐 Web Search Integration for Obsidian RAG

This guide explains how to enable web search capabilities in your Obsidian RAG system to surface additional insights from across the web.

## 🎯 Why Web Search?

Web search integration allows your RAG system to:
- **Augment your knowledge base** with current information
- **Find recent developments** not in your personal documents
- **Cross-reference information** from multiple sources
- **Discover related content** you might have missed
- **Stay up-to-date** with latest research and trends

## 🔍 Available Web Search Providers

### 1. **SearXNG (Recommended ⭐)**
**Best for:** Personal deep research, privacy-focused users
- ✅ **Free and open-source**
- ✅ **Self-hosted locally**
- ✅ **Aggregates 70+ search engines**
- ✅ **No API keys required**
- ✅ **High rate limits (10,000/day)**
- ✅ **Complete privacy control**

### 2. **Google Custom Search API**
**Best for:** Reliable, comprehensive search results
- ✅ **Official Google results**
- ✅ **100 free searches/day**
- ✅ **Advanced search operators**
- ✅ **Image and news search**

### 3. **Serper API**
**Best for:** Development and testing
- ✅ **2,500 free searches/month**
- ✅ **Real-time Google results**
- ✅ **JSON responses (no HTML parsing)**
- ✅ **Fast and reliable**

## 🚀 Quick Start with SearXNG

### Prerequisites
- Docker installed on your system

### Installation
1. **Run the setup script:**
   ```bash
   ./web-search-setup.sh
   ```

2. **Choose option 1** for SearXNG setup

3. **The script will create** `docker-compose.searxng.yml`

4. **Start SearXNG:**
   ```bash
   docker-compose -f docker-compose.searxng.yml up -d
   ```

5. **Access SearXNG** at `http://localhost:8888`

6. **Configure in Obsidian RAG:**
   - Environment variables are automatically set
   - Restart your RAG server: `npm run dev`

### SearXNG Configuration
Edit the generated `docker-compose.searxng.yml` file:

```yaml
environment:
  - SEARXNG_SECRET=your-secret-key-here  # Generate with: openssl rand -hex 32
  - SEARXNG_BASE_URL=https://your-domain.com/  # If exposing publicly
```

**Default search engines included:**
- Google, Bing, DuckDuckGo, Qwant, Startpage
- Wikipedia, Stack Overflow, GitHub
- News sites and academic sources

## 🔧 Advanced Setup Options

### Google Custom Search API
1. **Get API credentials:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Custom Search API
   - Create credentials (API Key)
   - Get Search Engine ID from [Google CSE](https://cse.google.com/)

2. **Set environment variables:**
   ```bash
   GOOGLE_SEARCH_API_KEY="your-api-key"
   GOOGLE_SEARCH_CX="your-search-engine-id"
   ```

### Serper API
1. **Get API key:**
   - Sign up at [Serper.dev](https://serper.dev/)
   - Get your API key (2,500 free searches/month)

2. **Set environment variable:**
   ```bash
   SERPER_API_KEY="your-serper-key"
   ```

## 📊 Usage Examples

### Basic Web Search
```bash
curl -X POST http://localhost:3001/search/web \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest React authentication patterns",
    "maxResults": 10
  }'
```

### Enhanced Search (Knowledge Base + Web)
```bash
curl -X POST http://localhost:3001/search/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning best practices",
    "includeWebResults": true,
    "limit": 15
  }'
```

### Context-Aware Search
```bash
curl -X POST http://localhost:3001/search/context \
  -H "Content-Type: application/json" \
  -d '{
    "query": "neural network optimization",
    "folders": ["ai-research", "deep-learning"],
    "includeRelated": true
  }'
```

## 🔒 Privacy & Security

### SearXNG (Most Private)
- **No tracking** of your searches
- **Self-hosted** - your data stays local
- **Aggregated results** without direct API calls
- **Configurable** which engines to use

### Google/Serper APIs
- **API calls logged** by providers
- **Rate limited** and monitored
- **Terms of service** restrictions apply
- **Better for** compliance requirements

## 📈 Performance Tips

### SearXNG Optimization
- **Cache settings:** Results cached for 24 hours
- **Engine selection:** Choose relevant engines for your research
- **Result limits:** Balance quantity vs. quality
- **Update frequency:** Keep SearXNG updated for best results

### API Optimization
- **Batch requests** for multiple searches
- **Use filters** to reduce result count
- **Cache aggressively** to avoid rate limits
- **Monitor usage** to stay within free tiers

## 🛠️ Troubleshooting

### SearXNG Issues
```bash
# Check if SearXNG is running
curl http://localhost:8888

# View SearXNG logs
docker-compose -f docker-compose.searxng.yml logs

# Restart SearXNG
docker-compose -f docker-compose.searxng.yml restart
```

### API Issues
```bash
# Check environment variables
grep -E "(GOOGLE|SERPER)" .env

# Test API connectivity
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_CX&q=test"
```

## 🎨 Customization

### Custom Search Engines
Edit your SearXNG configuration to:
- Add specialized search engines
- Remove irrelevant engines
- Adjust result ranking
- Configure categories

### Result Processing
The system automatically:
- Generates embeddings for web results
- Filters by relevance score
- Removes duplicates
- Integrates with your knowledge base

## 🔄 Integration with Chat

Once configured, web search automatically enhances:
- **Chat responses** with current web information
- **Search results** with external context
- **Knowledge discovery** with fresh insights
- **Research capabilities** with comprehensive sources

## 📚 Resources

- [SearXNG Documentation](https://docs.searxng.org/)
- [Google Custom Search API](https://developers.google.com/custom-search)
- [Serper.dev API](https://serper.dev/documentation)
- [Docker Installation](https://docs.docker.com/get-docker/)

---

**Ready to explore the web with your personal RAG system? 🚀**

Run `./web-search-setup.sh` to get started with SearXNG!
