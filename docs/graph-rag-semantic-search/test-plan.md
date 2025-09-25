# Graph RAG-Enhanced Semantic Search - Test Plan

## Test Strategy Overview

This test plan ensures comprehensive validation of the Graph RAG-enhanced semantic search system across all layers: unit, integration, contract, and end-to-end testing. The plan emphasizes property-based testing for graph consistency and performance testing for scalability.

## Risk-Based Test Prioritization

**Tier 2 Requirements** (per CAWS framework):
- Mutation testing ≥ 50%
- Branch coverage ≥ 80% 
- Contract tests mandatory
- Integration tests with real databases
- E2E smoke tests for critical paths

## Unit Test Suite

### 1. Entity Extraction & Management

#### Core Entity Operations
```typescript
describe("EntityExtractor", () => {
  it("should extract entities with confidence ≥ 0.7 [INV: Entity confidence threshold]", () => {
    const extractor = new EntityExtractor();
    const result = extractor.extractEntities(sampleText);
    
    result.entities.forEach(entity => {
      expect(entity.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  it("should deduplicate entities across content types [INV: Entity uniqueness]", () => {
    const entities1 = extractor.extractFromPDF(pdfContent);
    const entities2 = extractor.extractFromAudio(audioTranscript);
    
    const merged = entityManager.mergeEntities([entities1, entities2]);
    const duplicates = findDuplicateEntities(merged);
    
    expect(duplicates).toHaveLength(0);
  });
});
```

#### Property-Based Entity Tests
```typescript
import fc from "fast-check";

describe("Entity Properties", () => {
  it("entity IDs are unique across all extractions", () => {
    fc.assert(fc.property(
      fc.array(entityArbitrary(), { minLength: 10, maxLength: 100 }),
      (entities) => {
        const ids = entities.map(e => e.id);
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      }
    ));
  });

  it("entity embeddings have correct dimensionality", () => {
    fc.assert(fc.property(
      entityArbitrary(),
      (entity) => {
        return entity.embedding.length === 768; // Expected dimension
      }
    ));
  });
});
```

### 2. Knowledge Graph Construction

#### Graph Consistency Tests
```typescript
describe("KnowledgeGraphBuilder", () => {
  it("should maintain graph consistency during updates [INV: Graph consistency]", () => {
    const graph = new KnowledgeGraph();
    const entities = createTestEntities(10);
    const relationships = createTestRelationships(entities, 15);
    
    graph.addEntities(entities);
    graph.addRelationships(relationships);
    
    // Verify all relationships reference existing entities
    const orphanedRelationships = graph.findOrphanedRelationships();
    expect(orphanedRelationships).toHaveLength(0);
  });

  it("should handle concurrent graph updates atomically", async () => {
    const graph = new KnowledgeGraph();
    const updates = Array.from({ length: 10 }, () => 
      graph.updateEntities(generateRandomEntities(5))
    );
    
    await Promise.all(updates);
    
    // Graph should be in consistent state
    expect(graph.validateConsistency()).toBe(true);
  });
});
```

### 3. Hybrid Search Algorithm

#### Search Performance Tests
```typescript
describe("HybridSearchEngine", () => {
  it("should return results within P95 latency [INV: Search performance]", async () => {
    const searchEngine = new HybridSearchEngine(mockGraph, mockVectorDB);
    const query = "artificial intelligence design patterns";
    
    const startTime = performance.now();
    const results = await searchEngine.search(query, { maxHops: 3 });
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(500); // P95 requirement
    expect(results.length).toBeGreaterThan(0);
  });

  it("should combine vector and graph results effectively", async () => {
    const vectorResults = await vectorSearch(query);
    const graphResults = await graphTraversal(query, { maxHops: 2 });
    const hybridResults = await hybridSearch(query);
    
    // Hybrid should include elements from both approaches
    expect(hybridResults.length).toBeGreaterThan(Math.max(vectorResults.length, graphResults.length));
  });
});
```

### 4. Multi-Hop Reasoning

