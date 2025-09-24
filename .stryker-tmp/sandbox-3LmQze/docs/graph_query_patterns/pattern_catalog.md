# Graph Query Pattern Catalog

## Pattern Categories

### 1. Entity-Centric Queries

#### Find Related Entities
**Pattern**: "What is related to [entity]?"
**Graph Operation**: Find all entities connected to target entity
**Example**: "What is related to React?"
```typescript
interface EntityQuery {
  type: 'entity-relations';
  entity: string;
  relationshipTypes?: RelationshipType[];
  maxDepth: number;
  direction: 'outgoing' | 'incoming' | 'both';
}
```

#### Entity Comparison
**Pattern**: "Compare [entity1] and [entity2]"
**Graph Operation**: Find common and unique relationships
**Example**: "Compare Vue and React"
```typescript
interface ComparisonQuery {
  type: 'entity-comparison';
  entities: string[];
  comparisonType: 'relationships' | 'usage' | 'collaboration';
}
```

#### Entity Context
**Pattern**: "[entity]'s [relationship]"
**Graph Operation**: Find specific relationship type from entity
**Example**: "John's projects", "React's ecosystem"
```typescript
interface ContextQuery {
  type: 'entity-context';
  entity: string;
  relationship: string;
  limit: number;
}
```

### 2. Relationship Queries

#### Relationship Path Finding
**Pattern**: "How are [entity1] and [entity2] connected?"
**Graph Operation**: Find shortest path between entities
**Example**: "How are design systems and accessibility connected?"
```typescript
interface PathQuery {
  type: 'relationship-path';
  startEntity: string;
  endEntity: string;
  maxPathLength: number;
}
```

#### Relationship Patterns
**Pattern**: "Find [relationship] patterns"
**Graph Operation**: Match specific relationship structures
**Example**: "Find collaboration patterns", "Find dependency chains"
```typescript
interface PatternQuery {
  type: 'relationship-pattern';
  pattern: RelationshipPattern;
  constraints: PatternConstraints;
}
```

#### Relationship Strength
**Pattern**: "Strongest relationships for [entity]"
**Graph Operation**: Rank relationships by strength/importance
**Example**: "Strongest relationships for the design system"
```typescript
interface StrengthQuery {
  type: 'relationship-strength';
  entity: string;
  metric: 'frequency' | 'centrality' | 'recency';
  limit: number;
}
```

### 3. Structural Queries

#### Cluster Analysis
**Pattern**: "What clusters exist around [concept]?"
**Graph Operation**: Find densely connected subgraphs
**Example**: "What clusters exist around machine learning?"
```typescript
interface ClusterQuery {
  type: 'cluster-analysis';
  concept: string;
  clusterAlgorithm: 'connected-components' | 'modularity' | 'label-propagation';
}
```

#### Hierarchy Exploration
**Pattern**: "Show hierarchy of [concept]"
**Graph Operation**: Traverse hierarchical relationships
**Example**: "Show hierarchy of design components"
```typescript
interface HierarchyQuery {
  type: 'hierarchy-exploration';
  rootConcept: string;
  relationshipType: 'is-a' | 'part-of' | 'subclass-of';
  maxDepth: number;
}
```

#### Centrality Analysis
**Pattern**: "Most important [entities] in [domain]"
**Graph Operation**: Calculate centrality measures
**Example**: "Most important people in the design team"
```typescript
interface CentralityQuery {
  type: 'centrality-analysis';
  entityType: string;
  domain: string;
  centralityType: 'degree' | 'betweenness' | 'closeness' | 'eigenvector';
}
```

### 4. Temporal Queries

#### Evolution Tracking
**Pattern**: "How has [entity] evolved?"
**Graph Operation**: Track relationship changes over time
**Example**: "How has the design system evolved?"
```typescript
interface EvolutionQuery {
  type: 'evolution-tracking';
  entity: string;
  timeRange: { start: Date; end: Date };
  changeType: 'relationships' | 'importance' | 'connections';
}
```

#### Recent Activity
**Pattern**: "Recent [relationship] involving [entity]"
**Graph Operation**: Find recent relationship changes
**Example**: "Recent collaborations with John"
```typescript
interface ActivityQuery {
  type: 'recent-activity';
  entity: string;
  relationshipType: string;
  since: Date;
}
```

### 5. Comparative Queries

#### Difference Analysis
**Pattern**: "Differences between [entity1] and [entity2]"
**Graph Operation**: Compare relationship networks
**Example**: "Differences between agile and waterfall"
```typescript
interface DifferenceQuery {
  type: 'difference-analysis';
  entities: string[];
  analysisType: 'relationships' | 'connections' | 'influence';
}
```

#### Similarity Finding
**Pattern**: "Similar to [entity]"
**Graph Operation**: Find entities with similar relationship patterns
**Example**: "Similar to the current design system"
```typescript
interface SimilarityQuery {
  type: 'similarity-finding';
  entity: string;
  similarityMetric: 'structural' | 'semantic' | 'usage';
  threshold: number;
}
```

## Implementation Patterns

