// Service for generating LLM-powered explanations of search results

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  text?: string;
  meta?: {
    contentType: string;
    section: string;
    breadcrumbs: string[];
  };
  source: {
    type: "documentation" | "component" | "guideline";
    path: string;
    url: string;
  };
  confidenceScore: number;
}

export interface ResultExplanation {
  whyMatches: string;
  keyInsights: string[];
  suggestedFollowUps: string[];
  relevanceScore: number;
  matchingConcepts: string[];
}

export class ExplanationService {
  private static instance: ExplanationService;
  private cache = new Map<string, ResultExplanation>();

  static getInstance(): ExplanationService {
    if (!ExplanationService.instance) {
      ExplanationService.instance = new ExplanationService();
    }
    return ExplanationService.instance;
  }

  async explainResult(
    result: SearchResult,
    query: string,
    context?: { totalResults: number; rank: number }
  ): Promise<ResultExplanation> {
    const cacheKey = `${result.id}-${query}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // In a real implementation, this would call your LLM service
      // For now, we'll use intelligent heuristics
      const explanation = await this.generateExplanation(
        result,
        query,
        context
      );

      this.cache.set(cacheKey, explanation);
      return explanation;
    } catch (error) {
      console.error("Failed to generate explanation:", error);
      return this.getFallbackExplanation(result, query);
    }
  }

  private async generateExplanation(
    result: SearchResult,
    query: string,
    context?: { totalResults: number; rank: number }
  ): Promise<ResultExplanation> {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 1200)
    );

    const queryWords = this.extractKeywords(query);
    const contentText = (result.text || result.summary).toLowerCase();
    const matchingConcepts = this.findMatchingConcepts(
      queryWords,
      contentText,
      result
    );

    return {
      whyMatches: this.generateWhyMatches(
        result,
        query,
        matchingConcepts,
        context
      ),
      keyInsights: this.extractKeyInsights(result, matchingConcepts),
      suggestedFollowUps: this.generateFollowUps(
        result,
        query,
        matchingConcepts
      ),
      relevanceScore: result.confidenceScore,
      matchingConcepts,
    };
  }

  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter(
        (word) =>
          ![
            "the",
            "and",
            "for",
            "are",
            "but",
            "not",
            "you",
            "all",
            "can",
            "how",
            "what",
            "when",
            "where",
            "why",
          ].includes(word)
      );
  }

  private findMatchingConcepts(
    queryWords: string[],
    contentText: string,
    result: SearchResult
  ): string[] {
    const concepts = [];

    // Direct word matches
    queryWords.forEach((word) => {
      if (contentText.includes(word)) {
        concepts.push(word);
      }
    });

    // Semantic concept matching based on design system patterns
    const designConcepts = this.getDesignSystemConcepts();
    queryWords.forEach((queryWord) => {
      designConcepts.forEach((concept) => {
        if (
          concept.keywords.some(
            (keyword) =>
              queryWord.includes(keyword) || keyword.includes(queryWord)
          )
        ) {
          if (
            contentText.includes(concept.name.toLowerCase()) ||
            result.meta?.section
              ?.toLowerCase()
              .includes(concept.name.toLowerCase())
          ) {
            concepts.push(concept.name);
          }
        }
      });
    });

    // Content type relevance
    if (result.meta?.contentType) {
      const contentTypeRelevance = this.getContentTypeRelevance(
        queryWords,
        result.meta.contentType
      );
      if (contentTypeRelevance) {
        concepts.push(contentTypeRelevance);
      }
    }

    return [...new Set(concepts)];
  }

  private getDesignSystemConcepts() {
    return [
      {
        name: "Button",
        keywords: ["button", "click", "action", "cta", "primary", "secondary"],
      },
      {
        name: "Modal",
        keywords: ["modal", "dialog", "popup", "overlay", "close"],
      },
      {
        name: "Form",
        keywords: ["form", "input", "field", "validation", "submit"],
      },
      {
        name: "Navigation",
        keywords: ["nav", "menu", "link", "breadcrumb", "tab"],
      },
      {
        name: "Layout",
        keywords: ["grid", "flex", "spacing", "margin", "padding"],
      },
      {
        name: "Typography",
        keywords: ["text", "font", "heading", "paragraph", "size"],
      },
      {
        name: "Color",
        keywords: ["color", "theme", "brand", "palette", "contrast"],
      },
      {
        name: "Icon",
        keywords: ["icon", "symbol", "graphic", "visual", "svg"],
      },
      {
        name: "Accessibility",
        keywords: ["a11y", "accessible", "screen", "reader", "keyboard"],
      },
      {
        name: "Component",
        keywords: ["component", "element", "widget", "control"],
      },
    ];
  }

  private getContentTypeRelevance(
    queryWords: string[],
    contentType: string
  ): string | null {
    const relevanceMap: Record<string, string[]> = {
      code: ["implementation", "example", "snippet"],
      heading: ["structure", "organization", "hierarchy"],
      paragraph: ["explanation", "description", "details"],
      list: ["options", "items", "choices"],
      table: ["data", "comparison", "specifications"],
    };

    const keywords = relevanceMap[contentType] || [];
    const hasRelevantKeyword = queryWords.some((word) =>
      keywords.some(
        (keyword) => word.includes(keyword) || keyword.includes(word)
      )
    );

    return hasRelevantKeyword ? `${contentType} content` : null;
  }

  private generateWhyMatches(
    result: SearchResult,
    query: string,
    matchingConcepts: string[],
    context?: { totalResults: number; rank: number }
  ): string {
    const reasons = [];

    if (matchingConcepts.length > 0) {
      const conceptList = matchingConcepts.slice(0, 3).join(", ");
      reasons.push(`contains key concepts: ${conceptList}`);
    }

    if (result.meta?.section) {
      reasons.push(`is part of the ${result.meta.section} documentation`);
    }

    if (result.source.type === "component") {
      reasons.push("provides component-specific guidance");
    } else if (result.source.type === "guideline") {
      reasons.push("offers design principles and guidelines");
    }

    if (result.confidenceScore > 0.8) {
      reasons.push("has high semantic similarity to your query");
    }

    if (context && context.rank <= 3) {
      reasons.push("is among the most relevant results");
    }

    const reasonText =
      reasons.length > 0
        ? reasons.join(", ")
        : "provides contextually relevant information";

    return `This result matches your query because it ${reasonText}.`;
  }

  private extractKeyInsights(
    result: SearchResult,
    matchingConcepts: string[]
  ): string[] {
    const insights = [];

    // Content type insights
    if (result.meta?.contentType === "code") {
      insights.push("Contains implementation details and code examples");
    } else if (result.meta?.contentType === "heading") {
      insights.push(
        "Provides structural guidance and organizational principles"
      );
    } else if (result.meta?.contentType === "table") {
      insights.push("Includes structured data and specifications");
    }

    // Source type insights
    if (result.source.type === "component") {
      insights.push("Includes component specifications and usage patterns");
    } else if (result.source.type === "guideline") {
      insights.push("Contains design principles and best practices");
    }

    // Breadcrumb insights
    if (result.meta?.breadcrumbs && result.meta.breadcrumbs.length > 1) {
      const category = result.meta.breadcrumbs[0];
      insights.push(`Part of the ${category} documentation system`);
    }

    // Concept-based insights
    if (matchingConcepts.includes("Accessibility")) {
      insights.push("Addresses accessibility considerations and requirements");
    }

    if (
      matchingConcepts.some((concept) =>
        ["Button", "Modal", "Form"].includes(concept)
      )
    ) {
      insights.push("Covers interactive component behavior and states");
    }

    // Confidence-based insights
    if (result.confidenceScore > 0.9) {
      insights.push("Highly relevant to your specific query");
    } else if (result.confidenceScore > 0.7) {
      insights.push("Contextually relevant with good semantic match");
    }

    return insights.length > 0
      ? insights.slice(0, 4)
      : ["Provides relevant design system information"];
  }

  private generateFollowUps(
    result: SearchResult,
    query: string,
    matchingConcepts: string[]
  ): string[] {
    const followUps = [];
    const section = result.meta?.section || result.title;

    // Generic follow-ups
    followUps.push(`How do I implement ${section}?`);
    followUps.push(`What are the best practices for ${section}?`);

    // Content type specific follow-ups
    if (result.meta?.contentType === "code") {
      followUps.push("Explain this code implementation in detail");
      followUps.push("Show me related code examples");
    } else if (result.source.type === "component") {
      followUps.push(`Show me ${section} usage examples`);
      followUps.push(`What are the ${section} component variants?`);
    } else if (result.source.type === "guideline") {
      followUps.push(`What are the design principles behind ${section}?`);
      followUps.push(`How does ${section} fit into the overall design system?`);
    }

    // Concept-based follow-ups
    if (matchingConcepts.includes("Accessibility")) {
      followUps.push("What are the accessibility requirements for this?");
    }

    if (
      matchingConcepts.some((concept) =>
        ["Color", "Typography"].includes(concept)
      )
    ) {
      followUps.push("Show me the design tokens for this");
    }

    // Query-specific follow-ups
    const queryWords = this.extractKeywords(query);
    if (queryWords.includes("example") || queryWords.includes("examples")) {
      followUps.push("Show me more examples of this pattern");
    }

    if (
      queryWords.includes("implement") ||
      queryWords.includes("implementation")
    ) {
      followUps.push("Walk me through the implementation steps");
    }

    // Return top 4 most relevant follow-ups
    return [...new Set(followUps)].slice(0, 4);
  }

  private getFallbackExplanation(
    result: SearchResult,
    query: string
  ): ResultExplanation {
    return {
      whyMatches: `This result appears relevant to your query about "${query}" based on semantic similarity and content matching.`,
      keyInsights: ["Contains relevant design system information"],
      suggestedFollowUps: [
        `Tell me more about ${result.title}`,
        "How do I use this information?",
        "Show me related content",
      ],
      relevanceScore: result.confidenceScore,
      matchingConcepts: [],
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