#### Reasoning Path Tests
```typescript
describe("MultiHopReasoning", () => {
  it("should generate explainable reasoning paths [INV: Result explainability]", () => {
    const reasoner = new MultiHopReasoner(knowledgeGraph);
    const paths = reasoner.findPaths("Entity A", "Entity C", { maxHops: 3 });
    
    paths.forEach(path => {
      expect(path.explanation).toBeDefined();
      expect(path.confidence).toBeGreaterThan(0);
      expect(path.hops).toBeLessThanOrEqual(3);
    });
  });

  it("should respect hop depth limits", () => {
    const reasoner = new MultiHopReasoner(knowledgeGraph);
    
    [1, 2, 3].forEach(maxHops => {
      const paths = reasoner.findPaths("Entity A", "Entity Z", { maxHops });
      paths.forEach(path => {
        expect(path.hops).toBeLessThanOrEqual(maxHops);
      });
    });
  });
});
```

## Integration Test Suite

### 1. End-to-End Content Processing

```typescript
describe("Multi-Modal Integration", () => {
  let database: ObsidianDatabase;
  let knowledgeGraph: KnowledgeGraph;
  let searchEngine: HybridSearchEngine;

  beforeEach(async () => {
    // Use Testcontainers for real PostgreSQL + pgvector
    const container = await new PostgreSqlContainer("pgvector/pgvector:pg16")
      .withDatabase("testdb")
      .start();
    
    database = new ObsidianDatabase(container.getConnectionUri());
    await database.initialize();
    
    knowledgeGraph = new KnowledgeGraph(database);
    searchEngine = new HybridSearchEngine(knowledgeGraph, database);
  });

  it("should process multi-modal content and enable cross-modal search", async () => {
    // Ingest content from multiple modalities
    const pdfFile = "test-data/ai-research-paper.pdf";
    const videoFile = "test-data/ai-conference-talk.mp4";
    const audioFile = "test-data/ai-podcast-episode.mp3";
    
    const pipeline = new MultiModalIngestionPipeline(database, embeddings);
    await pipeline.ingestFiles([pdfFile, videoFile, audioFile]);
    
    // Search should find related content across all modalities
    const results = await searchEngine.search("machine learning algorithms");
    
    const contentTypes = new Set(results.map(r => r.metadata.contentType));
    expect(contentTypes.size).toBeGreaterThan(1); // Cross-modal results
    
    // Verify entity linking across modalities
    const entities = await knowledgeGraph.getEntitiesByName("neural networks");
    const sourceFiles = entities.flatMap(e => e.metadata.sourceFiles);
    const uniqueFiles = new Set(sourceFiles);
    expect(uniqueFiles.size).toBeGreaterThan(1); // Entity found in multiple files
  });

  it("should maintain performance with large knowledge graphs", async () => {
    // Create large test dataset
    await seedLargeKnowledgeGraph(knowledgeGraph, {
      entityCount: 10000,
      relationshipCount: 25000
    });
    
    // Test search performance
    const queries = [
      "artificial intelligence",
      "machine learning frameworks", 
      "neural network architectures"
    ];
    
    for (const query of queries) {
      const startTime = performance.now();
      const results = await searchEngine.search(query, { maxHops: 3 });
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(500); // P95 requirement
      expect(results.length).toBeGreaterThan(0);
    }
  });
});
```

### 2. Real-Time Graph Updates

```typescript
describe("Real-Time Knowledge Graph Updates", () => {
  it("should update knowledge graph during content ingestion", async () => {
    const initialEntityCount = await knowledgeGraph.getEntityCount();
    
    // Ingest new document with novel entities
    const newDocument = "test-data/emerging-ai-trends.pdf";
    await pipeline.ingestFiles([newDocument]);
    
    const finalEntityCount = await knowledgeGraph.getEntityCount();
    expect(finalEntityCount).toBeGreaterThan(initialEntityCount);
    
    // Verify new entities are immediately searchable
    const results = await searchEngine.search("quantum computing");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should handle concurrent ingestion without corruption", async () => {
    const files = [
      "test-data/doc1.pdf",
      "test-data/doc2.pdf", 
      "test-data/doc3.pdf"
    ];
    
    // Process files concurrently
    const ingestionPromises = files.map(file => 
      pipeline.ingestFiles([file])
    );
    
    await Promise.all(ingestionPromises);
    
    // Verify graph consistency
    const consistency = await knowledgeGraph.validateConsistency();
    expect(consistency.isValid).toBe(true);
    expect(consistency.errors).toHaveLength(0);
  });
});
```