### Query Parser Architecture
```typescript
class GraphQueryParser {
  parse(naturalLanguageQuery: string): GraphQuery {
    // 1. Tokenize and normalize
    const tokens = this.tokenize(query);

    // 2. Intent classification
    const intent = this.classifyIntent(tokens);

    // 3. Entity extraction
    const entities = this.extractEntities(tokens);

    // 4. Pattern matching
    const pattern = this.matchPattern(intent, entities, tokens);

    // 5. Parameter extraction
    const parameters = this.extractParameters(pattern, tokens);

    return this.buildGraphQuery(pattern, parameters);
  }
}
```

### Graph Execution Engine
```typescript
class GraphQueryExecutor {
  async execute(query: GraphQuery): Promise<QueryResult> {
    switch (query.type) {
      case 'entity-relations':
        return this.executeEntityRelations(query);
      case 'path-finding':
        return this.executePathFinding(query);
      case 'centrality-analysis':
        return this.executeCentralityAnalysis(query);
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  }

  private async executeEntityRelations(query: EntityQuery): Promise<EntityRelationsResult> {
    // Implement graph traversal logic
    const startEntity = await this.findEntity(query.entity);
    const relationships = await this.traverseRelationships(
      startEntity,
      query.relationshipTypes,
      query.maxDepth,
      query.direction
    );

    return {
      entity: startEntity,
      relationships,
      relatedEntities: this.extractRelatedEntities(relationships)
    };
  }
}
```

### Result Formatting
```typescript
class GraphQueryFormatter {
  format(result: QueryResult, format: 'natural' | 'structured' | 'visual'): FormattedResult {
    switch (format) {
      case 'natural':
        return this.formatNaturalLanguage(result);
      case 'structured':
        return this.formatStructured(result);
      case 'visual':
        return this.formatVisual(result);
      default:
        return result;
    }
  }

  private formatNaturalLanguage(result: QueryResult): NaturalLanguageResult {
    // Convert graph results to readable explanations
    // "React is used by 5 projects and has 12 related concepts..."
    return {
      summary: this.generateSummary(result),
      details: this.generateDetails(result),
      suggestions: this.generateSuggestions(result)
    };
  }
}
```

## Performance Optimization Patterns

### Query Optimization
- **Index Selection**: Choose optimal graph indexes for query types
- **Traversal Bounds**: Limit depth and breadth of graph traversals
- **Caching Strategy**: Cache frequent query patterns and results
- **Approximation**: Use approximate algorithms for expensive operations

### Execution Strategies
- **Parallel Processing**: Execute independent graph operations concurrently
- **Incremental Results**: Return results as they become available
- **Timeout Handling**: Prevent runaway queries with time limits
- **Resource Limits**: Control memory and CPU usage per query

### Storage Patterns
- **Graph Partitioning**: Divide large graphs for parallel processing
- **Index Optimization**: Maintain multiple indexes for different query patterns
- **Compression**: Reduce storage footprint of relationship data
- **Caching**: Cache frequently accessed graph structures

## Error Handling & Fallbacks

### Query Validation
- **Syntax Checking**: Validate query structure and parameters
- **Entity Resolution**: Ensure referenced entities exist
- **Constraint Validation**: Check query bounds and limits
- **Security Filtering**: Prevent malicious or overly expensive queries

### Graceful Degradation
- **Fallback to Search**: Fall back to vector search for failed graph queries
- **Partial Results**: Return available results when full query fails
- **Approximation**: Use faster approximate algorithms when needed
- **User Feedback**: Provide clear error messages and suggestions

## Testing Patterns

### Query Test Cases
```typescript
const graphQueryTestCases = [
  {
    input: "What projects use React?",
    expected: {
      type: 'entity-context',
      entity: 'React',
      relationship: 'uses',
      direction: 'incoming'
    }
  },
  {
    input: "How are design systems and accessibility connected?",
    expected: {
      type: 'relationship-path',
      startEntity: 'design systems',
      endEntity: 'accessibility'
    }
  }
];
```

### Performance Benchmarks
- **Query Latency**: Target <100ms for simple queries, <500ms for complex
- **Result Accuracy**: >90% precision for entity and relationship extraction
- **Coverage**: Support 80% of common relationship discovery queries
- **Scalability**: Maintain performance with 10K+ entities and 100K+ relationships

## Integration with Existing Search

### Hybrid Search Strategy
```typescript
class HybridSearchEngine {
  async search(query: string): Promise<SearchResults> {
    // 1. Determine if query benefits from graph analysis
    const queryType = this.classifyQueryType(query);

    if (queryType.isGraphQuery) {
      // 2. Execute graph query
      const graphResults = await this.graphQueryExecutor.execute(
        this.graphQueryParser.parse(query)
      );

      // 3. Enhance with vector search
      const enhancedResults = await this.enhanceWithVectorSearch(graphResults);

      return enhancedResults;
    } else {
      // 4. Fall back to standard vector search
      return this.vectorSearchEngine.search(query);
    }
  }
}
```

### Result Fusion
- **Graph + Vector**: Combine relationship-based and similarity-based results
- **Deduplication**: Remove duplicate results from different sources
- **Ranking**: Create unified ranking based on multiple signals
- **Explanation**: Provide reasoning for result ordering and relationships
