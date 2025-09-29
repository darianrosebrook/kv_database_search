# Critical Connections Implementation Roadmap

## Phase 1: Core Functionality (Immediate - Week 1)

### Task 1: Frontend Database Integration
**Priority**: CRITICAL
**Files**: 
- `apps/rag_editor/app/page.tsx`
- `apps/rag_editor/app/mobile/page.tsx`
- `apps/kv_database/src/server.ts` (add endpoint)

**Implementation Steps**:
1. Add `/api/recent-documents` endpoint to main server
2. Create database query for recent documents based on access time
3. Update frontend components to fetch from API
4. Add loading states and error handling
5. Implement proper TypeScript interfaces

**Acceptance Criteria**:
- Frontend shows actual recent documents from database
- Graceful handling when no documents exist
- Loading states during API calls
- Error states for API failures

### Task 2: Embedding Model Standardization
**Priority**: CRITICAL
**Files**:
- `apps/kv_database/src/graph-rag-server.ts`
- `apps/kv_database/src/server.ts`

**Implementation Steps**:
1. Change graph-rag-server.ts to use `embeddinggemma` model
2. Update dimension from 1536 to 768
3. Ensure consistent Ollama configuration across services
4. Add embedding service health checks
5. Update any hardcoded embedding dimensions

**Acceptance Criteria**:
- All services use same embedding model (`embeddinggemma`)
- Consistent 768-dimensional embeddings
- Health checks pass for embedding service
- No embedding dimension mismatches

### Task 3: Database Schema Validation
**Priority**: HIGH
**Files**:
- `apps/kv_database/src/lib/database.ts`
- `apps/kv_database/src/lib/dictionary-service.ts`

**Implementation Steps**:
1. Create database migration script for missing tables
2. Validate dictionary tables (synsets, lexical_entries, etc.)
3. Add schema validation on startup
4. Create seed data for dictionary if needed
5. Add proper indexes for performance

**Acceptance Criteria**:
- All required tables exist and are properly indexed
- Dictionary service can perform real lookups
- Schema validation passes on startup
- Migration scripts handle existing data

## Phase 2: Enhanced Features (Week 2-3)

### Task 4: Real System Monitoring
**Priority**: MEDIUM
**Files**:
- `apps/kv_database/src/lib/knowledge-graph/monitoring-system.ts`

**Implementation Steps**:
1. Replace mock system metrics with real data
2. Connect to PostgreSQL stats tables
3. Add Node.js process monitoring
4. Implement alerting thresholds
5. Add metrics export for external monitoring

**Acceptance Criteria**:
- Real CPU, memory, disk metrics
- Database performance metrics
- Configurable alerting
- Metrics available via API

### Task 5: Web Search Integration
**Priority**: MEDIUM
**Files**:
- `apps/kv_database/src/lib/web-search.ts`
- `apps/kv_database/src/lib/federated-search.ts`

**Implementation Steps**:
1. Implement Serper API provider
2. Add rate limiting and error handling
3. Connect to federated search system
4. Add search result caching
5. Implement search result ranking

**Acceptance Criteria**:
- At least one working web search provider
- Rate limiting prevents API abuse
- Search results integrated with local results
- Proper error handling and fallbacks

## Phase 3: Advanced Features (Week 4+)

### Task 6: Multi-Modal Processing
**Priority**: LOW
**Files**:
- `apps/kv_database/src/lib/processors/image-classification-processor.ts`
- `apps/kv_database/src/lib/processors/speech-processor.ts`

**Implementation Steps**:
1. Implement real image classification model
2. Connect speech processing to sherpa-onnx
3. Add API-based ML model support
4. Implement content type detection
5. Add processing pipeline optimization

**Acceptance Criteria**:
- Image classification produces real results
- Speech-to-text processing works
- API models can be configured
- Processing is performant

## Quick Wins (Can be done in parallel)

### Fix Commented Out Services
**Files**: `apps/kv_database/src/graph-rag-server.ts`
```typescript
// Uncomment and implement:
// let entityExtractor: EntityExtractor;
// let databaseService: DatabaseService;
```

### Add Environment Validation
**Files**: `apps/kv_database/src/server.ts`
```typescript
// Add startup validation for:
// - DATABASE_URL connectivity
// - Ollama service availability
// - Required environment variables
```

### Improve Error Messages
**Files**: Multiple
```typescript
// Replace generic errors with specific guidance:
// - Database connection failures
// - Ollama service unavailable
// - Missing configuration
```

## Implementation Commands

### 1. Start with Frontend Connection
```bash
# Add recent documents endpoint
cd apps/kv_database
# Edit src/server.ts to add /api/recent-documents

# Update frontend
cd ../rag_editor
# Edit app/page.tsx and app/mobile/page.tsx
```

### 2. Fix Embedding Consistency
```bash
# Edit graph-rag-server.ts
sed -i 's/text-embedding-ada-002/embeddinggemma/g' apps/kv_database/src/graph-rag-server.ts
sed -i 's/1536/768/g' apps/kv_database/src/graph-rag-server.ts
```

### 3. Database Schema Check
```bash
# Create migration script
touch apps/kv_database/src/scripts/validate-schema.ts
# Add schema validation logic
```

## Testing Strategy

### Unit Tests
- Mock external dependencies (Ollama, external APIs)
- Test error handling paths
- Validate data transformations

### Integration Tests
- Use testcontainers for database tests
- Test real Ollama connections in CI
- Validate API endpoints

### E2E Tests
- Test complete user journeys
- Validate frontend-backend integration
- Test error scenarios

## Monitoring and Rollback

### Health Checks
- Database connectivity
- Ollama service availability
- API endpoint responsiveness
- Memory and CPU usage

### Rollback Strategy
- Keep mock implementations as fallbacks
- Feature flags for new connections
- Graceful degradation when services unavailable
- Clear error messages for debugging

## Success Metrics

### Phase 1 Success
- Frontend shows real recent documents
- All services use consistent embeddings
- Database schema validation passes
- Zero critical connection failures

### Phase 2 Success
- Real system monitoring data
- Web search integration working
- Performance metrics within targets
- Error rates below 1%

### Phase 3 Success
- Multi-modal processing functional
- Advanced features working
- System fully production-ready
- All mocks replaced with real implementations
