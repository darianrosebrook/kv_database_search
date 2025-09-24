// Enhanced chat service for design system queries
import { apiService } from "./api";

export interface EnhancedChatOptions {
  pastedContent?: string;
  queryType?: "component" | "pattern" | "token" | "general";
  autoSearch?: boolean;
  context?: Array<{ role: string; content: string }>;
}

export interface ComponentAnalysis {
  detectedComponents: string[];
  cssClasses: string[];
  designTokens: string[];
  htmlElements: string[];
  confidence: number;
}

export class EnhancedChatService {
  // Analyze pasted content to identify design system elements
  static analyzeContent(content: string): ComponentAnalysis {
    const analysis: ComponentAnalysis = {
      detectedComponents: [],
      cssClasses: [],
      designTokens: [],
      htmlElements: [],
      confidence: 0,
    };

    // Extract CSS classes
    const classMatches = content.match(/class\s*=\s*["']([^"']*)["']/g);
    if (classMatches) {
      classMatches.forEach((match) => {
        const classes =
          match.match(/["']([^"']*)["']/)?.[1]?.split(/\s+/) || [];
        analysis.cssClasses.push(...classes);
      });
    }

    // Extract design tokens (CSS custom properties)
    const tokenMatches = content.match(/--[\w-]+/g);
    if (tokenMatches) {
      analysis.designTokens.push(...tokenMatches);
    }

    // Extract HTML elements
    const elementMatches = content.match(/<(\w+)/g);
    if (elementMatches) {
      analysis.htmlElements.push(
        ...elementMatches.map((match) => match.replace("<", ""))
      );
    }

    // Detect common component patterns
    const componentPatterns = [
      { pattern: /btn|button/i, component: "Button" },
      { pattern: /form-control|input/i, component: "Input" },
      { pattern: /modal|dialog/i, component: "Modal" },
      { pattern: /card/i, component: "Card" },
      { pattern: /nav|navigation/i, component: "Navigation" },
      { pattern: /dropdown|select/i, component: "Dropdown" },
      { pattern: /alert|notification/i, component: "Alert" },
      { pattern: /badge|tag/i, component: "Badge" },
      { pattern: /progress|loading/i, component: "Progress" },
      { pattern: /table|grid/i, component: "Table" },
    ];

    componentPatterns.forEach(({ pattern, component }) => {
      if (pattern.test(content)) {
        analysis.detectedComponents.push(component);
      }
    });

    // Calculate confidence based on detected elements
    const totalElements =
      analysis.cssClasses.length +
      analysis.designTokens.length +
      analysis.htmlElements.length +
      analysis.detectedComponents.length;

    analysis.confidence = Math.min(totalElements / 5, 1); // Normalize to 0-1

    return analysis;
  }

  // Generate search queries based on content analysis
  static generateSearchQueries(
    analysis: ComponentAnalysis,
    userQuery: string
  ): string[] {
    const queries: string[] = [];

    // Add user query if provided
    if (userQuery.trim()) {
      queries.push(userQuery);
    }

    // Add component-specific queries
    analysis.detectedComponents.forEach((component) => {
      queries.push(`${component} component`);
      queries.push(`${component} usage examples`);
    });

    // Add class-specific queries
    analysis.cssClasses.slice(0, 3).forEach((className) => {
      queries.push(`${className} class`);
      queries.push(`${className} styling`);
    });

    // Add token-specific queries
    analysis.designTokens.slice(0, 2).forEach((token) => {
      queries.push(`${token} design token`);
      queries.push(`${token} color variable`);
    });

    return queries.slice(0, 5); // Limit to top 5 queries
  }