## Contract Test Suite

### 1. Search API Contract

```typescript
// apps/contracts/graph-rag-search-api.yaml
describe("Graph RAG Search API Contract", () => {
  const server = setupServer(
    http.post("/api/search", () => 
      HttpResponse.json({
        results: [
          {
            id: "chunk_123",
            text: "Sample search result",
            score: 0.95,
            metadata: {
              contentType: "pdf",
              entities: ["AI", "Machine Learning"],
              relationships: [
                {
                  source: "AI",
                  target: "Machine Learning", 
                  type: "RELATED_TO",
                  confidence: 0.9
                }
              ]
            }
          }
        ],
        explanation: {
          queryEntities: ["AI"],
          traversalPath: ["AI", "Machine Learning", "Neural Networks"],
          hopCount: 2
        }
      } satisfies SearchResponse)
    )
  );

  it("should conform to search response schema", async () => {
    const response = await searchClient.search({
      query: "artificial intelligence",
      options: { maxHops: 2, includeExplanation: true }
    });
    
    expect(response.results).toBeDefined();
    expect(response.explanation).toBeDefined();
    expect(response.results[0].metadata.entities).toBeInstanceOf(Array);
  });
});
```

### 2. Knowledge Graph Schema Contract

```typescript
// apps/contracts/knowledge-graph-schema.graphql
describe("Knowledge Graph GraphQL Schema", () => {
  it("should support entity queries with relationships", async () => {
    const query = `
      query GetEntityWithRelationships($id: ID!) {
        entity(id: $id) {
          id
          name
          type
          confidence
          relationships {
            target {
              id
              name
            }
            type
            confidence
          }
        }
      }
    `;
    
    const result = await graphqlClient.query({
      query,
      variables: { id: "entity_123" }
    });
    
    expect(result.data.entity).toBeDefined();
    expect(result.data.entity.relationships).toBeInstanceOf(Array);
  });
});
```

## End-to-End Test Suite

### 1. Critical User Journeys

```typescript
describe("Graph RAG Search E2E", () => {
  it("should complete full search journey with explanations [A1, A4]", async () => {
    // User uploads multi-modal content
    await uploadFiles([
      "research-paper.pdf",
      "conference-video.mp4", 
      "podcast-audio.mp3"
    ]);
    
    // Wait for processing to complete
    await waitForProcessingComplete();
    
    // User performs search
    const searchResults = await performSearch("AI design patterns");
    
    // Verify cross-modal results
    expect(searchResults.length).toBeGreaterThan(0);
    
    const contentTypes = searchResults.map(r => r.contentType);
    expect(contentTypes).toContain("pdf");
    expect(contentTypes).toContain("video");
    
    // User requests explanation
    const explanation = await getSearchExplanation(searchResults[0].id);
    
    expect(explanation.entityPath).toBeDefined();
    expect(explanation.relationshipChain).toBeDefined();
    expect(explanation.sourceDocuments).toContain("research-paper.pdf");
  });

  it("should handle complex multi-hop queries [A3]", async () => {
    // Seed knowledge graph with connected entities
    await seedConnectedEntities();
    
    // Perform multi-hop search
    const results = await performSearch("neural networks optimization techniques", {
      maxHops: 3,
      includeExplanation: true
    });
    
    expect(results.length).toBeGreaterThan(0);
    
    // Verify multi-hop reasoning
    const explanation = results[0].explanation;
    expect(explanation.hopCount).toBeGreaterThan(1);
    expect(explanation.hopCount).toBeLessThanOrEqual(3);
    expect(explanation.confidenceScore).toBeGreaterThan(0.5);
  });
});
```

### 2. Performance & Scalability E2E

