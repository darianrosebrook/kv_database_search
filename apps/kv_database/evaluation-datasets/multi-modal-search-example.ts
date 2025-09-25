/**
 * Multi-Modal Search Integration Example
 *
 * This example demonstrates how to integrate the multi-modal search
 * capabilities into your application for enhanced content understanding.
 */

import { SearchService } from "../src/lib/search.ts";
import { Database } from "../src/lib/database.ts";
import { EmbeddingService } from "../src/lib/embeddings.ts";
import { KnowledgeGraphService } from "../src/lib/knowledge-graph.ts";
import { ContentType, ProgrammingLanguage } from "../src/lib/multi-modal.ts";

async function multiModalSearchExample() {
  console.log("🎨 Multi-Modal Search Integration Example\n");

  // Initialize core services
  const database = new Database();
  await database.initialize();

  const embeddings = new EmbeddingService();

  // Optional: Initialize knowledge graph for enhanced capabilities
  const knowledgeGraph = new KnowledgeGraphService();

  // Initialize search service with multi-modal support
  const searchService = new SearchService(database, embeddings, knowledgeGraph);

  // Example 1: Basic multi-modal search
  console.log("📊 Example 1: Basic Multi-Modal Search");
  const basicResults = await searchService.search("button component", {
    multiModal: true,
    limit: 5,
  });

  console.log(
    `Found ${basicResults.results.length} results with multi-modal enhancement`
  );

  // Example 2: Code-focused search
  console.log("\n💻 Example 2: Code-Focused Search");
  const codeResults = await searchService.search("React component with hooks", {
    multiModal: true,
    preferredContentTypes: [ContentType.CODE, ContentType.TEXT],
    programmingLanguages: [
      ProgrammingLanguage.JAVASCRIPT,
      ProgrammingLanguage.TYPESCRIPT,
    ],
    technicalLevel: "intermediate",
    minReadabilityScore: 0.6,
    limit: 3,
  });

  codeResults.results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.meta.section || "Code Snippet"}`);
    console.log(`   Score: ${(result.cosineSimilarity * 100).toFixed(1)}%`);

    // Access multi-modal metadata
    const metadata = (result as any).metadata;
    if (metadata) {
      if (metadata.language) {
        console.log(`   Language: ${metadata.language}`);
      }
      if (metadata.codeMetadata) {
        console.log(
          `   Complexity: ${metadata.codeMetadata.complexity.toFixed(1)}`
        );
        console.log(`   Has Tests: ${metadata.codeMetadata.hasTests}`);
      }
    }
  });

  // Example 3: Design-focused search
  console.log("\n🎨 Example 3: Design-Focused Search");
  const designResults = await searchService.search("responsive form layout", {
    multiModal: true,
    includeImages: true,
    technicalLevel: "beginner",
    limit: 3,
  });

  // Example 4: Advanced filtering
  console.log("\n🔧 Example 4: Advanced Filtering");
  const filteredResults = await searchService.search("API authentication", {
    multiModal: true,
    preferredContentTypes: [ContentType.CODE],
    programmingLanguages: [
      ProgrammingLanguage.PYTHON,
      ProgrammingLanguage.NODE,
    ],
    minReadabilityScore: 0.7,
    technicalLevel: "advanced",
    limit: 5,
  });

  console.log(`\n✅ Multi-modal search examples completed!`);

  await database.close();
}

// API-style usage for web applications
export class MultiModalSearchAPI {
  private searchService: SearchService;

  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }

  async searchCode(query: string, language?: ProgrammingLanguage) {
    return await this.searchService.search(query, {
      multiModal: true,
      preferredContentTypes: [ContentType.CODE],
      programmingLanguages: language ? [language] : undefined,
      includeCode: true,
      minReadabilityScore: 0.5,
    });
  }

  async searchDocumentation(
    query: string,
    technicalLevel?: "beginner" | "intermediate" | "advanced"
  ) {
    return await this.searchService.search(query, {
      multiModal: true,
      preferredContentTypes: [ContentType.TEXT, ContentType.DOCUMENT],
      technicalLevel,
      minReadabilityScore: 0.6,
    });
  }

  async searchUIComponents(query: string) {
    return await this.searchService.search(query, {
      multiModal: true,
      preferredContentTypes: [ContentType.CODE, ContentType.IMAGE],
      includeCode: true,
      includeImages: true,
      programmingLanguages: [
        ProgrammingLanguage.JAVASCRIPT,
        ProgrammingLanguage.TYPESCRIPT,
        ProgrammingLanguage.HTML,
        ProgrammingLanguage.CSS,
      ],
    });
  }

  async searchByExpertise(
    query: string,
    expertise: "beginner" | "intermediate" | "advanced"
  ) {
    return await this.searchService.search(query, {
      multiModal: true,
      technicalLevel: expertise,
      minReadabilityScore: expertise === "beginner" ? 0.7 : 0.5,
    });
  }
}

// Configuration examples
export const MultiModalSearchConfigs = {
  // For developer documentation search
  developerSearch: {
    multiModal: true,
    preferredContentTypes: [ContentType.CODE, ContentType.TEXT],
    programmingLanguages: [
      ProgrammingLanguage.JAVASCRIPT,
      ProgrammingLanguage.TYPESCRIPT,
      ProgrammingLanguage.PYTHON,
    ],
    technicalLevel: "intermediate",
    minReadabilityScore: 0.6,
  },

  // For design system search
  designSearch: {
    multiModal: true,
    preferredContentTypes: [
      ContentType.TEXT,
      ContentType.IMAGE,
      ContentType.DOCUMENT,
    ],
    includeImages: true,
    technicalLevel: "beginner",
    minReadabilityScore: 0.7,
  },

  // For API documentation search
  apiSearch: {
    multiModal: true,
    preferredContentTypes: [ContentType.CODE, ContentType.TEXT],
    programmingLanguages: [
      ProgrammingLanguage.JAVASCRIPT,
      ProgrammingLanguage.PYTHON,
      ProgrammingLanguage.CSHARP,
    ],
    technicalLevel: "intermediate",
    minReadabilityScore: 0.6,
  },

  // For comprehensive search (all modalities)
  comprehensiveSearch: {
    multiModal: true,
    preferredContentTypes: [
      ContentType.CODE,
      ContentType.TEXT,
      ContentType.IMAGE,
      ContentType.TABLE,
    ],
    includeCode: true,
    includeImages: true,
    minReadabilityScore: 0.5,
  },
};

// Error handling example
export class RobustMultiModalSearch {
  private searchService: SearchService;

  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }

  async searchWithFallback(query: string, options: any = {}) {
    try {
      // Try multi-modal search first
      return await this.searchService.search(query, {
        multiModal: true,
        ...options,
      });
    } catch (error) {
      console.warn(
        "Multi-modal search failed, falling back to standard search:",
        error
      );

      // Fallback to standard search
      return await this.searchService.search(query, {
        multiModal: false,
        ...options,
      });
    }
  }

  async searchWithRetry(
    query: string,
    options: any = {},
    maxRetries: number = 2
  ) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.searchService.search(query, {
          multiModal: true,
          ...options,
        });
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Multi-modal search attempt ${attempt + 1} failed:`,
          error
        );

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw new Error(
      `Multi-modal search failed after ${maxRetries + 1} attempts: ${
        lastError?.message
      }`
    );
  }
}