  // Enhanced chat that can handle direct queries
  static async chat(
    message: string,
    options: EnhancedChatOptions = {}
  ): Promise<{
    response: string;
    context: Array<{ role: string; content: string }>;
    suggestedActions?: Array<{
      type: "refine_search" | "new_search" | "filter" | "explore";
      label: string;
      query?: string;
      filters?: any;
    }>;
    searchResults?: any[];
    analysis?: ComponentAnalysis;
  }> {
    let searchResults: any[] = [];
    let analysis: ComponentAnalysis | undefined;

    // Analyze pasted content if provided
    if (options.pastedContent) {
      analysis = this.analyzeContent(options.pastedContent);

      // Generate contextual message
      const contextualMessage = this.generateContextualMessage(
        message,
        analysis
      );
      message = contextualMessage;
    }

    // Auto-search if no context provided or if autoSearch is enabled
    if (options.autoSearch || !options.context?.length) {
      try {
        // Determine search queries
        let searchQueries: string[] = [];

        if (analysis) {
          searchQueries = this.generateSearchQueries(analysis, message);
        } else {
          // Extract key terms from the message for search
          searchQueries = this.extractSearchTerms(message);
        }

        // Perform searches and combine results
        for (const query of searchQueries.slice(0, 2)) {
          // Limit to 2 searches
          try {
            const searchResponse = await apiService.search(query, {
              limit: 5,
              rerank: true,
              minSimilarity: 0.1,
            });
            searchResults.push(...searchResponse.results);
          } catch (error) {
            console.warn(`Search failed for query: ${query}`, error);
          }
        }

        // Remove duplicates and limit results
        const uniqueResults = searchResults
          .filter(
            (result, index, self) =>
              index === self.findIndex((r) => r.id === result.id)
          )
          .slice(0, 10);

        searchResults = uniqueResults;
      } catch (error) {
        console.warn("Auto-search failed:", error);
      }
    }

    // Use the regular chat API with enhanced context
    const chatResponse = await apiService.chat(message, {
      context: options.context || [],
      searchResults,
      originalQuery: message,
      searchMetadata: {
        totalResults: searchResults.length,
        searchTime: 0,
      },
    });

    return {
      ...chatResponse,
      searchResults,
      analysis,
    };
  }

  // Generate a contextual message based on analysis
  private static generateContextualMessage(
    userMessage: string,
    analysis: ComponentAnalysis
  ): string {
    const parts: string[] = [];

    if (userMessage.trim()) {
      parts.push(userMessage);
    }

    if (analysis.detectedComponents.length > 0) {
      parts.push(
        `I've detected these components: ${analysis.detectedComponents.join(
          ", "
        )}`
      );
    }

    if (analysis.cssClasses.length > 0) {
      parts.push(
        `CSS classes found: ${analysis.cssClasses.slice(0, 5).join(", ")}`
      );
    }

    if (analysis.designTokens.length > 0) {
      parts.push(`Design tokens found: ${analysis.designTokens.join(", ")}`);
    }

    return parts.join(". ");
  }

  // Extract search terms from natural language query
  private static extractSearchTerms(message: string): string[] {
    const terms: string[] = [];

    // Add the full message as primary search
    terms.push(message);

    // Extract component-related keywords
    const componentKeywords = [
      "button",
      "input",
      "form",
      "modal",
      "card",
      "navigation",
      "nav",
      "dropdown",
      "select",
      "alert",
      "badge",
      "progress",
      "table",
      "grid",
      "header",
      "footer",
      "sidebar",
      "menu",
      "tooltip",
      "popover",
    ];

    const lowerMessage = message.toLowerCase();
    componentKeywords.forEach((keyword) => {
      if (lowerMessage.includes(keyword)) {
        terms.push(`${keyword} component`);
      }
    });

    // Extract color/token keywords
    const colorKeywords = [
      "color",
      "primary",
      "secondary",
      "accent",
      "background",
      "text",
    ];
    colorKeywords.forEach((keyword) => {
      if (lowerMessage.includes(keyword)) {
        terms.push(`${keyword} token`);
        terms.push(`${keyword} design system`);
      }
    });

    return [...new Set(terms)].slice(0, 3); // Remove duplicates and limit
  }
}