```typescript
describe("Performance E2E Tests", () => {
  it("should maintain performance under concurrent load [A5]", async () => {
    // Seed large knowledge graph
    await seedLargeDataset({
      documents: 1000,
      entities: 10000,
      relationships: 25000
    });
    
    // Simulate concurrent users
    const concurrentSearches = Array.from({ length: 50 }, (_, i) => 
      performSearch(`query ${i}`, { maxHops: 2 })
    );
    
    const startTime = performance.now();
    const results = await Promise.all(concurrentSearches);
    const totalTime = performance.now() - startTime;
    
    // All searches should complete successfully
    results.forEach(result => {
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
    
    // Average response time should be acceptable
    const avgResponseTime = totalTime / concurrentSearches.length;
    expect(avgResponseTime).toBeLessThan(500);
  });
});
```

## Mutation Testing Strategy

### Critical Mutation Targets

1. **Entity Deduplication Logic**: Ensure mutations in similarity calculations are caught
2. **Graph Traversal Algorithms**: Verify path-finding logic is thoroughly tested  
3. **Confidence Score Calculations**: Test boundary conditions and edge cases
4. **Search Result Ranking**: Ensure ranking algorithm changes are detected

### Mutation Testing Configuration

```javascript
// stryker.conf.json additions
{
  "mutate": [
    "src/lib/knowledge-graph/**/*.ts",
    "src/lib/search/**/*.ts", 
    "src/lib/entity-extraction/**/*.ts"
  ],
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "thresholds": {
    "high": 80,
    "low": 50,
    "break": 45
  }
}
```

## Performance Testing

### Load Testing Scenarios

```typescript
describe("Performance Benchmarks", () => {
  it("should handle search load with P95 < 500ms", async () => {
    const loadTest = new LoadTester({
      concurrent: 100,
      duration: "60s",
      rampUp: "10s"
    });
    
    const results = await loadTest.run(async () => {
      return await searchEngine.search("machine learning", { maxHops: 2 });
    });
    
    expect(results.p95).toBeLessThan(500);
    expect(results.errorRate).toBeLessThan(0.01);
  });
});
```

## Test Data Management

### Synthetic Data Generation

```typescript
// Generate realistic test knowledge graphs
export function generateTestKnowledgeGraph(options: {
  entityCount: number;
  relationshipDensity: number;
  domainTypes: string[];
}) {
  const entities = Array.from({ length: options.entityCount }, () => ({
    id: `entity_${uuid()}`,
    type: fc.sample(options.domainTypes, 1)[0],
    name: generateRealisticEntityName(),
    confidence: fc.float({ min: 0.7, max: 1.0 })(),
    embedding: generateRandomEmbedding(768)
  }));
  
  const relationships = generateRelationships(entities, options.relationshipDensity);
  
  return { entities, relationships };
}
```

### Test Environment Isolation

```typescript
// Ensure test isolation with containerized databases
export async function setupTestEnvironment() {
  const container = await new PostgreSqlContainer("pgvector/pgvector:pg16")
    .withDatabase("test_graph_rag")
    .withUsername("testuser")
    .withPassword("testpass")
    .start();
    
  const database = new ObsidianDatabase(container.getConnectionUri());
  await database.initialize();
  
  return { database, container };
}
```

## Continuous Testing Strategy

### Automated Test Execution

- **Unit Tests**: Run on every commit with fast feedback (< 30s)
- **Integration Tests**: Run on PR creation with real databases (< 5min)
- **Contract Tests**: Run on API changes with schema validation
- **E2E Tests**: Run on merge to main with full system validation (< 15min)
- **Performance Tests**: Run nightly with trend analysis

### Quality Gates

- **Branch Coverage**: ≥ 80% (Tier 2 requirement)
- **Mutation Score**: ≥ 50% (Tier 2 requirement) 
- **Performance Regression**: No P95 increase > 10%
- **Contract Compliance**: 100% schema validation pass rate

This comprehensive test plan ensures the Graph RAG-enhanced semantic search system meets all functional, performance, and quality requirements while maintaining the engineering rigor expected from a Tier 2 system.
