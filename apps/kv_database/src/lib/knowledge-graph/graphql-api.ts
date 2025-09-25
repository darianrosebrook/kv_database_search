import { Pool } from "pg";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLInterfaceType,
} from "graphql";
import { ObsidianEmbeddingService } from "../embeddings.js";
import { HybridSearchEngine } from "./hybrid-search-engine.js";
import { MultiHopReasoningEngine } from "./multi-hop-reasoning.js";
import { ResultRankingService } from "./result-ranking.js";
import { KnowledgeGraphManager } from "./knowledge-graph-manager.js";
import { ProvenanceTracker } from "./provenance-tracker.js";
import { QueryOptimizer } from "./query-optimizer.js";
import {
  EntityType,
  RelationshipType,
  type KnowledgeGraphEntity,
  type KnowledgeGraphRelationship,
} from "./entity-extractor.js";

// GraphQL Enums
const EntityTypeEnum = new GraphQLEnumType({
  name: "EntityType",
  values: {
    PERSON: { value: EntityType.PERSON },
    ORGANIZATION: { value: EntityType.ORGANIZATION },
    LOCATION: { value: EntityType.LOCATION },
    CONCEPT: { value: EntityType.CONCEPT },
    DOCUMENT: { value: EntityType.DOCUMENT },
    EVENT: { value: EntityType.EVENT },
    PRODUCT: { value: EntityType.PRODUCT },
    TECHNOLOGY: { value: EntityType.TECHNOLOGY },
    PROCESS: { value: EntityType.PROCESS },
    METRIC: { value: EntityType.METRIC },
  },
});

const RelationshipTypeEnum = new GraphQLEnumType({
  name: "RelationshipType",
  values: {
    MENTIONS: { value: RelationshipType.MENTIONS },
    CONTAINS: { value: RelationshipType.CONTAINS },
    RELATES_TO: { value: RelationshipType.RELATES_TO },
    DEPENDS_ON: { value: RelationshipType.DEPENDS_ON },
    CAUSES: { value: RelationshipType.CAUSES },
    PART_OF: { value: RelationshipType.PART_OF },
    SIMILAR_TO: { value: RelationshipType.SIMILAR_TO },
    OPPOSITE_OF: { value: RelationshipType.OPPOSITE_OF },
    TEMPORAL_BEFORE: { value: RelationshipType.TEMPORAL_BEFORE },
    TEMPORAL_AFTER: { value: RelationshipType.TEMPORAL_AFTER },
  },
});

const ReasoningTypeEnum = new GraphQLEnumType({
  name: "ReasoningType",
  values: {
    EXPLORATORY: { value: "exploratory" },
    TARGETED: { value: "targeted" },
    COMPARATIVE: { value: "comparative" },
    CAUSAL: { value: "causal" },
  },
});

const SearchStrategyEnum = new GraphQLEnumType({
  name: "SearchStrategy",
  values: {
    VECTOR_ONLY: { value: "vector_only" },
    GRAPH_ONLY: { value: "graph_only" },
    HYBRID: { value: "hybrid" },
    ADAPTIVE: { value: "adaptive" },
  },
});

// GraphQL Types
const NodeType = new GraphQLObjectType({
  name: "Node",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(EntityTypeEnum) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    properties: { type: GraphQLString }, // JSON string
    aliases: { type: new GraphQLList(GraphQLString) },
    sourceFiles: { type: new GraphQLList(GraphQLString) },
    extractionMethods: { type: new GraphQLList(GraphQLString) },
    firstSeen: { type: GraphQLString }, // ISO date string
    lastUpdated: { type: GraphQLString }, // ISO date string
    relationships: {
      type: new GraphQLList(RelationshipType),
      args: {
        type: { type: RelationshipTypeEnum },
        limit: { type: GraphQLInt, defaultValue: 10 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.getEntityRelationships(
          parent.id,
          args.type,
          args.limit,
          args.offset
        );
      },
    },
    relatedNodes: {
      type: new GraphQLList(NodeType),
      args: {
        relationshipType: { type: RelationshipTypeEnum },
        maxDepth: { type: GraphQLInt, defaultValue: 1 },
        limit: { type: GraphQLInt, defaultValue: 10 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.getRelatedEntities(
          parent.id,
          args.relationshipType,
          args.maxDepth,
          args.limit
        );
      },
    },
  }),
});

