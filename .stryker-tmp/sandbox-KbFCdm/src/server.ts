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
const DEFAULT_PORT = parseInt(stryMutAct_9fa48("5519") ? process.env.PORT && "3001" : stryMutAct_9fa48("5518") ? false : stryMutAct_9fa48("5517") ? true : (stryCov_9fa48("5517", "5518", "5519"), process.env.PORT || (stryMutAct_9fa48("5520") ? "" : (stryCov_9fa48("5520"), "3001"))));
const HOST = stryMutAct_9fa48("5523") ? process.env.HOST && "0.0.0.0" : stryMutAct_9fa48("5522") ? false : stryMutAct_9fa48("5521") ? true : (stryCov_9fa48("5521", "5522", "5523"), process.env.HOST || (stryMutAct_9fa48("5524") ? "" : (stryCov_9fa48("5524"), "0.0.0.0")));
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_PORT_ATTEMPTS = 10; // Maximum number of ports to try

/**
 * Find an available port starting from the default port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  if (stryMutAct_9fa48("5525")) {
    {}
  } else {
    stryCov_9fa48("5525");
    const net = await import(stryMutAct_9fa48("5526") ? "" : (stryCov_9fa48("5526"), "net"));
    for (let port = startPort; stryMutAct_9fa48("5529") ? port >= startPort + MAX_PORT_ATTEMPTS : stryMutAct_9fa48("5528") ? port <= startPort + MAX_PORT_ATTEMPTS : stryMutAct_9fa48("5527") ? false : (stryCov_9fa48("5527", "5528", "5529"), port < (stryMutAct_9fa48("5530") ? startPort - MAX_PORT_ATTEMPTS : (stryCov_9fa48("5530"), startPort + MAX_PORT_ATTEMPTS))); stryMutAct_9fa48("5531") ? port-- : (stryCov_9fa48("5531"), port++)) {
      if (stryMutAct_9fa48("5532")) {
        {}
      } else {
        stryCov_9fa48("5532");
        const isPortAvailable = await new Promise<boolean>(resolve => {
          if (stryMutAct_9fa48("5533")) {
            {}
          } else {
            stryCov_9fa48("5533");
            const server = net.createServer();
            server.listen(port, HOST, () => {
              if (stryMutAct_9fa48("5534")) {
                {}
              } else {
                stryCov_9fa48("5534");
                server.once(stryMutAct_9fa48("5535") ? "" : (stryCov_9fa48("5535"), "close"), () => {
                  if (stryMutAct_9fa48("5536")) {
                    {}
                  } else {
                    stryCov_9fa48("5536");
                    resolve(stryMutAct_9fa48("5537") ? false : (stryCov_9fa48("5537"), true));
                  }
                });
                server.close();
              }
            });
            server.on(stryMutAct_9fa48("5538") ? "" : (stryCov_9fa48("5538"), "error"), () => {
              if (stryMutAct_9fa48("5539")) {
                {}
              } else {
                stryCov_9fa48("5539");
                resolve(stryMutAct_9fa48("5540") ? true : (stryCov_9fa48("5540"), false));
              }
            });
          }
        });
        if (stryMutAct_9fa48("5542") ? false : stryMutAct_9fa48("5541") ? true : (stryCov_9fa48("5541", "5542"), isPortAvailable)) {
          if (stryMutAct_9fa48("5543")) {
            {}
          } else {
            stryCov_9fa48("5543");
            console.log(stryMutAct_9fa48("5544") ? `` : (stryCov_9fa48("5544"), `✅ Port ${port} is available`));
            return port;
          }
        } else {
          if (stryMutAct_9fa48("5545")) {
            {}
          } else {
            stryCov_9fa48("5545");
            console.log(stryMutAct_9fa48("5546") ? `` : (stryCov_9fa48("5546"), `⚠️  Port ${port} is in use, trying ${stryMutAct_9fa48("5547") ? port - 1 : (stryCov_9fa48("5547"), port + 1)}...`));
          }
        }
      }
    }
    throw new Error(stryMutAct_9fa48("5548") ? `` : (stryCov_9fa48("5548"), `❌ No available ports found in range ${startPort}-${stryMutAct_9fa48("5549") ? startPort + MAX_PORT_ATTEMPTS + 1 : (stryCov_9fa48("5549"), (stryMutAct_9fa48("5550") ? startPort - MAX_PORT_ATTEMPTS : (stryCov_9fa48("5550"), startPort + MAX_PORT_ATTEMPTS)) - 1)}`));
  }
}
const EMBEDDING_MODEL = stryMutAct_9fa48("5553") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("5552") ? false : stryMutAct_9fa48("5551") ? true : (stryCov_9fa48("5551", "5552", "5553"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("5554") ? "" : (stryCov_9fa48("5554"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("5557") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("5556") ? false : stryMutAct_9fa48("5555") ? true : (stryCov_9fa48("5555", "5556", "5557"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("5558") ? "" : (stryCov_9fa48("5558"), "768"))));
const LLM_MODEL = stryMutAct_9fa48("5561") ? process.env.LLM_MODEL && "llama3.1" : stryMutAct_9fa48("5560") ? false : stryMutAct_9fa48("5559") ? true : (stryCov_9fa48("5559", "5560", "5561"), process.env.LLM_MODEL || (stryMutAct_9fa48("5562") ? "" : (stryCov_9fa48("5562"), "llama3.1")));
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("5565") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("5564") ? false : stryMutAct_9fa48("5563") ? true : (stryCov_9fa48("5563", "5564", "5565"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("5566") ? "" : (stryCov_9fa48("5566"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));

// Create Fastify server instance
const server = Fastify(stryMutAct_9fa48("5567") ? {} : (stryCov_9fa48("5567"), {
  logger: stryMutAct_9fa48("5568") ? {} : (stryCov_9fa48("5568"), {
    transport: stryMutAct_9fa48("5569") ? {} : (stryCov_9fa48("5569"), {
      target: stryMutAct_9fa48("5570") ? "" : (stryCov_9fa48("5570"), "pino-pretty")
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
  if (stryMutAct_9fa48("5571")) {
    {}
  } else {
    stryCov_9fa48("5571");
    if (stryMutAct_9fa48("5574") ? false : stryMutAct_9fa48("5573") ? true : stryMutAct_9fa48("5572") ? DATABASE_URL : (stryCov_9fa48("5572", "5573", "5574"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5575")) {
        {}
      } else {
        stryCov_9fa48("5575");
        throw new Error(stryMutAct_9fa48("5576") ? "" : (stryCov_9fa48("5576"), "DATABASE_URL environment variable is required"));
      }
    }
    console.log(stryMutAct_9fa48("5577") ? "" : (stryCov_9fa48("5577"), "🚀 Initializing Obsidian RAG services..."));

    // Initialize database with better error handling
    try {
      if (stryMutAct_9fa48("5578")) {
        {}
      } else {
        stryCov_9fa48("5578");
        database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        console.log(stryMutAct_9fa48("5579") ? "" : (stryCov_9fa48("5579"), "✅ Database initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5580")) {
        {}
      } else {
        stryCov_9fa48("5580");
        console.error(stryMutAct_9fa48("5581") ? "" : (stryCov_9fa48("5581"), "❌ Database initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5582") ? "" : (stryCov_9fa48("5582"), "💡 Make sure PostgreSQL is running and DATABASE_URL is correct"));
        console.error(stryMutAct_9fa48("5583") ? "" : (stryCov_9fa48("5583"), "💡 Example: postgresql://username:password@localhost:5432/obsidian_rag"));
        throw error;
      }
    }

    // Initialize embedding service with better error handling
    try {
      if (stryMutAct_9fa48("5584")) {
        {}
      } else {
        stryCov_9fa48("5584");
        embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5585") ? {} : (stryCov_9fa48("5585"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5588") ? false : stryMutAct_9fa48("5587") ? true : stryMutAct_9fa48("5586") ? embeddingTest.success : (stryCov_9fa48("5586", "5587", "5588"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("5589")) {
            {}
          } else {
            stryCov_9fa48("5589");
            throw new Error(stryMutAct_9fa48("5590") ? "" : (stryCov_9fa48("5590"), "Embedding service connection failed"));
          }
        }
        console.log(stryMutAct_9fa48("5591") ? `` : (stryCov_9fa48("5591"), `✅ Embedding service ready (${embeddingTest.dimension}d)`));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5592")) {
        {}
      } else {
        stryCov_9fa48("5592");
        console.error(stryMutAct_9fa48("5593") ? "" : (stryCov_9fa48("5593"), "❌ Embedding service initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5594") ? "" : (stryCov_9fa48("5594"), "💡 Make sure Ollama is running and the model is available"));
        console.error(stryMutAct_9fa48("5595") ? "" : (stryCov_9fa48("5595"), "💡 Install Ollama: https://ollama.com"));
        console.error(stryMutAct_9fa48("5596") ? "" : (stryCov_9fa48("5596"), "💡 Pull model: ollama pull embeddinggemma"));
        throw error;
      }
    }

    // Initialize search service
    try {
      if (stryMutAct_9fa48("5597")) {
        {}
      } else {
        stryCov_9fa48("5597");
        searchService = new ObsidianSearchService(database, embeddingService);
        console.log(stryMutAct_9fa48("5598") ? "" : (stryCov_9fa48("5598"), "✅ Search service initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5599")) {
        {}
      } else {
        stryCov_9fa48("5599");
        console.error(stryMutAct_9fa48("5600") ? "" : (stryCov_9fa48("5600"), "❌ Search service initialization failed:"), error.message);
        throw error;
      }
    }

    // Initialize ingestion pipeline
    try {
      if (stryMutAct_9fa48("5601")) {
        {}
      } else {
        stryCov_9fa48("5601");
        ingestionPipeline = new ObsidianIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);
        console.log(stryMutAct_9fa48("5602") ? "" : (stryCov_9fa48("5602"), "✅ Ingestion pipeline initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5603")) {
        {}
      } else {
        stryCov_9fa48("5603");
        console.error(stryMutAct_9fa48("5604") ? "" : (stryCov_9fa48("5604"), "❌ Ingestion pipeline initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5605") ? "" : (stryCov_9fa48("5605"), "💡 Make sure OBSIDIAN_VAULT_PATH points to a valid Obsidian vault"));
        throw error;
      }
    }

    // Initialize web search service
    try {
      if (stryMutAct_9fa48("5606")) {
        {}
      } else {
        stryCov_9fa48("5606");
        webSearchService = new WebSearchService(embeddingService);
        console.log(stryMutAct_9fa48("5607") ? "" : (stryCov_9fa48("5607"), "✅ Web search service initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5608")) {
        {}
      } else {
        stryCov_9fa48("5608");
        console.error(stryMutAct_9fa48("5609") ? "" : (stryCov_9fa48("5609"), "❌ Web search service initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5610") ? "" : (stryCov_9fa48("5610"), "💡 Web search will use mock data"));
        // Don't throw - web search can work with mock data
      }
    }

    // Initialize context manager
    try {
      if (stryMutAct_9fa48("5611")) {
        {}
      } else {
        stryCov_9fa48("5611");
        contextManager = new ContextManager(database, embeddingService);
        console.log(stryMutAct_9fa48("5612") ? "" : (stryCov_9fa48("5612"), "✅ Context manager initialized"));
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5613")) {
        {}
      } else {
        stryCov_9fa48("5613");
        console.error(stryMutAct_9fa48("5614") ? "" : (stryCov_9fa48("5614"), "❌ Context manager initialization failed:"), error.message);
        console.error(stryMutAct_9fa48("5615") ? "" : (stryCov_9fa48("5615"), "💡 Context management features will be limited"));
        // Don't throw - context manager can work with limited functionality
      }
    }

    // Initialize web search providers based on environment variables
    if (stryMutAct_9fa48("5618") ? process.env.ENABLE_SEARXNG !== "true" : stryMutAct_9fa48("5617") ? false : stryMutAct_9fa48("5616") ? true : (stryCov_9fa48("5616", "5617", "5618"), process.env.ENABLE_SEARXNG === (stryMutAct_9fa48("5619") ? "" : (stryCov_9fa48("5619"), "true")))) {
      if (stryMutAct_9fa48("5620")) {
        {}
      } else {
        stryCov_9fa48("5620");
        const searxngUrl = stryMutAct_9fa48("5623") ? process.env.SEARXNG_URL && "http://localhost:8888" : stryMutAct_9fa48("5622") ? false : stryMutAct_9fa48("5621") ? true : (stryCov_9fa48("5621", "5622", "5623"), process.env.SEARXNG_URL || (stryMutAct_9fa48("5624") ? "" : (stryCov_9fa48("5624"), "http://localhost:8888")));
        webSearchService.enableSearXNG(searxngUrl);
        console.log(stryMutAct_9fa48("5625") ? "" : (stryCov_9fa48("5625"), "🔍 SearXNG web search enabled"));
      }
    }
    if (stryMutAct_9fa48("5628") ? process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_CX : stryMutAct_9fa48("5627") ? false : stryMutAct_9fa48("5626") ? true : (stryCov_9fa48("5626", "5627", "5628"), process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX)) {
      if (stryMutAct_9fa48("5629")) {
        {}
      } else {
        stryCov_9fa48("5629");
        webSearchService.enableGoogleSearch(process.env.GOOGLE_SEARCH_API_KEY, process.env.GOOGLE_SEARCH_CX);
        console.log(stryMutAct_9fa48("5630") ? "" : (stryCov_9fa48("5630"), "🔍 Google Custom Search enabled"));
      }
    }
    if (stryMutAct_9fa48("5632") ? false : stryMutAct_9fa48("5631") ? true : (stryCov_9fa48("5631", "5632"), process.env.SERPER_API_KEY)) {
      if (stryMutAct_9fa48("5633")) {
        {}
      } else {
        stryCov_9fa48("5633");
        webSearchService.enableSerper(process.env.SERPER_API_KEY);
        console.log(stryMutAct_9fa48("5634") ? "" : (stryCov_9fa48("5634"), "🔍 Serper web search enabled"));
      }
    }
  }
}

/**
 * Health check endpoint
 */
