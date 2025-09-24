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
import { EmbeddingConfig } from "../types/index.js";
import { normalize, normalizeVector } from "./utils.js";
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

  // Obsidian-optimized embedding models
  private readonly models: EmbeddingModel[] = stryMutAct_9fa48("177") ? [] : (stryCov_9fa48("177"), [stryMutAct_9fa48("178") ? {} : (stryCov_9fa48("178"), {
    name: stryMutAct_9fa48("179") ? "" : (stryCov_9fa48("179"), "embeddinggemma"),
    dimension: 768,
    type: stryMutAct_9fa48("180") ? "" : (stryCov_9fa48("180"), "semantic"),
    domain: stryMutAct_9fa48("181") ? "" : (stryCov_9fa48("181"), "knowledge-base"),
    strengths: stryMutAct_9fa48("182") ? [] : (stryCov_9fa48("182"), [stryMutAct_9fa48("183") ? "" : (stryCov_9fa48("183"), "Fast inference"), stryMutAct_9fa48("184") ? "" : (stryCov_9fa48("184"), "Good for knowledge management"), stryMutAct_9fa48("185") ? "" : (stryCov_9fa48("185"), "Handles markdown well")]),
    limitations: stryMutAct_9fa48("186") ? [] : (stryCov_9fa48("186"), [stryMutAct_9fa48("187") ? "" : (stryCov_9fa48("187"), "Limited domain knowledge"), stryMutAct_9fa48("188") ? "" : (stryCov_9fa48("188"), "May not capture technical terms well")])
  }), stryMutAct_9fa48("189") ? {} : (stryCov_9fa48("189"), {
    name: stryMutAct_9fa48("190") ? "" : (stryCov_9fa48("190"), "nomic-embed-text"),
    dimension: 768,
    type: stryMutAct_9fa48("191") ? "" : (stryCov_9fa48("191"), "semantic"),
    domain: stryMutAct_9fa48("192") ? "" : (stryCov_9fa48("192"), "general"),
    strengths: stryMutAct_9fa48("193") ? [] : (stryCov_9fa48("193"), [stryMutAct_9fa48("194") ? "" : (stryCov_9fa48("194"), "Excellent for general text"), stryMutAct_9fa48("195") ? "" : (stryCov_9fa48("195"), "Good performance on knowledge tasks"), stryMutAct_9fa48("196") ? "" : (stryCov_9fa48("196"), "Handles long documents well")]),
    limitations: stryMutAct_9fa48("197") ? [] : (stryCov_9fa48("197"), [stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), "Larger model, slower inference"), stryMutAct_9fa48("199") ? "" : (stryCov_9fa48("199"), "May be overkill for simple queries")])
  })]);
  constructor(config: EmbeddingConfig) {
    if (stryMutAct_9fa48("200")) {
      {}
    } else {
      stryCov_9fa48("200");
      this.config = config;
      this.strategy = this.createObsidianStrategy();
    }
  }
  private createObsidianStrategy(): EmbeddingStrategy {
    if (stryMutAct_9fa48("201")) {
      {}
    } else {
      stryCov_9fa48("201");
      return stryMutAct_9fa48("202") ? {} : (stryCov_9fa48("202"), {
        primaryModel: stryMutAct_9fa48("205") ? this.models.find(m => m.name === this.config.model) && this.models[0] : stryMutAct_9fa48("204") ? false : stryMutAct_9fa48("203") ? true : (stryCov_9fa48("203", "204", "205"), this.models.find(stryMutAct_9fa48("206") ? () => undefined : (stryCov_9fa48("206"), m => stryMutAct_9fa48("209") ? m.name !== this.config.model : stryMutAct_9fa48("208") ? false : stryMutAct_9fa48("207") ? true : (stryCov_9fa48("207", "208", "209"), m.name === this.config.model))) || this.models[0]),
        fallbackModels: stryMutAct_9fa48("210") ? this.models : (stryCov_9fa48("210"), this.models.filter(stryMutAct_9fa48("211") ? () => undefined : (stryCov_9fa48("211"), m => stryMutAct_9fa48("214") ? m.name === this.config.model : stryMutAct_9fa48("213") ? false : stryMutAct_9fa48("212") ? true : (stryCov_9fa48("212", "213", "214"), m.name !== this.config.model)))),
        contentTypeOverrides: stryMutAct_9fa48("215") ? {} : (stryCov_9fa48("215"), {
          // Obsidian-specific content type optimizations
          moc: this.models.find(stryMutAct_9fa48("216") ? () => undefined : (stryCov_9fa48("216"), m => stryMutAct_9fa48("219") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("218") ? false : stryMutAct_9fa48("217") ? true : (stryCov_9fa48("217", "218", "219"), m.name === (stryMutAct_9fa48("220") ? "" : (stryCov_9fa48("220"), "embeddinggemma")))))!,
          article: this.models.find(stryMutAct_9fa48("221") ? () => undefined : (stryCov_9fa48("221"), m => stryMutAct_9fa48("224") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("223") ? false : stryMutAct_9fa48("222") ? true : (stryCov_9fa48("222", "223", "224"), m.name === (stryMutAct_9fa48("225") ? "" : (stryCov_9fa48("225"), "embeddinggemma")))))!,
          conversation: this.models.find(stryMutAct_9fa48("226") ? () => undefined : (stryCov_9fa48("226"), m => stryMutAct_9fa48("229") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("228") ? false : stryMutAct_9fa48("227") ? true : (stryCov_9fa48("227", "228", "229"), m.name === (stryMutAct_9fa48("230") ? "" : (stryCov_9fa48("230"), "embeddinggemma")))))!,
          "book-note": this.models.find(stryMutAct_9fa48("231") ? () => undefined : (stryCov_9fa48("231"), m => stryMutAct_9fa48("234") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("233") ? false : stryMutAct_9fa48("232") ? true : (stryCov_9fa48("232", "233", "234"), m.name === (stryMutAct_9fa48("235") ? "" : (stryCov_9fa48("235"), "embeddinggemma")))))!,
          note: this.models.find(stryMutAct_9fa48("236") ? () => undefined : (stryCov_9fa48("236"), m => stryMutAct_9fa48("239") ? m.name !== "embeddinggemma" : stryMutAct_9fa48("238") ? false : stryMutAct_9fa48("237") ? true : (stryCov_9fa48("237", "238", "239"), m.name === (stryMutAct_9fa48("240") ? "" : (stryCov_9fa48("240"), "embeddinggemma")))))!
        }),
        qualityThresholds: stryMutAct_9fa48("241") ? {} : (stryCov_9fa48("241"), {
          minSimilarity: 0.3,
          maxResults: 30
        })
      });
    }
  }
  async embed(text: string): Promise<number[]> {
    if (stryMutAct_9fa48("242")) {
      {}
    } else {
      stryCov_9fa48("242");
      const normalizedText = normalize(text);

      // Check cache first
      const cacheKey = stryMutAct_9fa48("243") ? `` : (stryCov_9fa48("243"), `${this.config.model}:${normalizedText}`);
      if (stryMutAct_9fa48("245") ? false : stryMutAct_9fa48("244") ? true : (stryCov_9fa48("244", "245"), this.cache.has(cacheKey))) {
        if (stryMutAct_9fa48("246")) {
          {}
        } else {
          stryCov_9fa48("246");
          return this.cache.get(cacheKey)!;
        }
      }
      try {
        if (stryMutAct_9fa48("247")) {
          {}
        } else {
          stryCov_9fa48("247");
          const response = await ollama.embed(stryMutAct_9fa48("248") ? {} : (stryCov_9fa48("248"), {
            model: this.config.model,
            input: normalizedText
          }));
          if (stryMutAct_9fa48("251") ? !response.embeddings && response.embeddings.length === 0 : stryMutAct_9fa48("250") ? false : stryMutAct_9fa48("249") ? true : (stryCov_9fa48("249", "250", "251"), (stryMutAct_9fa48("252") ? response.embeddings : (stryCov_9fa48("252"), !response.embeddings)) || (stryMutAct_9fa48("254") ? response.embeddings.length !== 0 : stryMutAct_9fa48("253") ? false : (stryCov_9fa48("253", "254"), response.embeddings.length === 0)))) {
            if (stryMutAct_9fa48("255")) {
              {}
            } else {
              stryCov_9fa48("255");
              throw new Error(stryMutAct_9fa48("256") ? "" : (stryCov_9fa48("256"), "No embeddings returned from Ollama"));
            }
          }
          const embedding = response.embeddings[0];

          // Validate dimension
          if (stryMutAct_9fa48("259") ? embedding.length === this.config.dimension : stryMutAct_9fa48("258") ? false : stryMutAct_9fa48("257") ? true : (stryCov_9fa48("257", "258", "259"), embedding.length !== this.config.dimension)) {
            if (stryMutAct_9fa48("260")) {
              {}
            } else {
              stryCov_9fa48("260");
              throw new Error(stryMutAct_9fa48("261") ? `` : (stryCov_9fa48("261"), `Embedding dimension mismatch: expected ${this.config.dimension}, got ${embedding.length}`));
            }
          }

          // Normalize the embedding vector for consistent cosine similarity scores
          const normalizedEmbedding = normalizeVector(embedding);

          // Cache the normalized result
          this.cache.set(cacheKey, normalizedEmbedding);
          return normalizedEmbedding;
        }
      } catch (error) {
        if (stryMutAct_9fa48("262")) {
          {}
        } else {
          stryCov_9fa48("262");
          console.error(stryMutAct_9fa48("263") ? `` : (stryCov_9fa48("263"), `❌ Failed to embed text: ${error}`));
          throw new Error(stryMutAct_9fa48("264") ? `` : (stryCov_9fa48("264"), `Embedding failed: ${error}`));
        }
      }
    }
  }
  async embedBatch(texts: string[], batchSize = 5): Promise<number[][]> {
    if (stryMutAct_9fa48("265")) {
      {}
    } else {
      stryCov_9fa48("265");
      const results: number[][] = stryMutAct_9fa48("266") ? ["Stryker was here"] : (stryCov_9fa48("266"), []);
      for (let i = 0; stryMutAct_9fa48("269") ? i >= texts.length : stryMutAct_9fa48("268") ? i <= texts.length : stryMutAct_9fa48("267") ? false : (stryCov_9fa48("267", "268", "269"), i < texts.length); stryMutAct_9fa48("270") ? i -= batchSize : (stryCov_9fa48("270"), i += batchSize)) {
        if (stryMutAct_9fa48("271")) {
          {}
        } else {
          stryCov_9fa48("271");
          const batch = stryMutAct_9fa48("272") ? texts : (stryCov_9fa48("272"), texts.slice(i, stryMutAct_9fa48("273") ? i - batchSize : (stryCov_9fa48("273"), i + batchSize)));
          const promises = batch.map(stryMutAct_9fa48("274") ? () => undefined : (stryCov_9fa48("274"), text => this.embed(text)));
          const batchResults = await Promise.all(promises);
          results.push(...batchResults);

          // Rate limiting - small delay between batches
          if (stryMutAct_9fa48("278") ? i + batchSize >= texts.length : stryMutAct_9fa48("277") ? i + batchSize <= texts.length : stryMutAct_9fa48("276") ? false : stryMutAct_9fa48("275") ? true : (stryCov_9fa48("275", "276", "277", "278"), (stryMutAct_9fa48("279") ? i - batchSize : (stryCov_9fa48("279"), i + batchSize)) < texts.length)) {
            if (stryMutAct_9fa48("280")) {
              {}
            } else {
              stryCov_9fa48("280");
              await new Promise(stryMutAct_9fa48("281") ? () => undefined : (stryCov_9fa48("281"), resolve => setTimeout(resolve, 100)));
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
    if (stryMutAct_9fa48("282")) {
      {}
    } else {
      stryCov_9fa48("282");
      const normalizedText = normalize(text);

      // Select appropriate model based on content type and domain
      const selectedModel = this.selectModelForContent(contentType, domainHint);

      // Check cache with model-specific key
      const cacheKey = stryMutAct_9fa48("283") ? `` : (stryCov_9fa48("283"), `${selectedModel.name}:${normalizedText}`);
      if (stryMutAct_9fa48("285") ? false : stryMutAct_9fa48("284") ? true : (stryCov_9fa48("284", "285"), this.cache.has(cacheKey))) {
        if (stryMutAct_9fa48("286")) {
          {}
        } else {
          stryCov_9fa48("286");
          return stryMutAct_9fa48("287") ? {} : (stryCov_9fa48("287"), {
            embedding: this.cache.get(cacheKey)!,
            model: selectedModel,
            confidence: 1.0 // Cached result
          });
        }
      }
      try {
        if (stryMutAct_9fa48("288")) {
          {}
        } else {
          stryCov_9fa48("288");
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
          return stryMutAct_9fa48("289") ? {} : (stryCov_9fa48("289"), {
            embedding,
            model: selectedModel,
            confidence
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("290")) {
          {}
        } else {
          stryCov_9fa48("290");
          console.warn(stryMutAct_9fa48("291") ? `` : (stryCov_9fa48("291"), `Failed to embed with ${selectedModel.name}, trying fallback...`));

          // Try fallback models
          for (const fallbackModel of this.strategy.fallbackModels) {
            if (stryMutAct_9fa48("292")) {
              {}
            } else {
              stryCov_9fa48("292");
              try {
                if (stryMutAct_9fa48("293")) {
                  {}
                } else {
                  stryCov_9fa48("293");
                  const originalModel = this.config.model;
                  this.config.model = fallbackModel.name;
                  const embedding = await this.embedCore(normalizedText);
                  this.config.model = originalModel;
                  const confidence = this.calculateEmbeddingConfidence(embedding, normalizedText);
                  return stryMutAct_9fa48("294") ? {} : (stryCov_9fa48("294"), {
                    embedding,
                    model: fallbackModel,
                    confidence: stryMutAct_9fa48("295") ? confidence / 0.8 : (stryCov_9fa48("295"), confidence * 0.8) // Penalty for fallback
                  });
                }
              } catch (fallbackError) {
                if (stryMutAct_9fa48("296")) {
                  {}
                } else {
                  stryCov_9fa48("296");
                  console.warn(stryMutAct_9fa48("297") ? `` : (stryCov_9fa48("297"), `Fallback model ${fallbackModel.name} also failed`));
                }
              }
            }
          }
          throw new Error(stryMutAct_9fa48("298") ? `` : (stryCov_9fa48("298"), `All embedding models failed for text: ${stryMutAct_9fa48("299") ? normalizedText : (stryCov_9fa48("299"), normalizedText.slice(0, 50))}...`));
        }
      }
    }
  }
  private selectModelForContent(contentType?: string, domainHint?: string): EmbeddingModel {
    if (stryMutAct_9fa48("300")) {
      {}
    } else {
      stryCov_9fa48("300");
      // Content-type specific overrides for Obsidian
      if (stryMutAct_9fa48("303") ? contentType || this.strategy.contentTypeOverrides[contentType] : stryMutAct_9fa48("302") ? false : stryMutAct_9fa48("301") ? true : (stryCov_9fa48("301", "302", "303"), contentType && this.strategy.contentTypeOverrides[contentType])) {
        if (stryMutAct_9fa48("304")) {
          {}
        } else {
          stryCov_9fa48("304");
          return this.strategy.contentTypeOverrides[contentType];
        }
      }

      // Domain-specific selection
      if (stryMutAct_9fa48("306") ? false : stryMutAct_9fa48("305") ? true : (stryCov_9fa48("305", "306"), domainHint)) {
        if (stryMutAct_9fa48("307")) {
          {}
        } else {
          stryCov_9fa48("307");
          const domainModel = this.models.find(stryMutAct_9fa48("308") ? () => undefined : (stryCov_9fa48("308"), m => stryMutAct_9fa48("311") ? m.domain === domainHint && m.name.includes(domainHint) : stryMutAct_9fa48("310") ? false : stryMutAct_9fa48("309") ? true : (stryCov_9fa48("309", "310", "311"), (stryMutAct_9fa48("313") ? m.domain !== domainHint : stryMutAct_9fa48("312") ? false : (stryCov_9fa48("312", "313"), m.domain === domainHint)) || m.name.includes(domainHint))));
          if (stryMutAct_9fa48("315") ? false : stryMutAct_9fa48("314") ? true : (stryCov_9fa48("314", "315"), domainModel)) return domainModel;
        }
      }

      // Default to primary model
      return this.strategy.primaryModel;
    }
  }
  private async embedCore(text: string): Promise<number[]> {
    if (stryMutAct_9fa48("316")) {
      {}
    } else {
      stryCov_9fa48("316");
      const response = await ollama.embed(stryMutAct_9fa48("317") ? {} : (stryCov_9fa48("317"), {
        model: this.config.model,
        input: text
      }));
      if (stryMutAct_9fa48("320") ? !response.embeddings && response.embeddings.length === 0 : stryMutAct_9fa48("319") ? false : stryMutAct_9fa48("318") ? true : (stryCov_9fa48("318", "319", "320"), (stryMutAct_9fa48("321") ? response.embeddings : (stryCov_9fa48("321"), !response.embeddings)) || (stryMutAct_9fa48("323") ? response.embeddings.length !== 0 : stryMutAct_9fa48("322") ? false : (stryCov_9fa48("322", "323"), response.embeddings.length === 0)))) {
        if (stryMutAct_9fa48("324")) {
          {}
        } else {
          stryCov_9fa48("324");
          throw new Error(stryMutAct_9fa48("325") ? "" : (stryCov_9fa48("325"), "No embeddings returned from Ollama"));
        }
      }
      const embedding = response.embeddings[0];

      // Validate dimension (may vary by model)
      if (stryMutAct_9fa48("328") ? embedding.length === this.config.dimension : stryMutAct_9fa48("327") ? false : stryMutAct_9fa48("326") ? true : (stryCov_9fa48("326", "327", "328"), embedding.length !== this.config.dimension)) {
        if (stryMutAct_9fa48("329")) {
          {}
        } else {
          stryCov_9fa48("329");
          // Update config dimension if model uses different size
          this.config.dimension = embedding.length;
        }
      }
      return normalizeVector(embedding);
    }
  }
  private calculateEmbeddingConfidence(embedding: number[], text: string): number {
    if (stryMutAct_9fa48("330")) {
      {}
    } else {
      stryCov_9fa48("330");
      // Simple confidence metric based on embedding properties
      const magnitude = Math.sqrt(embedding.reduce(stryMutAct_9fa48("331") ? () => undefined : (stryCov_9fa48("331"), (sum, x) => stryMutAct_9fa48("332") ? sum - x * x : (stryCov_9fa48("332"), sum + (stryMutAct_9fa48("333") ? x / x : (stryCov_9fa48("333"), x * x)))), 0));
      const sparsity = stryMutAct_9fa48("334") ? embedding.filter(x => Math.abs(x) < 0.01).length * embedding.length : (stryCov_9fa48("334"), (stryMutAct_9fa48("335") ? embedding.length : (stryCov_9fa48("335"), embedding.filter(stryMutAct_9fa48("336") ? () => undefined : (stryCov_9fa48("336"), x => stryMutAct_9fa48("340") ? Math.abs(x) >= 0.01 : stryMutAct_9fa48("339") ? Math.abs(x) <= 0.01 : stryMutAct_9fa48("338") ? false : stryMutAct_9fa48("337") ? true : (stryCov_9fa48("337", "338", "339", "340"), Math.abs(x) < 0.01))).length)) / embedding.length);

      // High magnitude and low sparsity indicate good embeddings
      let confidence = stryMutAct_9fa48("341") ? Math.max(magnitude / 2.0, 1.0) : (stryCov_9fa48("341"), Math.min(stryMutAct_9fa48("342") ? magnitude * 2.0 : (stryCov_9fa48("342"), magnitude / 2.0), 1.0)); // Normalized magnitude
      stryMutAct_9fa48("343") ? confidence /= 1.0 - sparsity * 0.5 : (stryCov_9fa48("343"), confidence *= stryMutAct_9fa48("344") ? 1.0 + sparsity * 0.5 : (stryCov_9fa48("344"), 1.0 - (stryMutAct_9fa48("345") ? sparsity / 0.5 : (stryCov_9fa48("345"), sparsity * 0.5)))); // Penalty for sparsity

      // Boost confidence for Obsidian-specific content patterns
      if (stryMutAct_9fa48("348") ? text.includes("[[") && text.includes("#") : stryMutAct_9fa48("347") ? false : stryMutAct_9fa48("346") ? true : (stryCov_9fa48("346", "347", "348"), text.includes(stryMutAct_9fa48("349") ? "" : (stryCov_9fa48("349"), "[[")) || text.includes(stryMutAct_9fa48("350") ? "" : (stryCov_9fa48("350"), "#")))) {
        if (stryMutAct_9fa48("351")) {
          {}
        } else {
          stryCov_9fa48("351");
          stryMutAct_9fa48("352") ? confidence /= 1.1 : (stryCov_9fa48("352"), confidence *= 1.1); // Boost for wikilinks and tags
        }
      }
      return stryMutAct_9fa48("353") ? Math.min(0.1, Math.min(1.0, confidence)) : (stryCov_9fa48("353"), Math.max(0.1, stryMutAct_9fa48("354") ? Math.max(1.0, confidence) : (stryCov_9fa48("354"), Math.min(1.0, confidence))));
    }
  }
  async testConnection(): Promise<{
    success: boolean;
    dimension: number;
    model: string;
  }> {
    if (stryMutAct_9fa48("355")) {
      {}
    } else {
      stryCov_9fa48("355");
      try {
        if (stryMutAct_9fa48("356")) {
          {}
        } else {
          stryCov_9fa48("356");
          const testText = stryMutAct_9fa48("357") ? "" : (stryCov_9fa48("357"), "This is a test embedding for Obsidian knowledge base.");
          const embedding = await this.embed(testText);
          return stryMutAct_9fa48("358") ? {} : (stryCov_9fa48("358"), {
            success: stryMutAct_9fa48("359") ? false : (stryCov_9fa48("359"), true),
            dimension: embedding.length,
            model: this.config.model
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("360")) {
          {}
        } else {
          stryCov_9fa48("360");
          console.error(stryMutAct_9fa48("361") ? `` : (stryCov_9fa48("361"), `❌ Embedding service test failed: ${error}`));
          return stryMutAct_9fa48("362") ? {} : (stryCov_9fa48("362"), {
            success: stryMutAct_9fa48("363") ? true : (stryCov_9fa48("363"), false),
            dimension: 0,
            model: this.config.model
          });
        }
      }
    }
  }
  clearCache(): void {
    if (stryMutAct_9fa48("364")) {
      {}
    } else {
      stryCov_9fa48("364");
      this.cache.clear();
    }
  }
  updateStrategy(newStrategy: Partial<EmbeddingStrategy>): void {
    if (stryMutAct_9fa48("365")) {
      {}
    } else {
      stryCov_9fa48("365");
      this.strategy = stryMutAct_9fa48("366") ? {} : (stryCov_9fa48("366"), {
        ...this.strategy,
        ...newStrategy
      });
      console.log(stryMutAct_9fa48("367") ? `` : (stryCov_9fa48("367"), `🔄 Updated embedding strategy:`), stryMutAct_9fa48("368") ? {} : (stryCov_9fa48("368"), {
        primary: this.strategy.primaryModel.name,
        fallbacks: this.strategy.fallbackModels.map(stryMutAct_9fa48("369") ? () => undefined : (stryCov_9fa48("369"), m => m.name)),
        overrides: Object.keys(this.strategy.contentTypeOverrides)
      }));
    }
  }
  getCurrentStrategy(): EmbeddingStrategy {
    if (stryMutAct_9fa48("370")) {
      {}
    } else {
      stryCov_9fa48("370");
      return stryMutAct_9fa48("371") ? {} : (stryCov_9fa48("371"), {
        ...this.strategy
      });
    }
  }
  getAvailableModels(): EmbeddingModel[] {
    if (stryMutAct_9fa48("372")) {
      {}
    } else {
      stryCov_9fa48("372");
      return stryMutAct_9fa48("373") ? [] : (stryCov_9fa48("373"), [...this.models]);
    }
  }
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    if (stryMutAct_9fa48("374")) {
      {}
    } else {
      stryCov_9fa48("374");
      return stryMutAct_9fa48("375") ? {} : (stryCov_9fa48("375"), {
        size: this.cache.size,
        keys: stryMutAct_9fa48("376") ? Array.from(this.cache.keys()) : (stryCov_9fa48("376"), Array.from(this.cache.keys()).slice(0, 10)) // First 10 keys for debugging
      });
    }
  }
}