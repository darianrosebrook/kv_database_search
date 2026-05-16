/**
 * Main Server Entry Point
 *
 * Orchestrates all server components: routes, services, and startup.
 *
 * TODO: Survey vector database performance optimization techniques
 * TODO: Review multi-modal retrieval system architectures
 * TODO: Study entity extraction and linking at scale
 *
 * Current system architecture could benefit from research into advanced
 * optimization techniques and architectural patterns:
 *
 * Potential improvements for vector database optimization:
 * - Research HNSW algorithm variants and optimizations
 * - Study IVF (Inverted File) indexing techniques
 * - Implement disk-based vector storage strategies
 * - Add vector compression and quantization research
 * - Create benchmark comparisons across vector databases
 *
 * Potential improvements for multi-modal retrieval:
 * - Study late fusion vs early fusion architectures
 * - Research cross-modal attention mechanisms
 * - Implement multi-modal embedding alignment
 * - Add modality-specific retrieval strategies
 * - Create unified vs separate index architectures
 *
 * Potential improvements for entity extraction at scale:
 * - Research distributed entity extraction pipelines
 * - Study incremental entity linking algorithms
 * - Implement entity resolution for large knowledge graphs
 * - Add entity clustering for scalability
 * - Create streaming entity extraction for real-time processing
 *
 * TODO: Analyze similar multi-modal RAG implementations
 * TODO: Review content extraction libraries and their performance
 * TODO: Study graph-enhanced vector search systems
 *
 * Current implementation could benefit from analysis of existing solutions:
 *
 * Potential improvements for multi-modal RAG analysis:
 * - Study LangChain, LlamaIndex, and other RAG frameworks
 * - Analyze open-source multi-modal search systems
 * - Research academic multi-modal retrieval papers
 * - Implement best practices from production systems
 * - Create comparative analysis tools for different approaches
 *
 * Potential improvements for content extraction libraries:
 * - Evaluate Apache Tika, Poppler, and other extraction tools
 * - Research performance characteristics of different libraries
 * - Implement hybrid extraction strategies combining multiple tools
 * - Add library selection based on content type and performance needs
 * - Create benchmarking framework for extraction accuracy/speed
 *
 * Potential improvements for graph-enhanced vector search:
 * - Study GraphRAG and other graph-enhanced approaches
 * - Research hybrid vector-graph retrieval strategies
 * - Implement graph traversal optimizations for search
 * - Add graph-based result reranking algorithms
 * - Create knowledge graph construction from search results
 *
 * TODO: Compare performance across different vector databases
 * TODO: Evaluate OCR and speech recognition service benchmarks
 * TODO: Review multi-modal search system performance studies
 *
 * Current system lacks comprehensive performance benchmarking:
 *
 * Potential improvements for vector database comparisons:
 * - Implement standardized benchmarking suite for vector databases
 * - Create performance comparisons across different scales
 * - Add memory usage and disk I/O benchmarking
 * - Implement accuracy vs performance trade-off analysis
 * - Create cost-benefit analysis for different database choices
 *
 * Potential improvements for OCR and speech benchmarks:
 * - Create comprehensive accuracy benchmarking for OCR engines
 * - Implement speech recognition accuracy testing across domains
 * - Add performance benchmarking for different service tiers
 * - Create cost-accuracy analysis for cloud services
 * - Implement offline vs online service comparisons
 *
 * Potential improvements for multi-modal performance studies:
 * - Research end-to-end multi-modal search performance
 * - Study content type processing time distributions
 * - Implement multi-modal result fusion optimization
 * - Add performance profiling for different query types
 * - Create system-level performance optimization studies
 */

import { createServer, initializeServer, startServer } from "./bootstrap.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerIngestionRoutes } from "./routes/ingestion.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerDictionaryRoutes } from "./routes/dictionary.js";
import { registerWorkspaceRoutes } from "./routes/workspace.js";

/**
 * Initialize and start the complete server
 */
export async function startMainServer(): Promise<void> {
  try {
    // Create Fastify server instance
    const server = await createServer();

    // Initialize services
    await initializeServer(server);

    // Register all route modules
    registerHealthRoutes(server);
    registerSearchRoutes(server);
    registerIngestionRoutes(server);
    registerFileRoutes(server);

    // Register dictionary routes
    registerDictionaryRoutes(server);

    // Register workspace routes
    registerWorkspaceRoutes(server);

    // TODO: Register additional route modules as they are extracted:
    // registerChatRoutes(server);
    // registerWebSearchRoutes(server);
    // registerGraphRoutes(server);
    // registerFederatedSearchRoutes(server);
    // registerTemporalRoutes(server);
    // registerMLRoutes(server);

    // Start the server
    await startServer(server);
  } catch (error) {
    console.error("❌ Failed to start main server:", error);
    process.exit(1);
  }
}

// Start the server if this file is run directly (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  startMainServer().catch(console.error);
}