const RelationshipType = new GraphQLObjectType({
  name: "Relationship",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(RelationshipTypeEnum) },
    sourceNode: {
      type: new GraphQLNonNull(NodeType),
      resolve: async (parent, args, context) => {
        return context.graphManager.getEntityById(parent.sourceEntityId);
      },
    },
    targetNode: {
      type: new GraphQLNonNull(NodeType),
      resolve: async (parent, args, context) => {
        return context.graphManager.getEntityById(parent.targetEntityId);
      },
    },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    strength: { type: new GraphQLNonNull(GraphQLFloat) },
    properties: { type: GraphQLString }, // JSON string
    isDirectional: { type: new GraphQLNonNull(GraphQLBoolean) },
    sourceChunkIds: { type: new GraphQLList(GraphQLString) },
    extractionMethod: { type: GraphQLString },
    createdAt: { type: GraphQLString }, // ISO date string
    updatedAt: { type: GraphQLString }, // ISO date string
  }),
});

const SearchResultType = new GraphQLObjectType({
  name: "SearchResult",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    text: { type: new GraphQLNonNull(GraphQLString) },
    score: { type: new GraphQLNonNull(GraphQLFloat) },
    similarity: { type: new GraphQLNonNull(GraphQLFloat) },
    rankingScore: { type: GraphQLFloat },
    metadata: { type: GraphQLString }, // JSON string
    entities: { type: new GraphQLList(NodeType) },
    relationships: { type: new GraphQLList(RelationshipType) },
    explanation: { type: GraphQLString },
  }),
});

const ReasoningPathType = new GraphQLObjectType({
  name: "ReasoningPath",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    entities: { type: new GraphQLList(NodeType) },
    relationships: { type: new GraphQLList(RelationshipType) },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    strength: { type: new GraphQLNonNull(GraphQLFloat) },
    depth: { type: new GraphQLNonNull(GraphQLInt) },
    explanation: { type: GraphQLString },
    evidence: { type: new GraphQLList(GraphQLString) }, // JSON strings
    logicalSteps: { type: new GraphQLList(GraphQLString) }, // JSON strings
  }),
});

const ReasoningResultType = new GraphQLObjectType({
  name: "ReasoningResult",
  fields: () => ({
    paths: { type: new GraphQLList(ReasoningPathType) },
    bestPath: { type: ReasoningPathType },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    explanation: { type: GraphQLString },
    metrics: { type: GraphQLString }, // JSON string
    alternativeHypotheses: { type: new GraphQLList(GraphQLString) }, // JSON strings
    contradictions: { type: new GraphQLList(GraphQLString) }, // JSON strings
  }),
});

const GraphStatisticsType = new GraphQLObjectType({
  name: "GraphStatistics",
  fields: () => ({
    nodeCount: { type: new GraphQLNonNull(GraphQLInt) },
    relationshipCount: { type: new GraphQLNonNull(GraphQLInt) },
    entityTypeDistribution: { type: GraphQLString }, // JSON string
    relationshipTypeDistribution: { type: GraphQLString }, // JSON string
    averageNodeDegree: { type: GraphQLFloat },
    clusteringCoefficient: { type: GraphQLFloat },
    connectedComponents: { type: GraphQLInt },
    diameter: { type: GraphQLInt },
    lastUpdated: { type: GraphQLString }, // ISO date string
  }),
});

