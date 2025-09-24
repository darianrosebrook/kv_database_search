// @ts-nocheck
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
import ollama from "ollama";
import { EmbeddingConfig } from "../types/index";
import { normalize, normalizeVector } from "./utils";
export interface EmbeddingModel {
  name: string;
  dimension: number;
  type: "semantic" | "keyword" | "hybrid";
  domain?: string;
  strengths: string[];
  limitations: string[];
}
export interface EmbeddingStrategy {
  primaryModel: EmbeddingModel;
  fallbackModels: EmbeddingModel[];
  contentTypeOverrides: Record<string, EmbeddingModel>;
  qualityThresholds: {
    minSimilarity: number;
    maxResults: number;
  };
}
export class ObsidianEmbeddingService {
  private config: EmbeddingConfig;
  private cache: Map<string, number[]> = new Map();
  private strategy: EmbeddingStrategy;
  private performanceMetrics: {
    embedLatency: number[];
    cacheHits: number;
    cacheMisses: number;
    totalRequests: number;
    slowEmbeds: number;
  } = stryMutAct_9fa48("542") ? {} : (stryCov_9fa48("542"), {
    embedLatency: stryMutAct_9fa48("543") ? ["Stryker was here"] : (stryCov_9fa48("543"), []),
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    slowEmbeds: 0
  });

