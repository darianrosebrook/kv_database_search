// Enhanced chat service with Graph RAG integration
import {
  graphRagApiService,
  type GraphRagSearchResult,
  type GraphRagEntity,
  type ReasoningResult,
} from "./graph-rag-api";

export interface GraphRagChatOptions {
  pastedContent?: string;
  queryType?:
    | "component"
    | "pattern"
    | "token"
    | "general"
    | "reasoning"
    | "exploration";
  autoSearch?: boolean;
  context?: Array<{ role: string; content: string }>;
  model?: string;
  sessionId?: string;
  userId?: string;
  enableReasoning?: boolean;
  maxReasoningDepth?: number;
  includeProvenance?: boolean;
}

export interface GraphRagChatResponse {
  response: string;
  context: Array<{ role: string; content: string }>;
  searchResults?: GraphRagSearchResult[];
  reasoningResults?: ReasoningResult;
  entities?: GraphRagEntity[];
  suggestedActions?: Array<{
    type:
      | "refine_search"
      | "new_search"
      | "filter"
      | "explore"
      | "reason"
      | "find_similar";
    label: string;
    query?: string;
    entityIds?: string[];
    filters?: any;
    reasoning?: {
      question: string;
      type: "exploratory" | "targeted" | "comparative" | "causal";
    };
  }>;
  explanation?: {
    searchStrategy: string;
    reasoningApplied: boolean;
    entitiesIdentified: number;
    relationshipsTraversed: number;
    confidenceScore: number;
  };
  provenance?: {
    operationId: string;
    qualityMetrics: Record<string, number>;
    dataLineage: string[];
  };
}

export class GraphRagChatService {
  private static readonly CHAT_API_URL = "http://localhost:11434/api/chat";
  private static readonly sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;