const ProvenanceRecordType = new GraphQLObjectType({
  name: "ProvenanceRecord",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    sessionId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: GraphQLString },
    timestamp: { type: new GraphQLNonNull(GraphQLString) }, // ISO date string
    operation: { type: GraphQLString }, // JSON string
    inputData: { type: GraphQLString }, // JSON string
    outputData: { type: GraphQLString }, // JSON string
    qualityMetrics: { type: GraphQLString }, // JSON string
    explanation: { type: GraphQLString },
  }),
});

// Input Types
const SearchFiltersInput = new GraphQLInputObjectType({
  name: "SearchFiltersInput",
  fields: {
    entityTypes: { type: new GraphQLList(EntityTypeEnum) },
    relationshipTypes: { type: new GraphQLList(RelationshipTypeEnum) },
    sourceFiles: { type: new GraphQLList(GraphQLString) },
    minConfidence: { type: GraphQLFloat },
    dateRange: {
      type: new GraphQLInputObjectType({
        name: "DateRangeInput",
        fields: {
          start: { type: GraphQLString }, // ISO date string
          end: { type: GraphQLString }, // ISO date string
        },
      }),
    },
  },
});

const SearchOptionsInput = new GraphQLInputObjectType({
  name: "SearchOptionsInput",
  fields: {
    maxResults: { type: GraphQLInt, defaultValue: 20 },
    maxHops: { type: GraphQLInt, defaultValue: 2 },
    includeExplanation: { type: GraphQLBoolean, defaultValue: false },
    strategy: { type: SearchStrategyEnum, defaultValue: "hybrid" },
    enableRanking: { type: GraphQLBoolean, defaultValue: true },
    enableProvenance: { type: GraphQLBoolean, defaultValue: false },
  },
});

const ReasoningOptionsInput = new GraphQLInputObjectType({
  name: "ReasoningOptionsInput",
  fields: {
    maxDepth: { type: GraphQLInt, defaultValue: 3 },
    minConfidence: { type: GraphQLFloat, defaultValue: 0.3 },
    reasoningType: { type: ReasoningTypeEnum, defaultValue: "exploratory" },
    enableExplanation: { type: GraphQLBoolean, defaultValue: true },
    enableProvenance: { type: GraphQLBoolean, defaultValue: false },
  },
});