  // Obsidian-optimized embedding models
  private readonly models: EmbeddingModel[] = stryMutAct_9fa48("544") ? [] : (stryCov_9fa48("544"), [stryMutAct_9fa48("545") ? {} : (stryCov_9fa48("545"), {
    name: stryMutAct_9fa48("546") ? "" : (stryCov_9fa48("546"), "embeddinggemma"),
    dimension: 768,
    type: stryMutAct_9fa48("547") ? "" : (stryCov_9fa48("547"), "semantic"),
    domain: stryMutAct_9fa48("548") ? "" : (stryCov_9fa48("548"), "knowledge-base"),
    strengths: stryMutAct_9fa48("549") ? [] : (stryCov_9fa48("549"), [stryMutAct_9fa48("550") ? "" : (stryCov_9fa48("550"), "Fast inference"), stryMutAct_9fa48("551") ? "" : (stryCov_9fa48("551"), "Good for knowledge management"), stryMutAct_9fa48("552") ? "" : (stryCov_9fa48("552"), "Handles markdown well")]),
    limitations: stryMutAct_9fa48("553") ? [] : (stryCov_9fa48("553"), [stryMutAct_9fa48("554") ? "" : (stryCov_9fa48("554"), "Limited domain knowledge"), stryMutAct_9fa48("555") ? "" : (stryCov_9fa48("555"), "May not capture technical terms well")])
  }), stryMutAct_9fa48("556") ? {} : (stryCov_9fa48("556"), {
    name: stryMutAct_9fa48("557") ? "" : (stryCov_9fa48("557"), "nomic-embed-text"),
    dimension: 768,
    type: stryMutAct_9fa48("558") ? "" : (stryCov_9fa48("558"), "semantic"),
    domain: stryMutAct_9fa48("559") ? "" : (stryCov_9fa48("559"), "general"),
    strengths: stryMutAct_9fa48("560") ? [] : (stryCov_9fa48("560"), [stryMutAct_9fa48("561") ? "" : (stryCov_9fa48("561"), "Excellent for general text"), stryMutAct_9fa48("562") ? "" : (stryCov_9fa48("562"), "Good performance on knowledge tasks"), stryMutAct_9fa48("563") ? "" : (stryCov_9fa48("563"), "Handles long documents well")]),
    limitations: stryMutAct_9fa48("564") ? [] : (stryCov_9fa48("564"), [stryMutAct_9fa48("565") ? "" : (stryCov_9fa48("565"), "Larger model, slower inference"), stryMutAct_9fa48("566") ? "" : (stryCov_9fa48("566"), "May be overkill for simple queries")])
  })]);
  constructor(config: EmbeddingConfig) {
    if (stryMutAct_9fa48("567")) {
      {}
    } else {
      stryCov_9fa48("567");
      this.config = config;
      this.strategy = this.createObsidianStrategy();
    }
  }
  private createObsidianStrategy(): EmbeddingStrategy {
    if (stryMutAct_9fa48("568")) {
      {}
    } else {
      stryCov_9fa48("568");
      return stryMutAct_9fa48("569") ? {} : (stryCov_9fa48("569"), {
        primaryModel: stryMutAct_9fa48("572") ? this.models.find(m => m.name === this.config.model) && this.models[0] : stryMutAct_9fa48("571") ? false : stryMutAct_9fa48("570") ? true : (stryCov_9fa48("570", "571", "572"), this.models.find(stryMutAct_9fa48("573") ? () => undefined : (stryCov_9fa48("573"), m => stryMutAct_9fa48("576") ? m.name !== this.config.model : stryMutAct_9fa48("575") ? false : stryMutAct_9fa48("574") ? true : (stryCov_9fa48("574", "575", "576"), m.name === this.config.model))) || this.models[0]),
        fallbackModels: stryMutAct_9fa48("577") ? this.models : (stryCov_9fa48("577"), this.models.filter(stryMutAct_9fa48("578") ? () => undefined : (stryCov_9fa48("578"), m => stryMutAct_9fa48("581") ? m.name === this.config.model : stryMutAct_9fa48("580") ? false : stryMutAct_9fa48("579") ? true : (stryCov_9fa48("579", "580", "581"), m.name !== this.config.model)))),
        contentTypeOverrides: stryMutAct_9fa48("582") ? {} : (stryCov_9fa48("582"), {
          // Obsidian-specific content type optimizations
          moc: this.models.find(stryMutAct_9fa48("583") ? () => undefined : (stryCov_9fa48("583"), m => stryMutAct_9fa48("586") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("585") ? false : stryMutAct_9fa48("584") ? true : (stryCov_9fa48("584", "585", "586"), m.name === (stryMutAct_9fa48("587") ? "" : (stryCov_9fa48("587"), "embeddinggemma")))))!,
          article: this.models.find(stryMutAct_9fa48("588") ? () => undefined : (stryCov_9fa48("588"), m => stryMutAct_9fa48("591") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("590") ? false : stryMutAct_9fa48("589") ? true : (stryCov_9fa48("589", "590", "591"), m.name === (stryMutAct_9fa48("592") ? "" : (stryCov_9fa48("592"), "embeddinggemma")))))!,
          conversation: this.models.find(stryMutAct_9fa48("593") ? () => undefined : (stryCov_9fa48("593"), m => stryMutAct_9fa48("596") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("595") ? false : stryMutAct_9fa48("594") ? true : (stryCov_9fa48("594", "595", "596"), m.name === (stryMutAct_9fa48("597") ? "" : (stryCov_9fa48("597"), "embeddinggemma")))))!,
          "book-note": this.models.find(stryMutAct_9fa48("598") ? () => undefined : (stryCov_9fa48("598"), m => stryMutAct_9fa48("601") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("600") ? false : stryMutAct_9fa48("599") ? true : (stryCov_9fa48("599", "600", "601"), m.name === (stryMutAct_9fa48("602") ? "" : (stryCov_9fa48("602"), "embeddinggemma")))))!,
          note: this.models.find(stryMutAct_9fa48("603") ? () => undefined : (stryCov_9fa48("603"), m => stryMutAct_9fa48("606") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("605") ? false : stryMutAct_9fa48("604") ? true : (stryCov_9fa48("604", "605", "606"), m.name === (stryMutAct_9fa48("607") ? "" : (stryCov_9fa48("607"), "embeddinggemma")))))!
        }),
        qualityThresholds: stryMutAct_9fa48("608") ? {} : (stryCov_9fa48("608"), {
          minSimilarity: 0.3,
          maxResults: 30
        })
      });
    }
  }
  async embed(text: string): Promise<number[]> {
    if (stryMutAct_9fa48("609")) {
      {}
    } else {
      stryCov_9fa48("609");
      const normalizedText = normalize(text);

      // Check cache first
      const cacheKey = stryMutAct_9fa48("610") ? `` : (stryCov_9fa48("610"), `${this.config.model}:${normalizedText}`);
      if (stryMutAct_9fa48("612") ? false : stryMutAct_9fa48("611") ? true : (stryCov_9fa48("611", "612"), this.cache.has(cacheKey))) {
        if (stryMutAct_9fa48("613")) {
          {}
        } else {
          stryCov_9fa48("613");
          return this.cache.get(cacheKey)!;
        }
      }
      try {
        if (stryMutAct_9fa48("614")) {
          {}
        } else {
          stryCov_9fa48("614");
          const response = await ollama.embed(stryMutAct_9fa48("615") ? {} : (stryCov_9fa48("615"), {
            model: this.config.model,
            input: normalizedText
          }));
          if (stryMutAct_9fa48("618") ? !response.embeddings && response.embeddings.length === 0 : stryMutAct_9fa48("617") ? false : stryMutAct_9fa48("616") ? true : (stryCov_9fa48("616", "617", "618"), (stryMutAct_9fa48("619") ? response.embeddings : (stryCov_9fa48("619"), !response.embeddings)) || (stryMutAct_9fa48("621") ? response.embeddings.length !== 0 : stryMutAct_9fa48("620") ? false : (stryCov_9fa48("620", "621"), response.embeddings.length === 0)))) {
            if (stryMutAct_9fa48("622")) {
              {}
            } else {
              stryCov_9fa48("622");
              throw new Error(stryMutAct_9fa48("623") ? "" : (stryCov_9fa48("623"), "No embeddings returned from Ollama"));
            }
          }
          const embedding = response.embeddings[0];

          // Validate dimension
          if (stryMutAct_9fa48("626") ? embedding.length === this.config.dimension : stryMutAct_9fa48("625") ? false : stryMutAct_9fa48("624") ? true : (stryCov_9fa48("624", "625", "626"), embedding.length !== this.config.dimension)) {
            if (stryMutAct_9fa48("627")) {
              {}
            } else {
              stryCov_9fa48("627");
              throw new Error(stryMutAct_9fa48("628") ? `` : (stryCov_9fa48("628"), `Embedding dimension mismatch: expected ${this.config.dimension}, got ${embedding.length}`));
            }
          }

          // Normalize the embedding vector for consistent cosine similarity scores
          const normalizedEmbedding = normalizeVector(embedding);

          // Cache the normalized result
          this.cache.set(cacheKey, normalizedEmbedding);
          return normalizedEmbedding;
        }
      } catch (error) {
        if (stryMutAct_9fa48("629")) {
          {}
        } else {
          stryCov_9fa48("629");
          console.error(stryMutAct_9fa48("630") ? `` : (stryCov_9fa48("630"), `❌ Failed to embed text: ${error}`));
          throw new Error(stryMutAct_9fa48("631") ? `` : (stryCov_9fa48("631"), `Embedding failed: ${error}`));
        }
      }
    }
  }
  async embedBatch(texts: string[], batchSize = 5): Promise<number[][]> {
    if (stryMutAct_9fa48("632")) {
      {}
    } else {
      stryCov_9fa48("632");
      const results: number[][] = stryMutAct_9fa48("633") ? ["Stryker was here"] : (stryCov_9fa48("633"), []);
      for (let i = 0; stryMutAct_9fa48("636") ? i >= texts.length : stryMutAct_9fa48("635") ? i <= texts.length : stryMutAct_9fa48("634") ? false : (stryCov_9fa48("634", "635", "636"), i < texts.length); stryMutAct_9fa48("637") ? i -= batchSize : (stryCov_9fa48("637"), i += batchSize)) {
        if (stryMutAct_9fa48("638")) {
          {}
        } else {
          stryCov_9fa48("638");
          const batch = stryMutAct_9fa48("639") ? texts : (stryCov_9fa48("639"), texts.slice(i, stryMutAct_9fa48("640") ? i - batchSize : (stryCov_9fa48("640"), i + batchSize)));
          const promises = batch.map(stryMutAct_9fa48("641") ? () => undefined : (stryCov_9fa48("641"), text => this.embed(text)));
          const batchResults = await Promise.all(promises);
          results.push(...batchResults);

          // Rate limiting - small delay between batches
          if (stryMutAct_9fa48("645") ? i + batchSize >= texts.length : stryMutAct_9fa48("644") ? i + batchSize <= texts.length : stryMutAct_9fa48("643") ? false : stryMutAct_9fa48("642") ? true : (stryCov_9fa48("642", "643", "644", "645"), (stryMutAct_9fa48("646") ? i - batchSize : (stryCov_9fa48("646"), i + batchSize)) < texts.length)) {
            if (stryMutAct_9fa48("647")) {
              {}
            } else {
              stryCov_9fa48("647");
              await new Promise(stryMutAct_9fa48("648") ? () => undefined : (stryCov_9fa48("648"), resolve => setTimeout(resolve, 100)));
            }
          }
        }
      }
      return results;
    }
  }
  async embedWithStrategy(text: string, contentType?: string, domainHint?: string): Promise<{
    embedding: number[];
    model: EmbeddingModel;
    confidence: number;
  }> {
    if (stryMutAct_9fa48("649")) {
      {}
    } else {
      stryCov_9fa48("649");
      const startTime = performance.now();
      stryMutAct_9fa48("650") ? this.performanceMetrics.totalRequests-- : (stryCov_9fa48("650"), this.performanceMetrics.totalRequests++);
      const normalizedText = normalize(text);

      // Select appropriate model based on content type and domain
      const selectedModel = this.selectModelForContent(contentType, domainHint);

      // Check cache with model-specific key
      const cacheKey = stryMutAct_9fa48("651") ? `` : (stryCov_9fa48("651"), `${selectedModel.name}:${normalizedText}`);
      if (stryMutAct_9fa48("653") ? false : stryMutAct_9fa48("652") ? true : (stryCov_9fa48("652", "653"), this.cache.has(cacheKey))) {
        if (stryMutAct_9fa48("654")) {
          {}
        } else {
          stryCov_9fa48("654");
          stryMutAct_9fa48("655") ? this.performanceMetrics.cacheHits-- : (stryCov_9fa48("655"), this.performanceMetrics.cacheHits++);
          const endTime = performance.now();
          this.performanceMetrics.embedLatency.push(stryMutAct_9fa48("656") ? endTime + startTime : (stryCov_9fa48("656"), endTime - startTime));
          return stryMutAct_9fa48("657") ? {} : (stryCov_9fa48("657"), {
            embedding: this.cache.get(cacheKey)!,
            model: selectedModel,
            confidence: 1.0 // Cached result
          });
        }
      }
      stryMutAct_9fa48("658") ? this.performanceMetrics.cacheMisses-- : (stryCov_9fa48("658"), this.performanceMetrics.cacheMisses++);
      try {
        if (stryMutAct_9fa48("659")) {
          {}
        } else {
          stryCov_9fa48("659");
          // Temporarily switch model if different from current
          const originalModel = this.config.model;
          this.config.model = selectedModel.name;
          const embedding = await this.embedCore(normalizedText);

          // Restore original model
          this.config.model = originalModel;

          // Cache with model-specific key
          this.cache.set(cacheKey, embedding);

          // Calculate confidence based on embedding quality metrics
          const confidence = this.calculateEmbeddingConfidence(embedding, normalizedText);

          // Performance monitoring
          const endTime = performance.now();
          const latency = stryMutAct_9fa48("660") ? endTime + startTime : (stryCov_9fa48("660"), endTime - startTime);
          this.performanceMetrics.embedLatency.push(latency);

          // Track slow embeddings (over 1000ms target for embedding)
          if (stryMutAct_9fa48("664") ? latency <= 1000 : stryMutAct_9fa48("663") ? latency >= 1000 : stryMutAct_9fa48("662") ? false : stryMutAct_9fa48("661") ? true : (stryCov_9fa48("661", "662", "663", "664"), latency > 1000)) {
            if (stryMutAct_9fa48("665")) {
              {}
            } else {
              stryCov_9fa48("665");
              stryMutAct_9fa48("666") ? this.performanceMetrics.slowEmbeds-- : (stryCov_9fa48("666"), this.performanceMetrics.slowEmbeds++);
              console.warn(stryMutAct_9fa48("667") ? `` : (stryCov_9fa48("667"), `⚠️ Slow embedding detected: ${latency.toFixed(2)}ms (target: 1000ms)`));
            }
          }

          // Keep only last 1000 measurements for memory efficiency
          if (stryMutAct_9fa48("671") ? this.performanceMetrics.embedLatency.length <= 1000 : stryMutAct_9fa48("670") ? this.performanceMetrics.embedLatency.length >= 1000 : stryMutAct_9fa48("669") ? false : stryMutAct_9fa48("668") ? true : (stryCov_9fa48("668", "669", "670", "671"), this.performanceMetrics.embedLatency.length > 1000)) {
            if (stryMutAct_9fa48("672")) {
              {}
            } else {
              stryCov_9fa48("672");
              this.performanceMetrics.embedLatency = stryMutAct_9fa48("673") ? this.performanceMetrics.embedLatency : (stryCov_9fa48("673"), this.performanceMetrics.embedLatency.slice(stryMutAct_9fa48("674") ? +500 : (stryCov_9fa48("674"), -500)));
            }
          }
          return stryMutAct_9fa48("675") ? {} : (stryCov_9fa48("675"), {
            embedding,
            model: selectedModel,
            confidence
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("676")) {
          {}
        } else {
          stryCov_9fa48("676");
          console.warn(stryMutAct_9fa48("677") ? `` : (stryCov_9fa48("677"), `Failed to embed with ${selectedModel.name}, trying fallback...`));

          // Try fallback models
          for (const fallbackModel of this.strategy.fallbackModels) {
            if (stryMutAct_9fa48("678")) {
              {}
            } else {
              stryCov_9fa48("678");
              try {
                if (stryMutAct_9fa48("679")) {
                  {}
                } else {
                  stryCov_9fa48("679");
                  const originalModel = this.config.model;
                  this.config.model = fallbackModel.name;
                  const embedding = await this.embedCore(normalizedText);
                  this.config.model = originalModel;
                  const confidence = this.calculateEmbeddingConfidence(embedding, normalizedText);
                  return stryMutAct_9fa48("680") ? {} : (stryCov_9fa48("680"), {
                    embedding,
                    model: fallbackModel,
                    confidence: stryMutAct_9fa48("681") ? confidence / 0.8 : (stryCov_9fa48("681"), confidence * 0.8) // Penalty for fallback
                  });
                }
              } catch (fallbackError) {
                if (stryMutAct_9fa48("682")) {
                  {}
                } else {
                  stryCov_9fa48("682");
                  console.warn(stryMutAct_9fa48("683") ? `` : (stryCov_9fa48("683"), `Fallback model ${fallbackModel.name} also failed`));
                }
              }
            }
          }
          throw new Error(stryMutAct_9fa48("684") ? `` : (stryCov_9fa48("684"), `All embedding models failed for text: ${stryMutAct_9fa48("685") ? normalizedText : (stryCov_9fa48("685"), normalizedText.slice(0, 50))}...`));
        }
      }
    }
  }
  private selectModelForContent(contentType?: string, domainHint?: string): EmbeddingModel {
    if (stryMutAct_9fa48("686")) {
      {}
    } else {
      stryCov_9fa48("686");
      // Content-type specific overrides for Obsidian
      if (stryMutAct_9fa48("689") ? contentType || this.strategy.contentTypeOverrides[contentType] : stryMutAct_9fa48("688") ? false : stryMutAct_9fa48("687") ? true : (stryCov_9fa48("687", "688", "689"), contentType && this.strategy.contentTypeOverrides[contentType])) {
        if (stryMutAct_9fa48("690")) {
          {}
        } else {
          stryCov_9fa48("690");
          return this.strategy.contentTypeOverrides[contentType];
        }
      }

      // Domain-specific selection
      if (stryMutAct_9fa48("692") ? false : stryMutAct_9fa48("691") ? true : (stryCov_9fa48("691", "692"), domainHint)) {
        if (stryMutAct_9fa48("693")) {
          {}
        } else {
          stryCov_9fa48("693");
          const domainModel = this.models.find(stryMutAct_9fa48("694") ? () => undefined : (stryCov_9fa48("694"), m => stryMutAct_9fa48("697") ? m.domain === domainHint && m.name.includes(domainHint) : stryMutAct_9fa48("696") ? false : stryMutAct_9fa48("695") ? true : (stryCov_9fa48("695", "696", "697"), (stryMutAct_9fa48("699") ? m.domain !== domainHint : stryMutAct_9fa48("698") ? false : (stryCov_9fa48("698", "699"), m.domain === domainHint)) || m.name.includes(domainHint))));
          if (stryMutAct_9fa48("701") ? false : stryMutAct_9fa48("700") ? true : (stryCov_9fa48("700", "701"), domainModel)) return domainModel;
        }
      }

      // Default to primary model
      return this.strategy.primaryModel;
    }
  }
  private async embedCore(text: string): Promise<number[]> {
    if (stryMutAct_9fa48("702")) {
      {}
    } else {
      stryCov_9fa48("702");
      const response = await ollama.embed(stryMutAct_9fa48("703") ? {} : (stryCov_9fa48("703"), {
        model: this.config.model,
        input: text
      }));
      if (stryMutAct_9fa48("706") ? !response.embeddings && response.embeddings.length === 0 : stryMutAct_9fa48("705") ? false : stryMutAct_9fa48("704") ? true : (stryCov_9fa48("704", "705", "706"), (stryMutAct_9fa48("707") ? response.embeddings : (stryCov_9fa48("707"), !response.embeddings)) || (stryMutAct_9fa48("709") ? response.embeddings.length !== 0 : stryMutAct_9fa48("708") ? false : (stryCov_9fa48("708", "709"), response.embeddings.length === 0)))) {
        if (stryMutAct_9fa48("710")) {
          {}
        } else {
          stryCov_9fa48("710");
          throw new Error(stryMutAct_9fa48("711") ? "" : (stryCov_9fa48("711"), "No embeddings returned from Ollama"));
        }
      }
      const embedding = response.embeddings[0];

      // Validate dimension (may vary by model)
      if (stryMutAct_9fa48("714") ? embedding.length === this.config.dimension : stryMutAct_9fa48("713") ? false : stryMutAct_9fa48("712") ? true : (stryCov_9fa48("712", "713", "714"), embedding.length !== this.config.dimension)) {
        if (stryMutAct_9fa48("715")) {
          {}
        } else {
          stryCov_9fa48("715");
          // Update config dimension if model uses different size
          this.config.dimension = embedding.length;
        }
      }
      return normalizeVector(embedding);
    }
  }
  private calculateEmbeddingConfidence(embedding: number[], text: string): number {
    if (stryMutAct_9fa48("716")) {
      {}
    } else {
      stryCov_9fa48("716");
      // Simple confidence metric based on embedding properties
      const magnitude = Math.sqrt(embedding.reduce(stryMutAct_9fa48("717") ? () => undefined : (stryCov_9fa48("717"), (sum, x) => stryMutAct_9fa48("718") ? sum - x * x : (stryCov_9fa48("718"), sum + (stryMutAct_9fa48("719") ? x / x : (stryCov_9fa48("719"), x * x)))), 0));
      const sparsity = stryMutAct_9fa48("720") ? embedding.filter(x => Math.abs(x) < 0.01).length * embedding.length : (stryCov_9fa48("720"), (stryMutAct_9fa48("721") ? embedding.length : (stryCov_9fa48("721"), embedding.filter(stryMutAct_9fa48("722") ? () => undefined : (stryCov_9fa48("722"), x => stryMutAct_9fa48("726") ? Math.abs(x) >= 0.01 : stryMutAct_9fa48("725") ? Math.abs(x) <= 0.01 : stryMutAct_9fa48("724") ? false : stryMutAct_9fa48("723") ? true : (stryCov_9fa48("723", "724", "725", "726"), Math.abs(x) < 0.01))).length)) / embedding.length);

      // High magnitude and low sparsity indicate good embeddings
      let confidence = stryMutAct_9fa48("727") ? Math.max(magnitude / 2.0, 1.0) : (stryCov_9fa48("727"), Math.min(stryMutAct_9fa48("728") ? magnitude * 2.0 : (stryCov_9fa48("728"), magnitude / 2.0), 1.0)); // Normalized magnitude
      stryMutAct_9fa48("729") ? confidence /= 1.0 - sparsity * 0.5 : (stryCov_9fa48("729"), confidence *= stryMutAct_9fa48("730") ? 1.0 + sparsity * 0.5 : (stryCov_9fa48("730"), 1.0 - (stryMutAct_9fa48("731") ? sparsity / 0.5 : (stryCov_9fa48("731"), sparsity * 0.5)))); // Penalty for sparsity

      // Boost confidence for Obsidian-specific content patterns
      if (stryMutAct_9fa48("734") ? text.includes("[[") && text.includes("#") : stryMutAct_9fa48("733") ? false : stryMutAct_9fa48("732") ? true : (stryCov_9fa48("732", "733", "734"), text.includes(stryMutAct_9fa48("735") ? "" : (stryCov_9fa48("735"), "[[")) || text.includes(stryMutAct_9fa48("736") ? "" : (stryCov_9fa48("736"), "#")))) {
        if (stryMutAct_9fa48("737")) {
          {}
        } else {
          stryCov_9fa48("737");
          stryMutAct_9fa48("738") ? confidence /= 1.1 : (stryCov_9fa48("738"), confidence *= 1.1); // Boost for wikilinks and tags
        }
      }
      return stryMutAct_9fa48("739") ? Math.min(0.1, Math.min(1.0, confidence)) : (stryCov_9fa48("739"), Math.max(0.1, stryMutAct_9fa48("740") ? Math.max(1.0, confidence) : (stryCov_9fa48("740"), Math.min(1.0, confidence))));
    }
  }
  async testConnection(): Promise<{
    success: boolean;
    dimension: number;
    model: string;
  }> {
    if (stryMutAct_9fa48("741")) {
      {}
    } else {
      stryCov_9fa48("741");
      try {
        if (stryMutAct_9fa48("742")) {
          {}
        } else {
          stryCov_9fa48("742");
          const testText = stryMutAct_9fa48("743") ? "" : (stryCov_9fa48("743"), "This is a test embedding for Obsidian knowledge base.");
          const embedding = await this.embed(testText);
          return stryMutAct_9fa48("744") ? {} : (stryCov_9fa48("744"), {
            success: stryMutAct_9fa48("745") ? false : (stryCov_9fa48("745"), true),
            dimension: embedding.length,
            model: this.config.model
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("746")) {
          {}
        } else {
          stryCov_9fa48("746");
          console.error(stryMutAct_9fa48("747") ? `` : (stryCov_9fa48("747"), `❌ Embedding service test failed: ${error}`));
          return stryMutAct_9fa48("748") ? {} : (stryCov_9fa48("748"), {
            success: stryMutAct_9fa48("749") ? true : (stryCov_9fa48("749"), false),
            dimension: 0,
            model: this.config.model
          });
        }
      }
    }
  }
  clearCache(): void {
    if (stryMutAct_9fa48("750")) {
      {}
    } else {
      stryCov_9fa48("750");
      this.cache.clear();
    }
  }
  updateStrategy(newStrategy: Partial<EmbeddingStrategy>): void {
    if (stryMutAct_9fa48("751")) {
      {}
    } else {
      stryCov_9fa48("751");
      this.strategy = stryMutAct_9fa48("752") ? {} : (stryCov_9fa48("752"), {
        ...this.strategy,
        ...newStrategy
      });
      console.log(stryMutAct_9fa48("753") ? `` : (stryCov_9fa48("753"), `🔄 Updated embedding strategy:`), stryMutAct_9fa48("754") ? {} : (stryCov_9fa48("754"), {
        primary: this.strategy.primaryModel.name,
        fallbacks: this.strategy.fallbackModels.map(stryMutAct_9fa48("755") ? () => undefined : (stryCov_9fa48("755"), m => m.name)),
        overrides: Object.keys(this.strategy.contentTypeOverrides)
      }));
    }
  }
  getCurrentStrategy(): EmbeddingStrategy {
    if (stryMutAct_9fa48("756")) {
      {}
    } else {
      stryCov_9fa48("756");
      return stryMutAct_9fa48("757") ? {} : (stryCov_9fa48("757"), {
        ...this.strategy
      });
    }
  }
  getAvailableModels(): EmbeddingModel[] {
    if (stryMutAct_9fa48("758")) {
      {}
    } else {
      stryCov_9fa48("758");
      return stryMutAct_9fa48("759") ? [] : (stryCov_9fa48("759"), [...this.models]);
    }
  }
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    if (stryMutAct_9fa48("760")) {
      {}
    } else {
      stryCov_9fa48("760");
      return stryMutAct_9fa48("761") ? {} : (stryCov_9fa48("761"), {
        size: this.cache.size,
        keys: stryMutAct_9fa48("762") ? Array.from(this.cache.keys()) : (stryCov_9fa48("762"), Array.from(this.cache.keys()).slice(0, 10)) // First 10 keys for debugging
      });
    }
  }

  /**
   * Get performance metrics for monitoring embedding latency requirements
   * @returns Performance statistics including p95 latency, cache hit rate, and slow embed count
   */
  getPerformanceMetrics() {
    if (stryMutAct_9fa48("763")) {
      {}
    } else {
      stryCov_9fa48("763");
      if (stryMutAct_9fa48("766") ? this.performanceMetrics.embedLatency.length !== 0 : stryMutAct_9fa48("765") ? false : stryMutAct_9fa48("764") ? true : (stryCov_9fa48("764", "765", "766"), this.performanceMetrics.embedLatency.length === 0)) {
        if (stryMutAct_9fa48("767")) {
          {}
        } else {
          stryCov_9fa48("767");
          return stryMutAct_9fa48("768") ? {} : (stryCov_9fa48("768"), {
            totalRequests: this.performanceMetrics.totalRequests,
            cacheHits: this.performanceMetrics.cacheHits,
            cacheMisses: this.performanceMetrics.cacheMisses,
            cacheHitRate: 0,
            slowEmbeds: this.performanceMetrics.slowEmbeds,
            p95Latency: 0,
            averageLatency: 0,
            minLatency: 0,
            maxLatency: 0
          });
        }
      }
      const sorted = stryMutAct_9fa48("769") ? [...this.performanceMetrics.embedLatency] : (stryCov_9fa48("769"), (stryMutAct_9fa48("770") ? [] : (stryCov_9fa48("770"), [...this.performanceMetrics.embedLatency])).sort(stryMutAct_9fa48("771") ? () => undefined : (stryCov_9fa48("771"), (a, b) => stryMutAct_9fa48("772") ? a + b : (stryCov_9fa48("772"), a - b))));
      const p95Index = Math.floor(stryMutAct_9fa48("773") ? sorted.length / 0.95 : (stryCov_9fa48("773"), sorted.length * 0.95));
      const cacheHitRate = (stryMutAct_9fa48("777") ? this.performanceMetrics.totalRequests <= 0 : stryMutAct_9fa48("776") ? this.performanceMetrics.totalRequests >= 0 : stryMutAct_9fa48("775") ? false : stryMutAct_9fa48("774") ? true : (stryCov_9fa48("774", "775", "776", "777"), this.performanceMetrics.totalRequests > 0)) ? stryMutAct_9fa48("778") ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests / 100 : (stryCov_9fa48("778"), (stryMutAct_9fa48("779") ? this.performanceMetrics.cacheHits * this.performanceMetrics.totalRequests : (stryCov_9fa48("779"), this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests)) * 100) : 0;
      return stryMutAct_9fa48("780") ? {} : (stryCov_9fa48("780"), {
        totalRequests: this.performanceMetrics.totalRequests,
        cacheHits: this.performanceMetrics.cacheHits,
        cacheMisses: this.performanceMetrics.cacheMisses,
        cacheHitRate: stryMutAct_9fa48("781") ? Math.round(cacheHitRate * 100) * 100 : (stryCov_9fa48("781"), Math.round(stryMutAct_9fa48("782") ? cacheHitRate / 100 : (stryCov_9fa48("782"), cacheHitRate * 100)) / 100),
        // Round to 2 decimal places
        slowEmbeds: this.performanceMetrics.slowEmbeds,
        p95Latency: stryMutAct_9fa48("785") ? sorted[p95Index] && 0 : stryMutAct_9fa48("784") ? false : stryMutAct_9fa48("783") ? true : (stryCov_9fa48("783", "784", "785"), sorted[p95Index] || 0),
        averageLatency: stryMutAct_9fa48("786") ? sorted.reduce((sum, lat) => sum + lat, 0) * sorted.length : (stryCov_9fa48("786"), sorted.reduce(stryMutAct_9fa48("787") ? () => undefined : (stryCov_9fa48("787"), (sum, lat) => stryMutAct_9fa48("788") ? sum - lat : (stryCov_9fa48("788"), sum + lat)), 0) / sorted.length),
        minLatency: sorted[0],
        maxLatency: sorted[stryMutAct_9fa48("789") ? sorted.length + 1 : (stryCov_9fa48("789"), sorted.length - 1)]
      });
    }
  }
}