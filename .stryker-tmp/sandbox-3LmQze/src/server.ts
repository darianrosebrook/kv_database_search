#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Obsidian RAG API Server
 *
 * Fastify-based API server implementing the OpenAPI specification for
 * semantic search and knowledge graph functionality.
 *
 * @author @darianrosebrook
 */
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import ollama from "ollama";
import { ObsidianDatabase } from "./lib/database";
import { ObsidianEmbeddingService } from "./lib/embeddings";
import { ObsidianSearchService } from "./lib/obsidian-search";
import { ObsidianIngestionPipeline } from "./lib/obsidian-ingest";
import { WebSearchService } from "./lib/web-search";
import { ContextManager } from "./lib/context-manager";
import { ChatSession } from "./types/index";
import type { HealthResponse, SearchRequest, SearchResponse, IngestRequest, IngestResponse, GraphResponse, StatsResponse } from "./types/index";

// Chat-related types
interface ChatRequest {
  message: string;
  model?: string;
  context?: Array<{
    role: string;
    content: string;
  }>;
  searchResults?: Array<any>;
  originalQuery?: string;
  searchMetadata?: {
    totalResults: number;
    searchTime: number;
    filters?: any;
  };
}
interface ChatResponse {
  response: string;
  context: Array<{
    role: string;
    content: string;
  }>;
  suggestedActions?: Array<{
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    filters?: any;
  }>;
  timestamp: string;
  model?: string;
}
interface ModelsResponse {
  models: Array<{
    name: string;
    size: number;
    modified_at: string;
    details?: {
      format?: string;
      family?: string;
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
  error?: string;
}
interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  model?: string;
  messageCount: number;
}
interface ChatHistoryResponse {
  sessions: ChatSession[];
  error?: string;
}
interface SaveChatRequest {
  title?: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model?: string;
  }>;
  model?: string;
}
interface WebSearchRequest {
  query: string;
  maxResults?: number;
  includeSnippets?: boolean;
  minRelevanceScore?: number;
  sources?: string[];
  timeRange?: "day" | "week" | "month" | "year" | "all";
  context?: string[]; // Additional context for better search
}
interface WebSearchResponse {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
    source: string;
    relevanceScore: number;
  }>;
  totalFound: number;
  searchTime: number;
  error?: string;
}

// Load environment variables
dotenv.config();
const DEFAULT_PORT = parseInt(stryMutAct_9fa48("5623") ? process.env.PORT && "3001" : stryMutAct_9fa48("5622") ? false : stryMutAct_9fa48("5621") ? true : (stryCov_9fa48("5621", "5622", "5623"), process.env.PORT || (stryMutAct_9fa48("5624") ? "" : (stryCov_9fa48("5624"), "3001"))));
const HOST = stryMutAct_9fa48("5627") ? process.env.HOST && "0.0.0.0" : stryMutAct_9fa48("5626") ? false : stryMutAct_9fa48("5625") ? true : (stryCov_9fa48("5625", "5626", "5627"), process.env.HOST || (stryMutAct_9fa48("5628") ? "" : (stryCov_9fa48("5628"), "0.0.0.0")));
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_PORT_ATTEMPTS = 10; // Maximum number of ports to try

/**
 * Find an available port starting from the default port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  if (stryMutAct_9fa48("5629")) {
    {}
  } else {
    stryCov_9fa48("5629");
    const net = await import(stryMutAct_9fa48("5630") ? "" : (stryCov_9fa48("5630"), "net"));
    for (let port = startPort; stryMutAct_9fa48("5633") ? port >= startPort + MAX_PORT_ATTEMPTS : stryMutAct_9fa48("5632") ? port <= startPort + MAX_PORT_ATTEMPTS : stryMutAct_9fa48("5631") ? false : (stryCov_9fa48("5631", "5632", "5633"), port < (stryMutAct_9fa48("5634") ? startPort - MAX_PORT_ATTEMPTS : (stryCov_9fa48("5634"), startPort + MAX_PORT_ATTEMPTS))); stryMutAct_9fa48("5635") ? port-- : (stryCov_9fa48("5635"), port++)) {
      if (stryMutAct_9fa48("5636")) {
        {}
      } else {
        stryCov_9fa48("5636");
        const isPortAvailable = await new Promise<boolean>(resolve => {
          if (stryMutAct_9fa48("5637")) {
            {}
          } else {
            stryCov_9fa48("5637");
            const server = net.createServer();
            server.listen(port, HOST, () => {
              if (stryMutAct_9fa48("5638")) {
                {}
              } else {
                stryCov_9fa48("5638");
                server.once(stryMutAct_9fa48("5639") ? "" : (stryCov_9fa48("5639"), "close"), () => {
                  if (stryMutAct_9fa48("5640")) {
                    {}
                  } else {
                    stryCov_9fa48("5640");
                    resolve(stryMutAct_9fa48("5641") ? false : (stryCov_9fa48("5641"), true));
                  }
                });
                server.close();
              }
            });
            server.on(stryMutAct_9fa48("5642") ? "" : (stryCov_9fa48("5642"), "error"), () => {
              if (stryMutAct_9fa48("5643")) {
                {}
              } else {
                stryCov_9fa48("5643");
                resolve(stryMutAct_9fa48("5644") ? true : (stryCov_9fa48("5644"), false));
              }
            });
          }
        });
        if (stryMutAct_9fa48("5646") ? false : stryMutAct_9fa48("5645") ? true : (stryCov_9fa48("5645", "5646"), isPortAvailable)) {
          if (stryMutAct_9fa48("5647")) {
            {}
          } else {
            stryCov_9fa48("5647");
            console.log(stryMutAct_9fa48("5648") ? `` : (stryCov_9fa48("5648"), `✅ Port ${port} is available`));
            return port;
          }
        } else {
          if (stryMutAct_9fa48("5649")) {
            {}
          } else {
            stryCov_9fa48("5649");
            console.log(stryMutAct_9fa48("5650") ? `` : (stryCov_9fa48("5650"), `⚠️  Port ${port} is in use, trying ${stryMutAct_9fa48("5651") ? port - 1 : (stryCov_9fa48("5651"), port + 1)}...`));
          }
        }
      }
    }
    throw new Error(stryMutAct_9fa48("5652") ? `` : (stryCov_9fa48("5652"), `❌ No available ports found in range ${startPort}-${stryMutAct_9fa48("5653") ? startPort + MAX_PORT_ATTEMPTS + 1 : (stryCov_9fa48("5653"), (stryMutAct_9fa48("5654") ? startPort - MAX_PORT_ATTEMPTS : (stryCov_9fa48("5654"), startPort + MAX_PORT_ATTEMPTS)) - 1)}`));
  }
}
const EMBEDDING_MODEL = stryMutAct_9fa48("5657") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("5656") ? false : stryMutAct_9fa48("5655") ? true : (stryCov_9fa48("5655", "5656", "5657"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("5658") ? "" : (stryCov_9fa48("5658"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("5661") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("5660") ? false : stryMutAct_9fa48("5659") ? true : (stryCov_9fa48("5659", "5660", "5661"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("5662") ? "" : (stryCov_9fa48("5662"), "768"))));
const LLM_MODEL = stryMutAct_9fa48("5665") ? process.env.LLM_MODEL && "llama3.1" : stryMutAct_9fa48("5664") ? false : stryMutAct_9fa48("5663") ? true : (stryCov_9fa48("5663", "5664", "5665"), process.env.LLM_MODEL || (stryMutAct_9fa48("5666") ? "" : (stryCov_9fa48("5666"), "llama3.1")));
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("5669") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("5668") ? false : stryMutAct_9fa48("5667") ? true : (stryCov_9fa48("5667", "5668", "5669"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("5670") ? "" : (stryCov_9fa48("5670"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));

// Create Fastify server instance
const server = Fastify(stryMutAct_9fa48("5671") ? {} : (stryCov_9fa48("5671"), {
  logger: stryMutAct_9fa48("5672") ? {} : (stryCov_9fa48("5672"), {
    transport: stryMutAct_9fa48("5673") ? {} : (stryCov_9fa48("5673"), {
      target: stryMutAct_9fa48("5674") ? "" : (stryCov_9fa48("5674"), "pino-pretty")
    })
  })
}));
let database: ObsidianDatabase | null = null;
let embeddingService: ObsidianEmbeddingService | null = null;
let searchService: ObsidianSearchService | null = null;
let ingestionPipeline: ObsidianIngestionPipeline | null = null;
let webSearchService: WebSearchService | null = null;
let contextManager: ContextManager | null = null;

/**
 * Initialize all services
 */