// Root Query Type
const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    // Node queries
    node: {
      type: NodeType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.getEntityById(args.id);
      },
    },
    nodes: {
      type: new GraphQLList(NodeType),
      args: {
        type: { type: EntityTypeEnum },
        search: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.searchEntities({
          type: args.type,
          search: args.search,
          limit: args.limit,
          offset: args.offset,
        });
      },
    },

    // Relationship queries
    relationship: {
      type: RelationshipType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.getRelationshipById(args.id);
      },
    },
    relationships: {
      type: new GraphQLList(RelationshipType),
      args: {
        type: { type: RelationshipTypeEnum },
        sourceNodeId: { type: GraphQLID },
        targetNodeId: { type: GraphQLID },
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.searchRelationships({
          type: args.type,
          sourceNodeId: args.sourceNodeId,
          targetNodeId: args.targetNodeId,
          limit: args.limit,
          offset: args.offset,
        });
      },
    },

    // Search queries
    search: {
      type: new GraphQLList(SearchResultType),
      args: {
        query: { type: new GraphQLNonNull(GraphQLString) },
        filters: { type: SearchFiltersInput },
        options: { type: SearchOptionsInput },
      },
      resolve: async (parent, args, context) => {
        const searchQuery = {
          text: args.query,
          filters: args.filters,
          options: args.options,
        };

        const sessionId = context.sessionId || "anonymous";

        // Optimize query if enabled
        let results;
        if (args.options?.enableOptimization) {
          const optimizationContext =
            await context.queryOptimizer.getOptimizationContext();
          const queryPlan = await context.queryOptimizer.optimizeSearchQuery(
            searchQuery,
            optimizationContext
          );
          const execution = await context.queryOptimizer.executeOptimizedPlan(
            queryPlan,
            async (optimizedQuery) => {
              return context.searchEngine.search(optimizedQuery);
            }
          );
          results = execution.results;
        } else {
          results = await context.searchEngine.search(searchQuery);
        }

        // Record provenance if enabled
        if (args.options?.enableProvenance) {
          await context.provenanceTracker.recordSearchProvenance(
            sessionId,
            args.query,
            results.results,
            results.metrics,
            results.explanation,
            { searchType: args.options?.strategy }
          );
        }

        return results.results;
      },
    },

    // Reasoning queries
    reason: {
      type: ReasoningResultType,
      args: {
        startEntities: { type: new GraphQLNonNull(new GraphQLList(GraphQLID)) },
        targetEntities: { type: new GraphQLList(GraphQLID) },
        question: { type: GraphQLString },
        options: { type: ReasoningOptionsInput },
      },
      resolve: async (parent, args, context) => {
        const reasoningQuery = {
          startEntities: args.startEntities,
          targetEntities: args.targetEntities,
          question: args.question || "What are the connections?",
          maxDepth: args.options?.maxDepth || 3,
          minConfidence: args.options?.minConfidence || 0.3,
          reasoningType: args.options?.reasoningType || "exploratory",
        };

        const sessionId = context.sessionId || "anonymous";

        // Execute reasoning
        const results = await context.reasoningEngine.reason(reasoningQuery);

        // Record provenance if enabled
        if (args.options?.enableProvenance) {
          await context.provenanceTracker.recordReasoningProvenance(
            sessionId,
            args.startEntities,
            reasoningQuery.question,
            results,
            { reasoningType: args.options?.reasoningType }
          );
        }

        return results;
      },
    },

    // Graph traversal queries
    traverse: {
      type: new GraphQLList(ReasoningPathType),
      args: {
        startNodeId: { type: new GraphQLNonNull(GraphQLID) },
        endNodeId: { type: GraphQLID },
        maxDepth: { type: GraphQLInt, defaultValue: 3 },
        relationshipTypes: { type: new GraphQLList(RelationshipTypeEnum) },
        minConfidence: { type: GraphQLFloat, defaultValue: 0.3 },
      },
      resolve: async (parent, args, context) => {
        return context.reasoningEngine.traverseGraph({
          startNodeId: args.startNodeId,
          endNodeId: args.endNodeId,
          maxDepth: args.maxDepth,
          relationshipTypes: args.relationshipTypes,
          minConfidence: args.minConfidence,
        });
      },
    },

    // Statistics queries
    graphStatistics: {
      type: GraphStatisticsType,
      resolve: async (parent, args, context) => {
        return context.graphManager.getGraphStatistics();
      },
    },

    // Provenance queries
    provenance: {
      type: new GraphQLList(ProvenanceRecordType),
      args: {
        sessionId: { type: GraphQLString },
        userId: { type: GraphQLString },
        operationType: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: async (parent, args, context) => {
        return context.provenanceTracker.queryProvenance({
          sessionId: args.sessionId,
          userId: args.userId,
          operationType: args.operationType,
        });
      },
    },

    // Similarity queries
    findSimilar: {
      type: new GraphQLList(NodeType),
      args: {
        nodeId: { type: new GraphQLNonNull(GraphQLID) },
        threshold: { type: GraphQLFloat, defaultValue: 0.7 },
        limit: { type: GraphQLInt, defaultValue: 10 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.findSimilarEntities(
          args.nodeId,
          args.threshold,
          args.limit
        );
      },
    },

    // Path finding queries
    shortestPath: {
      type: ReasoningPathType,
      args: {
        startNodeId: { type: new GraphQLNonNull(GraphQLID) },
        endNodeId: { type: new GraphQLNonNull(GraphQLID) },
        maxDepth: { type: GraphQLInt, defaultValue: 6 },
      },
      resolve: async (parent, args, context) => {
        return context.reasoningEngine.findShortestPath(
          args.startNodeId,
          args.endNodeId,
          args.maxDepth
        );
      },
    },

    // Clustering queries
    clusters: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "Cluster",
          fields: {
            id: { type: GraphQLID },
            nodes: { type: new GraphQLList(NodeType) },
            centroid: { type: NodeType },
            cohesion: { type: GraphQLFloat },
            size: { type: GraphQLInt },
          },
        })
      ),
      args: {
        algorithm: {
          type: new GraphQLEnumType({
            name: "ClusteringAlgorithm",
            values: {
              LOUVAIN: { value: "louvain" },
              LEIDEN: { value: "leiden" },
              KMEANS: { value: "kmeans" },
            },
          }),
          defaultValue: "louvain",
        },
        minClusterSize: { type: GraphQLInt, defaultValue: 3 },
        maxClusters: { type: GraphQLInt, defaultValue: 20 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.detectClusters({
          algorithm: args.algorithm,
          minClusterSize: args.minClusterSize,
          maxClusters: args.maxClusters,
        });
      },
    },
  }),
});

