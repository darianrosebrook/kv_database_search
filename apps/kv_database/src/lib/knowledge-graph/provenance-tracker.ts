import { Pool, PoolClient } from "pg";
import { ContentType } from "../types/index.js";
import {
  EntityType,
  RelationshipType,
  type KnowledgeGraphEntity,
  type KnowledgeGraphRelationship,
} from "./entity-extractor.js";
import {
  type SearchResult,
  type SearchMetrics,
  type SearchExplanation,
} from "./hybrid-search-engine.js";
import {
  type ReasoningResult,
  type ReasoningPath,
} from "./multi-hop-reasoning.js";

export interface ProvenanceRecord {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  operation: ProvenanceOperation;
  inputData: ProvenanceInput;
  outputData: ProvenanceOutput;
  processingSteps: ProcessingStep[];
  dataLineage: DataLineage[];
  qualityMetrics: QualityMetrics;
  auditTrail: AuditEvent[];
  metadata: Record<string, any>;
}

export interface ProvenanceOperation {
  type: "search" | "reasoning" | "entity_extraction" | "relationship_inference" | "ranking";
  subtype?: string;
  version: string;
  configuration: Record<string, any>;
  executionContext: ExecutionContext;
}

export interface ProvenanceInput {
  query?: string;
  entities?: string[];
  filters?: Record<string, any>;
  options?: Record<string, any>;
  sourceFiles?: string[];
  contentHash?: string;
}

export interface ProvenanceOutput {
  results: ProvenanceResult[];
  metrics: Record<string, number>;
  confidence: number;
  explanation?: string;
  warnings?: string[];
  errors?: string[];
}

export interface ProvenanceResult {
  id: string;
  type: "search_result" | "reasoning_path" | "entity" | "relationship";
  content: string;
  score: number;
  confidence: number;
  sources: DataSource[];
  derivedFrom: string[];
  transformations: Transformation[];
}

export interface ProcessingStep {
  stepId: string;
  stepName: string;
  stepType: "preprocessing" | "extraction" | "inference" | "ranking" | "postprocessing";
  startTime: Date;
  endTime: Date;
  duration: number;
  inputHash: string;
  outputHash: string;
  parameters: Record<string, any>;
  algorithmVersion: string;
  success: boolean;
  errorMessage?: string;
  metrics: Record<string, number>;
}

export interface DataLineage {
  sourceId: string;
  sourceType: "file" | "chunk" | "entity" | "relationship" | "inference";
  sourcePath: string;
  sourceHash: string;
  extractionMethod: string;
  extractionTimestamp: Date;
  transformationChain: string[];
  qualityScore: number;
  validationStatus: "validated" | "unvalidated" | "rejected";
}