  /**
   * Enhanced chat with Graph RAG integration
   */
  static async chat(
    message: string,
    options: GraphRagChatOptions = {}
  ): Promise<GraphRagChatResponse> {
    try {
      // Analyze the message to determine if we need Graph RAG capabilities
      const messageAnalysis = this.analyzeMessage(message);

      let searchResults: GraphRagSearchResult[] = [];
      let reasoningResults: ReasoningResult | undefined;
      let entities: GraphRagEntity[] = [];
      let explanation: GraphRagChatResponse["explanation"];

      // Perform Graph RAG search if needed
      if (options.autoSearch || messageAnalysis.needsSearch) {
        console.log("🔍 Performing Graph RAG search...");

        const searchResponse = await graphRagApiService.search(message, {
          maxResults: 10,
          includeExplanation: true,
          strategy: messageAnalysis.searchStrategy,
          enableRanking: true,
          enableProvenance: options.includeProvenance,
          filters: messageAnalysis.suggestedFilters,
        });

        searchResults = searchResponse.results;
        entities = searchResults.flatMap((r) => r.entities);

        explanation = {
          searchStrategy:
            searchResponse.explanation?.searchStrategy || "hybrid",
          reasoningApplied: false,
          entitiesIdentified: entities.length,
          relationshipsTraversed: searchResponse.metrics.relationshipsTraversed,
          confidenceScore:
            searchResponse.explanation?.qualityMetrics.accuracy || 0.8,
        };
      }

      // Perform reasoning if requested or if entities suggest it would be valuable
      if (options.enableReasoning || messageAnalysis.needsReasoning) {
        if (entities.length >= 2) {
          console.log("🧠 Performing multi-hop reasoning...");

          const topEntities = entities
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3)
            .map((e) => e.id);

          reasoningResults = await graphRagApiService.reason(
            topEntities,
            messageAnalysis.reasoningQuestion || message,
            {
              maxDepth: options.maxReasoningDepth || 3,
              reasoningType: messageAnalysis.reasoningType,
              enableExplanation: true,
              enableProvenance: options.includeProvenance,
            }
          );

          if (explanation) {
            explanation.reasoningApplied = true;
          }
        }
      }

      // Build enhanced context for the LLM
      const enhancedContext = this.buildEnhancedContext(
        message,
        searchResults,
        reasoningResults,
        options.context || []
      );

      // Generate response using LLM with enhanced context
      const llmResponse = await this.generateLLMResponse(
        message,
        enhancedContext,
        options.model || "llama3.1"
      );

      // Generate suggested actions based on results
      const suggestedActions = this.generateSuggestedActions(
        message,
        searchResults,
        reasoningResults,
        entities
      );

      return {
        response: llmResponse.content,
        context: enhancedContext,
        searchResults: searchResults.length > 0 ? searchResults : undefined,
        reasoningResults,
        entities: entities.length > 0 ? entities : undefined,
        suggestedActions,
        explanation,
      };
    } catch (error) {
      console.error("Graph RAG chat error:", error);

      // Fallback to basic response
      return {
        response: `I apologize, but I encountered an error while processing your request: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try rephrasing your question or try again.`,
        context: options.context || [],
        suggestedActions: [
          {
            type: "new_search",
            label: "Try a different search",
            query: message,
          },
        ],
      };
    }
  }

  /**
   * Analyze message to determine Graph RAG strategy
   */
  private static analyzeMessage(message: string): {
    needsSearch: boolean;
    needsReasoning: boolean;
    searchStrategy: "vector_only" | "graph_only" | "hybrid" | "adaptive";
    reasoningType: "exploratory" | "targeted" | "comparative" | "causal";
    reasoningQuestion?: string;
    suggestedFilters?: any;
  } {
    const lowerMessage = message.toLowerCase();

    // Keywords that suggest different approaches
    const searchKeywords = [
      "find",
      "search",
      "show",
      "what is",
      "explain",
      "describe",
    ];
    const reasoningKeywords = [
      "how",
      "why",
      "relationship",
      "connect",
      "compare",
      "cause",
      "effect",
      "related",
    ];
    const exploratoryKeywords = [
      "explore",
      "discover",
      "overview",
      "understand",
      "learn about",
    ];
    const comparativeKeywords = [
      "compare",
      "difference",
      "versus",
      "vs",
      "similar",
      "different",
    ];
    const causalKeywords = [
      "cause",
      "effect",
      "because",
      "reason",
      "why",
      "lead to",
      "result",
    ];

    const needsSearch =
      searchKeywords.some((keyword) => lowerMessage.includes(keyword)) ||
      !lowerMessage.includes("?"); // Statements often need search

    const needsReasoning =
      reasoningKeywords.some((keyword) => lowerMessage.includes(keyword)) ||
      lowerMessage.includes("?"); // Questions often benefit from reasoning

    // Determine reasoning type
    let reasoningType: "exploratory" | "targeted" | "comparative" | "causal" =
      "exploratory";
    if (comparativeKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      reasoningType = "comparative";
    } else if (
      causalKeywords.some((keyword) => lowerMessage.includes(keyword))
    ) {
      reasoningType = "causal";
    } else if (
      reasoningKeywords.some((keyword) => lowerMessage.includes(keyword))
    ) {
      reasoningType = "targeted";
    }

    // Determine search strategy
    let searchStrategy: "vector_only" | "graph_only" | "hybrid" | "adaptive" =
      "hybrid";
    if (lowerMessage.includes("semantic") || lowerMessage.includes("similar")) {
      searchStrategy = "vector_only";
    } else if (
      reasoningKeywords.some((keyword) => lowerMessage.includes(keyword))
    ) {
      searchStrategy = "graph_only";
    } else {
      searchStrategy = "adaptive";
    }

    return {
      needsSearch,
      needsReasoning,
      searchStrategy,
      reasoningType,
      reasoningQuestion: needsReasoning ? message : undefined,
    };
  }

  /**
   * Build enhanced context for LLM
   */
  private static buildEnhancedContext(
    message: string,
    searchResults: GraphRagSearchResult[],
    reasoningResults?: ReasoningResult,
    existingContext: Array<{ role: string; content: string }> = []
  ): Array<{ role: string; content: string }> {
    const context = [...existingContext];

    // Add system context about Graph RAG capabilities
    if (context.length === 0) {
      context.push({
        role: "system",
        content: `You are an AI assistant with access to a Graph RAG (Retrieval-Augmented Generation) system that combines semantic search with knowledge graph reasoning. You can:

1. Search through documents using semantic similarity
2. Identify entities and their relationships
3. Perform multi-hop reasoning across knowledge graphs
4. Provide explanations with provenance and confidence scores

When answering questions, use the provided search results and reasoning paths to give comprehensive, accurate responses. Always cite your sources and explain your reasoning process.`,
      });
    }

    // Add search results context
    if (searchResults.length > 0) {
      const searchContext = searchResults
        .map((result, index) => {
          const entityInfo =
            result.entities.length > 0
              ? `\nEntities: ${result.entities
                  .map(
                    (e) =>
                      `${e.name} (${e.type}, confidence: ${e.confidence.toFixed(
                        2
                      )})`
                  )
                  .join(", ")}`
              : "";

          const relationshipInfo =
            result.relationships.length > 0
              ? `\nRelationships: ${result.relationships
                  .map(
                    (r) => `${r.type} (confidence: ${r.confidence.toFixed(2)})`
                  )
                  .join(", ")}`
              : "";

          return `[Result ${index + 1}] (Score: ${result.score.toFixed(
            3
          )}, Similarity: ${result.similarity.toFixed(3)})
Source: ${result.metadata.sourceFile}
Content: ${result.text}${entityInfo}${relationshipInfo}`;
        })
        .join("\n\n");

      context.push({
        role: "system",
        content: `Search Results for "${message}":\n\n${searchContext}`,
      });
    }

    // Add reasoning results context
    if (reasoningResults && reasoningResults.paths.length > 0) {
      const reasoningContext = reasoningResults.paths
        .slice(0, 3)
        .map((path, index) => {
          const entityChain = path.entities.map((e) => e.name).join(" → ");
          const relationshipChain = path.relationships
            .map((r) => r.type)
            .join(" → ");

          return `[Reasoning Path ${
            index + 1
          }] (Confidence: ${path.confidence.toFixed(3)}, Depth: ${path.depth})
Entity Chain: ${entityChain}
Relationship Chain: ${relationshipChain}
Explanation: ${path.explanation}`;
        })
        .join("\n\n");

      context.push({
        role: "system",
        content: `Reasoning Results:\n\n${reasoningContext}\n\nBest Path Explanation: ${reasoningResults.explanation}`,
      });
    }

    // Add the user message
    context.push({
      role: "user",
      content: message,
    });

    return context;
  }

  /**
   * Generate LLM response with enhanced context
   */
  private static async generateLLMResponse(
    message: string,
    context: Array<{ role: string; content: string }>,
    model: string
  ): Promise<{ content: string }> {
    try {
      const response = await fetch(this.CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: context,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content:
          data.message?.content ||
          "I apologize, but I couldn't generate a response. Please try again.",
      };
    } catch (error) {
      console.error("LLM generation error:", error);
      return {
        content:
          "I apologize, but I'm having trouble connecting to the language model. Please try again later.",
      };
    }
  }

  /**
   * Generate suggested actions based on results
   */
  private static generateSuggestedActions(
    message: string,
    searchResults: GraphRagSearchResult[],
    reasoningResults?: ReasoningResult,
    entities: GraphRagEntity[] = []
  ): GraphRagChatResponse["suggestedActions"] {
    const actions: GraphRagChatResponse["suggestedActions"] = [];

    // Search refinement suggestions
    if (searchResults.length > 0) {
      const topEntities = entities
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      if (topEntities.length > 0) {
        actions.push({
          type: "explore",
          label: `Explore ${topEntities[0].name}`,
          query: `Tell me more about ${topEntities[0].name}`,
          entityIds: [topEntities[0].id],
        });
      }

      // Suggest reasoning if we have multiple entities
      if (entities.length >= 2) {
        actions.push({
          type: "reason",
          label: "Find relationships",
          reasoning: {
            question: `How are ${entities
              .slice(0, 2)
              .map((e) => e.name)
              .join(" and ")} related?`,
            type: "exploratory",
          },
          entityIds: entities.slice(0, 2).map((e) => e.id),
        });
      }

      // Suggest similar entity search
      if (entities.length > 0) {
        actions.push({
          type: "find_similar",
          label: `Find similar to ${entities[0].name}`,
          entityIds: [entities[0].id],
        });
      }
    }

    // If no good results, suggest broader search
    if (searchResults.length === 0) {
      actions.push({
        type: "new_search",
        label: "Try broader search",
        query: message.split(" ").slice(0, 3).join(" "), // Use first few words
      });
    }

    // Reasoning-based suggestions
    if (reasoningResults && reasoningResults.paths.length > 0) {
      const bestPath = reasoningResults.bestPath;
      if (bestPath && bestPath.entities.length > 2) {
        const middleEntity =
          bestPath.entities[Math.floor(bestPath.entities.length / 2)];
        actions.push({
          type: "explore",
          label: `Learn about ${middleEntity.name}`,
          query: `What is ${middleEntity.name} and why is it important?`,
          entityIds: [middleEntity.id],
        });
      }
    }

    return actions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Get chat session history with Graph RAG context
   */
  static async getChatHistory(sessionId?: string): Promise<{
    sessions: Array<{
      id: string;
      title: string;
      messages: Array<{ role: string; content: string; timestamp: string }>;
      createdAt: string;
      updatedAt: string;
      messageCount: number;
      entities?: GraphRagEntity[];
      searchCount?: number;
      reasoningCount?: number;
    }>;
  }> {
    try {
      // This would integrate with the backend to get enhanced chat history
      // For now, return empty array
      return { sessions: [] };
    } catch (error) {
      console.error("Get chat history error:", error);
      return { sessions: [] };
    }
  }

  /**
   * Save chat session with Graph RAG metadata
   */
  static async saveChatSession(
    messages: Array<{ role: string; content: string }>,
    metadata: {
      entities?: GraphRagEntity[];
      searchQueries?: string[];
      reasoningQuestions?: string[];
    } = {}
  ): Promise<{ sessionId: string }> {
    try {
      // This would integrate with the backend to save enhanced chat sessions
      return { sessionId: this.sessionId };
    } catch (error) {
      console.error("Save chat session error:", error);
      return { sessionId: this.sessionId };
    }
  }
}