// Root Mutation Type
const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    // Node mutations
    createNode: {
      type: NodeType,
      args: {
        type: { type: new GraphQLNonNull(EntityTypeEnum) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
        properties: { type: GraphQLString }, // JSON string
        aliases: { type: new GraphQLList(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.createEntity({
          type: args.type,
          name: args.name,
          description: args.description,
          properties: args.properties ? JSON.parse(args.properties) : {},
          aliases: args.aliases || [],
          confidence: 1.0, // Manual creation gets full confidence
        });
      },
    },

    updateNode: {
      type: NodeType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        properties: { type: GraphQLString }, // JSON string
        aliases: { type: new GraphQLList(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const updates: any = {};
        if (args.name) updates.name = args.name;
        if (args.description) updates.description = args.description;
        if (args.properties) updates.properties = JSON.parse(args.properties);
        if (args.aliases) updates.aliases = args.aliases;

        return context.graphManager.updateEntity(args.id, updates);
      },
    },

    deleteNode: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.deleteEntity(args.id);
      },
    },

    // Relationship mutations
    createRelationship: {
      type: RelationshipType,
      args: {
        type: { type: new GraphQLNonNull(RelationshipTypeEnum) },
        sourceNodeId: { type: new GraphQLNonNull(GraphQLID) },
        targetNodeId: { type: new GraphQLNonNull(GraphQLID) },
        properties: { type: GraphQLString }, // JSON string
        confidence: { type: GraphQLFloat, defaultValue: 1.0 },
        strength: { type: GraphQLFloat, defaultValue: 1.0 },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.createRelationship({
          type: args.type,
          sourceEntityId: args.sourceNodeId,
          targetEntityId: args.targetNodeId,
          properties: args.properties ? JSON.parse(args.properties) : {},
          confidence: args.confidence,
          strength: args.strength,
          isDirectional: true,
        });
      },
    },

    updateRelationship: {
      type: RelationshipType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        properties: { type: GraphQLString }, // JSON string
        confidence: { type: GraphQLFloat },
        strength: { type: GraphQLFloat },
      },
      resolve: async (parent, args, context) => {
        const updates: any = {};
        if (args.properties) updates.properties = JSON.parse(args.properties);
        if (args.confidence !== undefined) updates.confidence = args.confidence;
        if (args.strength !== undefined) updates.strength = args.strength;

        return context.graphManager.updateRelationship(args.id, updates);
      },
    },

    deleteRelationship: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.deleteRelationship(args.id);
      },
    },

    // Bulk operations
    mergeNodes: {
      type: NodeType,
      args: {
        primaryNodeId: { type: new GraphQLNonNull(GraphQLID) },
        secondaryNodeIds: {
          type: new GraphQLNonNull(new GraphQLList(GraphQLID)),
        },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.mergeEntities(
          args.primaryNodeId,
          args.secondaryNodeIds
        );
      },
    },

    // Graph maintenance
    rebuildIndex: {
      type: GraphQLBoolean,
      args: {
        indexType: {
          type: new GraphQLEnumType({
            name: "IndexType",
            values: {
              VECTOR: { value: "vector" },
              TEXT: { value: "text" },
              GRAPH: { value: "graph" },
              ALL: { value: "all" },
            },
          }),
          defaultValue: "all",
        },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.rebuildIndex(args.indexType);
      },
    },

    // Data import/export
    importGraph: {
      type: GraphQLBoolean,
      args: {
        format: {
          type: new GraphQLEnumType({
            name: "GraphFormat",
            values: {
              GRAPHML: { value: "graphml" },
              GEXF: { value: "gexf" },
              JSON: { value: "json" },
              CSV: { value: "csv" },
            },
          }),
          defaultValue: "json",
        },
        data: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        return context.graphManager.importGraph(args.format, args.data);
      },
    },
  }),
});