server.get(stryMutAct_9fa48("5635") ? "" : (stryCov_9fa48("5635"), "/health"), async (request, reply): Promise<HealthResponse> => {
  if (stryMutAct_9fa48("5636")) {
    {}
  } else {
    stryCov_9fa48("5636");
    const health: HealthResponse = stryMutAct_9fa48("5637") ? {} : (stryCov_9fa48("5637"), {
      status: stryMutAct_9fa48("5638") ? "" : (stryCov_9fa48("5638"), "healthy"),
      timestamp: new Date().toISOString(),
      version: stryMutAct_9fa48("5639") ? "" : (stryCov_9fa48("5639"), "1.0.0"),
      services: stryMutAct_9fa48("5640") ? {} : (stryCov_9fa48("5640"), {
        database: stryMutAct_9fa48("5641") ? true : (stryCov_9fa48("5641"), false),
        embeddings: stryMutAct_9fa48("5642") ? true : (stryCov_9fa48("5642"), false),
        search: stryMutAct_9fa48("5643") ? true : (stryCov_9fa48("5643"), false),
        ingestion: stryMutAct_9fa48("5644") ? true : (stryCov_9fa48("5644"), false)
      })
    });
    try {
      if (stryMutAct_9fa48("5645")) {
        {}
      } else {
        stryCov_9fa48("5645");
        // Check database connectivity
        if (stryMutAct_9fa48("5647") ? false : stryMutAct_9fa48("5646") ? true : (stryCov_9fa48("5646", "5647"), database)) {
          if (stryMutAct_9fa48("5648")) {
            {}
          } else {
            stryCov_9fa48("5648");
            const stats = await database.getStats();
            health.services.database = stryMutAct_9fa48("5649") ? false : (stryCov_9fa48("5649"), true);
            health.database = stryMutAct_9fa48("5650") ? {} : (stryCov_9fa48("5650"), {
              totalChunks: stats.totalChunks,
              lastUpdate: stats.lastUpdate
            });
          }
        }

        // Check embedding service
        if (stryMutAct_9fa48("5652") ? false : stryMutAct_9fa48("5651") ? true : (stryCov_9fa48("5651", "5652"), embeddingService)) {
          if (stryMutAct_9fa48("5653")) {
            {}
          } else {
            stryCov_9fa48("5653");
            const test = await embeddingService.testConnection();
            health.services.embeddings = test.success;
            health.embeddings = stryMutAct_9fa48("5654") ? {} : (stryCov_9fa48("5654"), {
              model: EMBEDDING_MODEL,
              dimension: EMBEDDING_DIMENSION,
              available: test.success
            });
          }
        }

        // Check search service
        if (stryMutAct_9fa48("5656") ? false : stryMutAct_9fa48("5655") ? true : (stryCov_9fa48("5655", "5656"), searchService)) {
          if (stryMutAct_9fa48("5657")) {
            {}
          } else {
            stryCov_9fa48("5657");
            health.services.search = stryMutAct_9fa48("5658") ? false : (stryCov_9fa48("5658"), true);
          }
        }

        // Check ingestion pipeline
        if (stryMutAct_9fa48("5660") ? false : stryMutAct_9fa48("5659") ? true : (stryCov_9fa48("5659", "5660"), ingestionPipeline)) {
          if (stryMutAct_9fa48("5661")) {
            {}
          } else {
            stryCov_9fa48("5661");
            health.services.ingestion = stryMutAct_9fa48("5662") ? false : (stryCov_9fa48("5662"), true);
          }
        }

        // Overall health status
        const allServicesHealthy = stryMutAct_9fa48("5663") ? Object.values(health.services).some(status => status) : (stryCov_9fa48("5663"), Object.values(health.services).every(stryMutAct_9fa48("5664") ? () => undefined : (stryCov_9fa48("5664"), status => status)));
        health.status = allServicesHealthy ? stryMutAct_9fa48("5665") ? "" : (stryCov_9fa48("5665"), "healthy") : stryMutAct_9fa48("5666") ? "" : (stryCov_9fa48("5666"), "degraded");
        reply.code(allServicesHealthy ? 200 : 503);
        return health;
      }
    } catch (error) {
      if (stryMutAct_9fa48("5667")) {
        {}
      } else {
        stryCov_9fa48("5667");
        console.error(stryMutAct_9fa48("5668") ? "" : (stryCov_9fa48("5668"), "Health check failed:"), error);
        health.status = stryMutAct_9fa48("5669") ? "" : (stryCov_9fa48("5669"), "unhealthy");
        reply.code(503);
        return health;
      }
    }
  }
});

/**
 * Search endpoint
 */
