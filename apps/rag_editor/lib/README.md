# RAG Editor Library

This directory contains the core functionality migrated from `rag_web_search_tool` to provide a comprehensive RAG (Retrieval-Augmented Generation) editing experience.

## 📁 Directory Structure

```
lib/
├── types/           # TypeScript type definitions
│   └── index.ts     # Core types for search, chat, and Graph RAG
├── utils/           # Utility functions
│   └── index.ts     # Data transformation, text processing, scoring
├── services/        # Service layer
│   └── search-service.ts  # Unified search functionality
├── graph-rag-api.ts # Graph RAG backend integration
├── api.ts          # Basic API utilities
├── chat-api.ts     # Chat session management
├── chat-types.ts   # Chat-related types
├── utils.ts        # UI utilities (cn function + re-exports)
└── index.ts        # Central exports
```

## 🚀 Key Features Added

### **Unified Search Service**
- **Hybrid Search**: Combines traditional vector search with Graph RAG
- **Entity Exploration**: Find relationships and similar entities
- **Intelligent Chat**: Context-aware conversational responses
- **Error Handling**: Robust error management with user-friendly messages

### **Comprehensive State Management**
- **useAppState Hook**: Centralized state for the entire application
- **Search State**: Query management, loading states, results
- **Chat State**: Message history, context, suggested actions
- **Graph RAG State**: Entities, reasoning results, graph data
- **UI State**: Test modes, chat history, multi-modal interfaces

### **Advanced Utilities**
- **Data Transformation**: Convert between different result formats
- **Text Processing**: Truncation, highlighting, keyword extraction
- **Scoring Algorithms**: Composite scoring with multiple factors
- **Entity Styling**: Color-coded entity and relationship types
- **Validation**: Type guards for runtime safety

### **Graph RAG Integration**
- **Entity Management**: CRUD operations for knowledge graph entities
- **Relationship Discovery**: Find connections between entities
- **Reasoning Engine**: Multi-hop reasoning with confidence scores
- **Provenance Tracking**: Audit trail for search operations
- **Statistics**: Graph analytics and health monitoring

## 📖 Usage Examples

### Search Service
```typescript
import { searchService } from '@/lib';

// Traditional search
const results = await searchService.search("How does React work?", {
  maxResults: 10
});

// Graph RAG search with reasoning
const graphResults = await searchService.search("React component lifecycle", {
  useGraphRag: true,
  includeReasoning: true,
  searchStrategy: "hybrid"
});
```

### State Management
```typescript
import { useAppState } from '@/hooks';

function SearchComponent() {
  const {
    query,
    isLoading,
    results,
    startSearch,
    completeSearch,
    handleSearchError
  } = useAppState();

  const handleSearch = async () => {
    try {
      startSearch(query);
      const searchResults = await searchService.search(query);
      completeSearch(searchResults.results);
    } catch (error) {
      handleSearchError(error.message);
    }
  };
}
```

### Utilities
```typescript
import { cn, truncateText, getEntityTypeColor } from '@/lib';

// CSS class merging
const buttonClass = cn("btn", "btn-primary", isActive && "active");

// Text processing
const summary = truncateText(longText, 200);

// Entity styling
const entityStyle = getEntityTypeColor("PERSON"); // "bg-blue-100 text-blue-800 border-blue-200"
```

## 🔧 Integration Notes

### **API Endpoints**
The services expect these backend endpoints:
- `/api/search` - Traditional search
- `/api/chat` - Chat functionality
- `/api/chat/history` - Chat history
- `/api/chat/session/{id}` - Chat session management

### **Graph RAG Endpoints** (Future)
- `/search` - Graph RAG hybrid search
- `/reasoning` - Multi-hop reasoning
- `/entities` - Entity management
- `/relationships` - Relationship queries

### **Environment Variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## 🎯 Next Steps

1. **Update Components**: Modify existing UI components to use the new services
2. **Add Graph RAG UI**: Implement entity visualization and relationship graphs
3. **Backend Integration**: Connect to actual Graph RAG endpoints
4. **Testing**: Add comprehensive tests for all new functionality
5. **Performance**: Optimize search and rendering performance

## 📚 Migration from rag_web_search_tool

This library provides feature parity with the `rag_web_search_tool` while being adapted for the Next.js/React environment of the RAG Editor. Key changes:

- **Next.js Compatibility**: Uses Next.js conventions and hooks
- **Type Safety**: Comprehensive TypeScript types
- **Modular Design**: Clean separation of concerns
- **Singleton Services**: Efficient service management
- **Error Boundaries**: Better error handling and user feedback