// Root Subscription Type (for real-time updates)
const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  fields: () => ({
    nodeUpdated: {
      type: NodeType,
      args: {
        nodeId: { type: GraphQLID },
      },
      resolve: (payload) => payload.nodeUpdated,
      // Would implement with GraphQL subscriptions transport
    },

    relationshipUpdated: {
      type: RelationshipType,
      args: {
        relationshipId: { type: GraphQLID },
      },
      resolve: (payload) => payload.relationshipUpdated,
    },

    graphStatisticsUpdated: {
      type: GraphStatisticsType,
      resolve: (payload) => payload.graphStatisticsUpdated,
    },
  }),
});

// Create the GraphQL Schema
export const createGraphQLSchema = (): GraphQLSchema => {
  return new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
    subscription: SubscriptionType,
  });
};

// GraphQL Context Interface
export interface GraphQLContext {
  pool: Pool;
  embeddings: ObsidianEmbeddingService;
  searchEngine: HybridSearchEngine;
  reasoningEngine: MultiHopReasoningEngine;
  rankingService: ResultRankingService;
  graphManager: KnowledgeGraphManager;
  provenanceTracker: ProvenanceTracker;
  queryOptimizer: QueryOptimizer;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

// GraphQL Context Factory
export const createGraphQLContext = (
  pool: Pool,
  embeddings: ObsidianEmbeddingService,
  searchEngine: HybridSearchEngine,
  reasoningEngine: MultiHopReasoningEngine,
  rankingService: ResultRankingService,
  graphManager: KnowledgeGraphManager,
  provenanceTracker: ProvenanceTracker,
  queryOptimizer: QueryOptimizer
): GraphQLContext => {
  return {
    pool,
    embeddings,
    searchEngine,
    reasoningEngine,
    rankingService,
    graphManager,
    provenanceTracker,
    queryOptimizer,
  };
};

// GraphQL Server Setup Helper
export const setupGraphQLServer = (context: GraphQLContext) => {
  const schema = createGraphQLSchema();

  return {
    schema,
    context: (req: any) => ({
      ...context,
      sessionId: req.headers["x-session-id"] || req.sessionID,
      userId: req.headers["x-user-id"] || req.user?.id,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection.remoteAddress,
    }),
    introspection: process.env.NODE_ENV !== "production",
    playground: process.env.NODE_ENV !== "production",
  };
};

// GraphQL Utility Functions
export const validateGraphQLQuery = (query: string): boolean => {
  try {
    // Would use GraphQL parser to validate
    return query.trim().length > 0;
  } catch {
    return false;
  }
};

export const optimizeGraphQLQuery = (query: string): string => {
  // Would implement query optimization
  return query;
};

export const formatGraphQLError = (error: Error): any => {
  return {
    message: error.message,
    locations: [], // Would include location info
    path: [], // Would include field path
    extensions: {
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    },
  };
};
