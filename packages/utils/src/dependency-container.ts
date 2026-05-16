/**
 * Dependency Injection Container
 *
 * Provides centralized dependency management for services.
 * Enables loose coupling and easier testing.
 */

export interface ServiceFactory<T> {
  (): T;
}

export interface AsyncServiceFactory<T> {
  (): Promise<T>;
}

/**
 * Lightweight dependency injection container
 */
export class DependencyContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, ServiceFactory<any>>();
  private asyncFactories = new Map<string, AsyncServiceFactory<any>>();
  private resolved = new Set<string>();

  /**
   * Register a service instance directly
   */
  register<T>(token: string, service: T): void {
    this.services.set(token, service);
    this.resolved.add(token);
  }

  /**
   * Register a synchronous factory function
   */
  registerFactory<T>(token: string, factory: ServiceFactory<T>): void {
    this.factories.set(token, factory);
  }

  /**
   * Register an asynchronous factory function
   */
  registerAsyncFactory<T>(
    token: string,
    factory: AsyncServiceFactory<T>
  ): void {
    this.asyncFactories.set(token, factory);
  }

  /**
   * Get a service instance, creating it if necessary
   */
  get<T>(token: string): T {
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    if (this.factories.has(token)) {
      const service = this.factories.get(token)!();
      this.services.set(token, service);
      this.resolved.add(token);
      return service;
    }

    throw new Error(`Service not found: ${token}`);
  }

  /**
   * Get a service instance asynchronously, creating it if necessary
   */
  async getAsync<T>(token: string): Promise<T> {
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    if (this.asyncFactories.has(token)) {
      const service = await this.asyncFactories.get(token)!();
      this.services.set(token, service);
      this.resolved.add(token);
      return service;
    }

    if (this.factories.has(token)) {
      const service = this.factories.get(token)!();
      this.services.set(token, service);
      this.resolved.add(token);
      return service;
    }

    throw new Error(`Service not found: ${token}`);
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return (
      this.services.has(token) ||
      this.factories.has(token) ||
      this.asyncFactories.has(token)
    );
  }

  /**
   * Check if a service has been resolved
   */
  isResolved(token: string): boolean {
    return this.resolved.has(token);
  }

  /**
   * Clear all services and factories
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.asyncFactories.clear();
    this.resolved.clear();
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): string[] {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.factories.keys()),
      ...Array.from(this.asyncFactories.keys()),
    ].filter((value, index, array) => array.indexOf(value) === index);
  }
}

/**
 * Global container instance
 */
export const container = new DependencyContainer();

/**
 * Service tokens for common services
 */
export const SERVICE_TOKENS = {
  DATABASE: "database",
  EMBEDDING_SERVICE: "embeddingService",
  HYBRID_SEARCH_ENGINE: "hybridSearchEngine",
  MULTI_HOP_REASONING_ENGINE: "multiHopReasoningEngine",
  RESULT_RANKING_ENGINE: "resultRankingEngine",
  KNOWLEDGE_GRAPH: "knowledgeGraph",
  PROVENANCE_TRACKER: "provenanceTracker",
  QUERY_OPTIMIZER: "queryOptimizer",
  MONITORING_SYSTEM: "monitoringSystem",
  GRAPH_RAG_API_SERVER: "graphRagApiServer",
  CONFIG: "config",
  LOGGER: "logger",
} as const;