export interface DataSource {
  id: string;
  type: "file" | "database" | "api" | "inference";
  location: string;
  hash: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface Transformation {
  id: string;
  type: "extraction" | "normalization" | "enrichment" | "aggregation" | "inference";
  algorithm: string;
  version: string;
  parameters: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

export interface ExecutionContext {
  environment: string;
  version: string;
  nodeVersion: string;
  systemInfo: Record<string, any>;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
  databaseQueries: number;
}

export interface QualityMetrics {
  completeness: number; // 0-1, how complete is the result
  accuracy: number; // 0-1, estimated accuracy
  consistency: number; // 0-1, internal consistency
  freshness: number; // 0-1, how recent is the data
  relevance: number; // 0-1, relevance to query
  coverage: number; // 0-1, coverage of the domain
  reliability: number; // 0-1, reliability of sources
}

export interface AuditEvent {
  eventId: string;
  eventType: "access" | "modification" | "validation" | "error" | "warning";
  timestamp: Date;
  actor: string; // user, system, algorithm
  action: string;
  target: string;
  details: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
}

export interface ExplanationTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  applicableOperations: string[];
  language: string;
  complexity: "simple" | "detailed" | "technical";
}

export interface GeneratedExplanation {
  id: string;
  provenanceId: string;
  templateId: string;
  language: string;
  complexity: "simple" | "detailed" | "technical";
  title: string;
  summary: string;
  sections: ExplanationSection[];
  visualizations?: VisualizationSpec[];
  interactiveElements?: InteractiveElement[];
  generatedAt: Date;
  confidence: number;
}

export interface ExplanationSection {
  id: string;
  title: string;
  content: string;
  type: "text" | "list" | "table" | "diagram" | "code";
  importance: number;
  evidence: Evidence[];
  relatedSections: string[];
}

export interface Evidence {
  id: string;
  type: "source_document" | "entity_match" | "relationship" | "algorithm_output" | "statistical";
  description: string;
  confidence: number;
  sourceId: string;
  relevance: number;
  metadata: Record<string, any>;
}

export interface VisualizationSpec {
  id: string;
  type: "graph" | "timeline" | "heatmap" | "flowchart" | "tree";
  title: string;
  data: any;
  config: Record<string, any>;
  interactivity: boolean;
}

export interface InteractiveElement {
  id: string;
  type: "drill_down" | "filter" | "expand" | "compare" | "explore";
  label: string;
  action: string;
  parameters: Record<string, any>;
}

export interface ProvenanceQuery {
  sessionId?: string;
  userId?: string;
  operationType?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  entityIds?: string[];
  sourceFiles?: string[];
  minConfidence?: number;
  includeLineage?: boolean;
  includeExplanations?: boolean;
}

/**
 * Comprehensive provenance tracking and explanation generation system
 * Provides detailed audit trails and explainable AI capabilities
 */
export class ProvenanceTracker {
  private pool: Pool;
  private explanationTemplates: Map<string, ExplanationTemplate> = new Map();

  constructor(pool: Pool) {
    this.pool = pool;
    this.initializeExplanationTemplates();
  }