// Performance monitoring example
export class MonitoredMultiModalSearch {
  private searchService: SearchService;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }

  async searchWithMonitoring(query: string, options: any = {}) {
    const startTime = Date.now();

    try {
      const results = await this.searchService.search(query, {
        multiModal: true,
        ...options,
      });

      const latency = Date.now() - startTime;

      // Record performance metrics
      this.recordMetric("search_latency", latency);
      this.recordMetric("results_count", results.results.length);

      // Analyze result quality
      const avgScore =
        results.results.reduce((sum, r) => sum + r.cosineSimilarity, 0) /
        results.results.length;
      this.recordMetric("average_score", avgScore);

      console.log(
        `🔍 Search completed in ${latency}ms with ${
          results.results.length
        } results (avg score: ${(avgScore * 100).toFixed(1)}%)`
      );

      return results;
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`❌ Search failed after ${latency}ms:`, error);
      throw error;
    }
  }

  private recordMetric(name: string, value: number) {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    this.performanceMetrics.get(name)!.push(value);

    // Keep only last 100 measurements
    if (this.performanceMetrics.get(name)!.length > 100) {
      this.performanceMetrics.get(name)!.shift();
    }
  }

  getPerformanceStats() {
    const stats: Record<
      string,
      { avg: number; min: number; max: number; count: number }
    > = {};

    for (const [name, values] of this.performanceMetrics) {
      if (values.length === 0) continue;

      stats[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return stats;
  }
}

// Usage examples
async function runExamples() {
  // Basic usage
  await multiModalSearchExample();

  // API-style usage
  const api = new MultiModalSearchAPI(searchService);

  // Search for React components
  const reactResults = await api.searchCode(
    "useState hook",
    ProgrammingLanguage.TYPESCRIPT
  );

  // Search for beginner-friendly documentation
  const beginnerDocs = await api.searchDocumentation(
    "getting started",
    "beginner"
  );

  // Search for UI components
  const uiComponents = await api.searchUIComponents("button variants");

  // Robust search with fallback
  const robustSearch = new RobustMultiModalSearch(searchService);
  const results = await robustSearch.searchWithFallback("complex query");

  // Monitored search
  const monitoredSearch = new MonitoredMultiModalSearch(searchService);
  const monitoredResults = await monitoredSearch.searchWithMonitoring(
    "test query"
  );
  const stats = monitoredSearch.getPerformanceStats();
}

// Export for use in applications
export {
  multiModalSearchExample,
  MultiModalSearchAPI,
  MultiModalSearchConfigs,
  RobustMultiModalSearch,
  MonitoredMultiModalSearch,
  runExamples,
};

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