server.post(stryMutAct_9fa48("5670") ? "" : (stryCov_9fa48("5670"), "/search"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("5671")) {
    {}
  } else {
    stryCov_9fa48("5671");
    if (stryMutAct_9fa48("5674") ? false : stryMutAct_9fa48("5673") ? true : stryMutAct_9fa48("5672") ? searchService : (stryCov_9fa48("5672", "5673", "5674"), !searchService)) {
      if (stryMutAct_9fa48("5675")) {
        {}
      } else {
        stryCov_9fa48("5675");
        reply.code(503);
        return stryMutAct_9fa48("5676") ? {} : (stryCov_9fa48("5676"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("5677") ? ["Stryker was here"] : (stryCov_9fa48("5677"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("5678") ? {} : (stryCov_9fa48("5678"), {
            queryConcepts: stryMutAct_9fa48("5679") ? ["Stryker was here"] : (stryCov_9fa48("5679"), []),
            relatedConcepts: stryMutAct_9fa48("5680") ? ["Stryker was here"] : (stryCov_9fa48("5680"), []),
            knowledgeClusters: stryMutAct_9fa48("5681") ? ["Stryker was here"] : (stryCov_9fa48("5681"), [])
          }),
          error: stryMutAct_9fa48("5682") ? "" : (stryCov_9fa48("5682"), "Search service not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    try {
      if (stryMutAct_9fa48("5683")) {
        {}
      } else {
        stryCov_9fa48("5683");
        const searchResponse = await searchService.search(searchRequest.query, stryMutAct_9fa48("5684") ? {} : (stryCov_9fa48("5684"), {
          limit: stryMutAct_9fa48("5687") ? searchRequest.limit && 10 : stryMutAct_9fa48("5686") ? false : stryMutAct_9fa48("5685") ? true : (stryCov_9fa48("5685", "5686", "5687"), searchRequest.limit || 10),
          searchMode: stryMutAct_9fa48("5690") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("5689") ? false : stryMutAct_9fa48("5688") ? true : (stryCov_9fa48("5688", "5689", "5690"), searchRequest.searchMode || (stryMutAct_9fa48("5691") ? "" : (stryCov_9fa48("5691"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("5694") ? searchRequest.includeRelated === false : stryMutAct_9fa48("5693") ? false : stryMutAct_9fa48("5692") ? true : (stryCov_9fa48("5692", "5693", "5694"), searchRequest.includeRelated !== (stryMutAct_9fa48("5695") ? true : (stryCov_9fa48("5695"), false))),
          maxRelated: stryMutAct_9fa48("5698") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("5697") ? false : stryMutAct_9fa48("5696") ? true : (stryCov_9fa48("5696", "5697", "5698"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: stryMutAct_9fa48("5701") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("5700") ? false : stryMutAct_9fa48("5699") ? true : (stryCov_9fa48("5699", "5700", "5701"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));
        reply.code(200);
        return searchResponse;
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5702")) {
        {}
      } else {
        stryCov_9fa48("5702");
        console.error(stryMutAct_9fa48("5703") ? "" : (stryCov_9fa48("5703"), "Search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5704") ? {} : (stryCov_9fa48("5704"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("5705") ? ["Stryker was here"] : (stryCov_9fa48("5705"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("5706") ? {} : (stryCov_9fa48("5706"), {
            queryConcepts: stryMutAct_9fa48("5707") ? ["Stryker was here"] : (stryCov_9fa48("5707"), []),
            relatedConcepts: stryMutAct_9fa48("5708") ? ["Stryker was here"] : (stryCov_9fa48("5708"), []),
            knowledgeClusters: stryMutAct_9fa48("5709") ? ["Stryker was here"] : (stryCov_9fa48("5709"), [])
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
server.post(stryMutAct_9fa48("5710") ? "" : (stryCov_9fa48("5710"), "/ingest"), async (request, reply): Promise<IngestResponse> => {
  if (stryMutAct_9fa48("5711")) {
    {}
  } else {
    stryCov_9fa48("5711");
    if (stryMutAct_9fa48("5714") ? false : stryMutAct_9fa48("5713") ? true : stryMutAct_9fa48("5712") ? ingestionPipeline : (stryCov_9fa48("5712", "5713", "5714"), !ingestionPipeline)) {
      if (stryMutAct_9fa48("5715")) {
        {}
      } else {
        stryCov_9fa48("5715");
        reply.code(503);
        return stryMutAct_9fa48("5716") ? {} : (stryCov_9fa48("5716"), {
          success: stryMutAct_9fa48("5717") ? true : (stryCov_9fa48("5717"), false),
          message: stryMutAct_9fa48("5718") ? "" : (stryCov_9fa48("5718"), "Ingestion pipeline not available"),
          processedFiles: 0,
          totalChunks: 0,
          errors: stryMutAct_9fa48("5719") ? [] : (stryCov_9fa48("5719"), [stryMutAct_9fa48("5720") ? "" : (stryCov_9fa48("5720"), "Ingestion service not initialized")])
        });
      }
    }
    const ingestRequest = request.body as IngestRequest;
    try {
      if (stryMutAct_9fa48("5721")) {
        {}
      } else {
        stryCov_9fa48("5721");
        const result = await ingestionPipeline.ingestVault(stryMutAct_9fa48("5722") ? {} : (stryCov_9fa48("5722"), {
          batchSize: 50,
          rateLimitMs: 100,
          skipExisting: stryMutAct_9fa48("5723") ? ingestRequest.forceRefresh : (stryCov_9fa48("5723"), !ingestRequest.forceRefresh),
          includePatterns: ingestRequest.fileTypes,
          excludePatterns: ingestRequest.folders,
          chunkingOptions: stryMutAct_9fa48("5724") ? {} : (stryCov_9fa48("5724"), {
            maxChunkSize: 1000,
            chunkOverlap: 200,
            preserveStructure: stryMutAct_9fa48("5725") ? false : (stryCov_9fa48("5725"), true),
            includeContext: stryMutAct_9fa48("5726") ? false : (stryCov_9fa48("5726"), true),
            cleanContent: stryMutAct_9fa48("5727") ? false : (stryCov_9fa48("5727"), true)
          })
        }));
        reply.code(200);
        return stryMutAct_9fa48("5728") ? {} : (stryCov_9fa48("5728"), {
          success: result.success,
          message: result.message,
          processedFiles: result.processedFiles,
          totalChunks: result.totalChunks,
          errors: result.errors,
          performance: result.performance
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5729")) {
        {}
      } else {
        stryCov_9fa48("5729");
        console.error(stryMutAct_9fa48("5730") ? "" : (stryCov_9fa48("5730"), "Ingestion failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5731") ? {} : (stryCov_9fa48("5731"), {
          success: stryMutAct_9fa48("5732") ? true : (stryCov_9fa48("5732"), false),
          message: stryMutAct_9fa48("5733") ? "" : (stryCov_9fa48("5733"), "Ingestion failed"),
          processedFiles: 0,
          totalChunks: 0,
          errors: stryMutAct_9fa48("5734") ? [] : (stryCov_9fa48("5734"), [error.message])
        });
      }
    }
  }
});

/**
 * Graph data endpoint
 */
server.get(stryMutAct_9fa48("5735") ? "" : (stryCov_9fa48("5735"), "/graph"), async (request, reply): Promise<GraphResponse> => {
  if (stryMutAct_9fa48("5736")) {
    {}
  } else {
    stryCov_9fa48("5736");
    if (stryMutAct_9fa48("5739") ? false : stryMutAct_9fa48("5738") ? true : stryMutAct_9fa48("5737") ? database : (stryCov_9fa48("5737", "5738", "5739"), !database)) {
      if (stryMutAct_9fa48("5740")) {
        {}
      } else {
        stryCov_9fa48("5740");
        reply.code(503);
        return stryMutAct_9fa48("5741") ? {} : (stryCov_9fa48("5741"), {
          nodes: stryMutAct_9fa48("5742") ? ["Stryker was here"] : (stryCov_9fa48("5742"), []),
          edges: stryMutAct_9fa48("5743") ? ["Stryker was here"] : (stryCov_9fa48("5743"), []),
          clusters: stryMutAct_9fa48("5744") ? ["Stryker was here"] : (stryCov_9fa48("5744"), []),
          error: stryMutAct_9fa48("5745") ? "" : (stryCov_9fa48("5745"), "Database not available")
        });
      }
    }
    try {
      if (stryMutAct_9fa48("5746")) {
        {}
      } else {
        stryCov_9fa48("5746");
        const stats = await database.getStats();

        // Convert stats to graph format
        const nodes = stryMutAct_9fa48("5747") ? ["Stryker was here"] : (stryCov_9fa48("5747"), []);
        const edges = stryMutAct_9fa48("5748") ? ["Stryker was here"] : (stryCov_9fa48("5748"), []);
        const clusters = stryMutAct_9fa48("5749") ? ["Stryker was here"] : (stryCov_9fa48("5749"), []);

        // Create nodes for content types
        const contentTypes = stryMutAct_9fa48("5752") ? stats.byContentType && {} : stryMutAct_9fa48("5751") ? false : stryMutAct_9fa48("5750") ? true : (stryCov_9fa48("5750", "5751", "5752"), stats.byContentType || {});
        for (const [type, count] of Object.entries(contentTypes)) {
          if (stryMutAct_9fa48("5753")) {
            {}
          } else {
            stryCov_9fa48("5753");
            nodes.push(stryMutAct_9fa48("5754") ? {} : (stryCov_9fa48("5754"), {
              id: stryMutAct_9fa48("5755") ? `` : (stryCov_9fa48("5755"), `type_${type}`),
              label: type,
              type: stryMutAct_9fa48("5756") ? "" : (stryCov_9fa48("5756"), "contentType"),
              count: count as number
            }));
          }
        }

        // Create nodes for folders
        const folders = stryMutAct_9fa48("5759") ? stats.byFolder && {} : stryMutAct_9fa48("5758") ? false : stryMutAct_9fa48("5757") ? true : (stryCov_9fa48("5757", "5758", "5759"), stats.byFolder || {});
        for (const [folder, count] of Object.entries(folders)) {
          if (stryMutAct_9fa48("5760")) {
            {}
          } else {
            stryCov_9fa48("5760");
            nodes.push(stryMutAct_9fa48("5761") ? {} : (stryCov_9fa48("5761"), {
              id: stryMutAct_9fa48("5762") ? `` : (stryCov_9fa48("5762"), `folder_${folder}`),
              label: folder,
              type: stryMutAct_9fa48("5763") ? "" : (stryCov_9fa48("5763"), "folder"),
              count: count as number
            }));
          }
        }
        reply.code(200);
        return stryMutAct_9fa48("5764") ? {} : (stryCov_9fa48("5764"), {
          nodes,
          edges,
          clusters,
          metadata: stryMutAct_9fa48("5765") ? {} : (stryCov_9fa48("5765"), {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            generatedAt: new Date().toISOString()
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5766")) {
        {}
      } else {
        stryCov_9fa48("5766");
        console.error(stryMutAct_9fa48("5767") ? "" : (stryCov_9fa48("5767"), "Graph data retrieval failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5768") ? {} : (stryCov_9fa48("5768"), {
          nodes: stryMutAct_9fa48("5769") ? ["Stryker was here"] : (stryCov_9fa48("5769"), []),
          edges: stryMutAct_9fa48("5770") ? ["Stryker was here"] : (stryCov_9fa48("5770"), []),
          clusters: stryMutAct_9fa48("5771") ? ["Stryker was here"] : (stryCov_9fa48("5771"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Statistics endpoint
 */
server.get(stryMutAct_9fa48("5772") ? "" : (stryCov_9fa48("5772"), "/stats"), async (request, reply): Promise<StatsResponse> => {
  if (stryMutAct_9fa48("5773")) {
    {}
  } else {
    stryCov_9fa48("5773");
    if (stryMutAct_9fa48("5776") ? false : stryMutAct_9fa48("5775") ? true : stryMutAct_9fa48("5774") ? database : (stryCov_9fa48("5774", "5775", "5776"), !database)) {
      if (stryMutAct_9fa48("5777")) {
        {}
      } else {
        stryCov_9fa48("5777");
        reply.code(503);
        return stryMutAct_9fa48("5778") ? {} : (stryCov_9fa48("5778"), {
          totalChunks: 0,
          byContentType: {},
          byFolder: {},
          lastUpdate: null,
          error: stryMutAct_9fa48("5779") ? "" : (stryCov_9fa48("5779"), "Database not available")
        });
      }
    }
    try {
      if (stryMutAct_9fa48("5780")) {
        {}
      } else {
        stryCov_9fa48("5780");
        const stats = await database.getStats();
        reply.code(200);
        return stryMutAct_9fa48("5781") ? {} : (stryCov_9fa48("5781"), {
          totalChunks: stats.totalChunks,
          byContentType: stryMutAct_9fa48("5784") ? stats.byContentType && {} : stryMutAct_9fa48("5783") ? false : stryMutAct_9fa48("5782") ? true : (stryCov_9fa48("5782", "5783", "5784"), stats.byContentType || {}),
          byFolder: stryMutAct_9fa48("5787") ? stats.byFolder && {} : stryMutAct_9fa48("5786") ? false : stryMutAct_9fa48("5785") ? true : (stryCov_9fa48("5785", "5786", "5787"), stats.byFolder || {}),
          lastUpdate: stats.lastUpdate,
          performance: database.getPerformanceMetrics()
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5788")) {
        {}
      } else {
        stryCov_9fa48("5788");
        console.error(stryMutAct_9fa48("5789") ? "" : (stryCov_9fa48("5789"), "Stats retrieval failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5790") ? {} : (stryCov_9fa48("5790"), {
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
server.get(stryMutAct_9fa48("5791") ? "" : (stryCov_9fa48("5791"), "/models"), async (request, reply): Promise<ModelsResponse> => {
  if (stryMutAct_9fa48("5792")) {
    {}
  } else {
    stryCov_9fa48("5792");
    try {
      if (stryMutAct_9fa48("5793")) {
        {}
      } else {
        stryCov_9fa48("5793");
        const models = await ollama.list();
        reply.code(200);
        return stryMutAct_9fa48("5794") ? {} : (stryCov_9fa48("5794"), {
          models: models.models
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5795")) {
        {}
      } else {
        stryCov_9fa48("5795");
        console.error(stryMutAct_9fa48("5796") ? "" : (stryCov_9fa48("5796"), "Failed to list models:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5797") ? {} : (stryCov_9fa48("5797"), {
          models: stryMutAct_9fa48("5798") ? ["Stryker was here"] : (stryCov_9fa48("5798"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Chat endpoint - Generate LLM responses
 */
server.post(stryMutAct_9fa48("5799") ? "" : (stryCov_9fa48("5799"), "/chat"), async (request, reply): Promise<ChatResponse> => {
  if (stryMutAct_9fa48("5800")) {
    {}
  } else {
    stryCov_9fa48("5800");
    const chatRequest = request.body as ChatRequest;
    try {
      if (stryMutAct_9fa48("5801")) {
        {}
      } else {
        stryCov_9fa48("5801");
        // Use the specified model or default to LLM_MODEL
        const model = stryMutAct_9fa48("5804") ? chatRequest.model && LLM_MODEL : stryMutAct_9fa48("5803") ? false : stryMutAct_9fa48("5802") ? true : (stryCov_9fa48("5802", "5803", "5804"), chatRequest.model || LLM_MODEL);

        // Prepare context from conversation history
        const context = stryMutAct_9fa48("5807") ? chatRequest.context && [] : stryMutAct_9fa48("5806") ? false : stryMutAct_9fa48("5805") ? true : (stryCov_9fa48("5805", "5806", "5807"), chatRequest.context || (stryMutAct_9fa48("5808") ? ["Stryker was here"] : (stryCov_9fa48("5808"), [])));
        const messages = stryMutAct_9fa48("5809") ? [] : (stryCov_9fa48("5809"), [...context, stryMutAct_9fa48("5810") ? {} : (stryCov_9fa48("5810"), {
          role: stryMutAct_9fa48("5811") ? "" : (stryCov_9fa48("5811"), "user"),
          content: chatRequest.message
        })]);

        // Add search results context if available
        if (stryMutAct_9fa48("5814") ? chatRequest.searchResults || chatRequest.searchResults.length > 0 : stryMutAct_9fa48("5813") ? false : stryMutAct_9fa48("5812") ? true : (stryCov_9fa48("5812", "5813", "5814"), chatRequest.searchResults && (stryMutAct_9fa48("5817") ? chatRequest.searchResults.length <= 0 : stryMutAct_9fa48("5816") ? chatRequest.searchResults.length >= 0 : stryMutAct_9fa48("5815") ? true : (stryCov_9fa48("5815", "5816", "5817"), chatRequest.searchResults.length > 0)))) {
          if (stryMutAct_9fa48("5818")) {
            {}
          } else {
            stryCov_9fa48("5818");
            const searchContext = stryMutAct_9fa48("5819") ? chatRequest.searchResults
            // Limit to top 3 results for context
            .map((result, index) => `Context ${index + 1}: ${result.text.substring(0, 500)}${result.text.length > 500 ? "..." : ""}`).join("\n\n") : (stryCov_9fa48("5819"), chatRequest.searchResults.slice(0, 3) // Limit to top 3 results for context
            .map(stryMutAct_9fa48("5820") ? () => undefined : (stryCov_9fa48("5820"), (result, index) => stryMutAct_9fa48("5821") ? `` : (stryCov_9fa48("5821"), `Context ${stryMutAct_9fa48("5822") ? index - 1 : (stryCov_9fa48("5822"), index + 1)}: ${stryMutAct_9fa48("5823") ? result.text : (stryCov_9fa48("5823"), result.text.substring(0, 500))}${(stryMutAct_9fa48("5827") ? result.text.length <= 500 : stryMutAct_9fa48("5826") ? result.text.length >= 500 : stryMutAct_9fa48("5825") ? false : stryMutAct_9fa48("5824") ? true : (stryCov_9fa48("5824", "5825", "5826", "5827"), result.text.length > 500)) ? stryMutAct_9fa48("5828") ? "" : (stryCov_9fa48("5828"), "...") : stryMutAct_9fa48("5829") ? "Stryker was here!" : (stryCov_9fa48("5829"), "")}`))).join(stryMutAct_9fa48("5830") ? "" : (stryCov_9fa48("5830"), "\n\n")));
            messages.unshift(stryMutAct_9fa48("5831") ? {} : (stryCov_9fa48("5831"), {
              role: stryMutAct_9fa48("5832") ? "" : (stryCov_9fa48("5832"), "system"),
              content: stryMutAct_9fa48("5833") ? `` : (stryCov_9fa48("5833"), `You have access to the user's knowledge base. Use this context to provide accurate, helpful responses:\n\n${searchContext}`)
            }));
          }
        }

        // Generate response using Ollama
        const response = await ollama.chat(stryMutAct_9fa48("5834") ? {} : (stryCov_9fa48("5834"), {
          model: model,
          messages: messages,
          options: stryMutAct_9fa48("5835") ? {} : (stryCov_9fa48("5835"), {
            temperature: 0.7,
            num_predict: 1000 // Limit response length
          })
        }));
        const aiResponse = response.message.content;

        // Generate suggested actions based on the response
        const suggestedActions = generateSuggestedActions(chatRequest.message, aiResponse, chatRequest.searchResults);
        reply.code(200);
        return stryMutAct_9fa48("5836") ? {} : (stryCov_9fa48("5836"), {
          response: aiResponse,
          context: stryMutAct_9fa48("5837") ? [] : (stryCov_9fa48("5837"), [...context, stryMutAct_9fa48("5838") ? {} : (stryCov_9fa48("5838"), {
            role: stryMutAct_9fa48("5839") ? "" : (stryCov_9fa48("5839"), "user"),
            content: chatRequest.message
          }), stryMutAct_9fa48("5840") ? {} : (stryCov_9fa48("5840"), {
            role: stryMutAct_9fa48("5841") ? "" : (stryCov_9fa48("5841"), "assistant"),
            content: aiResponse
          })]),
          suggestedActions,
          timestamp: new Date().toISOString(),
          model: model
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5842")) {
        {}
      } else {
        stryCov_9fa48("5842");
        console.error(stryMutAct_9fa48("5843") ? "" : (stryCov_9fa48("5843"), "Chat failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5844") ? {} : (stryCov_9fa48("5844"), {
          response: stryMutAct_9fa48("5845") ? `` : (stryCov_9fa48("5845"), `Sorry, I encountered an error while processing your message: ${error.message}`),
          context: stryMutAct_9fa48("5848") ? chatRequest.context && [] : stryMutAct_9fa48("5847") ? false : stryMutAct_9fa48("5846") ? true : (stryCov_9fa48("5846", "5847", "5848"), chatRequest.context || (stryMutAct_9fa48("5849") ? ["Stryker was here"] : (stryCov_9fa48("5849"), []))),
          timestamp: new Date().toISOString(),
          model: stryMutAct_9fa48("5852") ? chatRequest.model && LLM_MODEL : stryMutAct_9fa48("5851") ? false : stryMutAct_9fa48("5850") ? true : (stryCov_9fa48("5850", "5851", "5852"), chatRequest.model || LLM_MODEL)
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
  if (stryMutAct_9fa48("5853")) {
    {}
  } else {
    stryCov_9fa48("5853");
    const actions: Array<{
      type: "refine_search" | "new_search" | "filter" | "explore";
      label: string;
      query?: string;
      filters?: any;
    }> = stryMutAct_9fa48("5854") ? ["Stryker was here"] : (stryCov_9fa48("5854"), []);

    // If we have search results, suggest refinements
    if (stryMutAct_9fa48("5857") ? searchResults || searchResults.length > 0 : stryMutAct_9fa48("5856") ? false : stryMutAct_9fa48("5855") ? true : (stryCov_9fa48("5855", "5856", "5857"), searchResults && (stryMutAct_9fa48("5860") ? searchResults.length <= 0 : stryMutAct_9fa48("5859") ? searchResults.length >= 0 : stryMutAct_9fa48("5858") ? true : (stryCov_9fa48("5858", "5859", "5860"), searchResults.length > 0)))) {
      if (stryMutAct_9fa48("5861")) {
        {}
      } else {
        stryCov_9fa48("5861");
        actions.push(stryMutAct_9fa48("5862") ? {} : (stryCov_9fa48("5862"), {
          type: stryMutAct_9fa48("5863") ? "" : (stryCov_9fa48("5863"), "refine_search"),
          label: stryMutAct_9fa48("5864") ? "" : (stryCov_9fa48("5864"), "Show more results"),
          query: userMessage,
          filters: stryMutAct_9fa48("5865") ? {} : (stryCov_9fa48("5865"), {
            limit: 20
          })
        }));
        actions.push(stryMutAct_9fa48("5866") ? {} : (stryCov_9fa48("5866"), {
          type: stryMutAct_9fa48("5867") ? "" : (stryCov_9fa48("5867"), "filter"),
          label: stryMutAct_9fa48("5868") ? "" : (stryCov_9fa48("5868"), "Filter by content type"),
          filters: stryMutAct_9fa48("5869") ? {} : (stryCov_9fa48("5869"), {
            contentTypes: stryMutAct_9fa48("5870") ? [] : (stryCov_9fa48("5870"), [stryMutAct_9fa48("5871") ? "" : (stryCov_9fa48("5871"), "code"), stryMutAct_9fa48("5872") ? "" : (stryCov_9fa48("5872"), "text")])
          })
        }));
      }
    }

    // Suggest exploring related topics
    const exploreTopics = extractExploreTopics(userMessage, aiResponse);
    exploreTopics.forEach(topic => {
      if (stryMutAct_9fa48("5873")) {
        {}
      } else {
        stryCov_9fa48("5873");
        actions.push(stryMutAct_9fa48("5874") ? {} : (stryCov_9fa48("5874"), {
          type: stryMutAct_9fa48("5875") ? "" : (stryCov_9fa48("5875"), "explore"),
          label: stryMutAct_9fa48("5876") ? `` : (stryCov_9fa48("5876"), `Learn about ${topic}`),
          query: topic
        }));
      }
    });
    return stryMutAct_9fa48("5877") ? actions : (stryCov_9fa48("5877"), actions.slice(0, 4)); // Limit to 4 suggestions
  }
}

/**
 * Extract potential topics to explore from messages
 */
function extractExploreTopics(userMessage: string, aiResponse: string): string[] {
  if (stryMutAct_9fa48("5878")) {
    {}
  } else {
    stryCov_9fa48("5878");
    const topics: string[] = stryMutAct_9fa48("5879") ? ["Stryker was here"] : (stryCov_9fa48("5879"), []);

    // Look for technical terms, concepts, or questions in the response
    const sentences = aiResponse.split(stryMutAct_9fa48("5881") ? /[^.!?]+/ : stryMutAct_9fa48("5880") ? /[.!?]/ : (stryCov_9fa48("5880", "5881"), /[.!?]+/));
    sentences.forEach(sentence => {
      if (stryMutAct_9fa48("5882")) {
        {}
      } else {
        stryCov_9fa48("5882");
        const trimmed = stryMutAct_9fa48("5884") ? sentence.toLowerCase() : stryMutAct_9fa48("5883") ? sentence.trim().toUpperCase() : (stryCov_9fa48("5883", "5884"), sentence.trim().toLowerCase());
        if (stryMutAct_9fa48("5887") ? (trimmed.includes("component") || trimmed.includes("pattern") || trimmed.includes("best practice") || trimmed.includes("example")) && trimmed.includes("tutorial") : stryMutAct_9fa48("5886") ? false : stryMutAct_9fa48("5885") ? true : (stryCov_9fa48("5885", "5886", "5887"), (stryMutAct_9fa48("5889") ? (trimmed.includes("component") || trimmed.includes("pattern") || trimmed.includes("best practice")) && trimmed.includes("example") : stryMutAct_9fa48("5888") ? false : (stryCov_9fa48("5888", "5889"), (stryMutAct_9fa48("5891") ? (trimmed.includes("component") || trimmed.includes("pattern")) && trimmed.includes("best practice") : stryMutAct_9fa48("5890") ? false : (stryCov_9fa48("5890", "5891"), (stryMutAct_9fa48("5893") ? trimmed.includes("component") && trimmed.includes("pattern") : stryMutAct_9fa48("5892") ? false : (stryCov_9fa48("5892", "5893"), trimmed.includes(stryMutAct_9fa48("5894") ? "" : (stryCov_9fa48("5894"), "component")) || trimmed.includes(stryMutAct_9fa48("5895") ? "" : (stryCov_9fa48("5895"), "pattern")))) || trimmed.includes(stryMutAct_9fa48("5896") ? "" : (stryCov_9fa48("5896"), "best practice")))) || trimmed.includes(stryMutAct_9fa48("5897") ? "" : (stryCov_9fa48("5897"), "example")))) || trimmed.includes(stryMutAct_9fa48("5898") ? "" : (stryCov_9fa48("5898"), "tutorial")))) {
          if (stryMutAct_9fa48("5899")) {
            {}
          } else {
            stryCov_9fa48("5899");
            const words = stryMutAct_9fa48("5900") ? trimmed.split(/\s+/) : (stryCov_9fa48("5900"), trimmed.split(stryMutAct_9fa48("5902") ? /\S+/ : stryMutAct_9fa48("5901") ? /\s/ : (stryCov_9fa48("5901", "5902"), /\s+/)).slice(0, 3)); // Take first few words
            if (stryMutAct_9fa48("5906") ? words.length <= 1 : stryMutAct_9fa48("5905") ? words.length >= 1 : stryMutAct_9fa48("5904") ? false : stryMutAct_9fa48("5903") ? true : (stryCov_9fa48("5903", "5904", "5905", "5906"), words.length > 1)) {
              if (stryMutAct_9fa48("5907")) {
                {}
              } else {
                stryCov_9fa48("5907");
                topics.push(words.join(stryMutAct_9fa48("5908") ? "" : (stryCov_9fa48("5908"), " ")));
              }
            }
          }
        }
      }
    });
    return stryMutAct_9fa48("5909") ? [] : (stryCov_9fa48("5909"), [...new Set(topics)]); // Remove duplicates
  }
}

/**
 * Chat history endpoint - Get all chat sessions
 */
server.get(stryMutAct_9fa48("5910") ? "" : (stryCov_9fa48("5910"), "/chat/history"), async (request, reply): Promise<ChatHistoryResponse> => {
  if (stryMutAct_9fa48("5911")) {
    {}
  } else {
    stryCov_9fa48("5911");
    try {
      if (stryMutAct_9fa48("5912")) {
        {}
      } else {
        stryCov_9fa48("5912");
        const sessions = await database.getChatSessions(undefined, 50);
        reply.code(200);
        return stryMutAct_9fa48("5913") ? {} : (stryCov_9fa48("5913"), {
          sessions
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5914")) {
        {}
      } else {
        stryCov_9fa48("5914");
        console.error(stryMutAct_9fa48("5915") ? "" : (stryCov_9fa48("5915"), "Failed to get chat history:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5916") ? {} : (stryCov_9fa48("5916"), {
          sessions: stryMutAct_9fa48("5917") ? ["Stryker was here"] : (stryCov_9fa48("5917"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Save chat session endpoint
 */
server.post(stryMutAct_9fa48("5918") ? "" : (stryCov_9fa48("5918"), "/chat/save"), async (request, reply): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> => {
  if (stryMutAct_9fa48("5919")) {
    {}
  } else {
    stryCov_9fa48("5919");
    const saveRequest = request.body as SaveChatRequest;
    try {
      if (stryMutAct_9fa48("5920")) {
        {}
      } else {
        stryCov_9fa48("5920");
        // Generate a title from the first user message if not provided
        const title = stryMutAct_9fa48("5923") ? saveRequest.title && generateChatTitle(saveRequest.messages) : stryMutAct_9fa48("5922") ? false : stryMutAct_9fa48("5921") ? true : (stryCov_9fa48("5921", "5922", "5923"), saveRequest.title || generateChatTitle(saveRequest.messages));

        // Generate embedding for chat session (but don't include in main document search)
        let sessionEmbedding: number[] | undefined;
        try {
          if (stryMutAct_9fa48("5924")) {
            {}
          } else {
            stryCov_9fa48("5924");
            const conversationText = saveRequest.messages.map(stryMutAct_9fa48("5925") ? () => undefined : (stryCov_9fa48("5925"), msg => stryMutAct_9fa48("5926") ? `` : (stryCov_9fa48("5926"), `${msg.role}: ${msg.content}`))).join(stryMutAct_9fa48("5927") ? "" : (stryCov_9fa48("5927"), "\n"));

            // Use a special marker to distinguish chat embeddings
            const chatContent = stryMutAct_9fa48("5928") ? `` : (stryCov_9fa48("5928"), `[CHAT_SESSION] ${title}\n\n${conversationText}`);
            sessionEmbedding = await embeddingService.embed(chatContent);
          }
        } catch (error) {
          if (stryMutAct_9fa48("5929")) {
            {}
          } else {
            stryCov_9fa48("5929");
            console.warn(stryMutAct_9fa48("5930") ? "" : (stryCov_9fa48("5930"), "Failed to generate chat session embedding:"), error);
          }
        }

        // Create chat session object
        const session: ChatSession = stryMutAct_9fa48("5931") ? {} : (stryCov_9fa48("5931"), {
          id: stryMutAct_9fa48("5932") ? `` : (stryCov_9fa48("5932"), `session_${Date.now()}`),
          title,
          messages: saveRequest.messages,
          model: stryMutAct_9fa48("5935") ? saveRequest.model && LLM_MODEL : stryMutAct_9fa48("5934") ? false : stryMutAct_9fa48("5933") ? true : (stryCov_9fa48("5933", "5934", "5935"), saveRequest.model || LLM_MODEL),
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
        return stryMutAct_9fa48("5936") ? {} : (stryCov_9fa48("5936"), {
          success: stryMutAct_9fa48("5937") ? false : (stryCov_9fa48("5937"), true),
          sessionId: session.id
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5938")) {
        {}
      } else {
        stryCov_9fa48("5938");
        console.error(stryMutAct_9fa48("5939") ? "" : (stryCov_9fa48("5939"), "Failed to save chat session:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5940") ? {} : (stryCov_9fa48("5940"), {
          success: stryMutAct_9fa48("5941") ? true : (stryCov_9fa48("5941"), false),
          error: error.message
        });
      }
    }
  }
});

/**
 * Load chat session endpoint
 */
server.get(stryMutAct_9fa48("5942") ? "" : (stryCov_9fa48("5942"), "/chat/session/:id"), async (request, reply): Promise<{
  session?: ChatSession;
  error?: string;
}> => {
  if (stryMutAct_9fa48("5943")) {
    {}
  } else {
    stryCov_9fa48("5943");
    const {
      id
    } = request.params as {
      id: string;
    };
    try {
      if (stryMutAct_9fa48("5944")) {
        {}
      } else {
        stryCov_9fa48("5944");
        const session = await database.getChatSessionById(id);
        if (stryMutAct_9fa48("5947") ? false : stryMutAct_9fa48("5946") ? true : stryMutAct_9fa48("5945") ? session : (stryCov_9fa48("5945", "5946", "5947"), !session)) {
          if (stryMutAct_9fa48("5948")) {
            {}
          } else {
            stryCov_9fa48("5948");
            reply.code(404);
            return stryMutAct_9fa48("5949") ? {} : (stryCov_9fa48("5949"), {
              error: stryMutAct_9fa48("5950") ? "" : (stryCov_9fa48("5950"), "Chat session not found")
            });
          }
        }
        reply.code(200);
        return stryMutAct_9fa48("5951") ? {} : (stryCov_9fa48("5951"), {
          session
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5952")) {
        {}
      } else {
        stryCov_9fa48("5952");
        console.error(stryMutAct_9fa48("5953") ? "" : (stryCov_9fa48("5953"), "Failed to load chat session:"), error);
        reply.code(500);
        return stryMutAct_9fa48("5954") ? {} : (stryCov_9fa48("5954"), {
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
  if (stryMutAct_9fa48("5955")) {
    {}
  } else {
    stryCov_9fa48("5955");
    // Find the first user message
    const firstUserMessage = messages.find(stryMutAct_9fa48("5956") ? () => undefined : (stryCov_9fa48("5956"), msg => stryMutAct_9fa48("5959") ? msg.role !== "user" : stryMutAct_9fa48("5958") ? false : stryMutAct_9fa48("5957") ? true : (stryCov_9fa48("5957", "5958", "5959"), msg.role === (stryMutAct_9fa48("5960") ? "" : (stryCov_9fa48("5960"), "user")))));
    if (stryMutAct_9fa48("5963") ? false : stryMutAct_9fa48("5962") ? true : stryMutAct_9fa48("5961") ? firstUserMessage : (stryCov_9fa48("5961", "5962", "5963"), !firstUserMessage)) {
      if (stryMutAct_9fa48("5964")) {
        {}
      } else {
        stryCov_9fa48("5964");
        return stryMutAct_9fa48("5965") ? "" : (stryCov_9fa48("5965"), "New Chat");
      }
    }

    // Truncate to first 50 characters for title
    const content = firstUserMessage.content;
    const title = (stryMutAct_9fa48("5969") ? content.length <= 50 : stryMutAct_9fa48("5968") ? content.length >= 50 : stryMutAct_9fa48("5967") ? false : stryMutAct_9fa48("5966") ? true : (stryCov_9fa48("5966", "5967", "5968", "5969"), content.length > 50)) ? (stryMutAct_9fa48("5970") ? content : (stryCov_9fa48("5970"), content.substring(0, 50))) + (stryMutAct_9fa48("5971") ? "" : (stryCov_9fa48("5971"), "...")) : content;
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
  if (stryMutAct_9fa48("5972")) {
    {}
  } else {
    stryCov_9fa48("5972");
    try {
      if (stryMutAct_9fa48("5973")) {
        {}
      } else {
        stryCov_9fa48("5973");
        // Create a summary prompt
        const conversationText = messages.map(stryMutAct_9fa48("5974") ? () => undefined : (stryCov_9fa48("5974"), msg => stryMutAct_9fa48("5975") ? `` : (stryCov_9fa48("5975"), `${msg.role}: ${msg.content}`))).join(stryMutAct_9fa48("5976") ? "" : (stryCov_9fa48("5976"), "\n"));
        const summaryPrompt = stryMutAct_9fa48("5977") ? `` : (stryCov_9fa48("5977"), `Please provide a brief summary of this conversation (max 100 words):\n\n${conversationText}`);
        const response = await ollama.chat(stryMutAct_9fa48("5978") ? {} : (stryCov_9fa48("5978"), {
          model: LLM_MODEL,
          messages: stryMutAct_9fa48("5979") ? [] : (stryCov_9fa48("5979"), [stryMutAct_9fa48("5980") ? {} : (stryCov_9fa48("5980"), {
            role: stryMutAct_9fa48("5981") ? "" : (stryCov_9fa48("5981"), "user"),
            content: summaryPrompt
          })]),
          options: stryMutAct_9fa48("5982") ? {} : (stryCov_9fa48("5982"), {
            temperature: 0.3,
            num_predict: 200 // Limit summary length
          })
        }));
        return stryMutAct_9fa48("5983") ? response.message.content : (stryCov_9fa48("5983"), response.message.content.trim());
      }
    } catch (error) {
      if (stryMutAct_9fa48("5984")) {
        {}
      } else {
        stryCov_9fa48("5984");
        console.warn(stryMutAct_9fa48("5985") ? "" : (stryCov_9fa48("5985"), "Failed to generate session summary:"), error);
        // Fallback: generate a simple summary from the first few messages
        const userMessages = stryMutAct_9fa48("5986") ? messages : (stryCov_9fa48("5986"), messages.filter(stryMutAct_9fa48("5987") ? () => undefined : (stryCov_9fa48("5987"), msg => stryMutAct_9fa48("5990") ? msg.role !== "user" : stryMutAct_9fa48("5989") ? false : stryMutAct_9fa48("5988") ? true : (stryCov_9fa48("5988", "5989", "5990"), msg.role === (stryMutAct_9fa48("5991") ? "" : (stryCov_9fa48("5991"), "user"))))));
        if (stryMutAct_9fa48("5995") ? userMessages.length <= 0 : stryMutAct_9fa48("5994") ? userMessages.length >= 0 : stryMutAct_9fa48("5993") ? false : stryMutAct_9fa48("5992") ? true : (stryCov_9fa48("5992", "5993", "5994", "5995"), userMessages.length > 0)) {
          if (stryMutAct_9fa48("5996")) {
            {}
          } else {
            stryCov_9fa48("5996");
            const firstMessage = userMessages[0].content;
            return (stryMutAct_9fa48("6000") ? firstMessage.length <= 100 : stryMutAct_9fa48("5999") ? firstMessage.length >= 100 : stryMutAct_9fa48("5998") ? false : stryMutAct_9fa48("5997") ? true : (stryCov_9fa48("5997", "5998", "5999", "6000"), firstMessage.length > 100)) ? (stryMutAct_9fa48("6001") ? firstMessage : (stryCov_9fa48("6001"), firstMessage.substring(0, 100))) + (stryMutAct_9fa48("6002") ? "" : (stryCov_9fa48("6002"), "...")) : firstMessage;
          }
        }
        return stryMutAct_9fa48("6003") ? "" : (stryCov_9fa48("6003"), "Chat session");
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
  if (stryMutAct_9fa48("6004")) {
    {}
  } else {
    stryCov_9fa48("6004");
    const topics: string[] = stryMutAct_9fa48("6005") ? ["Stryker was here"] : (stryCov_9fa48("6005"), []);
    const userMessages = stryMutAct_9fa48("6006") ? messages : (stryCov_9fa48("6006"), messages.filter(stryMutAct_9fa48("6007") ? () => undefined : (stryCov_9fa48("6007"), msg => stryMutAct_9fa48("6010") ? msg.role !== "user" : stryMutAct_9fa48("6009") ? false : stryMutAct_9fa48("6008") ? true : (stryCov_9fa48("6008", "6009", "6010"), msg.role === (stryMutAct_9fa48("6011") ? "" : (stryCov_9fa48("6011"), "user"))))));

    // Simple keyword extraction
    const commonKeywords = stryMutAct_9fa48("6012") ? [] : (stryCov_9fa48("6012"), [stryMutAct_9fa48("6013") ? "" : (stryCov_9fa48("6013"), "design"), stryMutAct_9fa48("6014") ? "" : (stryCov_9fa48("6014"), "component"), stryMutAct_9fa48("6015") ? "" : (stryCov_9fa48("6015"), "system"), stryMutAct_9fa48("6016") ? "" : (stryCov_9fa48("6016"), "api"), stryMutAct_9fa48("6017") ? "" : (stryCov_9fa48("6017"), "database"), stryMutAct_9fa48("6018") ? "" : (stryCov_9fa48("6018"), "search"), stryMutAct_9fa48("6019") ? "" : (stryCov_9fa48("6019"), "code"), stryMutAct_9fa48("6020") ? "" : (stryCov_9fa48("6020"), "function"), stryMutAct_9fa48("6021") ? "" : (stryCov_9fa48("6021"), "class"), stryMutAct_9fa48("6022") ? "" : (stryCov_9fa48("6022"), "method"), stryMutAct_9fa48("6023") ? "" : (stryCov_9fa48("6023"), "variable"), stryMutAct_9fa48("6024") ? "" : (stryCov_9fa48("6024"), "algorithm"), stryMutAct_9fa48("6025") ? "" : (stryCov_9fa48("6025"), "project"), stryMutAct_9fa48("6026") ? "" : (stryCov_9fa48("6026"), "feature"), stryMutAct_9fa48("6027") ? "" : (stryCov_9fa48("6027"), "bug"), stryMutAct_9fa48("6028") ? "" : (stryCov_9fa48("6028"), "error"), stryMutAct_9fa48("6029") ? "" : (stryCov_9fa48("6029"), "documentation"), stryMutAct_9fa48("6030") ? "" : (stryCov_9fa48("6030"), "tutorial"), stryMutAct_9fa48("6031") ? "" : (stryCov_9fa48("6031"), "performance"), stryMutAct_9fa48("6032") ? "" : (stryCov_9fa48("6032"), "optimization"), stryMutAct_9fa48("6033") ? "" : (stryCov_9fa48("6033"), "security"), stryMutAct_9fa48("6034") ? "" : (stryCov_9fa48("6034"), "testing"), stryMutAct_9fa48("6035") ? "" : (stryCov_9fa48("6035"), "deployment")]);
    userMessages.forEach(msg => {
      if (stryMutAct_9fa48("6036")) {
        {}
      } else {
        stryCov_9fa48("6036");
        const content = stryMutAct_9fa48("6037") ? msg.content.toUpperCase() : (stryCov_9fa48("6037"), msg.content.toLowerCase());
        commonKeywords.forEach(keyword => {
          if (stryMutAct_9fa48("6038")) {
            {}
          } else {
            stryCov_9fa48("6038");
            if (stryMutAct_9fa48("6041") ? content.includes(keyword) || !topics.includes(keyword) : stryMutAct_9fa48("6040") ? false : stryMutAct_9fa48("6039") ? true : (stryCov_9fa48("6039", "6040", "6041"), content.includes(keyword) && (stryMutAct_9fa48("6042") ? topics.includes(keyword) : (stryCov_9fa48("6042"), !topics.includes(keyword))))) {
              if (stryMutAct_9fa48("6043")) {
                {}
              } else {
                stryCov_9fa48("6043");
                topics.push(keyword);
              }
            }
          }
        });
      }
    });

    // Extract technical terms (words starting with capital letters)
    userMessages.forEach(msg => {
      if (stryMutAct_9fa48("6044")) {
        {}
      } else {
        stryCov_9fa48("6044");
        const words = msg.content.split(stryMutAct_9fa48("6046") ? /\S+/ : stryMutAct_9fa48("6045") ? /\s/ : (stryCov_9fa48("6045", "6046"), /\s+/));
        words.forEach(word => {
          if (stryMutAct_9fa48("6047")) {
            {}
          } else {
            stryCov_9fa48("6047");
            if (stryMutAct_9fa48("6050") ? word.length > 3 && word[0] === word[0].toUpperCase() && !topics.includes(word) || !commonKeywords.includes(word.toLowerCase()) : stryMutAct_9fa48("6049") ? false : stryMutAct_9fa48("6048") ? true : (stryCov_9fa48("6048", "6049", "6050"), (stryMutAct_9fa48("6052") ? word.length > 3 && word[0] === word[0].toUpperCase() || !topics.includes(word) : stryMutAct_9fa48("6051") ? true : (stryCov_9fa48("6051", "6052"), (stryMutAct_9fa48("6054") ? word.length > 3 || word[0] === word[0].toUpperCase() : stryMutAct_9fa48("6053") ? true : (stryCov_9fa48("6053", "6054"), (stryMutAct_9fa48("6057") ? word.length <= 3 : stryMutAct_9fa48("6056") ? word.length >= 3 : stryMutAct_9fa48("6055") ? true : (stryCov_9fa48("6055", "6056", "6057"), word.length > 3)) && (stryMutAct_9fa48("6059") ? word[0] !== word[0].toUpperCase() : stryMutAct_9fa48("6058") ? true : (stryCov_9fa48("6058", "6059"), word[0] === (stryMutAct_9fa48("6060") ? word[0].toLowerCase() : (stryCov_9fa48("6060"), word[0].toUpperCase())))))) && (stryMutAct_9fa48("6061") ? topics.includes(word) : (stryCov_9fa48("6061"), !topics.includes(word))))) && (stryMutAct_9fa48("6062") ? commonKeywords.includes(word.toLowerCase()) : (stryCov_9fa48("6062"), !commonKeywords.includes(stryMutAct_9fa48("6063") ? word.toUpperCase() : (stryCov_9fa48("6063"), word.toLowerCase())))))) {
              if (stryMutAct_9fa48("6064")) {
                {}
              } else {
                stryCov_9fa48("6064");
                topics.push(word);
              }
            }
          }
        });
      }
    });
    return stryMutAct_9fa48("6065") ? topics : (stryCov_9fa48("6065"), topics.slice(0, 10)); // Limit to 10 topics
  }
}

/**
 * Delete chat session endpoint
 */
server.delete(stryMutAct_9fa48("6066") ? "" : (stryCov_9fa48("6066"), "/chat/session/:id"), async (request, reply): Promise<{
  success: boolean;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6067")) {
    {}
  } else {
    stryCov_9fa48("6067");
    const {
      id
    } = request.params as {
      id: string;
    };
    try {
      if (stryMutAct_9fa48("6068")) {
        {}
      } else {
        stryCov_9fa48("6068");
        await database.deleteChatSession(id);
        reply.code(200);
        return stryMutAct_9fa48("6069") ? {} : (stryCov_9fa48("6069"), {
          success: stryMutAct_9fa48("6070") ? false : (stryCov_9fa48("6070"), true)
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6071")) {
        {}
      } else {
        stryCov_9fa48("6071");
        console.error(stryMutAct_9fa48("6072") ? "" : (stryCov_9fa48("6072"), "Failed to delete chat session:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6073") ? {} : (stryCov_9fa48("6073"), {
          success: stryMutAct_9fa48("6074") ? true : (stryCov_9fa48("6074"), false),
          error: error.message
        });
      }
    }
  }
});

/**
 * Web search endpoint
 */
server.post(stryMutAct_9fa48("6075") ? "" : (stryCov_9fa48("6075"), "/search/web"), async (request, reply): Promise<WebSearchResponse> => {
  if (stryMutAct_9fa48("6076")) {
    {}
  } else {
    stryCov_9fa48("6076");
    if (stryMutAct_9fa48("6079") ? false : stryMutAct_9fa48("6078") ? true : stryMutAct_9fa48("6077") ? webSearchService : (stryCov_9fa48("6077", "6078", "6079"), !webSearchService)) {
      if (stryMutAct_9fa48("6080")) {
        {}
      } else {
        stryCov_9fa48("6080");
        reply.code(503);
        return stryMutAct_9fa48("6081") ? {} : (stryCov_9fa48("6081"), {
          query: (request.body as WebSearchRequest).query,
          results: stryMutAct_9fa48("6082") ? ["Stryker was here"] : (stryCov_9fa48("6082"), []),
          totalFound: 0,
          searchTime: 0,
          error: stryMutAct_9fa48("6083") ? "" : (stryCov_9fa48("6083"), "Web search service not available")
        });
      }
    }
    const searchRequest = request.body as WebSearchRequest;
    const startTime = Date.now();
    try {
      if (stryMutAct_9fa48("6084")) {
        {}
      } else {
        stryCov_9fa48("6084");
        const results = await webSearchService.search(searchRequest.query, stryMutAct_9fa48("6085") ? {} : (stryCov_9fa48("6085"), {
          maxResults: stryMutAct_9fa48("6088") ? searchRequest.maxResults && 10 : stryMutAct_9fa48("6087") ? false : stryMutAct_9fa48("6086") ? true : (stryCov_9fa48("6086", "6087", "6088"), searchRequest.maxResults || 10),
          includeSnippets: stryMutAct_9fa48("6091") ? searchRequest.includeSnippets === false : stryMutAct_9fa48("6090") ? false : stryMutAct_9fa48("6089") ? true : (stryCov_9fa48("6089", "6090", "6091"), searchRequest.includeSnippets !== (stryMutAct_9fa48("6092") ? true : (stryCov_9fa48("6092"), false))),
          minRelevanceScore: stryMutAct_9fa48("6095") ? searchRequest.minRelevanceScore && 0.1 : stryMutAct_9fa48("6094") ? false : stryMutAct_9fa48("6093") ? true : (stryCov_9fa48("6093", "6094", "6095"), searchRequest.minRelevanceScore || 0.1),
          sources: searchRequest.sources,
          timeRange: searchRequest.timeRange
        }));
        const searchTime = stryMutAct_9fa48("6096") ? Date.now() + startTime : (stryCov_9fa48("6096"), Date.now() - startTime);
        reply.code(200);
        return stryMutAct_9fa48("6097") ? {} : (stryCov_9fa48("6097"), {
          query: searchRequest.query,
          results: results.map(stryMutAct_9fa48("6098") ? () => undefined : (stryCov_9fa48("6098"), result => stryMutAct_9fa48("6099") ? {} : (stryCov_9fa48("6099"), {
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
      if (stryMutAct_9fa48("6100")) {
        {}
      } else {
        stryCov_9fa48("6100");
        console.error(stryMutAct_9fa48("6101") ? "" : (stryCov_9fa48("6101"), "Web search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6102") ? {} : (stryCov_9fa48("6102"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6103") ? ["Stryker was here"] : (stryCov_9fa48("6103"), []),
          totalFound: 0,
          searchTime: stryMutAct_9fa48("6104") ? Date.now() + startTime : (stryCov_9fa48("6104"), Date.now() - startTime),
          error: error.message
        });
      }
    }
  }
});

/**
 * Enhanced search endpoint with web search integration
 */
server.post(stryMutAct_9fa48("6105") ? "" : (stryCov_9fa48("6105"), "/search/enhanced"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("6106")) {
    {}
  } else {
    stryCov_9fa48("6106");
    if (stryMutAct_9fa48("6109") ? false : stryMutAct_9fa48("6108") ? true : stryMutAct_9fa48("6107") ? searchService : (stryCov_9fa48("6107", "6108", "6109"), !searchService)) {
      if (stryMutAct_9fa48("6110")) {
        {}
      } else {
        stryCov_9fa48("6110");
        reply.code(503);
        return stryMutAct_9fa48("6111") ? {} : (stryCov_9fa48("6111"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("6112") ? ["Stryker was here"] : (stryCov_9fa48("6112"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6113") ? {} : (stryCov_9fa48("6113"), {
            queryConcepts: stryMutAct_9fa48("6114") ? ["Stryker was here"] : (stryCov_9fa48("6114"), []),
            relatedConcepts: stryMutAct_9fa48("6115") ? ["Stryker was here"] : (stryCov_9fa48("6115"), []),
            knowledgeClusters: stryMutAct_9fa48("6116") ? ["Stryker was here"] : (stryCov_9fa48("6116"), [])
          }),
          error: stryMutAct_9fa48("6117") ? "" : (stryCov_9fa48("6117"), "Search service not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    const startTime = Date.now();
    try {
      if (stryMutAct_9fa48("6118")) {
        {}
      } else {
        stryCov_9fa48("6118");
        // Perform regular knowledge base search
        const kbResults = await searchService.search(searchRequest.query, stryMutAct_9fa48("6119") ? {} : (stryCov_9fa48("6119"), {
          limit: Math.floor(stryMutAct_9fa48("6120") ? (searchRequest.limit || 10) / 0.7 : (stryCov_9fa48("6120"), (stryMutAct_9fa48("6123") ? searchRequest.limit && 10 : stryMutAct_9fa48("6122") ? false : stryMutAct_9fa48("6121") ? true : (stryCov_9fa48("6121", "6122", "6123"), searchRequest.limit || 10)) * 0.7)),
          // Reserve 30% for web results
          searchMode: stryMutAct_9fa48("6126") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("6125") ? false : stryMutAct_9fa48("6124") ? true : (stryCov_9fa48("6124", "6125", "6126"), searchRequest.searchMode || (stryMutAct_9fa48("6127") ? "" : (stryCov_9fa48("6127"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("6130") ? searchRequest.includeRelated === false : stryMutAct_9fa48("6129") ? false : stryMutAct_9fa48("6128") ? true : (stryCov_9fa48("6128", "6129", "6130"), searchRequest.includeRelated !== (stryMutAct_9fa48("6131") ? true : (stryCov_9fa48("6131"), false))),
          maxRelated: stryMutAct_9fa48("6134") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("6133") ? false : stryMutAct_9fa48("6132") ? true : (stryCov_9fa48("6132", "6133", "6134"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: stryMutAct_9fa48("6137") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("6136") ? false : stryMutAct_9fa48("6135") ? true : (stryCov_9fa48("6135", "6136", "6137"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));
        let allResults = stryMutAct_9fa48("6138") ? [] : (stryCov_9fa48("6138"), [...kbResults.results]);
        let webResults: any[] = stryMutAct_9fa48("6139") ? ["Stryker was here"] : (stryCov_9fa48("6139"), []);

        // Add web search results if requested and web search is available
        if (stryMutAct_9fa48("6142") ? webSearchService || (searchRequest as any).includeWebResults : stryMutAct_9fa48("6141") ? false : stryMutAct_9fa48("6140") ? true : (stryCov_9fa48("6140", "6141", "6142"), webSearchService && (searchRequest as any).includeWebResults)) {
          if (stryMutAct_9fa48("6143")) {
            {}
          } else {
            stryCov_9fa48("6143");
            try {
              if (stryMutAct_9fa48("6144")) {
                {}
              } else {
                stryCov_9fa48("6144");
                const webSearchResults = await webSearchService.search(searchRequest.query, stryMutAct_9fa48("6145") ? {} : (stryCov_9fa48("6145"), {
                  maxResults: Math.floor(stryMutAct_9fa48("6146") ? (searchRequest.limit || 10) / 0.3 : (stryCov_9fa48("6146"), (stryMutAct_9fa48("6149") ? searchRequest.limit && 10 : stryMutAct_9fa48("6148") ? false : stryMutAct_9fa48("6147") ? true : (stryCov_9fa48("6147", "6148", "6149"), searchRequest.limit || 10)) * 0.3)),
                  includeSnippets: stryMutAct_9fa48("6150") ? false : (stryCov_9fa48("6150"), true),
                  minRelevanceScore: 0.3
                }));
                webResults = webSearchResults.map(stryMutAct_9fa48("6151") ? () => undefined : (stryCov_9fa48("6151"), (result, index) => stryMutAct_9fa48("6152") ? {} : (stryCov_9fa48("6152"), {
                  id: stryMutAct_9fa48("6153") ? `` : (stryCov_9fa48("6153"), `web_${Date.now()}_${index}`),
                  text: stryMutAct_9fa48("6154") ? `` : (stryCov_9fa48("6154"), `${result.title}\n\n${result.snippet}`),
                  meta: stryMutAct_9fa48("6155") ? {} : (stryCov_9fa48("6155"), {
                    contentType: stryMutAct_9fa48("6156") ? "" : (stryCov_9fa48("6156"), "web"),
                    section: result.title,
                    breadcrumbs: stryMutAct_9fa48("6157") ? [] : (stryCov_9fa48("6157"), [result.source]),
                    uri: result.url,
                    url: result.url,
                    updatedAt: result.publishedDate,
                    createdAt: result.publishedDate,
                    sourceType: stryMutAct_9fa48("6158") ? "" : (stryCov_9fa48("6158"), "web"),
                    webSource: result.source
                  }),
                  source: stryMutAct_9fa48("6159") ? {} : (stryCov_9fa48("6159"), {
                    type: stryMutAct_9fa48("6160") ? "" : (stryCov_9fa48("6160"), "web"),
                    path: result.url,
                    url: result.url
                  }),
                  cosineSimilarity: result.relevanceScore,
                  rank: stryMutAct_9fa48("6161") ? kbResults.results.length + index - 1 : (stryCov_9fa48("6161"), (stryMutAct_9fa48("6162") ? kbResults.results.length - index : (stryCov_9fa48("6162"), kbResults.results.length + index)) + 1)
                })));
                allResults.push(...webResults);
              }
            } catch (webError) {
              if (stryMutAct_9fa48("6163")) {
                {}
              } else {
                stryCov_9fa48("6163");
                console.warn(stryMutAct_9fa48("6164") ? "" : (stryCov_9fa48("6164"), "Web search failed, continuing with knowledge base results:"), webError);
              }
            }
          }
        }
        const searchTime = stryMutAct_9fa48("6165") ? Date.now() + startTime : (stryCov_9fa48("6165"), Date.now() - startTime);
        reply.code(200);
        return stryMutAct_9fa48("6166") ? {} : (stryCov_9fa48("6166"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6167") ? allResults : (stryCov_9fa48("6167"), allResults.slice(0, stryMutAct_9fa48("6170") ? searchRequest.limit && 10 : stryMutAct_9fa48("6169") ? false : stryMutAct_9fa48("6168") ? true : (stryCov_9fa48("6168", "6169", "6170"), searchRequest.limit || 10))),
          totalFound: allResults.length,
          facets: kbResults.facets,
          graphInsights: stryMutAct_9fa48("6171") ? {} : (stryCov_9fa48("6171"), {
            ...kbResults.graphInsights,
            webResults: webResults.length
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6172")) {
        {}
      } else {
        stryCov_9fa48("6172");
        console.error(stryMutAct_9fa48("6173") ? "" : (stryCov_9fa48("6173"), "Enhanced search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6174") ? {} : (stryCov_9fa48("6174"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6175") ? ["Stryker was here"] : (stryCov_9fa48("6175"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6176") ? {} : (stryCov_9fa48("6176"), {
            queryConcepts: stryMutAct_9fa48("6177") ? ["Stryker was here"] : (stryCov_9fa48("6177"), []),
            relatedConcepts: stryMutAct_9fa48("6178") ? ["Stryker was here"] : (stryCov_9fa48("6178"), []),
            knowledgeClusters: stryMutAct_9fa48("6179") ? ["Stryker was here"] : (stryCov_9fa48("6179"), [])
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
server.post(stryMutAct_9fa48("6180") ? "" : (stryCov_9fa48("6180"), "/search/context"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("6181")) {
    {}
  } else {
    stryCov_9fa48("6181");
    if (stryMutAct_9fa48("6184") ? !searchService && !contextManager : stryMutAct_9fa48("6183") ? false : stryMutAct_9fa48("6182") ? true : (stryCov_9fa48("6182", "6183", "6184"), (stryMutAct_9fa48("6185") ? searchService : (stryCov_9fa48("6185"), !searchService)) || (stryMutAct_9fa48("6186") ? contextManager : (stryCov_9fa48("6186"), !contextManager)))) {
      if (stryMutAct_9fa48("6187")) {
        {}
      } else {
        stryCov_9fa48("6187");
        reply.code(503);
        return stryMutAct_9fa48("6188") ? {} : (stryCov_9fa48("6188"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("6189") ? ["Stryker was here"] : (stryCov_9fa48("6189"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6190") ? {} : (stryCov_9fa48("6190"), {
            queryConcepts: stryMutAct_9fa48("6191") ? ["Stryker was here"] : (stryCov_9fa48("6191"), []),
            relatedConcepts: stryMutAct_9fa48("6192") ? ["Stryker was here"] : (stryCov_9fa48("6192"), []),
            knowledgeClusters: stryMutAct_9fa48("6193") ? ["Stryker was here"] : (stryCov_9fa48("6193"), [])
          }),
          error: stryMutAct_9fa48("6194") ? "" : (stryCov_9fa48("6194"), "Search or context services not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    try {
      if (stryMutAct_9fa48("6195")) {
        {}
      } else {
        stryCov_9fa48("6195");
        // Get context for related documents
        const contextQuery = stryMutAct_9fa48("6196") ? {} : (stryCov_9fa48("6196"), {
          documentIds: stryMutAct_9fa48("6199") ? searchRequest.folders && [] : stryMutAct_9fa48("6198") ? false : stryMutAct_9fa48("6197") ? true : (stryCov_9fa48("6197", "6198", "6199"), searchRequest.folders || (stryMutAct_9fa48("6200") ? ["Stryker was here"] : (stryCov_9fa48("6200"), []))),
          // Use folders as context
          maxRelated: stryMutAct_9fa48("6203") ? searchRequest.maxRelated && 5 : stryMutAct_9fa48("6202") ? false : stryMutAct_9fa48("6201") ? true : (stryCov_9fa48("6201", "6202", "6203"), searchRequest.maxRelated || 5),
          relationshipTypes: stryMutAct_9fa48("6204") ? [] : (stryCov_9fa48("6204"), [stryMutAct_9fa48("6205") ? "" : (stryCov_9fa48("6205"), "references"), stryMutAct_9fa48("6206") ? "" : (stryCov_9fa48("6206"), "similar"), stryMutAct_9fa48("6207") ? "" : (stryCov_9fa48("6207"), "related")]),
          minStrength: 0.3,
          includeIndirect: stryMutAct_9fa48("6208") ? false : (stryCov_9fa48("6208"), true)
        });
        const documentContexts = await contextManager.getDocumentContext(contextQuery);

        // Extract related document IDs for enhanced search
        const relatedDocIds = documentContexts.flatMap(stryMutAct_9fa48("6209") ? () => undefined : (stryCov_9fa48("6209"), ctx => ctx.relatedDocuments.map(stryMutAct_9fa48("6210") ? () => undefined : (stryCov_9fa48("6210"), rel => rel.documentId))));

        // Perform enhanced search with context
        const enhancedSearchRequest = stryMutAct_9fa48("6211") ? {} : (stryCov_9fa48("6211"), {
          ...searchRequest,
          // Include related documents in search
          additionalContext: relatedDocIds
        });
        const searchResults = await searchService.search(searchRequest.query, stryMutAct_9fa48("6212") ? {} : (stryCov_9fa48("6212"), {
          limit: stryMutAct_9fa48("6215") ? searchRequest.limit && 10 : stryMutAct_9fa48("6214") ? false : stryMutAct_9fa48("6213") ? true : (stryCov_9fa48("6213", "6214", "6215"), searchRequest.limit || 10),
          searchMode: stryMutAct_9fa48("6218") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("6217") ? false : stryMutAct_9fa48("6216") ? true : (stryCov_9fa48("6216", "6217", "6218"), searchRequest.searchMode || (stryMutAct_9fa48("6219") ? "" : (stryCov_9fa48("6219"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("6220") ? false : (stryCov_9fa48("6220"), true),
          maxRelated: stryMutAct_9fa48("6223") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("6222") ? false : stryMutAct_9fa48("6221") ? true : (stryCov_9fa48("6221", "6222", "6223"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: stryMutAct_9fa48("6224") ? [] : (stryCov_9fa48("6224"), [...(stryMutAct_9fa48("6227") ? searchRequest.folders && [] : stryMutAct_9fa48("6226") ? false : stryMutAct_9fa48("6225") ? true : (stryCov_9fa48("6225", "6226", "6227"), searchRequest.folders || (stryMutAct_9fa48("6228") ? ["Stryker was here"] : (stryCov_9fa48("6228"), [])))), ...relatedDocIds]),
          minSimilarity: stryMutAct_9fa48("6231") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("6230") ? false : stryMutAct_9fa48("6229") ? true : (stryCov_9fa48("6229", "6230", "6231"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));

        // Add context information to results
        const enhancedResults = searchResults.results.map(stryMutAct_9fa48("6232") ? () => undefined : (stryCov_9fa48("6232"), result => stryMutAct_9fa48("6233") ? {} : (stryCov_9fa48("6233"), {
          ...result,
          contextInfo: stryMutAct_9fa48("6234") ? {} : (stryCov_9fa48("6234"), {
            relatedDocuments: relatedDocIds.length,
            contextStrength: (stryMutAct_9fa48("6238") ? documentContexts.length <= 0 : stryMutAct_9fa48("6237") ? documentContexts.length >= 0 : stryMutAct_9fa48("6236") ? false : stryMutAct_9fa48("6235") ? true : (stryCov_9fa48("6235", "6236", "6237", "6238"), documentContexts.length > 0)) ? stryMutAct_9fa48("6239") ? documentContexts.reduce((sum, ctx) => sum + ctx.importance, 0) * documentContexts.length : (stryCov_9fa48("6239"), documentContexts.reduce(stryMutAct_9fa48("6240") ? () => undefined : (stryCov_9fa48("6240"), (sum, ctx) => stryMutAct_9fa48("6241") ? sum - ctx.importance : (stryCov_9fa48("6241"), sum + ctx.importance)), 0) / documentContexts.length) : 0
          })
        })));
        reply.code(200);
        return stryMutAct_9fa48("6242") ? {} : (stryCov_9fa48("6242"), {
          query: searchRequest.query,
          results: enhancedResults,
          totalFound: searchResults.totalFound,
          facets: searchResults.facets,
          graphInsights: stryMutAct_9fa48("6243") ? {} : (stryCov_9fa48("6243"), {
            ...searchResults.graphInsights,
            contextDocuments: documentContexts.length,
            relatedDocuments: relatedDocIds.length
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6244")) {
        {}
      } else {
        stryCov_9fa48("6244");
        console.error(stryMutAct_9fa48("6245") ? "" : (stryCov_9fa48("6245"), "Context search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6246") ? {} : (stryCov_9fa48("6246"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6247") ? ["Stryker was here"] : (stryCov_9fa48("6247"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6248") ? {} : (stryCov_9fa48("6248"), {
            queryConcepts: stryMutAct_9fa48("6249") ? ["Stryker was here"] : (stryCov_9fa48("6249"), []),
            relatedConcepts: stryMutAct_9fa48("6250") ? ["Stryker was here"] : (stryCov_9fa48("6250"), []),
            knowledgeClusters: stryMutAct_9fa48("6251") ? ["Stryker was here"] : (stryCov_9fa48("6251"), [])
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
server.get(stryMutAct_9fa48("6252") ? "" : (stryCov_9fa48("6252"), "/graph/context"), async (request, reply): Promise<{
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
  if (stryMutAct_9fa48("6253")) {
    {}
  } else {
    stryCov_9fa48("6253");
    if (stryMutAct_9fa48("6256") ? false : stryMutAct_9fa48("6255") ? true : stryMutAct_9fa48("6254") ? contextManager : (stryCov_9fa48("6254", "6255", "6256"), !contextManager)) {
      if (stryMutAct_9fa48("6257")) {
        {}
      } else {
        stryCov_9fa48("6257");
        reply.code(503);
        return stryMutAct_9fa48("6258") ? {} : (stryCov_9fa48("6258"), {
          nodes: stryMutAct_9fa48("6259") ? ["Stryker was here"] : (stryCov_9fa48("6259"), []),
          edges: stryMutAct_9fa48("6260") ? ["Stryker was here"] : (stryCov_9fa48("6260"), []),
          error: stryMutAct_9fa48("6261") ? "" : (stryCov_9fa48("6261"), "Context manager not available")
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
      if (stryMutAct_9fa48("6262")) {
        {}
      } else {
        stryCov_9fa48("6262");
        const graphData = await contextManager.getKnowledgeGraphData(centerDocument, maxNodes);
        const context = contextManager.getContextStats();

        // Get related topics
        const topics = new Set<string>();
        graphData.nodes.forEach(node => {
          if (stryMutAct_9fa48("6263")) {
            {}
          } else {
            stryCov_9fa48("6263");
            // Mock topics extraction - in real implementation, get from document metadata
            if (stryMutAct_9fa48("6265") ? false : stryMutAct_9fa48("6264") ? true : (stryCov_9fa48("6264", "6265"), node.id.includes(stryMutAct_9fa48("6266") ? "" : (stryCov_9fa48("6266"), "api")))) topics.add(stryMutAct_9fa48("6267") ? "" : (stryCov_9fa48("6267"), "API"));
            if (stryMutAct_9fa48("6269") ? false : stryMutAct_9fa48("6268") ? true : (stryCov_9fa48("6268", "6269"), node.id.includes(stryMutAct_9fa48("6270") ? "" : (stryCov_9fa48("6270"), "component")))) topics.add(stryMutAct_9fa48("6271") ? "" : (stryCov_9fa48("6271"), "Components"));
            if (stryMutAct_9fa48("6273") ? false : stryMutAct_9fa48("6272") ? true : (stryCov_9fa48("6272", "6273"), node.id.includes(stryMutAct_9fa48("6274") ? "" : (stryCov_9fa48("6274"), "database")))) topics.add(stryMutAct_9fa48("6275") ? "" : (stryCov_9fa48("6275"), "Database"));
          }
        });
        reply.code(200);
        return stryMutAct_9fa48("6276") ? {} : (stryCov_9fa48("6276"), {
          ...graphData,
          context: stryMutAct_9fa48("6277") ? {} : (stryCov_9fa48("6277"), {
            centerDocument,
            relatedTopics: Array.from(topics),
            relationshipStats: stryMutAct_9fa48("6278") ? {} : (stryCov_9fa48("6278"), {
              totalRelationships: context.totalRelationships,
              averagePerDocument: context.averageRelationshipsPerDocument
            })
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6279")) {
        {}
      } else {
        stryCov_9fa48("6279");
        console.error(stryMutAct_9fa48("6280") ? "" : (stryCov_9fa48("6280"), "Knowledge graph retrieval failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6281") ? {} : (stryCov_9fa48("6281"), {
          nodes: stryMutAct_9fa48("6282") ? ["Stryker was here"] : (stryCov_9fa48("6282"), []),
          edges: stryMutAct_9fa48("6283") ? ["Stryker was here"] : (stryCov_9fa48("6283"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Context suggestions endpoint
 */
server.post(stryMutAct_9fa48("6284") ? "" : (stryCov_9fa48("6284"), "/context/suggestions"), async (request, reply): Promise<{
  suggestions: Array<{
    suggestion: string;
    confidence: number;
    context?: string;
  }>;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6285")) {
    {}
  } else {
    stryCov_9fa48("6285");
    if (stryMutAct_9fa48("6288") ? false : stryMutAct_9fa48("6287") ? true : stryMutAct_9fa48("6286") ? contextManager : (stryCov_9fa48("6286", "6287", "6288"), !contextManager)) {
      if (stryMutAct_9fa48("6289")) {
        {}
      } else {
        stryCov_9fa48("6289");
        reply.code(503);
        return stryMutAct_9fa48("6290") ? {} : (stryCov_9fa48("6290"), {
          suggestions: stryMutAct_9fa48("6291") ? ["Stryker was here"] : (stryCov_9fa48("6291"), []),
          error: stryMutAct_9fa48("6292") ? "" : (stryCov_9fa48("6292"), "Context manager not available")
        });
      }
    }
    const {
      query,
      context = stryMutAct_9fa48("6293") ? ["Stryker was here"] : (stryCov_9fa48("6293"), [])
    } = request.body as {
      query: string;
      context?: string[];
    };
    try {
      if (stryMutAct_9fa48("6294")) {
        {}
      } else {
        stryCov_9fa48("6294");
        const suggestions = await contextManager.getContextualSuggestions(query, context);
        reply.code(200);
        return stryMutAct_9fa48("6295") ? {} : (stryCov_9fa48("6295"), {
          suggestions
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6296")) {
        {}
      } else {
        stryCov_9fa48("6296");
        console.error(stryMutAct_9fa48("6297") ? "" : (stryCov_9fa48("6297"), "Context suggestions failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6298") ? {} : (stryCov_9fa48("6298"), {
          suggestions: stryMutAct_9fa48("6299") ? ["Stryker was here"] : (stryCov_9fa48("6299"), []),
          error: error.message
        });
      }
    }
  }
});

/**
 * Chat session search endpoint - searches only chat sessions, not regular documents
 */
server.post(stryMutAct_9fa48("6300") ? "" : (stryCov_9fa48("6300"), "/search/chat-sessions"), async (request, reply): Promise<{
  query: string;
  results: Array<ChatSession & {
    similarity: number;
  }>;
  totalFound: number;
  error?: string;
}> => {
  if (stryMutAct_9fa48("6301")) {
    {}
  } else {
    stryCov_9fa48("6301");
    if (stryMutAct_9fa48("6304") ? false : stryMutAct_9fa48("6303") ? true : stryMutAct_9fa48("6302") ? database : (stryCov_9fa48("6302", "6303", "6304"), !database)) {
      if (stryMutAct_9fa48("6305")) {
        {}
      } else {
        stryCov_9fa48("6305");
        reply.code(503);
        return stryMutAct_9fa48("6306") ? {} : (stryCov_9fa48("6306"), {
          query: (request.body as {
            query: string;
          }).query,
          results: stryMutAct_9fa48("6307") ? ["Stryker was here"] : (stryCov_9fa48("6307"), []),
          totalFound: 0,
          error: stryMutAct_9fa48("6308") ? "" : (stryCov_9fa48("6308"), "Database not available")
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
      if (stryMutAct_9fa48("6309")) {
        {}
      } else {
        stryCov_9fa48("6309");
        // Generate embedding for the query
        const queryEmbedding = await embeddingService.embed(stryMutAct_9fa48("6310") ? `` : (stryCov_9fa48("6310"), `[CHAT_SEARCH] ${query}`));

        // Search chat sessions using their embeddings
        const chatResults = await database.searchChatSessions(query, queryEmbedding, limit);
        reply.code(200);
        return stryMutAct_9fa48("6311") ? {} : (stryCov_9fa48("6311"), {
          query,
          results: chatResults,
          totalFound: chatResults.length
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6312")) {
        {}
      } else {
        stryCov_9fa48("6312");
        console.error(stryMutAct_9fa48("6313") ? "" : (stryCov_9fa48("6313"), "Chat session search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6314") ? {} : (stryCov_9fa48("6314"), {
          query,
          results: stryMutAct_9fa48("6315") ? ["Stryker was here"] : (stryCov_9fa48("6315"), []),
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
server.post(stryMutAct_9fa48("6316") ? "" : (stryCov_9fa48("6316"), "/search/combined"), async (request, reply): Promise<SearchResponse> => {
  if (stryMutAct_9fa48("6317")) {
    {}
  } else {
    stryCov_9fa48("6317");
    if (stryMutAct_9fa48("6320") ? !searchService && !database : stryMutAct_9fa48("6319") ? false : stryMutAct_9fa48("6318") ? true : (stryCov_9fa48("6318", "6319", "6320"), (stryMutAct_9fa48("6321") ? searchService : (stryCov_9fa48("6321"), !searchService)) || (stryMutAct_9fa48("6322") ? database : (stryCov_9fa48("6322"), !database)))) {
      if (stryMutAct_9fa48("6323")) {
        {}
      } else {
        stryCov_9fa48("6323");
        reply.code(503);
        return stryMutAct_9fa48("6324") ? {} : (stryCov_9fa48("6324"), {
          query: (request.body as SearchRequest).query,
          results: stryMutAct_9fa48("6325") ? ["Stryker was here"] : (stryCov_9fa48("6325"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6326") ? {} : (stryCov_9fa48("6326"), {
            queryConcepts: stryMutAct_9fa48("6327") ? ["Stryker was here"] : (stryCov_9fa48("6327"), []),
            relatedConcepts: stryMutAct_9fa48("6328") ? ["Stryker was here"] : (stryCov_9fa48("6328"), []),
            knowledgeClusters: stryMutAct_9fa48("6329") ? ["Stryker was here"] : (stryCov_9fa48("6329"), [])
          }),
          error: stryMutAct_9fa48("6330") ? "" : (stryCov_9fa48("6330"), "Search services not available")
        });
      }
    }
    const searchRequest = request.body as SearchRequest;
    try {
      if (stryMutAct_9fa48("6331")) {
        {}
      } else {
        stryCov_9fa48("6331");
        // Perform regular document search
        const docResults = await searchService.search(searchRequest.query, stryMutAct_9fa48("6332") ? {} : (stryCov_9fa48("6332"), {
          limit: Math.floor(stryMutAct_9fa48("6333") ? (searchRequest.limit || 10) / 0.8 : (stryCov_9fa48("6333"), (stryMutAct_9fa48("6336") ? searchRequest.limit && 10 : stryMutAct_9fa48("6335") ? false : stryMutAct_9fa48("6334") ? true : (stryCov_9fa48("6334", "6335", "6336"), searchRequest.limit || 10)) * 0.8)),
          // Reserve 20% for chat results
          searchMode: stryMutAct_9fa48("6339") ? searchRequest.searchMode && "comprehensive" : stryMutAct_9fa48("6338") ? false : stryMutAct_9fa48("6337") ? true : (stryCov_9fa48("6337", "6338", "6339"), searchRequest.searchMode || (stryMutAct_9fa48("6340") ? "" : (stryCov_9fa48("6340"), "comprehensive"))),
          includeRelated: stryMutAct_9fa48("6343") ? searchRequest.includeRelated === false : stryMutAct_9fa48("6342") ? false : stryMutAct_9fa48("6341") ? true : (stryCov_9fa48("6341", "6342", "6343"), searchRequest.includeRelated !== (stryMutAct_9fa48("6344") ? true : (stryCov_9fa48("6344"), false))),
          maxRelated: stryMutAct_9fa48("6347") ? searchRequest.maxRelated && 3 : stryMutAct_9fa48("6346") ? false : stryMutAct_9fa48("6345") ? true : (stryCov_9fa48("6345", "6346", "6347"), searchRequest.maxRelated || 3),
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: stryMutAct_9fa48("6350") ? searchRequest.minSimilarity && 0.1 : stryMutAct_9fa48("6349") ? false : stryMutAct_9fa48("6348") ? true : (stryCov_9fa48("6348", "6349", "6350"), searchRequest.minSimilarity || 0.1),
          dateRange: searchRequest.dateRange
        }));
        let allResults = stryMutAct_9fa48("6351") ? [] : (stryCov_9fa48("6351"), [...docResults.results]);
        let chatResults: Array<any> = stryMutAct_9fa48("6352") ? ["Stryker was here"] : (stryCov_9fa48("6352"), []);

        // Only search chat sessions if explicitly requested and not searching within chat context
        if (stryMutAct_9fa48("6355") ? (searchRequest as any).includeChatSessions || !searchRequest.query.includes("[CHAT_SESSION]") : stryMutAct_9fa48("6354") ? false : stryMutAct_9fa48("6353") ? true : (stryCov_9fa48("6353", "6354", "6355"), (searchRequest as any).includeChatSessions && (stryMutAct_9fa48("6356") ? searchRequest.query.includes("[CHAT_SESSION]") : (stryCov_9fa48("6356"), !searchRequest.query.includes(stryMutAct_9fa48("6357") ? "" : (stryCov_9fa48("6357"), "[CHAT_SESSION]")))))) {
          if (stryMutAct_9fa48("6358")) {
            {}
          } else {
            stryCov_9fa48("6358");
            try {
              if (stryMutAct_9fa48("6359")) {
                {}
              } else {
                stryCov_9fa48("6359");
                const queryEmbedding = await embeddingService.embed(stryMutAct_9fa48("6360") ? `` : (stryCov_9fa48("6360"), `[CHAT_SEARCH] ${searchRequest.query}`));
                const chatSearchResults = await database.searchChatSessions(searchRequest.query, queryEmbedding, Math.floor(stryMutAct_9fa48("6361") ? (searchRequest.limit || 10) / 0.2 : (stryCov_9fa48("6361"), (stryMutAct_9fa48("6364") ? searchRequest.limit && 10 : stryMutAct_9fa48("6363") ? false : stryMutAct_9fa48("6362") ? true : (stryCov_9fa48("6362", "6363", "6364"), searchRequest.limit || 10)) * 0.2)));
                chatResults = chatSearchResults.map(stryMutAct_9fa48("6365") ? () => undefined : (stryCov_9fa48("6365"), (session, index) => stryMutAct_9fa48("6366") ? {} : (stryCov_9fa48("6366"), {
                  id: stryMutAct_9fa48("6367") ? `` : (stryCov_9fa48("6367"), `chat_${session.id}`),
                  text: stryMutAct_9fa48("6368") ? `` : (stryCov_9fa48("6368"), `[CHAT SESSION] ${session.title}\n\n${stryMutAct_9fa48("6371") ? session.summary && "No summary available" : stryMutAct_9fa48("6370") ? false : stryMutAct_9fa48("6369") ? true : (stryCov_9fa48("6369", "6370", "6371"), session.summary || (stryMutAct_9fa48("6372") ? "" : (stryCov_9fa48("6372"), "No summary available")))}`),
                  meta: stryMutAct_9fa48("6373") ? {} : (stryCov_9fa48("6373"), {
                    contentType: stryMutAct_9fa48("6374") ? "" : (stryCov_9fa48("6374"), "chat_session"),
                    section: session.title,
                    breadcrumbs: stryMutAct_9fa48("6375") ? [] : (stryCov_9fa48("6375"), [stryMutAct_9fa48("6376") ? `` : (stryCov_9fa48("6376"), `Chat Session`), session.model]),
                    uri: stryMutAct_9fa48("6377") ? `` : (stryCov_9fa48("6377"), `chat://${session.id}`),
                    updatedAt: session.updatedAt,
                    createdAt: session.createdAt,
                    sourceType: stryMutAct_9fa48("6378") ? "" : (stryCov_9fa48("6378"), "chat"),
                    model: session.model,
                    messageCount: session.messageCount,
                    topics: session.topics
                  }),
                  source: stryMutAct_9fa48("6379") ? {} : (stryCov_9fa48("6379"), {
                    type: stryMutAct_9fa48("6380") ? "" : (stryCov_9fa48("6380"), "chat"),
                    path: session.title,
                    url: stryMutAct_9fa48("6381") ? `` : (stryCov_9fa48("6381"), `chat://${session.id}`)
                  }),
                  cosineSimilarity: session.similarity,
                  rank: stryMutAct_9fa48("6382") ? docResults.results.length + index - 1 : (stryCov_9fa48("6382"), (stryMutAct_9fa48("6383") ? docResults.results.length - index : (stryCov_9fa48("6383"), docResults.results.length + index)) + 1)
                })));
                allResults.push(...chatResults);
              }
            } catch (chatError) {
              if (stryMutAct_9fa48("6384")) {
                {}
              } else {
                stryCov_9fa48("6384");
                console.warn(stryMutAct_9fa48("6385") ? "" : (stryCov_9fa48("6385"), "Chat session search failed, continuing with document results:"), chatError);
              }
            }
          }
        }
        reply.code(200);
        return stryMutAct_9fa48("6386") ? {} : (stryCov_9fa48("6386"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6387") ? allResults : (stryCov_9fa48("6387"), allResults.slice(0, stryMutAct_9fa48("6390") ? searchRequest.limit && 10 : stryMutAct_9fa48("6389") ? false : stryMutAct_9fa48("6388") ? true : (stryCov_9fa48("6388", "6389", "6390"), searchRequest.limit || 10))),
          totalFound: allResults.length,
          facets: docResults.facets,
          graphInsights: stryMutAct_9fa48("6391") ? {} : (stryCov_9fa48("6391"), {
            ...docResults.graphInsights,
            chatSessions: chatResults.length,
            hasChatResults: stryMutAct_9fa48("6395") ? chatResults.length <= 0 : stryMutAct_9fa48("6394") ? chatResults.length >= 0 : stryMutAct_9fa48("6393") ? false : stryMutAct_9fa48("6392") ? true : (stryCov_9fa48("6392", "6393", "6394", "6395"), chatResults.length > 0)
          })
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6396")) {
        {}
      } else {
        stryCov_9fa48("6396");
        console.error(stryMutAct_9fa48("6397") ? "" : (stryCov_9fa48("6397"), "Combined search failed:"), error);
        reply.code(500);
        return stryMutAct_9fa48("6398") ? {} : (stryCov_9fa48("6398"), {
          query: searchRequest.query,
          results: stryMutAct_9fa48("6399") ? ["Stryker was here"] : (stryCov_9fa48("6399"), []),
          totalFound: 0,
          facets: {},
          graphInsights: stryMutAct_9fa48("6400") ? {} : (stryCov_9fa48("6400"), {
            queryConcepts: stryMutAct_9fa48("6401") ? ["Stryker was here"] : (stryCov_9fa48("6401"), []),
            relatedConcepts: stryMutAct_9fa48("6402") ? ["Stryker was here"] : (stryCov_9fa48("6402"), []),
            knowledgeClusters: stryMutAct_9fa48("6403") ? ["Stryker was here"] : (stryCov_9fa48("6403"), [])
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
  if (stryMutAct_9fa48("6404")) {
    {}
  } else {
    stryCov_9fa48("6404");
    console.log(stryMutAct_9fa48("6405") ? `` : (stryCov_9fa48("6405"), `\n${signal} received, shutting down gracefully...`));
    try {
      if (stryMutAct_9fa48("6406")) {
        {}
      } else {
        stryCov_9fa48("6406");
        if (stryMutAct_9fa48("6408") ? false : stryMutAct_9fa48("6407") ? true : (stryCov_9fa48("6407", "6408"), database)) {
          if (stryMutAct_9fa48("6409")) {
            {}
          } else {
            stryCov_9fa48("6409");
            await database.close();
            console.log(stryMutAct_9fa48("6410") ? "" : (stryCov_9fa48("6410"), "✅ Database connection closed"));
          }
        }
        await server.close();
        console.log(stryMutAct_9fa48("6411") ? "" : (stryCov_9fa48("6411"), "✅ Server closed"));
        process.exit(0);
      }
    } catch (error) {
      if (stryMutAct_9fa48("6412")) {
        {}
      } else {
        stryCov_9fa48("6412");
        console.error(stryMutAct_9fa48("6413") ? "" : (stryCov_9fa48("6413"), "❌ Error during shutdown:"), error);
        process.exit(1);
      }
    }
  }
}

// Register shutdown handlers
process.on(stryMutAct_9fa48("6414") ? "" : (stryCov_9fa48("6414"), "SIGTERM"), stryMutAct_9fa48("6415") ? () => undefined : (stryCov_9fa48("6415"), () => gracefulShutdown(stryMutAct_9fa48("6416") ? "" : (stryCov_9fa48("6416"), "SIGTERM"))));
process.on(stryMutAct_9fa48("6417") ? "" : (stryCov_9fa48("6417"), "SIGINT"), stryMutAct_9fa48("6418") ? () => undefined : (stryCov_9fa48("6418"), () => gracefulShutdown(stryMutAct_9fa48("6419") ? "" : (stryCov_9fa48("6419"), "SIGINT"))));

// Register CORS plugin
await server.register(cors, stryMutAct_9fa48("6420") ? {} : (stryCov_9fa48("6420"), {
  origin: stryMutAct_9fa48("6421") ? false : (stryCov_9fa48("6421"), true),
  // Allow all origins in development
  credentials: stryMutAct_9fa48("6422") ? false : (stryCov_9fa48("6422"), true)
}));

// Start server
async function start() {
  if (stryMutAct_9fa48("6423")) {
    {}
  } else {
    stryCov_9fa48("6423");
    try {
      if (stryMutAct_9fa48("6424")) {
        {}
      } else {
        stryCov_9fa48("6424");
        console.log(stryMutAct_9fa48("6425") ? "" : (stryCov_9fa48("6425"), "🔧 Starting Obsidian RAG Server..."));
        console.log(stryMutAct_9fa48("6426") ? `` : (stryCov_9fa48("6426"), `🌐 Host: ${HOST}`));
        console.log(stryMutAct_9fa48("6427") ? `` : (stryCov_9fa48("6427"), `🗄️  Database: ${DATABASE_URL ? stryMutAct_9fa48("6428") ? "" : (stryCov_9fa48("6428"), "Configured") : stryMutAct_9fa48("6429") ? "" : (stryCov_9fa48("6429"), "NOT CONFIGURED")}`));
        console.log(stryMutAct_9fa48("6430") ? `` : (stryCov_9fa48("6430"), `🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
        console.log(stryMutAct_9fa48("6431") ? `` : (stryCov_9fa48("6431"), `🧠 LLM: ${LLM_MODEL}`));
        console.log(stryMutAct_9fa48("6432") ? `` : (stryCov_9fa48("6432"), `📁 Obsidian Vault: ${OBSIDIAN_VAULT_PATH}`));
        await initializeServices();

        // Find an available port dynamically
        const PORT = await findAvailablePort(DEFAULT_PORT);
        console.log(stryMutAct_9fa48("6433") ? `` : (stryCov_9fa48("6433"), `📡 Starting on port: ${PORT}`));
        await server.listen(stryMutAct_9fa48("6434") ? {} : (stryCov_9fa48("6434"), {
          port: PORT,
          host: HOST
        }));
        console.log((stryMutAct_9fa48("6435") ? "" : (stryCov_9fa48("6435"), "\n")) + (stryMutAct_9fa48("6436") ? "" : (stryCov_9fa48("6436"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("6437") ? "" : (stryCov_9fa48("6437"), "🚀 Obsidian RAG API server is running!"));
        console.log((stryMutAct_9fa48("6438") ? "" : (stryCov_9fa48("6438"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("6439") ? `` : (stryCov_9fa48("6439"), `📡 Server: http://${HOST}:${PORT}`));
        console.log(stryMutAct_9fa48("6440") ? `` : (stryCov_9fa48("6440"), `📚 API Documentation: http://${HOST}:${PORT}/docs`));
        console.log(stryMutAct_9fa48("6441") ? `` : (stryCov_9fa48("6441"), `🔍 Health check: http://${HOST}:${PORT}/health`));
        console.log(stryMutAct_9fa48("6442") ? `` : (stryCov_9fa48("6442"), `🔍 Search endpoint: http://${HOST}:${PORT}/search`));
        console.log(stryMutAct_9fa48("6443") ? `` : (stryCov_9fa48("6443"), `💬 Chat endpoint: http://${HOST}:${PORT}/chat`));
        console.log(stryMutAct_9fa48("6444") ? `` : (stryCov_9fa48("6444"), `💬 Chat history: http://${HOST}:${PORT}/chat/history`));
        console.log(stryMutAct_9fa48("6445") ? `` : (stryCov_9fa48("6445"), `💬 Save chat: http://${HOST}:${PORT}/chat/save`));
        console.log(stryMutAct_9fa48("6446") ? `` : (stryCov_9fa48("6446"), `💬 Load chat: http://${HOST}:${PORT}/chat/session/:id`));
        console.log(stryMutAct_9fa48("6447") ? `` : (stryCov_9fa48("6447"), `💬 Delete chat: http://${HOST}:${PORT}/chat/session/:id`));
        console.log(stryMutAct_9fa48("6448") ? `` : (stryCov_9fa48("6448"), `🌐 Web search: http://${HOST}:${PORT}/search/web`));
        console.log(stryMutAct_9fa48("6449") ? `` : (stryCov_9fa48("6449"), `🔍 Enhanced search: http://${HOST}:${PORT}/search/enhanced`));
        console.log(stryMutAct_9fa48("6450") ? `` : (stryCov_9fa48("6450"), `🔍 Context search: http://${HOST}:${PORT}/search/context`));
        console.log(stryMutAct_9fa48("6451") ? `` : (stryCov_9fa48("6451"), `🔍 Chat sessions search: http://${HOST}:${PORT}/search/chat-sessions`));
        console.log(stryMutAct_9fa48("6452") ? `` : (stryCov_9fa48("6452"), `🔍 Combined search: http://${HOST}:${PORT}/search/combined`));
        console.log(stryMutAct_9fa48("6453") ? `` : (stryCov_9fa48("6453"), `🕸️  Context graph: http://${HOST}:${PORT}/graph/context`));
        console.log(stryMutAct_9fa48("6454") ? `` : (stryCov_9fa48("6454"), `💡 Context suggestions: http://${HOST}:${PORT}/context/suggestions`));
        console.log(stryMutAct_9fa48("6455") ? `` : (stryCov_9fa48("6455"), `🧠 Models endpoint: http://${HOST}:${PORT}/models`));
        console.log(stryMutAct_9fa48("6456") ? `` : (stryCov_9fa48("6456"), `📥 Ingestion endpoint: http://${HOST}:${PORT}/ingest`));
        console.log(stryMutAct_9fa48("6457") ? `` : (stryCov_9fa48("6457"), `📊 Statistics: http://${HOST}:${PORT}/stats`));
        console.log(stryMutAct_9fa48("6458") ? `` : (stryCov_9fa48("6458"), `🕸️  Graph data: http://${HOST}:${PORT}/graph`));
        console.log((stryMutAct_9fa48("6459") ? "" : (stryCov_9fa48("6459"), "=")).repeat(60));

        // Log helpful setup instructions if needed
        if (stryMutAct_9fa48("6462") ? false : stryMutAct_9fa48("6461") ? true : stryMutAct_9fa48("6460") ? DATABASE_URL : (stryCov_9fa48("6460", "6461", "6462"), !DATABASE_URL)) {
          if (stryMutAct_9fa48("6463")) {
            {}
          } else {
            stryCov_9fa48("6463");
            console.log(stryMutAct_9fa48("6464") ? "" : (stryCov_9fa48("6464"), "\n⚠️  Setup Required:"));
            console.log(stryMutAct_9fa48("6465") ? "" : (stryCov_9fa48("6465"), "   1. Set DATABASE_URL in .env file"));
            console.log(stryMutAct_9fa48("6466") ? "" : (stryCov_9fa48("6466"), "   2. Ensure PostgreSQL is running"));
            console.log(stryMutAct_9fa48("6467") ? "" : (stryCov_9fa48("6467"), "   3. Run: npm run setup"));
          }
        }
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("6468")) {
        {}
      } else {
        stryCov_9fa48("6468");
        console.error(stryMutAct_9fa48("6469") ? "" : (stryCov_9fa48("6469"), "\n❌ Failed to start server:"), error.message);
        if (stryMutAct_9fa48("6471") ? false : stryMutAct_9fa48("6470") ? true : (stryCov_9fa48("6470", "6471"), error.message.includes(stryMutAct_9fa48("6472") ? "" : (stryCov_9fa48("6472"), "DATABASE_URL")))) {
          if (stryMutAct_9fa48("6473")) {
            {}
          } else {
            stryCov_9fa48("6473");
            console.error(stryMutAct_9fa48("6474") ? "" : (stryCov_9fa48("6474"), "\n💡 Fix: Set DATABASE_URL in .env file"));
            console.error(stryMutAct_9fa48("6475") ? "" : (stryCov_9fa48("6475"), "   Example: DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag"));
          }
        } else if (stryMutAct_9fa48("6477") ? false : stryMutAct_9fa48("6476") ? true : (stryCov_9fa48("6476", "6477"), error.message.includes(stryMutAct_9fa48("6478") ? "" : (stryCov_9fa48("6478"), "PostgreSQL")))) {
          if (stryMutAct_9fa48("6479")) {
            {}
          } else {
            stryCov_9fa48("6479");
            console.error(stryMutAct_9fa48("6480") ? "" : (stryCov_9fa48("6480"), "\n💡 Fix: Make sure PostgreSQL is running"));
            console.error(stryMutAct_9fa48("6481") ? "" : (stryCov_9fa48("6481"), "   1. Install PostgreSQL"));
            console.error(stryMutAct_9fa48("6482") ? "" : (stryCov_9fa48("6482"), "   2. Start PostgreSQL service"));
            console.error(stryMutAct_9fa48("6483") ? "" : (stryCov_9fa48("6483"), "   3. Create database: obsidian_rag"));
          }
        } else if (stryMutAct_9fa48("6485") ? false : stryMutAct_9fa48("6484") ? true : (stryCov_9fa48("6484", "6485"), error.message.includes(stryMutAct_9fa48("6486") ? "" : (stryCov_9fa48("6486"), "Ollama")))) {
          if (stryMutAct_9fa48("6487")) {
            {}
          } else {
            stryCov_9fa48("6487");
            console.error(stryMutAct_9fa48("6488") ? "" : (stryCov_9fa48("6488"), "\n💡 Fix: Set up Ollama embedding service"));
            console.error(stryMutAct_9fa48("6489") ? "" : (stryCov_9fa48("6489"), "   1. Install Ollama: https://ollama.com"));
            console.error(stryMutAct_9fa48("6490") ? "" : (stryCov_9fa48("6490"), "   2. Start Ollama: ollama serve"));
            console.error(stryMutAct_9fa48("6491") ? "" : (stryCov_9fa48("6491"), "   3. Pull model: ollama pull embeddinggemma"));
          }
        } else if (stryMutAct_9fa48("6493") ? false : stryMutAct_9fa48("6492") ? true : (stryCov_9fa48("6492", "6493"), error.message.includes(stryMutAct_9fa48("6494") ? "" : (stryCov_9fa48("6494"), "Obsidian Vault")))) {
          if (stryMutAct_9fa48("6495")) {
            {}
          } else {
            stryCov_9fa48("6495");
            console.error(stryMutAct_9fa48("6496") ? "" : (stryCov_9fa48("6496"), "\n💡 Fix: Set OBSIDIAN_VAULT_PATH to a valid Obsidian vault directory"));
          }
        }
        process.exit(1);
      }
    }
  }
}

// Handle unhandled promise rejections
process.on(stryMutAct_9fa48("6497") ? "" : (stryCov_9fa48("6497"), "unhandledRejection"), (reason, promise) => {
  if (stryMutAct_9fa48("6498")) {
    {}
  } else {
    stryCov_9fa48("6498");
    console.error(stryMutAct_9fa48("6499") ? "" : (stryCov_9fa48("6499"), "Unhandled Rejection at:"), promise, stryMutAct_9fa48("6500") ? "" : (stryCov_9fa48("6500"), "reason:"), reason);
    process.exit(1);
  }
});

// Start the server
start();