  /**
   * Record a new provenance entry
   */
  async recordProvenance(
    sessionId: string,
    operation: ProvenanceOperation,
    input: ProvenanceInput,
    output: ProvenanceOutput,
    processingSteps: ProcessingStep[],
    options: {
      userId?: string;
      generateExplanation?: boolean;
      explanationComplexity?: "simple" | "detailed" | "technical";
    } = {}
  ): Promise<ProvenanceRecord> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Generate unique ID
      const provenanceId = `prov_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Build data lineage
      const dataLineage = await this.buildDataLineage(input, client);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(
        input,
        output,
        processingSteps,
        dataLineage
      );

      // Generate audit trail
      const auditTrail = this.generateAuditTrail(
        operation,
        input,
        output,
        options.userId
      );

      // Create provenance record
      const provenanceRecord: ProvenanceRecord = {
        id: provenanceId,
        sessionId,
        userId: options.userId,
        timestamp: new Date(),
        operation,
        inputData: input,
        outputData: output,
        processingSteps,
        dataLineage,
        qualityMetrics,
        auditTrail,
        metadata: {
          generatedBy: "ProvenanceTracker",
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development",
        },
      };

      // Store in database
      await this.storeProvenanceRecord(provenanceRecord, client);

      // Generate explanation if requested
      if (options.generateExplanation) {
        const explanation = await this.generateExplanation(
          provenanceRecord,
          options.explanationComplexity || "detailed"
        );
        await this.storeExplanation(explanation, client);
      }

      await client.query("COMMIT");

      console.log(`📋 Provenance recorded: ${provenanceId}`);
      return provenanceRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Failed to record provenance:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record search operation provenance
   */
  async recordSearchProvenance(
    sessionId: string,
    query: string,
    results: SearchResult[],
    metrics: SearchMetrics,
    explanation?: SearchExplanation,
    options: {
      userId?: string;
      searchType?: string;
      configuration?: Record<string, any>;
    } = {}
  ): Promise<ProvenanceRecord> {
    const operation: ProvenanceOperation = {
      type: "search",
      subtype: options.searchType || "hybrid",
      version: "1.0.0",
      configuration: options.configuration || {},
      executionContext: await this.getExecutionContext(),
    };

    const input: ProvenanceInput = {
      query,
      filters: {},
      options: options.configuration,
    };

    const output: ProvenanceOutput = {
      results: results.map((result) => ({
        id: result.id,
        type: "search_result" as const,
        content: result.text,
        score: result.score,
        confidence: result.similarity,
        sources: [
          {
            id: result.metadata.chunkId,
            type: "file" as const,
            location: result.metadata.sourceFile,
            hash: "",
            timestamp: result.metadata.processingTime,
            metadata: result.metadata,
          },
        ],
        derivedFrom: [result.metadata.chunkId],
        transformations: [],
      })),
      metrics: {
        totalResults: metrics.totalResults,
        executionTime: metrics.executionTime,
        vectorResults: metrics.vectorResults,
        graphResults: metrics.graphResults,
      },
      confidence: results.length > 0 ? results[0].similarity : 0,
      explanation: explanation?.searchStrategy,
    };

    const processingSteps: ProcessingStep[] = [
      {
        stepId: "search_execution",
        stepName: "Hybrid Search Execution",
        stepType: "extraction",
        startTime: new Date(Date.now() - metrics.executionTime),
        endTime: new Date(),
        duration: metrics.executionTime,
        inputHash: this.hashInput(input),
        outputHash: this.hashOutput(output),
        parameters: options.configuration || {},
        algorithmVersion: "1.0.0",
        success: true,
        metrics: {
          vectorSearchTime: metrics.vectorSearchTime,
          graphTraversalTime: metrics.graphTraversalTime,
          resultFusionTime: metrics.resultFusionTime,
        },
      },
    ];

    return this.recordProvenance(sessionId, operation, input, output, processingSteps, {
      userId: options.userId,
      generateExplanation: true,
      explanationComplexity: "detailed",
    });
  }

  /**
   * Record reasoning operation provenance
   */
  async recordReasoningProvenance(
    sessionId: string,
    startEntities: string[],
    question: string,
    result: ReasoningResult,
    options: {
      userId?: string;
      reasoningType?: string;
      configuration?: Record<string, any>;
    } = {}
  ): Promise<ProvenanceRecord> {
    const operation: ProvenanceOperation = {
      type: "reasoning",
      subtype: options.reasoningType || "exploratory",
      version: "1.0.0",
      configuration: options.configuration || {},
      executionContext: await this.getExecutionContext(),
    };

    const input: ProvenanceInput = {
      entities: startEntities,
      query: question,
      options: options.configuration,
    };

    const output: ProvenanceOutput = {
      results: result.paths.map((path) => ({
        id: path.id,
        type: "reasoning_path" as const,
        content: path.explanation,
        score: path.confidence,
        confidence: path.confidence,
        sources: path.evidence.map((evidence) => ({
          id: evidence.id,
          type: "inference" as const,
          location: evidence.type,
          hash: "",
          timestamp: new Date(),
          metadata: { confidence: evidence.confidence },
        })),
        derivedFrom: path.entities.map((e) => e.id),
        transformations: path.logicalSteps.map((step) => ({
          id: `step_${step.step}`,
          type: "inference" as const,
          algorithm: step.logicalRule,
          version: "1.0.0",
          parameters: { premises: step.premises },
          confidence: step.confidence,
          timestamp: new Date(),
        })),
      })),
      metrics: {
        totalPaths: result.metrics.totalPaths,
        averageDepth: result.metrics.averageDepth,
        processingTime: result.metrics.processingTime,
      },
      confidence: result.confidence,
      explanation: result.explanation,
    };

    const processingSteps: ProcessingStep[] = [
      {
        stepId: "reasoning_execution",
        stepName: "Multi-Hop Reasoning",
        stepType: "inference",
        startTime: new Date(Date.now() - result.metrics.processingTime),
        endTime: new Date(),
        duration: result.metrics.processingTime,
        inputHash: this.hashInput(input),
        outputHash: this.hashOutput(output),
        parameters: options.configuration || {},
        algorithmVersion: "1.0.0",
        success: true,
        metrics: {
          exploredNodes: result.metrics.exploredNodes,
          exploredRelationships: result.metrics.exploredRelationships,
        },
      },
    ];

    return this.recordProvenance(sessionId, operation, input, output, processingSteps, {
      userId: options.userId,
      generateExplanation: true,
      explanationComplexity: "technical",
    });
  }

  /**
   * Query provenance records
   */
  async queryProvenance(query: ProvenanceQuery): Promise<ProvenanceRecord[]> {
    const client = await this.pool.connect();

    try {
      let sql = `
        SELECT 
          id, session_id, user_id, timestamp, operation, input_data, 
          output_data, processing_steps, data_lineage, quality_metrics, 
          audit_trail, metadata
        FROM provenance_records
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (query.sessionId) {
        sql += ` AND session_id = $${paramIndex}`;
        params.push(query.sessionId);
        paramIndex++;
      }