async function initializeServices() {
  if (stryMutAct_9fa48("5675")) {
    {}
  } else {
    stryCov_9fa48("5675");
    if (stryMutAct_9fa48("5678") ? false : stryMutAct_9fa48("5677") ? true : stryMutAct_9fa48("5676") ? DATABASE_URL : (stryCov_9fa48("5676", "5677", "5678"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5679")) {
        {}
      } else {
        stryCov_9fa48("5679");
        throw new Error(stryMutAct_9fa48("5680") ? "" : (stryCov_9fa48("5680"), "DATABASE_URL environment variable is required"));
      }
    }
    console.log(stryMutAct_9fa48("5681") ? "" : (stryCov_9fa48("5681"), "🚀 Initializing Obsidian RAG services..."));

    // Initialize database with better error handling
    try {
      if (stryMutAct_9fa48("5682")) {
        {}
      } else {
        stryCov_9fa48("5682");
        database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        console.log(stryMutAct_9fa48("5683") ? "" : (stryCov_9fa48("5683"), "✅ Database initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5684")) {
        {}
      } else {
        stryCov_9fa48("5684");
        console.error(stryMutAct_9fa48("5685") ? "" : (stryCov_9fa48("5685"), "❌ Database initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5686") ? "" : (stryCov_9fa48("5686"), "💡 Make sure PostgreSQL is running and DATABASE_URL is correct"));
        console.error(stryMutAct_9fa48("5687") ? "" : (stryCov_9fa48("5687"), "💡 Example: postgresql://username:password@localhost:5432/obsidian_rag"));
        throw error;
      }
    }

    // Initialize embedding service with better error handling
    try {
      if (stryMutAct_9fa48("5688")) {
        {}
      } else {
        stryCov_9fa48("5688");
        embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5689") ? {} : (stryCov_9fa48("5689"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5692") ? false : stryMutAct_9fa48("5691") ? true : stryMutAct_9fa48("5690") ? embeddingTest.success : (stryCov_9fa48("5690", "5691", "5692"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("5693")) {
            {}
          } else {
            stryCov_9fa48("5693");
            throw new Error(stryMutAct_9fa48("5694") ? "" : (stryCov_9fa48("5694"), "Embedding service connection failed"));
          }
        }
        console.log(stryMutAct_9fa48("5695") ? `` : (stryCov_9fa48("5695"), `✅ Embedding service ready (${embeddingTest.dimension}d)`));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5696")) {
        {}
      } else {
        stryCov_9fa48("5696");
        console.error(stryMutAct_9fa48("5697") ? "" : (stryCov_9fa48("5697"), "❌ Embedding service initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5698") ? "" : (stryCov_9fa48("5698"), "💡 Make sure Ollama is running and the model is available"));
        console.error(stryMutAct_9fa48("5699") ? "" : (stryCov_9fa48("5699"), "💡 Install Ollama: https://ollama.com"));
        console.error(stryMutAct_9fa48("5700") ? "" : (stryCov_9fa48("5700"), "💡 Pull model: ollama pull embeddinggemma"));
        throw error;
      }
    }

    // Initialize search service
    try {
      if (stryMutAct_9fa48("5701")) {
        {}
      } else {
        stryCov_9fa48("5701");
        searchService = new ObsidianSearchService(database, embeddingService);
        console.log(stryMutAct_9fa48("5702") ? "" : (stryCov_9fa48("5702"), "✅ Search service initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5703")) {
        {}
      } else {
        stryCov_9fa48("5703");
        console.error(stryMutAct_9fa48("5704") ? "" : (stryCov_9fa48("5704"), "❌ Search service initialization failed:"), error.message);
        throw error;
      }
    }

    // Initialize ingestion pipeline
    try {
      if (stryMutAct_9fa48("5705")) {
        {}
      } else {
        stryCov_9fa48("5705");
        ingestionPipeline = new ObsidianIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);
        console.log(stryMutAct_9fa48("5706") ? "" : (stryCov_9fa48("5706"), "✅ Ingestion pipeline initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5707")) {
        {}
      } else {
        stryCov_9fa48("5707");
        console.error(stryMutAct_9fa48("5708") ? "" : (stryCov_9fa48("5708"), "❌ Ingestion pipeline initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5709") ? "" : (stryCov_9fa48("5709"), "💡 Make sure OBSIDIAN_VAULT_PATH points to a valid Obsidian vault"));
        throw error;
      }
    }

    // Initialize web search service
    try {
      if (stryMutAct_9fa48("5710")) {
        {}
      } else {
        stryCov_9fa48("5710");
        webSearchService = new WebSearchService(embeddingService);
        console.log(stryMutAct_9fa48("5711") ? "" : (stryCov_9fa48("5711"), "✅ Web search service initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5712")) {
        {}
      } else {
        stryCov_9fa48("5712");
        console.error(stryMutAct_9fa48("5713") ? "" : (stryCov_9fa48("5713"), "❌ Web search service initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5714") ? "" : (stryCov_9fa48("5714"), "💡 Web search will use mock data"));
        // Don't throw - web search can work with mock data
      }
    }

    // Initialize context manager
    try {
      if (stryMutAct_9fa48("5715")) {
        {}
      } else {
        stryCov_9fa48("5715");
        contextManager = new ContextManager(database, embeddingService);
        console.log(stryMutAct_9fa48("5716") ? "" : (stryCov_9fa48("5716"), "✅ Context manager initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5717")) {
        {}
      } else {
        stryCov_9fa48("5717");
        console.error(stryMutAct_9fa48("5718") ? "" : (stryCov_9fa48("5718"), "❌ Context manager initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5719") ? "" : (stryCov_9fa48("5719"), "💡 Context management features will be limited"));
        // Don't throw - context manager can work with limited functionality
      }
    }

    // Initialize web search providers based on environment variables
    if (stryMutAct_9fa48("5722") ? process.env.ENABLE_SEARXNG !== "true" : stryMutAct_9fa48("5721") ? false : stryMutAct_9fa48("5720") ? true : (stryCov_9fa48("5720", "5721", "5722"), process.env.ENABLE_SEARXNG === (stryMutAct_9fa48("5723") ? "" : (stryCov_9fa48("5723"), "true")))) {
      if (stryMutAct_9fa48("5724")) {
        {}
      } else {
        stryCov_9fa48("5724");
        const searxngUrl = stryMutAct_9fa48("5727") ? process.env.SEARXNG_URL && "http://localhost:8888" : stryMutAct_9fa48("5726") ? false : stryMutAct_9fa48("5725") ? true : (stryCov_9fa48("5725", "5726", "5727"), process.env.SEARXNG_URL || (stryMutAct_9fa48("5728") ? "" : (stryCov_9fa48("5728"), "http://localhost:8888")));
        webSearchService.enableSearXNG(searxngUrl);
        console.log(stryMutAct_9fa48("5729") ? "" : (stryCov_9fa48("5729"), "🔍 SearXNG web search enabled"));
      }
    }
    if (stryMutAct_9fa48("5732") ? process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_CX : stryMutAct_9fa48("5731") ? false : stryMutAct_9fa48("5730") ? true : (stryCov_9fa48("5730", "5731", "5732"), process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX)) {
      if (stryMutAct_9fa48("5733")) {
        {}
      } else {
        stryCov_9fa48("5733");
        webSearchService.enableGoogleSearch(process.env.GOOGLE_SEARCH_API_KEY, process.env.GOOGLE_SEARCH_CX);
        console.log(stryMutAct_9fa48("5734") ? "" : (stryCov_9fa48("5734"), "🔍 Google Custom Search enabled"));
      }
    }
    if (stryMutAct_9fa48("5736") ? false : stryMutAct_9fa48("5735") ? true : (stryCov_9fa48("5735", "5736"), process.env.SERPER_API_KEY)) {
      if (stryMutAct_9fa48("5737")) {
        {}
      } else {
        stryCov_9fa48("5737");
        webSearchService.enableSerper(process.env.SERPER_API_KEY);
        console.log(stryMutAct_9fa48("5738") ? "" : (stryCov_9fa48("5738"), "🔍 Serper web search enabled"));
      }
    }
  }
}

/**
 * Health check endpoint
 */
server.get(stryMutAct_9fa48("5739") ? "" : (stryCov_9fa48("5739"), "/health"), async (request, reply): Promise<HealthResponse> => {
  if (stryMutAct_9fa48("5740")) {
    {}
  } else {
    stryCov_9fa48("5740");
    const health: HealthResponse = stryMutAct_9fa48("5741") ? {} : (stryCov_9fa48("5741"), {
      status: stryMutAct_9fa48("5742") ? "" : (stryCov_9fa48("5742"), "healthy"),
      timestamp: new Date().toISOString(),
      version: stryMutAct_9fa48("5743") ? "" : (stryCov_9fa48("5743"), "1.0.0"),
      services: stryMutAct_9fa48("5744") ? {} : (stryCov_9fa48("5744"), {
        database: stryMutAct_9fa48("5745") ? true : (stryCov_9fa48("5745"), false),
        embeddings: stryMutAct_9fa48("5746") ? true : (stryCov_9fa48("5746"), false),
        search: stryMutAct_9fa48("5747") ? true : (stryCov_9fa48("5747"), false),
        ingestion: stryMutAct_9fa48("5748") ? true : (stryCov_9fa48("5748"), false)
      })
    });
    try {
      if (stryMutAct_9fa48("5749")) {
        {}
      } else {
        stryCov_9fa48("5749");
        // Check database connectivity
        if (stryMutAct_9fa48("5751") ? false : stryMutAct_9fa48("5750") ? true : (stryCov_9fa48("5750", "5751"), database)) {
          if (stryMutAct_9fa48("5752")) {
            {}
          } else {
            stryCov_9fa48("5752");
            const stats = await database.getStats();
            health.services.database = stryMutAct_9fa48("5753") ? false : (stryCov_9fa48("5753"), true);
            health.database = stryMutAct_9fa48("5754") ? {} : (stryCov_9fa48("5754"), {
              totalChunks: stats.totalChunks,
              lastUpdate: stats.lastUpdate
            });
          }
        }

        // Check embedding service
        if (stryMutAct_9fa48("5756") ? false : stryMutAct_9fa48("5755") ? true : (stryCov_9fa48("5755", "5756"), embeddingService)) {
          if (stryMutAct_9fa48("5757")) {
            {}
          } else {
            stryCov_9fa48("5757");
            const test = await embeddingService.testConnection();
            health.services.embeddings = test.success;
            health.embeddings = stryMutAct_9fa48("5758") ? {} : (stryCov_9fa48("5758"), {
              model: EMBEDDING_MODEL,
              dimension: EMBEDDING_DIMENSION,
              available: test.success
            });
          }
        }

        // Check search service
        if (stryMutAct_9fa48("5760") ? false : stryMutAct_9fa48("5759") ? true : (stryCov_9fa48("5759", "5760"), searchService)) {
          if (stryMutAct_9fa48("5761")) {
            {}
          } else {
            stryCov_9fa48("5761");
            health.services.search = stryMutAct_9fa48("5762") ? false : (stryCov_9fa48("5762"), true);
          }
        }

        // Check ingestion pipeline
        if (stryMutAct_9fa48("5764") ? false : stryMutAct_9fa48("5763") ? true : (stryCov_9fa48("5763", "5764"), ingestionPipeline)) {
          if (stryMutAct_9fa48("5765")) {
            {}
          } else {
            stryCov_9fa48("5765");
            health.services.ingestion = stryMutAct_9fa48("5766") ? false : (stryCov_9fa48("5766"), true);
          }
        }

        // Overall health status
        const allServicesHealthy = stryMutAct_9fa48("5767") ? Object.values(health.services).some(status => status) : (stryCov_9fa48("5767"), Object.values(health.services).every(stryMutAct_9fa48("5768") ? () => undefined : (stryCov_9fa48("5768"), status => status)));
        health.status = allServicesHealthy ? stryMutAct_9fa48("5769") ? "" : (stryCov_9fa48("5769"), "healthy") : stryMutAct_9fa48("5770") ? "" : (stryCov_9fa48("5770"), "degraded");
        reply.code(allServicesHealthy ? 200 : 503);
        return health;
      }
    } catch (error) {
      if (stryMutAct_9fa48("5771")) {
        {}
      } else {
        stryCov_9fa48("5771");
        console.error(stryMutAct_9fa48("5772") ? "" : (stryCov_9fa48("5772"), "Health check failed:"), error);
        health.status = stryMutAct_9fa48("5773") ? "" : (stryCov_9fa48("5773"), "unhealthy");
        reply.code(503);
        return health;
      }
    }
  }
});

/**
 * Search endpoint
 */
server.post(stryMutAct_9fa48("5774") ? "" : (stryCov_9fa48("5774"), "/search"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("5775")) {
    {}
  } else {
    stryCov_9fa48("5775");
    if (stryMutAct_9fa48("5778") ? false : stryMutAct_9fa48("5777") ? true : stryMutAct_9fa48("5776") ? searchService : (stryCov_9fa48("5776", "5777", "5778"), !searchService)) {
      if (stryMutAct_9fa48("5779")) {
        {}
      } else {
        stryCov_9fa48("5779");
        reply.code(503);
        return stryMutAct_9fa48("5780") ? {} : (stryCov_9fa48("5780"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("5781") ? ["Stryker was here"] : (stryCov_9fa48("5781"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("5782") ? {} : (stryCov_9fa48("5782"), {
            queryConcepts: stryMutAct_9fa48("5783") ? ["Stryker was here"] : (stryCov_9fa48("5783"), []),
            relatedConcepts: stryMutAct_9fa48("5784") ? ["Stryker was here"] : (stryCov_9fa48("5784"), []),
            knowledgeClusters: stryMutAct_9fa48("5785") ? ["Stryker was here"] : (stryCov_9fa48("5785"), [])
          }),
          error: stryMutAct_9fa48("5786") ? "" : (stryCov_9fa48("5786"), "Search service not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    try {
      if (stryMutAct_9fa48("5787")) {
        {}
      } else {
        stryCov_9fa48("5787");
        const searchResponse = await searchService.search(searchRequest.query, stryMutAct_9fa48("5788") ? {} : (stryCov_9fa48("5788"), {
          limit: stryMutAct_9fa48("5791") ? searchRequest.limit && 10 : stryMutAct_9fa48("5790") ? false : stryMutAct_9fa48("5789") ? true : (stryCov_9fa48("5789", "5790", "5791"), searchRequest.limit || 10),
          searchMode: stryMutAct_9fa48("5794") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("5793") ? false : stryMutAct_9fa48("5792") ? true : (stryCov_9fa48("5792", "5793", "5794"), searchRequest.searchMode || (stryMutAct_9fa48("5795") ? "" : (stryCov_9fa48("5795"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("5798") ? searchRequest.includeRelated === false : stryMutAct_9fa48("5797") ? false : stryMutAct_9fa48("5796") ? true : (stryCov_9fa48("5796", "5797", "5798"), searchRequest.includeRelated !== (stryMutAct_9fa48("5799") ? true : (stryCov_9fa48("5799"), false))),
          maxRelated: stryMutAct_9fa48("5802") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("5801") ? false : stryMutAct_9fa48("5800") ? true : (stryCov_9fa48("5800", "5801", "5802"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: stryMutAct_9fa48("5805") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("5804") ? false : stryMutAct_9fa48("5803") ? true : (stryCov_9fa48("5803", "5804", "5805"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));
        reply.code(200);
        return searchResponse;
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5806")) {
        {}
      } else {
        stryCov_9fa48("5806");
        console.error(stryMutAct_9fa48("5807") ? "" : (stryCov_9fa48("5807"), "Search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5808") ? {} : (stryCov_9fa48("5808"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("5809") ? ["Stryker was here"] : (stryCov_9fa48("5809"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("5810") ? {} : (stryCov_9fa48("5810"), {
            queryConcepts: stryMutAct_9fa48("5811") ? ["Stryker was here"] : (stryCov_9fa48("5811"), []),
            relatedConcepts: stryMutAct_9fa48("5812") ? ["Stryker was here"] : (stryCov_9fa48("5812"), []),
            knowledgeClusters: stryMutAct_9fa48("5813") ? ["Stryker was here"] : (stryCov_9fa48("5813"), [])
          }),
          error: error.message
        });
      }
    }
  }
});

/**
 * Ingestion endpoint
 */
server.post(stryMutAct_9fa48("5814") ? "" : (stryCov_9fa48("5814"), "/ingest"), async (request, reply): Promise<IngestResponse> => {
  if (stryMutAct_9fa48("5815")) {
    {}
  } else {
    stryCov_9fa48("5815");
    if (stryMutAct_9fa48("5818") ? false : stryMutAct_9fa48("5817") ? true : stryMutAct_9fa48("5816") ? ingestionPipeline : (stryCov_9fa48("5816", "5817", "5818"), !ingestionPipeline)) {
      if (stryMutAct_9fa48("5819")) {
        {}
      } else {
        stryCov_9fa48("5819");
        reply.code(503);
        return stryMutAct_9fa48("5820") ? {} : (stryCov_9fa48("5820"), {
          success: stryMutAct_9fa48("5821") ? true : (stryCov_9fa48("5821"), false),
          message: stryMutAct_9fa48("5822") ? "" : (stryCov_9fa48("5822"), "Ingestion pipeline not available"),
          processedFiles: 0,
          totalChunks: 0,
          errors: stryMutAct_9fa48("5823") ? [] : (stryCov_9fa48("5823"), [stryMutAct_9fa48("5824") ? "" : (stryCov_9fa48("5824"), "Ingestion service not initialized")])
        });
      }
    }
    const ingestRequest = request.body as IngestRequest;
    try {
      if (stryMutAct_9fa48("5825")) {
        {}
      } else {
        stryCov_9fa48("5825");
        const result = await ingestionPipeline.ingestVault(stryMutAct_9fa48("5826") ? {} : (stryCov_9fa48("5826"), {
          batchSize: 50,
          rateLimitMs: 100,
          skipExisting: stryMutAct_9fa48("5827") ? ingestRequest.forceRefresh : (stryCov_9fa48("5827"), !ingestRequest.forceRefresh),
          includePatterns: ingestRequest.fileTypes,
          excludePatterns: ingestRequest.folders,
          chunkingOptions: stryMutAct_9fa48("5828") ? {} : (stryCov_9fa48("5828"), {
            maxChunkSize: 1000,
            chunkOverlap: 200,
            preserveStructure: stryMutAct_9fa48("5829") ? false : (stryCov_9fa48("5829"), true),
            includeContext: stryMutAct_9fa48("5830") ? false : (stryCov_9fa48("5830"), true),
            cleanContent: stryMutAct_9fa48("5831") ? false : (stryCov_9fa48("5831"), true)
          })
        }));
        reply.code(200);
        return stryMutAct_9fa48("5832") ? {} : (stryCov_9fa48("5832"), {
          success: result.success,
          message: result.message,
          processedFiles: result.processedFiles,
          totalChunks: result.totalChunks,
          errors: result.errors,
          performance: result.performance
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5833")) {
        {}
      } else {
        stryCov_9fa48("5833");
        console.error(stryMutAct_9fa48("5834") ? "" : (stryCov_9fa48("5834"), "Ingestion failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5835") ? {} : (stryCov_9fa48("5835"), {
          success: stryMutAct_9fa48("5836") ? true : (stryCov_9fa48("5836"), false),
          message: stryMutAct_9fa48("5837") ? "" : (stryCov_9fa48("5837"), "Ingestion failed"),
          processedFiles: 0,
          totalChunks: 0,
          errors: stryMutAct_9fa48("5838") ? [] : (stryCov_9fa48("5838"), [error.message])
        });
      }
    }
  }
});

/**
 * Graph data endpoint
 */
server.get(stryMutAct_9fa48("5839") ? "" : (stryCov_9fa48("5839"), "/graph"), async (request, reply): Promise<GraphResponse> => {
  if (stryMutAct_9fa48("5840")) {
    {}
  } else {
    stryCov_9fa48("5840");
    if (stryMutAct_9fa48("5843") ? false : stryMutAct_9fa48("5842") ? true : stryMutAct_9fa48("5841") ? database : (stryCov_9fa48("5841", "5842", "5843"), !database)) {
      if (stryMutAct_9fa48("5844")) {
        {}
      } else {
        stryCov_9fa48("5844");
        reply.code(503);
        return stryMutAct_9fa48("5845") ? {} : (stryCov_9fa48("5845"), {
          nodes: stryMutAct_9fa48("5846") ? ["Stryker was here"] : (stryCov_9fa48("5846"), []),
          edges: stryMutAct_9fa48("5847") ? ["Stryker was here"] : (stryCov_9fa48("5847"), []),
          clusters: stryMutAct_9fa48("5848") ? ["Stryker was here"] : (stryCov_9fa48("5848"), []),
          error: stryMutAct_9fa48("5849") ? "" : (stryCov_9fa48("5849"), "Database not available")
        });
      }
    }
    try {
      if (stryMutAct_9fa48("5850")) {
        {}
      } else {
        stryCov_9fa48("5850");
        const stats = await database.getStats();

        // Convert stats to graph format
        const nodes = stryMutAct_9fa48("5851") ? ["Stryker was here"] : (stryCov_9fa48("5851"), []);
        const edges = stryMutAct_9fa48("5852") ? ["Stryker was here"] : (stryCov_9fa48("5852"), []);
        const clusters = stryMutAct_9fa48("5853") ? ["Stryker was here"] : (stryCov_9fa48("5853"), []);

        // Create nodes for content types
        const contentTypes = stryMutAct_9fa48("5856") ? stats.byContentType && {} : stryMutAct_9fa48("5855") ? false : stryMutAct_9fa48("5854") ? true : (stryCov_9fa48("5854", "5855", "5856"), stats.byContentType || {});
        for (const [type, count] of Object.entries(contentTypes)) {
          if (stryMutAct_9fa48("5857")) {
            {}
          } else {
            stryCov_9fa48("5857");
            nodes.push(stryMutAct_9fa48("5858") ? {} : (stryCov_9fa48("5858"), {
              id: stryMutAct_9fa48("5859") ? `` : (stryCov_9fa48("5859"), `type_${type}`),
              label: type,
              type: stryMutAct_9fa48("5860") ? "" : (stryCov_9fa48("5860"), "contentType"),
              count: count as number
            }));
          }
        }

        // Create nodes for folders
        const folders = stryMutAct_9fa48("5863") ? stats.byFolder && {} : stryMutAct_9fa48("5862") ? false : stryMutAct_9fa48("5861") ? true : (stryCov_9fa48("5861", "5862", "5863"), stats.byFolder || {});
        for (const [folder, count] of Object.entries(folders)) {
          if (stryMutAct_9fa48("5864")) {
            {}
          } else {
            stryCov_9fa48("5864");
            nodes.push(stryMutAct_9fa48("5865") ? {} : (stryCov_9fa48("5865"), {
              id: stryMutAct_9fa48("5866") ? `` : (stryCov_9fa48("5866"), `folder_${folder}`),
              label: folder,
              type: stryMutAct_9fa48("5867") ? "" : (stryCov_9fa48("5867"), "folder"),
              count: count as number
            }));
          }
        }
        reply.code(200);
        return stryMutAct_9fa48("5868") ? {} : (stryCov_9fa48("5868"), {
          nodes,
          edges,
          clusters,
          metadata: stryMutAct_9fa48("5869") ? {} : (stryCov_9fa48("5869"), {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            generatedAt: new Date().toISOString()
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5870")) {
        {}
      } else {
        stryCov_9fa48("5870");
        console.error(stryMutAct_9fa48("5871") ? "" : (stryCov_9fa48("5871"), "Graph data retrieval failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5872") ? {} : (stryCov_9fa48("5872"), {
          nodes: stryMutAct_9fa48("5873") ? ["Stryker was here"] : (stryCov_9fa48("5873"), []),
          edges: stryMutAct_9fa48("5874") ? ["Stryker was here"] : (stryCov_9fa48("5874"), []),
          clusters: stryMutAct_9fa48("5875") ? ["Stryker was here"] : (stryCov_9fa48("5875"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Statistics endpoint
 */
server.get(stryMutAct_9fa48("5876") ? "" : (stryCov_9fa48("5876"), "/stats"), async (request, reply): Promise<StatsResponse> => {
  if (stryMutAct_9fa48("5877")) {
    {}
  } else {
    stryCov_9fa48("5877");
    if (stryMutAct_9fa48("5880") ? false : stryMutAct_9fa48("5879") ? true : stryMutAct_9fa48("5878") ? database : (stryCov_9fa48("5878", "5879", "5880"), !database)) {
      if (stryMutAct_9fa48("5881")) {
        {}
      } else {
        stryCov_9fa48("5881");
        reply.code(503);
        return stryMutAct_9fa48("5882") ? {} : (stryCov_9fa48("5882"), {
          totalChunks: 0,
          byContentType: {},
          byFolder: {},
          lastUpdate: null,
          error: stryMutAct_9fa48("5883") ? "" : (stryCov_9fa48("5883"), "Database not available")
        });
      }
    }
    try {
      if (stryMutAct_9fa48("5884")) {
        {}
      } else {
        stryCov_9fa48("5884");
        const stats = await database.getStats();
        reply.code(200);
        return stryMutAct_9fa48("5885") ? {} : (stryCov_9fa48("5885"), {
          totalChunks: stats.totalChunks,
          byContentType: stryMutAct_9fa48("5888") ? stats.byContentType && {} : stryMutAct_9fa48("5887") ? false : stryMutAct_9fa48("5886") ? true : (stryCov_9fa48("5886", "5887", "5888"), stats.byContentType || {}),
          byFolder: stryMutAct_9fa48("5891") ? stats.byFolder && {} : stryMutAct_9fa48("5890") ? false : stryMutAct_9fa48("5889") ? true : (stryCov_9fa48("5889", "5890", "5891"), stats.byFolder || {}),
          lastUpdate: stats.lastUpdate,
          performance: database.getPerformanceMetrics()
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5892")) {
        {}
      } else {
        stryCov_9fa48("5892");
        console.error(stryMutAct_9fa48("5893") ? "" : (stryCov_9fa48("5893"), "Stats retrieval failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5894") ? {} : (stryCov_9fa48("5894"), {
          totalChunks: 0,
          byContentType: {},
          byFolder: {},
          lastUpdate: null,
          error: error.message
        });
      }
    }
  }
});

/**
 * Models endpoint - List available Ollama models
 */
server.get(stryMutAct_9fa48("5895") ? "" : (stryCov_9fa48("5895"), "/models"), async (request, reply): Promise<ModelsResponse> => {
  if (stryMutAct_9fa48("5896")) {
    {}
  } else {
    stryCov_9fa48("5896");
    try {
      if (stryMutAct_9fa48("5897")) {
        {}
      } else {
        stryCov_9fa48("5897");
        const models = await ollama.list();
        reply.code(200);
        return stryMutAct_9fa48("5898") ? {} : (stryCov_9fa48("5898"), {
          models: models.models
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5899")) {
        {}
      } else {
        stryCov_9fa48("5899");
        console.error(stryMutAct_9fa48("5900") ? "" : (stryCov_9fa48("5900"), "Failed to list models:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5901") ? {} : (stryCov_9fa48("5901"), {
          models: stryMutAct_9fa48("5902") ? ["Stryker was here"] : (stryCov_9fa48("5902"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Chat endpoint - Generate LLM responses
 */
server.post(stryMutAct_9fa48("5903") ? "" : (stryCov_9fa48("5903"), "/chat"), async (request, reply): Promise<ChatResponse> => {
  if (stryMutAct_9fa48("5904")) {
    {}
  } else {
    stryCov_9fa48("5904");
    const chatRequest = request.body as ChatRequest;
    try {
      if (stryMutAct_9fa48("5905")) {
        {}
      } else {
        stryCov_9fa48("5905");
        // Use the specified model or default to LLM_MODEL
        const model = stryMutAct_9fa48("5908") ? chatRequest.model && LLM_MODEL : stryMutAct_9fa48("5907") ? false : stryMutAct_9fa48("5906") ? true : (stryCov_9fa48("5906", "5907", "5908"), chatRequest.model || LLM_MODEL);

        // Prepare context from conversation history
        const context = stryMutAct_9fa48("5911") ? chatRequest.context && [] : stryMutAct_9fa48("5910") ? false : stryMutAct_9fa48("5909") ? true : (stryCov_9fa48("5909", "5910", "5911"), chatRequest.context || (stryMutAct_9fa48("5912") ? ["Stryker was here"] : (stryCov_9fa48("5912"), [])));
        const messages = stryMutAct_9fa48("5913") ? [] : (stryCov_9fa48("5913"), [...context, stryMutAct_9fa48("5914") ? {} : (stryCov_9fa48("5914"), {
          role: stryMutAct_9fa48("5915") ? "" : (stryCov_9fa48("5915"), "user"),
          content: chatRequest.message
        })]);

        // Add search results context if available
        if (stryMutAct_9fa48("5918") ? chatRequest.searchResults || chatRequest.searchResults.length > 0 : stryMutAct_9fa48("5917") ? false : stryMutAct_9fa48("5916") ? true : (stryCov_9fa48("5916", "5917", "5918"), chatRequest.searchResults && (stryMutAct_9fa48("5921") ? chatRequest.searchResults.length <= 0 : stryMutAct_9fa48("5920") ? chatRequest.searchResults.length >= 0 : stryMutAct_9fa48("5919") ? true : (stryCov_9fa48("5919", "5920", "5921"), chatRequest.searchResults.length > 0)))) {
          if (stryMutAct_9fa48("5922")) {
            {}
          } else {
            stryCov_9fa48("5922");
            const searchContext = stryMutAct_9fa48("5923") ? chatRequest.searchResults
            // Limit to top 3 results for context
            .map((result, index) => `Context ${index + 1}: ${result.text.substring(0, 500)}${result.text.length > 500 ? "..." : ""}`).join("\n\n") : (stryCov_9fa48("5923"), chatRequest.searchResults.slice(0, 3) // Limit to top 3 results for context
            .map(stryMutAct_9fa48("5924") ? () => undefined : (stryCov_9fa48("5924"), (result, index) => stryMutAct_9fa48("5925") ? `` : (stryCov_9fa48("5925"), `Context ${stryMutAct_9fa48("5926") ? index - 1 : (stryCov_9fa48("5926"), index + 1)}: ${stryMutAct_9fa48("5927") ? result.text : (stryCov_9fa48("5927"), result.text.substring(0, 500))}${(stryMutAct_9fa48("5931") ? result.text.length <= 500 : stryMutAct_9fa48("5930") ? result.text.length >= 500 : stryMutAct_9fa48("5929") ? false : stryMutAct_9fa48("5928") ? true : (stryCov_9fa48("5928", "5929", "5930", "5931"), result.text.length > 500)) ? stryMutAct_9fa48("5932") ? "" : (stryCov_9fa48("5932"), "...") : stryMutAct_9fa48("5933") ? "Stryker was here!" : (stryCov_9fa48("5933"), "")}`))).join(stryMutAct_9fa48("5934") ? "" : (stryCov_9fa48("5934"), "\n\n")));
            messages.unshift(stryMutAct_9fa48("5935") ? {} : (stryCov_9fa48("5935"), {
              role: stryMutAct_9fa48("5936") ? "" : (stryCov_9fa48("5936"), "system"),
              content: stryMutAct_9fa48("5937") ? `` : (stryCov_9fa48("5937"), `You have access to the user's knowledge base. Use this context to provide accurate, helpful responses:\n\n${searchContext}`)
            }));
          }
        }

        // Generate response using Ollama
        const response = await ollama.chat(stryMutAct_9fa48("5938") ? {} : (stryCov_9fa48("5938"), {
          model: model,
          messages: messages,
          options: stryMutAct_9fa48("5939") ? {} : (stryCov_9fa48("5939"), {
            temperature: 0.7,
            num_predict: 1000 // Limit response length
          })
        }));
        const aiResponse = response.message.content;

        // Generate suggested actions based on the response
        const suggestedActions = generateSuggestedActions(chatRequest.message, aiResponse, chatRequest.searchResults);
        reply.code(200);
        return stryMutAct_9fa48("5940") ? {} : (stryCov_9fa48("5940"), {
          response: aiResponse,
          context: stryMutAct_9fa48("5941") ? [] : (stryCov_9fa48("5941"), [...context, stryMutAct_9fa48("5942") ? {} : (stryCov_9fa48("5942"), {
            role: stryMutAct_9fa48("5943") ? "" : (stryCov_9fa48("5943"), "user"),
            content: chatRequest.message
          }), stryMutAct_9fa48("5944") ? {} : (stryCov_9fa48("5944"), {
            role: stryMutAct_9fa48("5945") ? "" : (stryCov_9fa48("5945"), "assistant"),
            content: aiResponse
          })]),
          suggestedActions,
          timestamp: new Date().toISOString(),
          model: model
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5946")) {
        {}
      } else {
        stryCov_9fa48("5946");
        console.error(stryMutAct_9fa48("5947") ? "" : (stryCov_9fa48("5947"), "Chat failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5948") ? {} : (stryCov_9fa48("5948"), {
          response: stryMutAct_9fa48("5949") ? `` : (stryCov_9fa48("5949"), `Sorry, I encountered an error while processing your message: ${error.message}`),
          context: stryMutAct_9fa48("5952") ? chatRequest.context && [] : stryMutAct_9fa48("5951") ? false : stryMutAct_9fa48("5950") ? true : (stryCov_9fa48("5950", "5951", "5952"), chatRequest.context || (stryMutAct_9fa48("5953") ? ["Stryker was here"] : (stryCov_9fa48("5953"), []))),
          timestamp: new Date().toISOString(),
          model: stryMutAct_9fa48("5956") ? chatRequest.model && LLM_MODEL : stryMutAct_9fa48("5955") ? false : stryMutAct_9fa48("5954") ? true : (stryCov_9fa48("5954", "5955", "5956"), chatRequest.model || LLM_MODEL)
        });
      }
    }
  }
});

/**
 * Generate suggested actions based on user message and AI response
 */
function generateSuggestedActions(userMessage: string, aiResponse: string, searchResults?: Array<any>): Array<{
  type: "refine_search" | "new_search" | "filter" | "explore";
  label: string;
  query?: string;
  filters?: any;
}> {
  if (stryMutAct_9fa48("5957")) {
    {}
  } else {
    stryCov_9fa48("5957");
    const actions: Array<{
      type: "refine_search" | "new_search" | "filter" | "explore";
      label: string;
      query?: string;
      filters?: any;
    }> = stryMutAct_9fa48("5958") ? ["Stryker was here"] : (stryCov_9fa48("5958"), []);

    // If we have search results, suggest refinements
    if (stryMutAct_9fa48("5961") ? searchResults || searchResults.length > 0 : stryMutAct_9fa48("5960") ? false : stryMutAct_9fa48("5959") ? true : (stryCov_9fa48("5959", "5960", "5961"), searchResults && (stryMutAct_9fa48("5964") ? searchResults.length <= 0 : stryMutAct_9fa48("5963") ? searchResults.length >= 0 : stryMutAct_9fa48("5962") ? true : (stryCov_9fa48("5962", "5963", "5964"), searchResults.length > 0)))) {
      if (stryMutAct_9fa48("5965")) {
        {}
      } else {
        stryCov_9fa48("5965");
        actions.push(stryMutAct_9fa48("5966") ? {} : (stryCov_9fa48("5966"), {
          type: stryMutAct_9fa48("5967") ? "" : (stryCov_9fa48("5967"), "refine_search"),
          label: stryMutAct_9fa48("5968") ? "" : (stryCov_9fa48("5968"), "Show more results"),
          query: userMessage,
          filters: stryMutAct_9fa48("5969") ? {} : (stryCov_9fa48("5969"), {
            limit: 20
          })
        }));
        actions.push(stryMutAct_9fa48("5970") ? {} : (stryCov_9fa48("5970"), {
          type: stryMutAct_9fa48("5971") ? "" : (stryCov_9fa48("5971"), "filter"),
          label: stryMutAct_9fa48("5972") ? "" : (stryCov_9fa48("5972"), "Filter by content type"),
          filters: stryMutAct_9fa48("5973") ? {} : (stryCov_9fa48("5973"), {
            contentTypes: stryMutAct_9fa48("5974") ? [] : (stryCov_9fa48("5974"), [stryMutAct_9fa48("5975") ? "" : (stryCov_9fa48("5975"), "code"), stryMutAct_9fa48("5976") ? "" : (stryCov_9fa48("5976"), "text")])
          })
        }));
      }
    }

    // Suggest exploring related topics
    const exploreTopics = extractExploreTopics(userMessage, aiResponse);
    exploreTopics.forEach(topic => {
      if (stryMutAct_9fa48("5977")) {
        {}
      } else {
        stryCov_9fa48("5977");
        actions.push(stryMutAct_9fa48("5978") ? {} : (stryCov_9fa48("5978"), {
          type: stryMutAct_9fa48("5979") ? "" : (stryCov_9fa48("5979"), "explore"),
          label: stryMutAct_9fa48("5980") ? `` : (stryCov_9fa48("5980"), `Learn about ${topic}`),
          query: topic
        }));
      }
    });
    return stryMutAct_9fa48("5981") ? actions : (stryCov_9fa48("5981"), actions.slice(0, 4)); // Limit to 4 suggestions
  }
}

/**
 * Extract potential topics to explore from messages
 */
function extractExploreTopics(userMessage: string, aiResponse: string): string[] {
  if (stryMutAct_9fa48("5982")) {
    {}
  } else {
    stryCov_9fa48("5982");
    const topics: string[] = stryMutAct_9fa48("5983") ? ["Stryker was here"] : (stryCov_9fa48("5983"), []);

    // Look for technical terms, concepts, or questions in the response
    const sentences = aiResponse.split(stryMutAct_9fa48("5985") ? /[^.!?]+/ : stryMutAct_9fa48("5984") ? /[.!?]/ : (stryCov_9fa48("5984", "5985"), /[.!?]+/));
    sentences.forEach(sentence => {
      if (stryMutAct_9fa48("5986")) {
        {}
      } else {
        stryCov_9fa48("5986");
        const trimmed = stryMutAct_9fa48("5988") ? sentence.toLowerCase() : stryMutAct_9fa48("5987") ? sentence.trim().toUpperCase() : (stryCov_9fa48("5987", "5988"), sentence.trim().toLowerCase());
        if (stryMutAct_9fa48("5991") ? (trimmed.includes("component") || trimmed.includes("pattern") || trimmed.includes("best practice") || trimmed.includes("example")) && trimmed.includes("tutorial") : stryMutAct_9fa48("5990") ? false : stryMutAct_9fa48("5989") ? true : (stryCov_9fa48("5989", "5990", "5991"), (stryMutAct_9fa48("5993") ? (trimmed.includes("component") || trimmed.includes("pattern") || trimmed.includes("best practice")) && trimmed.includes("example") : stryMutAct_9fa48("5992") ? false : (stryCov_9fa48("5992", "5993"), (stryMutAct_9fa48("5995") ? (trimmed.includes("component") || trimmed.includes("pattern")) && trimmed.includes("best practice") : stryMutAct_9fa48("5994") ? false : (stryCov_9fa48("5994", "5995"), (stryMutAct_9fa48("5997") ? trimmed.includes("component") && trimmed.includes("pattern") : stryMutAct_9fa48("5996") ? false : (stryCov_9fa48("5996", "5997"), trimmed.includes(stryMutAct_9fa48("5998") ? "" : (stryCov_9fa48("5998"), "component")) || trimmed.includes(stryMutAct_9fa48("5999") ? "" : (stryCov_9fa48("5999"), "pattern")))) || trimmed.includes(stryMutAct_9fa48("6000") ? "" : (stryCov_9fa48("6000"), "best practice")))) || trimmed.includes(stryMutAct_9fa48("6001") ? "" : (stryCov_9fa48("6001"), "example")))) || trimmed.includes(stryMutAct_9fa48("6002") ? "" : (stryCov_9fa48("6002"), "tutorial")))) {
          if (stryMutAct_9fa48("6003")) {
            {}
          } else {
            stryCov_9fa48("6003");
            const words = stryMutAct_9fa48("6004") ? trimmed.split(/\s+/) : (stryCov_9fa48("6004"), trimmed.split(stryMutAct_9fa48("6006") ? /\S+/ : stryMutAct_9fa48("6005") ? /\s/ : (stryCov_9fa48("6005", "6006"), /\s+/)).slice(0, 3)); // Take first few words
            if (stryMutAct_9fa48("6010") ? words.length <= 1 : stryMutAct_9fa48("6009") ? words.length >= 1 : stryMutAct_9fa48("6008") ? false : stryMutAct_9fa48("6007") ? true : (stryCov_9fa48("6007", "6008", "6009", "6010"), words.length > 1)) {
              if (stryMutAct_9fa48("6011")) {
                {}
              } else {
                stryCov_9fa48("6011");
                topics.push(words.join(stryMutAct_9fa48("6012") ? "" : (stryCov_9fa48("6012"), " ")));
              }
            }
          }
        }
      }
    });
    return stryMutAct_9fa48("6013") ? [] : (stryCov_9fa48("6013"), [...new Set(topics)]); // Remove duplicates
  }
}

/**
 * Chat history endpoint - Get all chat sessions
 */
server.get(stryMutAct_9fa48("6014") ? "" : (stryCov_9fa48("6014"), "/chat/history"), async (request, reply): Promise<ChatHistoryResponse> => {
  if (stryMutAct_9fa48("6015")) {
    {}
  } else {
    stryCov_9fa48("6015");
    try {
      if (stryMutAct_9fa48("6016")) {
        {}
      } else {
        stryCov_9fa48("6016");
        const sessions = await database.getChatSessions(undefined, 50);
        reply.code(200);
        return stryMutAct_9fa48("6017") ? {} : (stryCov_9fa48("6017"), {
          sessions
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6018")) {
        {}
      } else {
        stryCov_9fa48("6018");
        console.error(stryMutAct_9fa48("6019") ? "" : (stryCov_9fa48("6019"), "Failed to get chat history:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6020") ? {} : (stryCov_9fa48("6020"), {
          sessions: stryMutAct_9fa48("6021") ? ["Stryker was here"] : (stryCov_9fa48("6021"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Save chat session endpoint
 */
server.post(stryMutAct_9fa48("6022") ? "" : (stryCov_9fa48("6022"), "/chat/save"), async (request, reply): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6023")) {
    {}
  } else {
    stryCov_9fa48("6023");
    const saveRequest = request.body as SaveChatRequest;
    try {
      if (stryMutAct_9fa48("6024")) {
        {}
      } else {
        stryCov_9fa48("6024");
        // Generate a title from the first user message if not provided
        const title = stryMutAct_9fa48("6027") ? saveRequest.title && generateChatTitle(saveRequest.messages) : stryMutAct_9fa48("6026") ? false : stryMutAct_9fa48("6025") ? true : (stryCov_9fa48("6025", "6026", "6027"), saveRequest.title || generateChatTitle(saveRequest.messages));

        // Generate embedding for chat session (but don't include in main document search)
        let sessionEmbedding: number[] | undefined;
        try {
          if (stryMutAct_9fa48("6028")) {
            {}
          } else {
            stryCov_9fa48("6028");
            const conversationText = saveRequest.messages.map(stryMutAct_9fa48("6029") ? () => undefined : (stryCov_9fa48("6029"), msg => stryMutAct_9fa48("6030") ? `` : (stryCov_9fa48("6030"), `${msg.role}: ${msg.content}`))).join(stryMutAct_9fa48("6031") ? "" : (stryCov_9fa48("6031"), "\n"));

            // Use a special marker to distinguish chat embeddings
            const chatContent = stryMutAct_9fa48("6032") ? `` : (stryCov_9fa48("6032"), `[CHAT_SESSION] ${title}\n\n${conversationText}`);
            sessionEmbedding = await embeddingService.embed(chatContent);
          }
        } catch (error) {
          if (stryMutAct_9fa48("6033")) {
            {}
          } else {
            stryCov_9fa48("6033");
            console.warn(stryMutAct_9fa48("6034") ? "" : (stryCov_9fa48("6034"), "Failed to generate chat session embedding:"), error);
          }
        }

        // Create chat session object
        const session: ChatSession = stryMutAct_9fa48("6035") ? {} : (stryCov_9fa48("6035"), {
          id: stryMutAct_9fa48("6036") ? `` : (stryCov_9fa48("6036"), `session_${Date.now()}`),
          title,
          messages: saveRequest.messages,
          model: stryMutAct_9fa48("6039") ? saveRequest.model && LLM_MODEL : stryMutAct_9fa48("6038") ? false : stryMutAct_9fa48("6037") ? true : (stryCov_9fa48("6037", "6038", "6039"), saveRequest.model || LLM_MODEL),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: saveRequest.messages.length,
          topics: extractTopicsFromMessages(saveRequest.messages),
          summary: await generateSessionSummary(saveRequest.messages),
          embedding: sessionEmbedding
        });

        // Save to database
        await database.saveChatSession(session);
        reply.code(200);
        return stryMutAct_9fa48("6040") ? {} : (stryCov_9fa48("6040"), {
          success: stryMutAct_9fa48("6041") ? false : (stryCov_9fa48("6041"), true),
          sessionId: session.id
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6042")) {
        {}
      } else {
        stryCov_9fa48("6042");
        console.error(stryMutAct_9fa48("6043") ? "" : (stryCov_9fa48("6043"), "Failed to save chat session:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6044") ? {} : (stryCov_9fa48("6044"), {
          success: stryMutAct_9fa48("6045") ? true : (stryCov_9fa48("6045"), false),
          error: error.message
        });
      }
    }
  }
});

/**
 * Load chat session endpoint
 */
server.get(stryMutAct_9fa48("6046") ? "" : (stryCov_9fa48("6046"), "/chat/session/:id"), async (request, reply): Promise<{
  session?: ChatSession;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6047")) {
    {}
  } else {
    stryCov_9fa48("6047");
    const {
      id
    } = request.params as {
      id: string;
    };
    try {
      if (stryMutAct_9fa48("6048")) {
        {}
      } else {
        stryCov_9fa48("6048");
        const session = await database.getChatSessionById(id);
        if (stryMutAct_9fa48("6051") ? false : stryMutAct_9fa48("6050") ? true : stryMutAct_9fa48("6049") ? session : (stryCov_9fa48("6049", "6050", "6051"), !session)) {
          if (stryMutAct_9fa48("6052")) {
            {}
          } else {
            stryCov_9fa48("6052");
            reply.code(404);
            return stryMutAct_9fa48("6053") ? {} : (stryCov_9fa48("6053"), {
              error: stryMutAct_9fa48("6054") ? "" : (stryCov_9fa48("6054"), "Chat session not found")
            });
          }
        }
        reply.code(200);
        return stryMutAct_9fa48("6055") ? {} : (stryCov_9fa48("6055"), {
          session
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6056")) {
        {}
      } else {
        stryCov_9fa48("6056");
        console.error(stryMutAct_9fa48("6057") ? "" : (stryCov_9fa48("6057"), "Failed to load chat session:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6058") ? {} : (stryCov_9fa48("6058"), {
          error: error.message
        });
      }
    }
  }
});

/**
 * Generate a title for a chat session based on messages
 */
function generateChatTitle(messages: Array<{
  role: string;
  content: string;
}>): string {
  if (stryMutAct_9fa48("6059")) {
    {}
  } else {
    stryCov_9fa48("6059");
    // Find the first user message
    const firstUserMessage = messages.find(stryMutAct_9fa48("6060") ? () => undefined : (stryCov_9fa48("6060"), msg => stryMutAct_9fa48("6063") ? msg.role !== "user" : stryMutAct_9fa48("6062") ? false : stryMutAct_9fa48("6061") ? true : (stryCov_9fa48("6061", "6062", "6063"), msg.role === (stryMutAct_9fa48("6064") ? "" : (stryCov_9fa48("6064"), "user")))));
    if (stryMutAct_9fa48("6067") ? false : stryMutAct_9fa48("6066") ? true : stryMutAct_9fa48("6065") ? firstUserMessage : (stryCov_9fa48("6065", "6066", "6067"), !firstUserMessage)) {
      if (stryMutAct_9fa48("6068")) {
        {}
      } else {
        stryCov_9fa48("6068");
        return stryMutAct_9fa48("6069") ? "" : (stryCov_9fa48("6069"), "New Chat");
      }
    }

    // Truncate to first 50 characters for title
    const content = firstUserMessage.content;
    const title = (stryMutAct_9fa48("6073") ? content.length <= 50 : stryMutAct_9fa48("6072") ? content.length >= 50 : stryMutAct_9fa48("6071") ? false : stryMutAct_9fa48("6070") ? true : (stryCov_9fa48("6070", "6071", "6072", "6073"), content.length > 50)) ? (stryMutAct_9fa48("6074") ? content : (stryCov_9fa48("6074"), content.substring(0, 50))) + (stryMutAct_9fa48("6075") ? "" : (stryCov_9fa48("6075"), "...")) : content;
    return title;
  }
}

/**
 * Generate a summary for a chat session using LLM
 */
async function generateSessionSummary(messages: Array<{
  role: string;
  content: string;
}>): Promise<string> {
  if (stryMutAct_9fa48("6076")) {
    {}
  } else {
    stryCov_9fa48("6076");
    try {
      if (stryMutAct_9fa48("6077")) {
        {}
      } else {
        stryCov_9fa48("6077");
        // Create a summary prompt
        const conversationText = messages.map(stryMutAct_9fa48("6078") ? () => undefined : (stryCov_9fa48("6078"), msg => stryMutAct_9fa48("6079") ? `` : (stryCov_9fa48("6079"), `${msg.role}: ${msg.content}`))).join(stryMutAct_9fa48("6080") ? "" : (stryCov_9fa48("6080"), "\n"));
        const summaryPrompt = stryMutAct_9fa48("6081") ? `` : (stryCov_9fa48("6081"), `Please provide a brief summary of this conversation (max 100 words):\n\n${conversationText}`);
        const response = await ollama.chat(stryMutAct_9fa48("6082") ? {} : (stryCov_9fa48("6082"), {
          model: LLM_MODEL,
          messages: stryMutAct_9fa48("6083") ? [] : (stryCov_9fa48("6083"), [stryMutAct_9fa48("6084") ? {} : (stryCov_9fa48("6084"), {
            role: stryMutAct_9fa48("6085") ? "" : (stryCov_9fa48("6085"), "user"),
            content: summaryPrompt
          })]),
          options: stryMutAct_9fa48("6086") ? {} : (stryCov_9fa48("6086"), {
            temperature: 0.3,
            num_predict: 200 // Limit summary length
          })
        }));
        return stryMutAct_9fa48("6087") ? response.message.content : (stryCov_9fa48("6087"), response.message.content.trim());
      }
    } catch (error) {
      if (stryMutAct_9fa48("6088")) {
        {}
      } else {
        stryCov_9fa48("6088");
        console.warn(stryMutAct_9fa48("6089") ? "" : (stryCov_9fa48("6089"), "Failed to generate session summary:"), error);
        // Fallback: generate a simple summary from the first few messages
        const userMessages = stryMutAct_9fa48("6090") ? messages : (stryCov_9fa48("6090"), messages.filter(stryMutAct_9fa48("6091") ? () => undefined : (stryCov_9fa48("6091"), msg => stryMutAct_9fa48("6094") ? msg.role !== "user" : stryMutAct_9fa48("6093") ? false : stryMutAct_9fa48("6092") ? true : (stryCov_9fa48("6092", "6093", "6094"), msg.role === (stryMutAct_9fa48("6095") ? "" : (stryCov_9fa48("6095"), "user"))))));
        if (stryMutAct_9fa48("6099") ? userMessages.length <= 0 : stryMutAct_9fa48("6098") ? userMessages.length >= 0 : stryMutAct_9fa48("6097") ? false : stryMutAct_9fa48("6096") ? true : (stryCov_9fa48("6096", "6097", "6098", "6099"), userMessages.length > 0)) {
          if (stryMutAct_9fa48("6100")) {
            {}
          } else {
            stryCov_9fa48("6100");
            const firstMessage = userMessages[0].content;
            return (stryMutAct_9fa48("6104") ? firstMessage.length <= 100 : stryMutAct_9fa48("6103") ? firstMessage.length >= 100 : stryMutAct_9fa48("6102") ? false : stryMutAct_9fa48("6101") ? true : (stryCov_9fa48("6101", "6102", "6103", "6104"), firstMessage.length > 100)) ? (stryMutAct_9fa48("6105") ? firstMessage : (stryCov_9fa48("6105"), firstMessage.substring(0, 100))) + (stryMutAct_9fa48("6106") ? "" : (stryCov_9fa48("6106"), "...")) : firstMessage;
          }
        }
        return stryMutAct_9fa48("6107") ? "" : (stryCov_9fa48("6107"), "Chat session");
      }
    }
  }
}

/**
 * Extract topics from chat messages for better organization
 */
function extractTopicsFromMessages(messages: Array<{
  role: string;
  content: string;
}>): string[] {
  if (stryMutAct_9fa48("6108")) {
    {}
  } else {
    stryCov_9fa48("6108");
    const topics: string[] = stryMutAct_9fa48("6109") ? ["Stryker was here"] : (stryCov_9fa48("6109"), []);
    const userMessages = stryMutAct_9fa48("6110") ? messages : (stryCov_9fa48("6110"), messages.filter(stryMutAct_9fa48("6111") ? () => undefined : (stryCov_9fa48("6111"), msg => stryMutAct_9fa48("6114") ? msg.role !== "user" : stryMutAct_9fa48("6113") ? false : stryMutAct_9fa48("6112") ? true : (stryCov_9fa48("6112", "6113", "6114"), msg.role === (stryMutAct_9fa48("6115") ? "" : (stryCov_9fa48("6115"), "user"))))));

    // Simple keyword extraction
    const commonKeywords = stryMutAct_9fa48("6116") ? [] : (stryCov_9fa48("6116"), [stryMutAct_9fa48("6117") ? "" : (stryCov_9fa48("6117"), "design"), stryMutAct_9fa48("6118") ? "" : (stryCov_9fa48("6118"), "component"), stryMutAct_9fa48("6119") ? "" : (stryCov_9fa48("6119"), "system"), stryMutAct_9fa48("6120") ? "" : (stryCov_9fa48("6120"), "api"), stryMutAct_9fa48("6121") ? "" : (stryCov_9fa48("6121"), "database"), stryMutAct_9fa48("6122") ? "" : (stryCov_9fa48("6122"), "search"), stryMutAct_9fa48("6123") ? "" : (stryCov_9fa48("6123"), "code"), stryMutAct_9fa48("6124") ? "" : (stryCov_9fa48("6124"), "function"), stryMutAct_9fa48("6125") ? "" : (stryCov_9fa48("6125"), "class"), stryMutAct_9fa48("6126") ? "" : (stryCov_9fa48("6126"), "method"), stryMutAct_9fa48("6127") ? "" : (stryCov_9fa48("6127"), "variable"), stryMutAct_9fa48("6128") ? "" : (stryCov_9fa48("6128"), "algorithm"), stryMutAct_9fa48("6129") ? "" : (stryCov_9fa48("6129"), "project"), stryMutAct_9fa48("6130") ? "" : (stryCov_9fa48("6130"), "feature"), stryMutAct_9fa48("6131") ? "" : (stryCov_9fa48("6131"), "bug"), stryMutAct_9fa48("6132") ? "" : (stryCov_9fa48("6132"), "error"), stryMutAct_9fa48("6133") ? "" : (stryCov_9fa48("6133"), "documentation"), stryMutAct_9fa48("6134") ? "" : (stryCov_9fa48("6134"), "tutorial"), stryMutAct_9fa48("6135") ? "" : (stryCov_9fa48("6135"), "performance"), stryMutAct_9fa48("6136") ? "" : (stryCov_9fa48("6136"), "optimization"), stryMutAct_9fa48("6137") ? "" : (stryCov_9fa48("6137"), "security"), stryMutAct_9fa48("6138") ? "" : (stryCov_9fa48("6138"), "testing"), stryMutAct_9fa48("6139") ? "" : (stryCov_9fa48("6139"), "deployment")]);
    userMessages.forEach(msg => {
      if (stryMutAct_9fa48("6140")) {
        {}
      } else {
        stryCov_9fa48("6140");
        const content = stryMutAct_9fa48("6141") ? msg.content.toUpperCase() : (stryCov_9fa48("6141"), msg.content.toLowerCase());
        commonKeywords.forEach(keyword => {
          if (stryMutAct_9fa48("6142")) {
            {}
          } else {
            stryCov_9fa48("6142");
            if (stryMutAct_9fa48("6145") ? content.includes(keyword) || !topics.includes(keyword) : stryMutAct_9fa48("6144") ? false : stryMutAct_9fa48("6143") ? true : (stryCov_9fa48("6143", "6144", "6145"), content.includes(keyword) && (stryMutAct_9fa48("6146") ? topics.includes(keyword) : (stryCov_9fa48("6146"), !topics.includes(keyword))))) {
              if (stryMutAct_9fa48("6147")) {
                {}
              } else {
                stryCov_9fa48("6147");
                topics.push(keyword);
              }
            }
          }
        });
      }
    });

    // Extract technical terms (words starting with capital letters)
    userMessages.forEach(msg => {
      if (stryMutAct_9fa48("6148")) {
        {}
      } else {
        stryCov_9fa48("6148");
        const words = msg.content.split(stryMutAct_9fa48("6150") ? /\S+/ : stryMutAct_9fa48("6149") ? /\s/ : (stryCov_9fa48("6149", "6150"), /\s+/));
        words.forEach(word => {
          if (stryMutAct_9fa48("6151")) {
            {}
          } else {
            stryCov_9fa48("6151");
            if (stryMutAct_9fa48("6154") ? word.length > 3 && word[0] === word[0].toUpperCase() && !topics.includes(word) || !commonKeywords.includes(word.toLowerCase()) : stryMutAct_9fa48("6153") ? false : stryMutAct_9fa48("6152") ? true : (stryCov_9fa48("6152", "6153", "6154"), (stryMutAct_9fa48("6156") ? word.length > 3 && word[0] === word[0].toUpperCase() || !topics.includes(word) : stryMutAct_9fa48("6155") ? true : (stryCov_9fa48("6155", "6156"), (stryMutAct_9fa48("6158") ? word.length > 3 || word[0] === word[0].toUpperCase() : stryMutAct_9fa48("6157") ? true : (stryCov_9fa48("6157", "6158"), (stryMutAct_9fa48("6161") ? word.length <= 3 : stryMutAct_9fa48("6160") ? word.length >= 3 : stryMutAct_9fa48("6159") ? true : (stryCov_9fa48("6159", "6160", "6161"), word.length > 3)) && (stryMutAct_9fa48("6163") ? word[0] !== word[0].toUpperCase() : stryMutAct_9fa48("6162") ? true : (stryCov_9fa48("6162", "6163"), word[0] === (stryMutAct_9fa48("6164") ? word[0].toLowerCase() : (stryCov_9fa48("6164"), word[0].toUpperCase())))))) && (stryMutAct_9fa48("6165") ? topics.includes(word) : (stryCov_9fa48("6165"), !topics.includes(word))))) && (stryMutAct_9fa48("6166") ? commonKeywords.includes(word.toLowerCase()) : (stryCov_9fa48("6166"), !commonKeywords.includes(stryMutAct_9fa48("6167") ? word.toUpperCase() : (stryCov_9fa48("6167"), word.toLowerCase())))))) {
              if (stryMutAct_9fa48("6168")) {
                {}
              } else {
                stryCov_9fa48("6168");
                topics.push(word);
              }
            }
          }
        });
      }
    });
    return stryMutAct_9fa48("6169") ? topics : (stryCov_9fa48("6169"), topics.slice(0, 10)); // Limit to 10 topics
  }
}

/**
 * Delete chat session endpoint
 */
server.delete(stryMutAct_9fa48("6170") ? "" : (stryCov_9fa48("6170"), "/chat/session/:id"), async (request, reply): Promise<{
  success: boolean;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6171")) {
    {}
  } else {
    stryCov_9fa48("6171");
    const {
      id
    } = request.params as {
      id: string;
    };
    try {
      if (stryMutAct_9fa48("6172")) {
        {}
      } else {
        stryCov_9fa48("6172");
        await database.deleteChatSession(id);
        reply.code(200);
        return stryMutAct_9fa48("6173") ? {} : (stryCov_9fa48("6173"), {
          success: stryMutAct_9fa48("6174") ? false : (stryCov_9fa48("6174"), true)
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6175")) {
        {}
      } else {
        stryCov_9fa48("6175");
        console.error(stryMutAct_9fa48("6176") ? "" : (stryCov_9fa48("6176"), "Failed to delete chat session:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6177") ? {} : (stryCov_9fa48("6177"), {
          success: stryMutAct_9fa48("6178") ? true : (stryCov_9fa48("6178"), false),
          error: error.message
        });
      }
    }
  }
});

/**
 * Web search endpoint
 */
server.post(stryMutAct_9fa48("6179") ? "" : (stryCov_9fa48("6179"), "/search/web"), async (request, reply): Promise<WebSearchResponse> => {
  if (stryMutAct_9fa48("6180")) {
    {}
  } else {
    stryCov_9fa48("6180");
    if (stryMutAct_9fa48("6183") ? false : stryMutAct_9fa48("6182") ? true : stryMutAct_9fa48("6181") ? webSearchService : (stryCov_9fa48("6181", "6182", "6183"), !webSearchService)) {
      if (stryMutAct_9fa48("6184")) {
        {}
      } else {
        stryCov_9fa48("6184");
        reply.code(503);
        return stryMutAct_9fa48("6185") ? {} : (stryCov_9fa48("6185"), {
          query: (request.body as WebSearchRequest).query,
          results: stryMutAct_9fa48("6186") ? ["Stryker was here"] : (stryCov_9fa48("6186"), []),
          totalFound: 0,
          searchTime: 0,
          error: stryMutAct_9fa48("6187") ? "" : (stryCov_9fa48("6187"), "Web search service not available")
        });
      }
    }
    const searchRequest = request.body as WebSearchRequest;
    const startTime = Date.now();
    try {
      if (stryMutAct_9fa48("6188")) {
        {}
      } else {
        stryCov_9fa48("6188");
        const results = await webSearchService.search(searchRequest.query, stryMutAct_9fa48("6189") ? {} : (stryCov_9fa48("6189"), {
          maxResults: stryMutAct_9fa48("6192") ? searchRequest.maxResults && 10 : stryMutAct_9fa48("6191") ? false : stryMutAct_9fa48("6190") ? true : (stryCov_9fa48("6190", "6191", "6192"), searchRequest.maxResults || 10),
          includeSnippets: stryMutAct_9fa48("6195") ? searchRequest.includeSnippets === false : stryMutAct_9fa48("6194") ? false : stryMutAct_9fa48("6193") ? true : (stryCov_9fa48("6193", "6194", "6195"), searchRequest.includeSnippets !== (stryMutAct_9fa48("6196") ? true : (stryCov_9fa48("6196"), false))),
          minRelevanceScore: stryMutAct_9fa48("6199") ? searchRequest.minRelevanceScore && 0.1 : stryMutAct_9fa48("6198") ? false : stryMutAct_9fa48("6197") ? true : (stryCov_9fa48("6197", "6198", "6199"), searchRequest.minRelevanceScore || 0.1),
          sources: searchRequest.sources,
          timeRange: searchRequest.timeRange
        }));
        const searchTime = stryMutAct_9fa48("6200") ? Date.now() + startTime : (stryCov_9fa48("6200"), Date.now() - startTime);
        reply.code(200);
        return stryMutAct_9fa48("6201") ? {} : (stryCov_9fa48("6201"), {
          query: searchRequest.query,
          results: results.map(stryMutAct_9fa48("6202") ? () => undefined : (stryCov_9fa48("6202"), result => stryMutAct_9fa48("6203") ? {} : (stryCov_9fa48("6203"), {
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            publishedDate: result.publishedDate,
            source: result.source,
            relevanceScore: result.relevanceScore
          }))),
          totalFound: results.length,
          searchTime
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6204")) {
        {}
      } else {
        stryCov_9fa48("6204");
        console.error(stryMutAct_9fa48("6205") ? "" : (stryCov_9fa48("6205"), "Web search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6206") ? {} : (stryCov_9fa48("6206"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6207") ? ["Stryker was here"] : (stryCov_9fa48("6207"), []),
          totalFound: 0,
          searchTime: stryMutAct_9fa48("6208") ? Date.now() + startTime : (stryCov_9fa48("6208"), Date.now() - startTime),
          error: error.message
        });
      }
    }
  }
});

/**
 * Enhanced search endpoint with web search integration
 */
server.post(stryMutAct_9fa48("6209") ? "" : (stryCov_9fa48("6209"), "/search/enhanced"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("6210")) {
    {}
  } else {
    stryCov_9fa48("6210");
    if (stryMutAct_9fa48("6213") ? false : stryMutAct_9fa48("6212") ? true : stryMutAct_9fa48("6211") ? searchService : (stryCov_9fa48("6211", "6212", "6213"), !searchService)) {
      if (stryMutAct_9fa48("6214")) {
        {}
      } else {
        stryCov_9fa48("6214");
        reply.code(503);
        return stryMutAct_9fa48("6215") ? {} : (stryCov_9fa48("6215"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("6216") ? ["Stryker was here"] : (stryCov_9fa48("6216"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6217") ? {} : (stryCov_9fa48("6217"), {
            queryConcepts: stryMutAct_9fa48("6218") ? ["Stryker was here"] : (stryCov_9fa48("6218"), []),
            relatedConcepts: stryMutAct_9fa48("6219") ? ["Stryker was here"] : (stryCov_9fa48("6219"), []),
            knowledgeClusters: stryMutAct_9fa48("6220") ? ["Stryker was here"] : (stryCov_9fa48("6220"), [])
          }),
          error: stryMutAct_9fa48("6221") ? "" : (stryCov_9fa48("6221"), "Search service not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    const startTime = Date.now();
    try {
      if (stryMutAct_9fa48("6222")) {
        {}
      } else {
        stryCov_9fa48("6222");
        // Perform regular knowledge base search
        const kbResults = await searchService.search(searchRequest.query, stryMutAct_9fa48("6223") ? {} : (stryCov_9fa48("6223"), {
          limit: Math.floor(stryMutAct_9fa48("6224") ? (searchRequest.limit || 10) / 0.7 : (stryCov_9fa48("6224"), (stryMutAct_9fa48("6227") ? searchRequest.limit && 10 : stryMutAct_9fa48("6226") ? false : stryMutAct_9fa48("6225") ? true : (stryCov_9fa48("6225", "6226", "6227"), searchRequest.limit || 10)) * 0.7)),
          // Reserve 30% for web results
          searchMode: stryMutAct_9fa48("6230") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("6229") ? false : stryMutAct_9fa48("6228") ? true : (stryCov_9fa48("6228", "6229", "6230"), searchRequest.searchMode || (stryMutAct_9fa48("6231") ? "" : (stryCov_9fa48("6231"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("6234") ? searchRequest.includeRelated === false : stryMutAct_9fa48("6233") ? false : stryMutAct_9fa48("6232") ? true : (stryCov_9fa48("6232", "6233", "6234"), searchRequest.includeRelated !== (stryMutAct_9fa48("6235") ? true : (stryCov_9fa48("6235"), false))),
          maxRelated: stryMutAct_9fa48("6238") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("6237") ? false : stryMutAct_9fa48("6236") ? true : (stryCov_9fa48("6236", "6237", "6238"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: stryMutAct_9fa48("6241") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("6240") ? false : stryMutAct_9fa48("6239") ? true : (stryCov_9fa48("6239", "6240", "6241"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));
        let allResults = stryMutAct_9fa48("6242") ? [] : (stryCov_9fa48("6242"), [...kbResults.results]);
        let webResults: any[] = stryMutAct_9fa48("6243") ? ["Stryker was here"] : (stryCov_9fa48("6243"), []);

        // Add web search results if requested and web search is available
        if (stryMutAct_9fa48("6246") ? webSearchService || (searchRequest as any).includeWebResults : stryMutAct_9fa48("6245") ? false : stryMutAct_9fa48("6244") ? true : (stryCov_9fa48("6244", "6245", "6246"), webSearchService && (searchRequest as any).includeWebResults)) {
          if (stryMutAct_9fa48("6247")) {
            {}
          } else {
            stryCov_9fa48("6247");
            try {
              if (stryMutAct_9fa48("6248")) {
                {}
              } else {
                stryCov_9fa48("6248");
                const webSearchResults = await webSearchService.search(searchRequest.query, stryMutAct_9fa48("6249") ? {} : (stryCov_9fa48("6249"), {
                  maxResults: Math.floor(stryMutAct_9fa48("6250") ? (searchRequest.limit || 10) / 0.3 : (stryCov_9fa48("6250"), (stryMutAct_9fa48("6253") ? searchRequest.limit && 10 : stryMutAct_9fa48("6252") ? false : stryMutAct_9fa48("6251") ? true : (stryCov_9fa48("6251", "6252", "6253"), searchRequest.limit || 10)) * 0.3)),
                  includeSnippets: stryMutAct_9fa48("6254") ? false : (stryCov_9fa48("6254"), true),
                  minRelevanceScore: 0.3
                }));
                webResults = webSearchResults.map(stryMutAct_9fa48("6255") ? () => undefined : (stryCov_9fa48("6255"), (result, index) => stryMutAct_9fa48("6256") ? {} : (stryCov_9fa48("6256"), {
                  id: stryMutAct_9fa48("6257") ? `` : (stryCov_9fa48("6257"), `web_${Date.now()}_${index}`),
                  text: stryMutAct_9fa48("6258") ? `` : (stryCov_9fa48("6258"), `${result.title}\n\n${result.snippet}`),
                  meta: stryMutAct_9fa48("6259") ? {} : (stryCov_9fa48("6259"), {
                    contentType: stryMutAct_9fa48("6260") ? "" : (stryCov_9fa48("6260"), "web"),
                    section: result.title,
                    breadcrumbs: stryMutAct_9fa48("6261") ? [] : (stryCov_9fa48("6261"), [result.source]),
                    uri: result.url,
                    url: result.url,
                    updatedAt: result.publishedDate,
                    createdAt: result.publishedDate,
                    sourceType: stryMutAct_9fa48("6262") ? "" : (stryCov_9fa48("6262"), "web"),
                    webSource: result.source
                  }),
                  source: stryMutAct_9fa48("6263") ? {} : (stryCov_9fa48("6263"), {
                    type: stryMutAct_9fa48("6264") ? "" : (stryCov_9fa48("6264"), "web"),
                    path: result.url,
                    url: result.url
                  }),
                  cosineSimilarity: result.relevanceScore,
                  rank: stryMutAct_9fa48("6265") ? kbResults.results.length + index - 1 : (stryCov_9fa48("6265"), (stryMutAct_9fa48("6266") ? kbResults.results.length - index : (stryCov_9fa48("6266"), kbResults.results.length + index)) + 1)
                })));
                allResults.push(...webResults);
              }
            } catch (webError) {
              if (stryMutAct_9fa48("6267")) {
                {}
              } else {
                stryCov_9fa48("6267");
                console.warn(stryMutAct_9fa48("6268") ? "" : (stryCov_9fa48("6268"), "Web search failed, continuing with knowledge base results:"), webError);
              }
            }
          }
        }
        const searchTime = stryMutAct_9fa48("6269") ? Date.now() + startTime : (stryCov_9fa48("6269"), Date.now() - startTime);
        reply.code(200);
        return stryMutAct_9fa48("6270") ? {} : (stryCov_9fa48("6270"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6271") ? allResults : (stryCov_9fa48("6271"), allResults.slice(0, stryMutAct_9fa48("6274") ? searchRequest.limit && 10 : stryMutAct_9fa48("6273") ? false : stryMutAct_9fa48("6272") ? true : (stryCov_9fa48("6272", "6273", "6274"), searchRequest.limit || 10))),
          totalFound: allResults.length,
          facets: kbResults.facets,
          graphInsights: stryMutAct_9fa48("6275") ? {} : (stryCov_9fa48("6275"), {
            ...kbResults.graphInsights,
            webResults: webResults.length
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6276")) {
        {}
      } else {
        stryCov_9fa48("6276");
        console.error(stryMutAct_9fa48("6277") ? "" : (stryCov_9fa48("6277"), "Enhanced search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6278") ? {} : (stryCov_9fa48("6278"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6279") ? ["Stryker was here"] : (stryCov_9fa48("6279"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6280") ? {} : (stryCov_9fa48("6280"), {
            queryConcepts: stryMutAct_9fa48("6281") ? ["Stryker was here"] : (stryCov_9fa48("6281"), []),
            relatedConcepts: stryMutAct_9fa48("6282") ? ["Stryker was here"] : (stryCov_9fa48("6282"), []),
            knowledgeClusters: stryMutAct_9fa48("6283") ? ["Stryker was here"] : (stryCov_9fa48("6283"), [])
          }),
          error: error.message
        });
      }
    }
  }
});

/**
 * Context-aware search endpoint
 */
server.post(stryMutAct_9fa48("6284") ? "" : (stryCov_9fa48("6284"), "/search/context"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("6285")) {
    {}
  } else {
    stryCov_9fa48("6285");
    if (stryMutAct_9fa48("6288") ? !searchService && !contextManager : stryMutAct_9fa48("6287") ? false : stryMutAct_9fa48("6286") ? true : (stryCov_9fa48("6286", "6287", "6288"), (stryMutAct_9fa48("6289") ? searchService : (stryCov_9fa48("6289"), !searchService)) || (stryMutAct_9fa48("6290") ? contextManager : (stryCov_9fa48("6290"), !contextManager)))) {
      if (stryMutAct_9fa48("6291")) {
        {}
      } else {
        stryCov_9fa48("6291");
        reply.code(503);
        return stryMutAct_9fa48("6292") ? {} : (stryCov_9fa48("6292"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("6293") ? ["Stryker was here"] : (stryCov_9fa48("6293"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6294") ? {} : (stryCov_9fa48("6294"), {
            queryConcepts: stryMutAct_9fa48("6295") ? ["Stryker was here"] : (stryCov_9fa48("6295"), []),
            relatedConcepts: stryMutAct_9fa48("6296") ? ["Stryker was here"] : (stryCov_9fa48("6296"), []),
            knowledgeClusters: stryMutAct_9fa48("6297") ? ["Stryker was here"] : (stryCov_9fa48("6297"), [])
          }),
          error: stryMutAct_9fa48("6298") ? "" : (stryCov_9fa48("6298"), "Search or context services not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    try {
      if (stryMutAct_9fa48("6299")) {
        {}
      } else {
        stryCov_9fa48("6299");
        // Get context for related documents
        const contextQuery = stryMutAct_9fa48("6300") ? {} : (stryCov_9fa48("6300"), {
          documentIds: stryMutAct_9fa48("6303") ? searchRequest.folders && [] : stryMutAct_9fa48("6302") ? false : stryMutAct_9fa48("6301") ? true : (stryCov_9fa48("6301", "6302", "6303"), searchRequest.folders || (stryMutAct_9fa48("6304") ? ["Stryker was here"] : (stryCov_9fa48("6304"), []))),
          // Use folders as context
          maxRelated: stryMutAct_9fa48("6307") ? searchRequest.maxRelated && 5 : stryMutAct_9fa48("6306") ? false : stryMutAct_9fa48("6305") ? true : (stryCov_9fa48("6305", "6306", "6307"), searchRequest.maxRelated || 5),
          relationshipTypes: stryMutAct_9fa48("6308") ? [] : (stryCov_9fa48("6308"), [stryMutAct_9fa48("6309") ? "" : (stryCov_9fa48("6309"), "references"), stryMutAct_9fa48("6310") ? "" : (stryCov_9fa48("6310"), "similar"), stryMutAct_9fa48("6311") ? "" : (stryCov_9fa48("6311"), "related")]),
          minStrength: 0.3,
          includeIndirect: stryMutAct_9fa48("6312") ? false : (stryCov_9fa48("6312"), true)
        });
        const documentContexts = await contextManager.getDocumentContext(contextQuery);

        // Extract related document IDs for enhanced search
        const relatedDocIds = documentContexts.flatMap(stryMutAct_9fa48("6313") ? () => undefined : (stryCov_9fa48("6313"), ctx => ctx.relatedDocuments.map(stryMutAct_9fa48("6314") ? () => undefined : (stryCov_9fa48("6314"), rel => rel.documentId))));

        // Perform enhanced search with context
        const enhancedSearchRequest = stryMutAct_9fa48("6315") ? {} : (stryCov_9fa48("6315"), {
          ...searchRequest,
          // Include related documents in search
          additionalContext: relatedDocIds
        });
        const searchResults = await searchService.search(searchRequest.query, stryMutAct_9fa48("6316") ? {} : (stryCov_9fa48("6316"), {
          limit: stryMutAct_9fa48("6319") ? searchRequest.limit && 10 : stryMutAct_9fa48("6318") ? false : stryMutAct_9fa48("6317") ? true : (stryCov_9fa48("6317", "6318", "6319"), searchRequest.limit || 10),
          searchMode: stryMutAct_9fa48("6322") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("6321") ? false : stryMutAct_9fa48("6320") ? true : (stryCov_9fa48("6320", "6321", "6322"), searchRequest.searchMode || (stryMutAct_9fa48("6323") ? "" : (stryCov_9fa48("6323"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("6324") ? false : (stryCov_9fa48("6324"), true),
          maxRelated: stryMutAct_9fa48("6327") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("6326") ? false : stryMutAct_9fa48("6325") ? true : (stryCov_9fa48("6325", "6326", "6327"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: stryMutAct_9fa48("6328") ? [] : (stryCov_9fa48("6328"), [...(stryMutAct_9fa48("6331") ? searchRequest.folders && [] : stryMutAct_9fa48("6330") ? false : stryMutAct_9fa48("6329") ? true : (stryCov_9fa48("6329", "6330", "6331"), searchRequest.folders || (stryMutAct_9fa48("6332") ? ["Stryker was here"] : (stryCov_9fa48("6332"), [])))), ...relatedDocIds]),
          minSimilarity: stryMutAct_9fa48("6335") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("6334") ? false : stryMutAct_9fa48("6333") ? true : (stryCov_9fa48("6333", "6334", "6335"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));

        // Add context information to results
        const enhancedResults = searchResults.results.map(stryMutAct_9fa48("6336") ? () => undefined : (stryCov_9fa48("6336"), result => stryMutAct_9fa48("6337") ? {} : (stryCov_9fa48("6337"), {
          ...result,
          contextInfo: stryMutAct_9fa48("6338") ? {} : (stryCov_9fa48("6338"), {
            relatedDocuments: relatedDocIds.length,
            contextStrength: (stryMutAct_9fa48("6342") ? documentContexts.length <= 0 : stryMutAct_9fa48("6341") ? documentContexts.length >= 0 : stryMutAct_9fa48("6340") ? false : stryMutAct_9fa48("6339") ? true : (stryCov_9fa48("6339", "6340", "6341", "6342"), documentContexts.length > 0)) ? stryMutAct_9fa48("6343") ? documentContexts.reduce((sum, ctx) => sum + ctx.importance, 0) * documentContexts.length : (stryCov_9fa48("6343"), documentContexts.reduce(stryMutAct_9fa48("6344") ? () => undefined : (stryCov_9fa48("6344"), (sum, ctx) => stryMutAct_9fa48("6345") ? sum - ctx.importance : (stryCov_9fa48("6345"), sum + ctx.importance)), 0) / documentContexts.length) : 0
          })
        })));
        reply.code(200);
        return stryMutAct_9fa48("6346") ? {} : (stryCov_9fa48("6346"), {
          query: searchRequest.query,
          results: enhancedResults,
          totalFound: searchResults.totalFound,
          facets: searchResults.facets,
          graphInsights: stryMutAct_9fa48("6347") ? {} : (stryCov_9fa48("6347"), {
            ...searchResults.graphInsights,
            contextDocuments: documentContexts.length,
            relatedDocuments: relatedDocIds.length
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6348")) {
        {}
      } else {
        stryCov_9fa48("6348");
        console.error(stryMutAct_9fa48("6349") ? "" : (stryCov_9fa48("6349"), "Context search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6350") ? {} : (stryCov_9fa48("6350"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6351") ? ["Stryker was here"] : (stryCov_9fa48("6351"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6352") ? {} : (stryCov_9fa48("6352"), {
            queryConcepts: stryMutAct_9fa48("6353") ? ["Stryker was here"] : (stryCov_9fa48("6353"), []),
            relatedConcepts: stryMutAct_9fa48("6354") ? ["Stryker was here"] : (stryCov_9fa48("6354"), []),
            knowledgeClusters: stryMutAct_9fa48("6355") ? ["Stryker was here"] : (stryCov_9fa48("6355"), [])
          }),
          error: error.message
        });
      }
    }
  }
});

/**
 * Knowledge graph endpoint
 */
server.get(stryMutAct_9fa48("6356") ? "" : (stryCov_9fa48("6356"), "/graph/context"), async (request, reply): Promise<{
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    importance: number;
    topics?: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
  }>;
  context?: {
    centerDocument?: string;
    relatedTopics: string[];
    relationshipStats: Record<string, number>;
  };
  error?: string;
}> => {
  if (stryMutAct_9fa48("6357")) {
    {}
  } else {
    stryCov_9fa48("6357");
    if (stryMutAct_9fa48("6360") ? false : stryMutAct_9fa48("6359") ? true : stryMutAct_9fa48("6358") ? contextManager : (stryCov_9fa48("6358", "6359", "6360"), !contextManager)) {
      if (stryMutAct_9fa48("6361")) {
        {}
      } else {
        stryCov_9fa48("6361");
        reply.code(503);
        return stryMutAct_9fa48("6362") ? {} : (stryCov_9fa48("6362"), {
          nodes: stryMutAct_9fa48("6363") ? ["Stryker was here"] : (stryCov_9fa48("6363"), []),
          edges: stryMutAct_9fa48("6364") ? ["Stryker was here"] : (stryCov_9fa48("6364"), []),
          error: stryMutAct_9fa48("6365") ? "" : (stryCov_9fa48("6365"), "Context manager not available")
        });
      }
    }
    const {
      centerDocument,
      maxNodes = 50
    } = request.query as {
      centerDocument?: string;
      maxNodes?: number;
    };
    try {
      if (stryMutAct_9fa48("6366")) {
        {}
      } else {
        stryCov_9fa48("6366");
        const graphData = await contextManager.getKnowledgeGraphData(centerDocument, maxNodes);
        const context = contextManager.getContextStats();

        // Get related topics
        const topics = new Set<string>();
        graphData.nodes.forEach(node => {
          if (stryMutAct_9fa48("6367")) {
            {}
          } else {
            stryCov_9fa48("6367");
            // Mock topics extraction - in real implementation, get from document metadata
            if (stryMutAct_9fa48("6369") ? false : stryMutAct_9fa48("6368") ? true : (stryCov_9fa48("6368", "6369"), node.id.includes(stryMutAct_9fa48("6370") ? "" : (stryCov_9fa48("6370"), "api")))) topics.add(stryMutAct_9fa48("6371") ? "" : (stryCov_9fa48("6371"), "API"));
            if (stryMutAct_9fa48("6373") ? false : stryMutAct_9fa48("6372") ? true : (stryCov_9fa48("6372", "6373"), node.id.includes(stryMutAct_9fa48("6374") ? "" : (stryCov_9fa48("6374"), "component")))) topics.add(stryMutAct_9fa48("6375") ? "" : (stryCov_9fa48("6375"), "Components"));
            if (stryMutAct_9fa48("6377") ? false : stryMutAct_9fa48("6376") ? true : (stryCov_9fa48("6376", "6377"), node.id.includes(stryMutAct_9fa48("6378") ? "" : (stryCov_9fa48("6378"), "database")))) topics.add(stryMutAct_9fa48("6379") ? "" : (stryCov_9fa48("6379"), "Database"));
          }
        });
        reply.code(200);
        return stryMutAct_9fa48("6380") ? {} : (stryCov_9fa48("6380"), {
          ...graphData,
          context: stryMutAct_9fa48("6381") ? {} : (stryCov_9fa48("6381"), {
            centerDocument,
            relatedTopics: Array.from(topics),
            relationshipStats: stryMutAct_9fa48("6382") ? {} : (stryCov_9fa48("6382"), {
              totalRelationships: context.totalRelationships,
              averagePerDocument: context.averageRelationshipsPerDocument
            })
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6383")) {
        {}
      } else {
        stryCov_9fa48("6383");
        console.error(stryMutAct_9fa48("6384") ? "" : (stryCov_9fa48("6384"), "Knowledge graph retrieval failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6385") ? {} : (stryCov_9fa48("6385"), {
          nodes: stryMutAct_9fa48("6386") ? ["Stryker was here"] : (stryCov_9fa48("6386"), []),
          edges: stryMutAct_9fa48("6387") ? ["Stryker was here"] : (stryCov_9fa48("6387"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Context suggestions endpoint
 */
server.post(stryMutAct_9fa48("6388") ? "" : (stryCov_9fa48("6388"), "/context/suggestions"), async (request, reply): Promise<{
  suggestions: Array<{
    suggestion: string;
    confidence: number;
    context?: string;
  }>;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6389")) {
    {}
  } else {
    stryCov_9fa48("6389");
    if (stryMutAct_9fa48("6392") ? false : stryMutAct_9fa48("6391") ? true : stryMutAct_9fa48("6390") ? contextManager : (stryCov_9fa48("6390", "6391", "6392"), !contextManager)) {
      if (stryMutAct_9fa48("6393")) {
        {}
      } else {
        stryCov_9fa48("6393");
        reply.code(503);
        return stryMutAct_9fa48("6394") ? {} : (stryCov_9fa48("6394"), {
          suggestions: stryMutAct_9fa48("6395") ? ["Stryker was here"] : (stryCov_9fa48("6395"), []),
          error: stryMutAct_9fa48("6396") ? "" : (stryCov_9fa48("6396"), "Context manager not available")
        });
      }
    }
    const {
      query,
      context = stryMutAct_9fa48("6397") ? ["Stryker was here"] : (stryCov_9fa48("6397"), [])
    } = request.body as {
      query: string;
      context?: string[];
    };
    try {
      if (stryMutAct_9fa48("6398")) {
        {}
      } else {
        stryCov_9fa48("6398");
        const suggestions = await contextManager.getContextualSuggestions(query, context);
        reply.code(200);
        return stryMutAct_9fa48("6399") ? {} : (stryCov_9fa48("6399"), {
          suggestions
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6400")) {
        {}
      } else {
        stryCov_9fa48("6400");
        console.error(stryMutAct_9fa48("6401") ? "" : (stryCov_9fa48("6401"), "Context suggestions failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6402") ? {} : (stryCov_9fa48("6402"), {
          suggestions: stryMutAct_9fa48("6403") ? ["Stryker was here"] : (stryCov_9fa48("6403"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Chat session search endpoint - searches only chat sessions, not regular documents
 */
server.post(stryMutAct_9fa48("6404") ? "" : (stryCov_9fa48("6404"), "/search/chat-sessions"), async (request, reply): Promise<{
  query: string;
  results: Array<ChatSession & {
    similarity: number;
  }>;
  totalFound: number;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6405")) {
    {}
  } else {
    stryCov_9fa48("6405");
    if (stryMutAct_9fa48("6408") ? false : stryMutAct_9fa48("6407") ? true : stryMutAct_9fa48("6406") ? database : (stryCov_9fa48("6406", "6407", "6408"), !database)) {
      if (stryMutAct_9fa48("6409")) {
        {}
      } else {
        stryCov_9fa48("6409");
        reply.code(503);
        return stryMutAct_9fa48("6410") ? {} : (stryCov_9fa48("6410"), {
          query: (request.body as {
            query: string;
          }).query,
          results: stryMutAct_9fa48("6411") ? ["Stryker was here"] : (stryCov_9fa48("6411"), []),
          totalFound: 0,
          error: stryMutAct_9fa48("6412") ? "" : (stryCov_9fa48("6412"), "Database not available")
        });
      }
    }
    const {
      query,
      limit = 10
    } = request.body as {
      query: string;
      limit?: number;
    };
    try {
      if (stryMutAct_9fa48("6413")) {
        {}
      } else {
        stryCov_9fa48("6413");
        // Generate embedding for the query
        const queryEmbedding = await embeddingService.embed(stryMutAct_9fa48("6414") ? `` : (stryCov_9fa48("6414"), `[CHAT_SEARCH] ${query}`));

        // Search chat sessions using their embeddings
        const chatResults = await database.searchChatSessions(query, queryEmbedding, limit);
        reply.code(200);
        return stryMutAct_9fa48("6415") ? {} : (stryCov_9fa48("6415"), {
          query,
          results: chatResults,
          totalFound: chatResults.length
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6416")) {
        {}
      } else {
        stryCov_9fa48("6416");
        console.error(stryMutAct_9fa48("6417") ? "" : (stryCov_9fa48("6417"), "Chat session search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6418") ? {} : (stryCov_9fa48("6418"), {
          query,
          results: stryMutAct_9fa48("6419") ? ["Stryker was here"] : (stryCov_9fa48("6419"), []),
          totalFound: 0,
          error: error.message
        });
      }
    }
  }
});

/**
 * Combined search that includes both documents and chat sessions
 * with safeguards to prevent recursion
 */
server.post(stryMutAct_9fa48("6420") ? "" : (stryCov_9fa48("6420"), "/search/combined"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("6421")) {
    {}
  } else {
    stryCov_9fa48("6421");
    if (stryMutAct_9fa48("6424") ? !searchService && !database : stryMutAct_9fa48("6423") ? false : stryMutAct_9fa48("6422") ? true : (stryCov_9fa48("6422", "6423", "6424"), (stryMutAct_9fa48("6425") ? searchService : (stryCov_9fa48("6425"), !searchService)) || (stryMutAct_9fa48("6426") ? database : (stryCov_9fa48("6426"), !database)))) {
      if (stryMutAct_9fa48("6427")) {
        {}
      } else {
        stryCov_9fa48("6427");
        reply.code(503);
        return stryMutAct_9fa48("6428") ? {} : (stryCov_9fa48("6428"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("6429") ? ["Stryker was here"] : (stryCov_9fa48("6429"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6430") ? {} : (stryCov_9fa48("6430"), {
            queryConcepts: stryMutAct_9fa48("6431") ? ["Stryker was here"] : (stryCov_9fa48("6431"), []),
            relatedConcepts: stryMutAct_9fa48("6432") ? ["Stryker was here"] : (stryCov_9fa48("6432"), []),
            knowledgeClusters: stryMutAct_9fa48("6433") ? ["Stryker was here"] : (stryCov_9fa48("6433"), [])
          }),
          error: stryMutAct_9fa48("6434") ? "" : (stryCov_9fa48("6434"), "Search services not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    try {
      if (stryMutAct_9fa48("6435")) {
        {}
      } else {
        stryCov_9fa48("6435");
        // Perform regular document search
        const docResults = await searchService.search(searchRequest.query, stryMutAct_9fa48("6436") ? {} : (stryCov_9fa48("6436"), {
          limit: Math.floor(stryMutAct_9fa48("6437") ? (searchRequest.limit || 10) / 0.8 : (stryCov_9fa48("6437"), (stryMutAct_9fa48("6440") ? searchRequest.limit && 10 : stryMutAct_9fa48("6439") ? false : stryMutAct_9fa48("6438") ? true : (stryCov_9fa48("6438", "6439", "6440"), searchRequest.limit || 10)) * 0.8)),
          // Reserve 20% for chat results
          searchMode: stryMutAct_9fa48("6443") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("6442") ? false : stryMutAct_9fa48("6441") ? true : (stryCov_9fa48("6441", "6442", "6443"), searchRequest.searchMode || (stryMutAct_9fa48("6444") ? "" : (stryCov_9fa48("6444"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("6447") ? searchRequest.includeRelated === false : stryMutAct_9fa48("6446") ? false : stryMutAct_9fa48("6445") ? true : (stryCov_9fa48("6445", "6446", "6447"), searchRequest.includeRelated !== (stryMutAct_9fa48("6448") ? true : (stryCov_9fa48("6448"), false))),
          maxRelated: stryMutAct_9fa48("6451") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("6450") ? false : stryMutAct_9fa48("6449") ? true : (stryCov_9fa48("6449", "6450", "6451"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: stryMutAct_9fa48("6454") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("6453") ? false : stryMutAct_9fa48("6452") ? true : (stryCov_9fa48("6452", "6453", "6454"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));
        let allResults = stryMutAct_9fa48("6455") ? [] : (stryCov_9fa48("6455"), [...docResults.results]);
        let chatResults: Array<any> = stryMutAct_9fa48("6456") ? ["Stryker was here"] : (stryCov_9fa48("6456"), []);

        // Only search chat sessions if explicitly requested and not searching within chat context
        if (stryMutAct_9fa48("6459") ? (searchRequest as any).includeChatSessions || !searchRequest.query.includes("[CHAT_SESSION]") : stryMutAct_9fa48("6458") ? false : stryMutAct_9fa48("6457") ? true : (stryCov_9fa48("6457", "6458", "6459"), (searchRequest as any).includeChatSessions && (stryMutAct_9fa48("6460") ? searchRequest.query.includes("[CHAT_SESSION]") : (stryCov_9fa48("6460"), !searchRequest.query.includes(stryMutAct_9fa48("6461") ? "" : (stryCov_9fa48("6461"), "[CHAT_SESSION]")))))) {
          if (stryMutAct_9fa48("6462")) {
            {}
          } else {
            stryCov_9fa48("6462");
            try {
              if (stryMutAct_9fa48("6463")) {
                {}
              } else {
                stryCov_9fa48("6463");
                const queryEmbedding = await embeddingService.embed(stryMutAct_9fa48("6464") ? `` : (stryCov_9fa48("6464"), `[CHAT_SEARCH] ${searchRequest.query}`));
                const chatSearchResults = await database.searchChatSessions(searchRequest.query, queryEmbedding, Math.floor(stryMutAct_9fa48("6465") ? (searchRequest.limit || 10) / 0.2 : (stryCov_9fa48("6465"), (stryMutAct_9fa48("6468") ? searchRequest.limit && 10 : stryMutAct_9fa48("6467") ? false : stryMutAct_9fa48("6466") ? true : (stryCov_9fa48("6466", "6467", "6468"), searchRequest.limit || 10)) * 0.2)));
                chatResults = chatSearchResults.map(stryMutAct_9fa48("6469") ? () => undefined : (stryCov_9fa48("6469"), (session, index) => stryMutAct_9fa48("6470") ? {} : (stryCov_9fa48("6470"), {
                  id: stryMutAct_9fa48("6471") ? `` : (stryCov_9fa48("6471"), `chat_${session.id}`),
                  text: stryMutAct_9fa48("6472") ? `` : (stryCov_9fa48("6472"), `[CHAT SESSION] ${session.title}\n\n${stryMutAct_9fa48("6475") ? session.summary && "No summary available" : stryMutAct_9fa48("6474") ? false : stryMutAct_9fa48("6473") ? true : (stryCov_9fa48("6473", "6474", "6475"), session.summary || (stryMutAct_9fa48("6476") ? "" : (stryCov_9fa48("6476"), "No summary available")))}`),
                  meta: stryMutAct_9fa48("6477") ? {} : (stryCov_9fa48("6477"), {
                    contentType: stryMutAct_9fa48("6478") ? "" : (stryCov_9fa48("6478"), "chat_session"),
                    section: session.title,
                    breadcrumbs: stryMutAct_9fa48("6479") ? [] : (stryCov_9fa48("6479"), [stryMutAct_9fa48("6480") ? `` : (stryCov_9fa48("6480"), `Chat Session`), session.model]),
                    uri: stryMutAct_9fa48("6481") ? `` : (stryCov_9fa48("6481"), `chat://${session.id}`),
                    updatedAt: session.updatedAt,
                    createdAt: session.createdAt,
                    sourceType: stryMutAct_9fa48("6482") ? "" : (stryCov_9fa48("6482"), "chat"),
                    model: session.model,
                    messageCount: session.messageCount,
                    topics: session.topics
                  }),
                  source: stryMutAct_9fa48("6483") ? {} : (stryCov_9fa48("6483"), {
                    type: stryMutAct_9fa48("6484") ? "" : (stryCov_9fa48("6484"), "chat"),
                    path: session.title,
                    url: stryMutAct_9fa48("6485") ? `` : (stryCov_9fa48("6485"), `chat://${session.id}`)
                  }),
                  cosineSimilarity: session.similarity,
                  rank: stryMutAct_9fa48("6486") ? docResults.results.length + index - 1 : (stryCov_9fa48("6486"), (stryMutAct_9fa48("6487") ? docResults.results.length - index : (stryCov_9fa48("6487"), docResults.results.length + index)) + 1)
                })));
                allResults.push(...chatResults);
              }
            } catch (chatError) {
              if (stryMutAct_9fa48("6488")) {
                {}
              } else {
                stryCov_9fa48("6488");
                console.warn(stryMutAct_9fa48("6489") ? "" : (stryCov_9fa48("6489"), "Chat session search failed, continuing with document results:"), chatError);
              }
            }
          }
        }
        reply.code(200);
        return stryMutAct_9fa48("6490") ? {} : (stryCov_9fa48("6490"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6491") ? allResults : (stryCov_9fa48("6491"), allResults.slice(0, stryMutAct_9fa48("6494") ? searchRequest.limit && 10 : stryMutAct_9fa48("6493") ? false : stryMutAct_9fa48("6492") ? true : (stryCov_9fa48("6492", "6493", "6494"), searchRequest.limit || 10))),
          totalFound: allResults.length,
          facets: docResults.facets,
          graphInsights: stryMutAct_9fa48("6495") ? {} : (stryCov_9fa48("6495"), {
            ...docResults.graphInsights,
            chatSessions: chatResults.length,
            hasChatResults: stryMutAct_9fa48("6499") ? chatResults.length <= 0 : stryMutAct_9fa48("6498") ? chatResults.length >= 0 : stryMutAct_9fa48("6497") ? false : stryMutAct_9fa48("6496") ? true : (stryCov_9fa48("6496", "6497", "6498", "6499"), chatResults.length > 0)
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6500")) {
        {}
      } else {
        stryCov_9fa48("6500");
        console.error(stryMutAct_9fa48("6501") ? "" : (stryCov_9fa48("6501"), "Combined search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6502") ? {} : (stryCov_9fa48("6502"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6503") ? ["Stryker was here"] : (stryCov_9fa48("6503"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6504") ? {} : (stryCov_9fa48("6504"), {
            queryConcepts: stryMutAct_9fa48("6505") ? ["Stryker was here"] : (stryCov_9fa48("6505"), []),
            relatedConcepts: stryMutAct_9fa48("6506") ? ["Stryker was here"] : (stryCov_9fa48("6506"), []),
            knowledgeClusters: stryMutAct_9fa48("6507") ? ["Stryker was here"] : (stryCov_9fa48("6507"), [])
          }),
          error: error.message
        });
      }
    }
  }
});

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal: string) {
  if (stryMutAct_9fa48("6508")) {
    {}
  } else {
    stryCov_9fa48("6508");
    console.log(stryMutAct_9fa48("6509") ? `` : (stryCov_9fa48("6509"), `\n${signal} received, shutting down gracefully...`));
    try {
      if (stryMutAct_9fa48("6510")) {
        {}
      } else {
        stryCov_9fa48("6510");
        if (stryMutAct_9fa48("6512") ? false : stryMutAct_9fa48("6511") ? true : (stryCov_9fa48("6511", "6512"), database)) {
          if (stryMutAct_9fa48("6513")) {
            {}
          } else {
            stryCov_9fa48("6513");
            await database.close();
            console.log(stryMutAct_9fa48("6514") ? "" : (stryCov_9fa48("6514"), "✅ Database connection closed"));
          }
        }
        await server.close();
        console.log(stryMutAct_9fa48("6515") ? "" : (stryCov_9fa48("6515"), "✅ Server closed"));
        process.exit(0);
      }
    } catch (error) {
      if (stryMutAct_9fa48("6516")) {
        {}
      } else {
        stryCov_9fa48("6516");
        console.error(stryMutAct_9fa48("6517") ? "" : (stryCov_9fa48("6517"), "❌ Error during shutdown:"), error);
        process.exit(1);
      }
    }
  }
}

// Register shutdown handlers
process.on(stryMutAct_9fa48("6518") ? "" : (stryCov_9fa48("6518"), "SIGTERM"), stryMutAct_9fa48("6519") ? () => undefined : (stryCov_9fa48("6519"), () => gracefulShutdown(stryMutAct_9fa48("6520") ? "" : (stryCov_9fa48("6520"), "SIGTERM"))));
process.on(stryMutAct_9fa48("6521") ? "" : (stryCov_9fa48("6521"), "SIGINT"), stryMutAct_9fa48("6522") ? () => undefined : (stryCov_9fa48("6522"), () => gracefulShutdown(stryMutAct_9fa48("6523") ? "" : (stryCov_9fa48("6523"), "SIGINT"))));

// Register CORS plugin
await server.register(cors, stryMutAct_9fa48("6524") ? {} : (stryCov_9fa48("6524"), {
  origin: stryMutAct_9fa48("6525") ? false : (stryCov_9fa48("6525"), true),
  // Allow all origins in development
  credentials: stryMutAct_9fa48("6526") ? false : (stryCov_9fa48("6526"), true)
}));

// Start server
async function start() {
  if (stryMutAct_9fa48("6527")) {
    {}
  } else {
    stryCov_9fa48("6527");
    try {
      if (stryMutAct_9fa48("6528")) {
        {}
      } else {
        stryCov_9fa48("6528");
        console.log(stryMutAct_9fa48("6529") ? "" : (stryCov_9fa48("6529"), "🔧 Starting Obsidian RAG Server..."));
        console.log(stryMutAct_9fa48("6530") ? `` : (stryCov_9fa48("6530"), `🌐 Host: ${HOST}`));
        console.log(stryMutAct_9fa48("6531") ? `` : (stryCov_9fa48("6531"), `🗄️  Database: ${DATABASE_URL ? stryMutAct_9fa48("6532") ? "" : (stryCov_9fa48("6532"), "Configured") : stryMutAct_9fa48("6533") ? "" : (stryCov_9fa48("6533"), "NOT CONFIGURED")}`));
        console.log(stryMutAct_9fa48("6534") ? `` : (stryCov_9fa48("6534"), `🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
        console.log(stryMutAct_9fa48("6535") ? `` : (stryCov_9fa48("6535"), `🧠 LLM: ${LLM_MODEL}`));
        console.log(stryMutAct_9fa48("6536") ? `` : (stryCov_9fa48("6536"), `📁 Obsidian Vault: ${OBSIDIAN_VAULT_PATH}`));
        await initializeServices();

        // Find an available port dynamically
        const PORT = await findAvailablePort(DEFAULT_PORT);
        console.log(stryMutAct_9fa48("6537") ? `` : (stryCov_9fa48("6537"), `📡 Starting on port: ${PORT}`));
        await server.listen(stryMutAct_9fa48("6538") ? {} : (stryCov_9fa48("6538"), {
          port: PORT,
          host: HOST
        }));
        console.log((stryMutAct_9fa48("6539") ? "" : (stryCov_9fa48("6539"), "\n")) + (stryMutAct_9fa48("6540") ? "" : (stryCov_9fa48("6540"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("6541") ? "" : (stryCov_9fa48("6541"), "🚀 Obsidian RAG API server is running!"));
        console.log((stryMutAct_9fa48("6542") ? "" : (stryCov_9fa48("6542"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("6543") ? `` : (stryCov_9fa48("6543"), `📡 Server: http://${HOST}:${PORT}`));
        console.log(stryMutAct_9fa48("6544") ? `` : (stryCov_9fa48("6544"), `📚 API Documentation: http://${HOST}:${PORT}/docs`));
        console.log(stryMutAct_9fa48("6545") ? `` : (stryCov_9fa48("6545"), `🔍 Health check: http://${HOST}:${PORT}/health`));
        console.log(stryMutAct_9fa48("6546") ? `` : (stryCov_9fa48("6546"), `🔍 Search endpoint: http://${HOST}:${PORT}/search`));
        console.log(stryMutAct_9fa48("6547") ? `` : (stryCov_9fa48("6547"), `💬 Chat endpoint: http://${HOST}:${PORT}/chat`));
        console.log(stryMutAct_9fa48("6548") ? `` : (stryCov_9fa48("6548"), `💬 Chat history: http://${HOST}:${PORT}/chat/history`));
        console.log(stryMutAct_9fa48("6549") ? `` : (stryCov_9fa48("6549"), `💬 Save chat: http://${HOST}:${PORT}/chat/save`));
        console.log(stryMutAct_9fa48("6550") ? `` : (stryCov_9fa48("6550"), `💬 Load chat: http://${HOST}:${PORT}/chat/session/:id`));
        console.log(stryMutAct_9fa48("6551") ? `` : (stryCov_9fa48("6551"), `💬 Delete chat: http://${HOST}:${PORT}/chat/session/:id`));
        console.log(stryMutAct_9fa48("6552") ? `` : (stryCov_9fa48("6552"), `🌐 Web search: http://${HOST}:${PORT}/search/web`));
        console.log(stryMutAct_9fa48("6553") ? `` : (stryCov_9fa48("6553"), `🔍 Enhanced search: http://${HOST}:${PORT}/search/enhanced`));
        console.log(stryMutAct_9fa48("6554") ? `` : (stryCov_9fa48("6554"), `🔍 Context search: http://${HOST}:${PORT}/search/context`));
        console.log(stryMutAct_9fa48("6555") ? `` : (stryCov_9fa48("6555"), `🔍 Chat sessions search: http://${HOST}:${PORT}/search/chat-sessions`));
        console.log(stryMutAct_9fa48("6556") ? `` : (stryCov_9fa48("6556"), `🔍 Combined search: http://${HOST}:${PORT}/search/combined`));
        console.log(stryMutAct_9fa48("6557") ? `` : (stryCov_9fa48("6557"), `🕸️  Context graph: http://${HOST}:${PORT}/graph/context`));
        console.log(stryMutAct_9fa48("6558") ? `` : (stryCov_9fa48("6558"), `💡 Context suggestions: http://${HOST}:${PORT}/context/suggestions`));
        console.log(stryMutAct_9fa48("6559") ? `` : (stryCov_9fa48("6559"), `🧠 Models endpoint: http://${HOST}:${PORT}/models`));
        console.log(stryMutAct_9fa48("6560") ? `` : (stryCov_9fa48("6560"), `📥 Ingestion endpoint: http://${HOST}:${PORT}/ingest`));
        console.log(stryMutAct_9fa48("6561") ? `` : (stryCov_9fa48("6561"), `📊 Statistics: http://${HOST}:${PORT}/stats`));
        console.log(stryMutAct_9fa48("6562") ? `` : (stryCov_9fa48("6562"), `🕸️  Graph data: http://${HOST}:${PORT}/graph`));
        console.log((stryMutAct_9fa48("6563") ? "" : (stryCov_9fa48("6563"), "=")).repeat(60));

        // Log helpful setup instructions if needed
        if (stryMutAct_9fa48("6566") ? false : stryMutAct_9fa48("6565") ? true : stryMutAct_9fa48("6564") ? DATABASE_URL : (stryCov_9fa48("6564", "6565", "6566"), !DATABASE_URL)) {
          if (stryMutAct_9fa48("6567")) {
            {}
          } else {
            stryCov_9fa48("6567");
            console.log(stryMutAct_9fa48("6568") ? "" : (stryCov_9fa48("6568"), "\n⚠️  Setup Required:"));
            console.log(stryMutAct_9fa48("6569") ? "" : (stryCov_9fa48("6569"), "   1. Set DATABASE_URL in .env file"));
            console.log(stryMutAct_9fa48("6570") ? "" : (stryCov_9fa48("6570"), "   2. Ensure PostgreSQL is running"));
            console.log(stryMutAct_9fa48("6571") ? "" : (stryCov_9fa48("6571"), "   3. Run: npm run setup"));
          }
        }
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6572")) {
        {}
      } else {
        stryCov_9fa48("6572");
        console.error(stryMutAct_9fa48("6573") ? "" : (stryCov_9fa48("6573"), "\n❌ Failed to start server:"), error.message);
        if (stryMutAct_9fa48("6575") ? false : stryMutAct_9fa48("6574") ? true : (stryCov_9fa48("6574", "6575"), error.message.includes(stryMutAct_9fa48("6576") ? "" : (stryCov_9fa48("6576"), "DATABASE_URL")))) {
          if (stryMutAct_9fa48("6577")) {
            {}
          } else {
            stryCov_9fa48("6577");
            console.error(stryMutAct_9fa48("6578") ? "" : (stryCov_9fa48("6578"), "\n💡 Fix: Set DATABASE_URL in .env file"));
            console.error(stryMutAct_9fa48("6579") ? "" : (stryCov_9fa48("6579"), "   Example: DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag"));
          }
        } else if (stryMutAct_9fa48("6581") ? false : stryMutAct_9fa48("6580") ? true : (stryCov_9fa48("6580", "6581"), error.message.includes(stryMutAct_9fa48("6582") ? "" : (stryCov_9fa48("6582"), "PostgreSQL")))) {
          if (stryMutAct_9fa48("6583")) {
            {}
          } else {
            stryCov_9fa48("6583");
            console.error(stryMutAct_9fa48("6584") ? "" : (stryCov_9fa48("6584"), "\n💡 Fix: Make sure PostgreSQL is running"));
            console.error(stryMutAct_9fa48("6585") ? "" : (stryCov_9fa48("6585"), "   1. Install PostgreSQL"));
            console.error(stryMutAct_9fa48("6586") ? "" : (stryCov_9fa48("6586"), "   2. Start PostgreSQL service"));
            console.error(stryMutAct_9fa48("6587") ? "" : (stryCov_9fa48("6587"), "   3. Create database: obsidian_rag"));
          }
        } else if (stryMutAct_9fa48("6589") ? false : stryMutAct_9fa48("6588") ? true : (stryCov_9fa48("6588", "6589"), error.message.includes(stryMutAct_9fa48("6590") ? "" : (stryCov_9fa48("6590"), "Ollama")))) {
          if (stryMutAct_9fa48("6591")) {
            {}
          } else {
            stryCov_9fa48("6591");
            console.error(stryMutAct_9fa48("6592") ? "" : (stryCov_9fa48("6592"), "\n💡 Fix: Set up Ollama embedding service"));
            console.error(stryMutAct_9fa48("6593") ? "" : (stryCov_9fa48("6593"), "   1. Install Ollama: https://ollama.com"));
            console.error(stryMutAct_9fa48("6594") ? "" : (stryCov_9fa48("6594"), "   2. Start Ollama: ollama serve"));
            console.error(stryMutAct_9fa48("6595") ? "" : (stryCov_9fa48("6595"), "   3. Pull model: ollama pull embeddinggemma"));
          }
        } else if (stryMutAct_9fa48("6597") ? false : stryMutAct_9fa48("6596") ? true : (stryCov_9fa48("6596", "6597"), error.message.includes(stryMutAct_9fa48("6598") ? "" : (stryCov_9fa48("6598"), "Obsidian Vault")))) {
          if (stryMutAct_9fa48("6599")) {
            {}
          } else {
            stryCov_9fa48("6599");
            console.error(stryMutAct_9fa48("6600") ? "" : (stryCov_9fa48("6600"), "\n💡 Fix: Set OBSIDIAN_VAULT_PATH to a valid Obsidian vault directory"));
          }
        }
        process.exit(1);
      }
    }
  }
}

// Handle unhandled promise rejections
process.on(stryMutAct_9fa48("6601") ? "" : (stryCov_9fa48("6601"), "unhandledRejection"), (reason, promise) => {
  if (stryMutAct_9fa48("6602")) {
    {}
  } else {
    stryCov_9fa48("6602");
    console.error(stryMutAct_9fa48("6603") ? "" : (stryCov_9fa48("6603"), "Unhandled Rejection at:"), promise, stryMutAct_9fa48("6604") ? "" : (stryCov_9fa48("6604"), "reason:"), reason);
    process.exit(1);
  }
});

// Start the server
start();