      if (query.userId) {
        sql += ` AND user_id = $${paramIndex}`;
        params.push(query.userId);
        paramIndex++;
      }

      if (query.operationType) {
        sql += ` AND operation->>'type' = $${paramIndex}`;
        params.push(query.operationType);
        paramIndex++;
      }

      if (query.timeRange) {
        sql += ` AND timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(query.timeRange.start, query.timeRange.end);
        paramIndex += 2;
      }

      if (query.minConfidence) {
        sql += ` AND (output_data->>'confidence')::float >= $${paramIndex}`;
        params.push(query.minConfidence);
        paramIndex++;
      }

      sql += ` ORDER BY timestamp DESC LIMIT 100`;

      const result = await client.query(sql, params);

      return result.rows.map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        timestamp: row.timestamp,
        operation: row.operation,
        inputData: row.input_data,
        outputData: row.output_data,
        processingSteps: row.processing_steps,
        dataLineage: row.data_lineage,
        qualityMetrics: row.quality_metrics,
        auditTrail: row.audit_trail,
        metadata: row.metadata,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Generate explanation for a provenance record
   */
  async generateExplanation(
    provenance: ProvenanceRecord,
    complexity: "simple" | "detailed" | "technical" = "detailed"
  ): Promise<GeneratedExplanation> {
    const templateId = this.selectExplanationTemplate(
      provenance.operation.type,
      complexity
    );
    const template = this.explanationTemplates.get(templateId);

    if (!template) {
      throw new Error(`Explanation template not found: ${templateId}`);
    }

    const sections = await this.generateExplanationSections(
      provenance,
      template,
      complexity
    );

    const explanation: GeneratedExplanation = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      provenanceId: provenance.id,
      templateId,
      language: "en",
      complexity,
      title: this.generateExplanationTitle(provenance),
      summary: this.generateExplanationSummary(provenance, complexity),
      sections,
      visualizations: this.generateVisualizations(provenance),
      interactiveElements: this.generateInteractiveElements(provenance),
      generatedAt: new Date(),
      confidence: this.calculateExplanationConfidence(provenance, sections),
    };

    return explanation;
  }

  /**
   * Get execution context information
   */
  private async getExecutionContext(): Promise<ExecutionContext> {
    return {
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      nodeVersion: process.version,
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
      },
      resourceUsage: {
        cpuTime: process.cpuUsage().user + process.cpuUsage().system,
        memoryUsage: process.memoryUsage().heapUsed,
        diskIO: 0, // Would need system monitoring
        networkIO: 0, // Would need system monitoring
        databaseQueries: 0, // Would be tracked separately
      },
    };
  }

  /**
   * Build data lineage for input data
   */
  private async buildDataLineage(
    input: ProvenanceInput,
    client: PoolClient
  ): Promise<DataLineage[]> {
    const lineage: DataLineage[] = [];

    // Trace source files
    if (input.sourceFiles) {
      for (const sourceFile of input.sourceFiles) {
        const fileLineage = await this.traceFileLineage(sourceFile, client);
        lineage.push(...fileLineage);
      }
    }

    // Trace entities
    if (input.entities) {
      for (const entityId of input.entities) {
        const entityLineage = await this.traceEntityLineage(entityId, client);
        lineage.push(...entityLineage);
      }
    }

    return lineage;
  }

  /**
   * Trace lineage for a specific file
   */
  private async traceFileLineage(
    sourceFile: string,
    client: PoolClient
  ): Promise<DataLineage[]> {
    const query = `
      SELECT 
        c.id, c.source_file, c.meta, c.created_at,
        c.content_hash, c.extraction_method
      FROM obsidian_chunks c
      WHERE c.source_file = $1
    `;

    const result = await client.query(query, [sourceFile]);

    return result.rows.map((row) => ({
      sourceId: row.id,
      sourceType: "chunk" as const,
      sourcePath: row.source_file,
      sourceHash: row.content_hash || "",
      extractionMethod: row.extraction_method || "unknown",
      extractionTimestamp: row.created_at,
      transformationChain: [],
      qualityScore: 0.8, // Would be calculated based on various factors
      validationStatus: "unvalidated" as const,
    }));
  }

  /**
   * Trace lineage for a specific entity
   */
  private async traceEntityLineage(
    entityId: string,
    client: PoolClient
  ): Promise<DataLineage[]> {
    const query = `
      SELECT 
        e.id, e.name, e.source_files, e.extraction_methods,
        e.first_seen, e.confidence
      FROM kg_nodes e
      WHERE e.id = $1
    `;

    const result = await client.query(query, [entityId]);

    if (result.rows.length === 0) return [];

    const row = result.rows[0];
    return [
      {
        sourceId: row.id,
        sourceType: "entity" as const,
        sourcePath: row.source_files?.[0] || "unknown",
        sourceHash: "",
        extractionMethod: row.extraction_methods?.[0] || "unknown",
        extractionTimestamp: row.first_seen,
        transformationChain: ["entity_extraction", "deduplication"],
        qualityScore: row.confidence,
        validationStatus: "unvalidated" as const,
      },
    ];
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(
    input: ProvenanceInput,
    output: ProvenanceOutput,
    processingSteps: ProcessingStep[],
    dataLineage: DataLineage[]
  ): QualityMetrics {
    // Calculate completeness based on successful processing steps
    const completeness =
      processingSteps.filter((step) => step.success).length /
      Math.max(processingSteps.length, 1);

    // Estimate accuracy based on confidence scores
    const accuracy = output.confidence;

    // Calculate consistency based on result variance
    const consistency = this.calculateConsistency(output.results);

    // Calculate freshness based on data age
    const freshness = this.calculateFreshness(dataLineage);

    // Calculate relevance based on result scores
    const relevance =
      output.results.length > 0
        ? output.results.reduce((sum, r) => sum + r.score, 0) /
          output.results.length
        : 0;

    // Calculate coverage based on result diversity
    const coverage = this.calculateCoverage(output.results);

    // Calculate reliability based on source quality
    const reliability = this.calculateReliability(dataLineage);

    return {
      completeness,
      accuracy,
      consistency,
      freshness,
      relevance,
      coverage,
      reliability,
    };
  }

  /**
   * Generate audit trail
   */
  private generateAuditTrail(
    operation: ProvenanceOperation,
    input: ProvenanceInput,
    output: ProvenanceOutput,
    userId?: string
  ): AuditEvent[] {
    const events: AuditEvent[] = [];

    // Operation start event
    events.push({
      eventId: `audit_${Date.now()}_start`,
      eventType: "access",
      timestamp: new Date(),
      actor: userId || "system",
      action: `${operation.type}_start`,
      target: operation.type,
      details: {
        operationType: operation.type,
        subtype: operation.subtype,
        inputSize: JSON.stringify(input).length,
      },
      severity: "low",
    });

    // Operation completion event
    events.push({
      eventId: `audit_${Date.now()}_complete`,
      eventType: "access",
      timestamp: new Date(),
      actor: userId || "system",
      action: `${operation.type}_complete`,
      target: operation.type,
      details: {
        resultCount: output.results.length,
        confidence: output.confidence,
        hasErrors: (output.errors?.length || 0) > 0,
      },
      severity: output.errors?.length ? "medium" : "low",
    });

    return events;
  }

  /**
   * Store provenance record in database
   */
  private async storeProvenanceRecord(
    record: ProvenanceRecord,
    client: PoolClient
  ): Promise<void> {
    const query = `
      INSERT INTO provenance_records (
        id, session_id, user_id, timestamp, operation, input_data,
        output_data, processing_steps, data_lineage, quality_metrics,
        audit_trail, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      record.id,
      record.sessionId,
      record.userId,
      record.timestamp,
      JSON.stringify(record.operation),
      JSON.stringify(record.inputData),
      JSON.stringify(record.outputData),
      JSON.stringify(record.processingSteps),
      JSON.stringify(record.dataLineage),
      JSON.stringify(record.qualityMetrics),
      JSON.stringify(record.auditTrail),
      JSON.stringify(record.metadata),
    ];

    await client.query(query, values);
  }

  /**
   * Store explanation in database
   */
  private async storeExplanation(
    explanation: GeneratedExplanation,
    client: PoolClient
  ): Promise<void> {
    const query = `
      INSERT INTO explanations (
        id, provenance_id, template_id, language, complexity,
        title, summary, sections, visualizations, interactive_elements,
        generated_at, confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      explanation.id,
      explanation.provenanceId,
      explanation.templateId,
      explanation.language,
      explanation.complexity,
      explanation.title,
      explanation.summary,
      JSON.stringify(explanation.sections),
      JSON.stringify(explanation.visualizations),
      JSON.stringify(explanation.interactiveElements),
      explanation.generatedAt,
      explanation.confidence,
    ];

    await client.query(query, values);
  }

  /**
   * Initialize explanation templates
   */
  private initializeExplanationTemplates(): void {
    // Search explanation template
    this.explanationTemplates.set("search_detailed", {
      id: "search_detailed",
      name: "Detailed Search Explanation",
      description: "Comprehensive explanation of search results and methodology",
      template: `
# Search Results Explanation

## Query Analysis
Your search for "{{query}}" was processed using our hybrid search system.

## Search Strategy
We used {{searchStrategy}} search, which combines:
- **Vector Similarity**: Finding semantically similar content
- **Graph Traversal**: Exploring entity relationships
- **Result Ranking**: Scoring based on multiple factors

## Results Overview
Found {{resultCount}} results in {{executionTime}}ms with {{confidence}} confidence.

## Top Results Analysis
{{#each topResults}}
### Result {{@index}}: {{title}}
- **Relevance Score**: {{score}}
- **Source**: {{source}}
- **Key Entities**: {{entities}}
- **Why this result**: {{explanation}}
{{/each}}

## Data Sources
Results were derived from {{sourceCount}} sources with quality score {{qualityScore}}.
      `,
      variables: [
        "query",
        "searchStrategy",
        "resultCount",
        "executionTime",
        "confidence",
        "topResults",
        "sourceCount",
        "qualityScore",
      ],
      applicableOperations: ["search"],
      language: "en",
      complexity: "detailed",
    });

    // Reasoning explanation template
    this.explanationTemplates.set("reasoning_technical", {
      id: "reasoning_technical",
      name: "Technical Reasoning Explanation",
      description: "Technical explanation of reasoning process and logical steps",
      template: `
# Reasoning Analysis Report

## Reasoning Query
**Question**: {{question}}
**Starting Entities**: {{startEntities}}
**Reasoning Type**: {{reasoningType}}

## Logical Process
{{#each reasoningSteps}}
### Step {{step}}: {{description}}
- **Confidence**: {{confidence}}
- **Rule Applied**: {{logicalRule}}
- **Evidence**: {{evidence}}
{{/each}}

## Best Reasoning Path
{{#if bestPath}}
**Path Confidence**: {{bestPath.confidence}}
**Reasoning Chain**: {{bestPath.explanation}}

### Entities in Path
{{#each bestPath.entities}}
- {{name}} ({{type}}, confidence: {{confidence}})
{{/each}}

### Relationships Traversed
{{#each bestPath.relationships}}
- {{sourceEntity}} --[{{type}}]--> {{targetEntity}} (strength: {{strength}})
{{/each}}
{{/if}}

## Quality Assessment
- **Path Count**: {{pathCount}}
- **Average Confidence**: {{averageConfidence}}
- **Data Quality**: {{dataQuality}}
      `,
      variables: [
        "question",
        "startEntities",
        "reasoningType",
        "reasoningSteps",
        "bestPath",
        "pathCount",
        "averageConfidence",
        "dataQuality",
      ],
      applicableOperations: ["reasoning"],
      language: "en",
      complexity: "technical",
    });
  }

  /**
   * Helper methods for explanation generation
   */
  private selectExplanationTemplate(
    operationType: string,
    complexity: string
  ): string {
    return `${operationType}_${complexity}`;
  }

  private generateExplanationTitle(provenance: ProvenanceRecord): string {
    const operation = provenance.operation;
    switch (operation.type) {
      case "search":
        return `Search Results for "${provenance.inputData.query}"`;
      case "reasoning":
        return `Reasoning Analysis: ${provenance.inputData.query}`;
      default:
        return `${operation.type} Operation Results`;
    }
  }

  private generateExplanationSummary(
    provenance: ProvenanceRecord,
    complexity: string
  ): string {
    const resultCount = provenance.outputData.results.length;
    const confidence = provenance.outputData.confidence;
    const operation = provenance.operation.type;

    if (complexity === "simple") {
      return `Found ${resultCount} results with ${(confidence * 100).toFixed(0)}% confidence using ${operation} analysis.`;
    } else {
      return `Executed ${operation} operation resulting in ${resultCount} results with ${(confidence * 100).toFixed(1)}% confidence. Processing involved ${provenance.processingSteps.length} steps and analyzed ${provenance.dataLineage.length} data sources.`;
    }
  }

  private async generateExplanationSections(
    provenance: ProvenanceRecord,
    template: ExplanationTemplate,
    complexity: string
  ): Promise<ExplanationSection[]> {
    // This would generate sections based on the template and provenance data
    // For now, return basic sections
    return [
      {
        id: "overview",
        title: "Overview",
        content: this.generateExplanationSummary(provenance, complexity),
        type: "text",
        importance: 1.0,
        evidence: [],
        relatedSections: [],
      },
      {
        id: "methodology",
        title: "Methodology",
        content: `Used ${provenance.operation.type} with ${provenance.operation.subtype} approach.`,
        type: "text",
        importance: 0.8,
        evidence: [],
        relatedSections: [],
      },
    ];
  }

  private generateVisualizations(
    provenance: ProvenanceRecord
  ): VisualizationSpec[] {
    // Generate appropriate visualizations based on operation type
    return [];
  }

  private generateInteractiveElements(
    provenance: ProvenanceRecord
  ): InteractiveElement[] {
    // Generate interactive elements for exploration
    return [];
  }

  private calculateExplanationConfidence(
    provenance: ProvenanceRecord,
    sections: ExplanationSection[]
  ): number {
    // Calculate confidence based on data quality and completeness
    return Math.min(
      provenance.qualityMetrics.completeness * 0.4 +
        provenance.qualityMetrics.accuracy * 0.4 +
        provenance.qualityMetrics.reliability * 0.2,
      1.0
    );
  }

  /**
   * Utility methods
   */
  private hashInput(input: ProvenanceInput): string {
    return Buffer.from(JSON.stringify(input)).toString("base64").substring(0, 16);
  }

  private hashOutput(output: ProvenanceOutput): string {
    return Buffer.from(JSON.stringify(output)).toString("base64").substring(0, 16);
  }

  private calculateConsistency(results: ProvenanceResult[]): number {
    if (results.length < 2) return 1.0;
    
    const scores = results.map((r) => r.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - variance);
  }

  private calculateFreshness(lineage: DataLineage[]): number {
    if (lineage.length === 0) return 0.5;
    
    const now = Date.now();
    const avgAge = lineage.reduce((sum, item) => {
      const age = now - item.extractionTimestamp.getTime();
      return sum + age;
    }, 0) / lineage.length;
    
    // Convert to days and apply exponential decay
    const ageInDays = avgAge / (1000 * 60 * 60 * 24);
    return Math.exp(-ageInDays / 30); // 30-day half-life
  }

  private calculateCoverage(results: ProvenanceResult[]): number {
    // Simple coverage based on result diversity
    const uniqueSources = new Set(results.flatMap((r) => r.sources.map((s) => s.id)));
    return Math.min(uniqueSources.size / 10, 1.0); // Normalize to 10 sources
  }

  private calculateReliability(lineage: DataLineage[]): number {
    if (lineage.length === 0) return 0.5;
    
    return lineage.reduce((sum, item) => sum + item.qualityScore, 0) / lineage.length;
  }
}
