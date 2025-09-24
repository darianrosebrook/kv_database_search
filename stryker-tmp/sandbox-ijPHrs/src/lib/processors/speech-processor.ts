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
import { createModel, createRecognizer, type ModelConfig, type RecognizerConfig } from "sherpa-onnx";
import { ContentType, ContentMetadata } from "../multi-modal.js";
import * as fs from "fs";
export interface SpeechMetadata {
  duration?: number; // in seconds
  sampleRate?: number;
  channels?: number;
  confidence?: number;
  processingTime: number;
  language: string;
  engine: string;
}
export interface SpeechContentMetadata extends ContentMetadata {
  speechMetadata?: SpeechMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
}
export class SpeechProcessor {
  private model: any = null;
  private recognizer: any = null;
  private initialized = stryMutAct_9fa48("857") ? true : (stryCov_9fa48("857"), false);

  /**
   * Initialize the speech recognition model
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("858")) {
      {}
    } else {
      stryCov_9fa48("858");
      if (stryMutAct_9fa48("860") ? false : stryMutAct_9fa48("859") ? true : (stryCov_9fa48("859", "860"), this.initialized)) return;
      try {
        if (stryMutAct_9fa48("861")) {
          {}
        } else {
          stryCov_9fa48("861");
          // Configure the model for speech recognition
          // Using a pre-built model configuration for English
          const modelConfig: ModelConfig = stryMutAct_9fa48("862") ? {} : (stryCov_9fa48("862"), {
            encoder: stryMutAct_9fa48("863") ? "" : (stryCov_9fa48("863"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/encoder-epoch-99-avg-1.onnx"),
            decoder: stryMutAct_9fa48("864") ? "" : (stryCov_9fa48("864"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/decoder-epoch-99-avg-1.onnx"),
            joiner: stryMutAct_9fa48("865") ? "" : (stryCov_9fa48("865"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/joiner-epoch-99-avg-1.onnx"),
            tokens: stryMutAct_9fa48("866") ? "" : (stryCov_9fa48("866"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/tokens.txt"),
            numThreads: 2,
            provider: stryMutAct_9fa48("867") ? "" : (stryCov_9fa48("867"), "cpu")
          });
          const recognizerConfig: RecognizerConfig = stryMutAct_9fa48("868") ? {} : (stryCov_9fa48("868"), {
            modelConfig,
            decodingMethod: stryMutAct_9fa48("869") ? "" : (stryCov_9fa48("869"), "greedy_search"),
            maxActivePaths: 4,
            enableEndpoint: stryMutAct_9fa48("870") ? false : (stryCov_9fa48("870"), true),
            rule1MinTrailingSilence: 2.4,
            rule2MinTrailingSilence: 1.2,
            rule3MinUtteranceLength: 20
          });

          // Create model and recognizer
          this.model = createModel(modelConfig);
          this.recognizer = createRecognizer(recognizerConfig);
          this.initialized = stryMutAct_9fa48("871") ? false : (stryCov_9fa48("871"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("872")) {
          {}
        } else {
          stryCov_9fa48("872");
          console.warn(stryMutAct_9fa48("873") ? "" : (stryCov_9fa48("873"), "Speech recognition model initialization failed:"), error);
          // Continue with limited functionality
        }
      }
    }
  }

  /**
   * Transcribe audio from a buffer
   */
  async transcribeFromBuffer(buffer: Buffer, options: {
    language?: string;
    sampleRate?: number;
  } = {}): Promise<{
    text: string;
    metadata: SpeechContentMetadata;
  }> {
    if (stryMutAct_9fa48("874")) {
      {}
    } else {
      stryCov_9fa48("874");
      try {
        if (stryMutAct_9fa48("875")) {
          {}
        } else {
          stryCov_9fa48("875");
          await this.initialize();
          const startTime = Date.now();

          // If we don't have a working model, return a placeholder
          if (stryMutAct_9fa48("878") ? false : stryMutAct_9fa48("877") ? true : stryMutAct_9fa48("876") ? this.recognizer : (stryCov_9fa48("876", "877", "878"), !this.recognizer)) {
            if (stryMutAct_9fa48("879")) {
              {}
            } else {
              stryCov_9fa48("879");
              return this.createFallbackResult(stryMutAct_9fa48("880") ? "" : (stryCov_9fa48("880"), "Speech recognition model not available"), startTime);
            }
          }

          // Convert buffer to the format expected by sherpa-onnx
          // This is a simplified implementation - in practice, you'd need proper audio decoding
          const audioData = this.convertBufferToAudioData(buffer);
          if (stryMutAct_9fa48("883") ? false : stryMutAct_9fa48("882") ? true : stryMutAct_9fa48("881") ? audioData : (stryCov_9fa48("881", "882", "883"), !audioData)) {
            if (stryMutAct_9fa48("884")) {
              {}
            } else {
              stryCov_9fa48("884");
              return this.createFallbackResult(stryMutAct_9fa48("885") ? "" : (stryCov_9fa48("885"), "Unsupported audio format"), startTime);
            }
          }

          // Reset recognizer for new audio
          this.recognizer.reset();

          // Process audio in chunks
          const stream = this.recognizer.createStream();
          const samplesPerChunk = 1024; // Process in chunks

          for (let i = 0; stryMutAct_9fa48("888") ? i >= audioData.length : stryMutAct_9fa48("887") ? i <= audioData.length : stryMutAct_9fa48("886") ? false : (stryCov_9fa48("886", "887", "888"), i < audioData.length); stryMutAct_9fa48("889") ? i -= samplesPerChunk : (stryCov_9fa48("889"), i += samplesPerChunk)) {
            if (stryMutAct_9fa48("890")) {
              {}
            } else {
              stryCov_9fa48("890");
              const chunk = stryMutAct_9fa48("891") ? audioData : (stryCov_9fa48("891"), audioData.slice(i, stryMutAct_9fa48("892") ? i - samplesPerChunk : (stryCov_9fa48("892"), i + samplesPerChunk)));
              stream.acceptWaveform(chunk);
            }
          }

          // Get the final result
          stream.inputFinished();
          const result = this.recognizer.getResult();
          const processingTime = stryMutAct_9fa48("893") ? Date.now() + startTime : (stryCov_9fa48("893"), Date.now() - startTime);
          const text = stryMutAct_9fa48("896") ? result.text?.trim() && "" : stryMutAct_9fa48("895") ? false : stryMutAct_9fa48("894") ? true : (stryCov_9fa48("894", "895", "896"), (stryMutAct_9fa48("898") ? result.text.trim() : stryMutAct_9fa48("897") ? result.text : (stryCov_9fa48("897", "898"), result.text?.trim())) || (stryMutAct_9fa48("899") ? "Stryker was here!" : (stryCov_9fa48("899"), "")));
          const words = stryMutAct_9fa48("900") ? text.split(/\s+/) : (stryCov_9fa48("900"), text.split(stryMutAct_9fa48("902") ? /\S+/ : stryMutAct_9fa48("901") ? /\s/ : (stryCov_9fa48("901", "902"), /\s+/)).filter(stryMutAct_9fa48("903") ? () => undefined : (stryCov_9fa48("903"), word => stryMutAct_9fa48("907") ? word.length <= 0 : stryMutAct_9fa48("906") ? word.length >= 0 : stryMutAct_9fa48("905") ? false : stryMutAct_9fa48("904") ? true : (stryCov_9fa48("904", "905", "906", "907"), word.length > 0))));
          const hasText = stryMutAct_9fa48("910") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("909") ? false : stryMutAct_9fa48("908") ? true : (stryCov_9fa48("908", "909", "910"), (stryMutAct_9fa48("913") ? text.length <= 0 : stryMutAct_9fa48("912") ? text.length >= 0 : stryMutAct_9fa48("911") ? true : (stryCov_9fa48("911", "912", "913"), text.length > 0)) && (stryMutAct_9fa48("916") ? words.length <= 0 : stryMutAct_9fa48("915") ? words.length >= 0 : stryMutAct_9fa48("914") ? true : (stryCov_9fa48("914", "915", "916"), words.length > 0)));

          // Estimate confidence (simplified - sherpa-onnx doesn't provide direct confidence)
          const confidence = hasText ? 0.8 : 0.0;
          const speechMetadata: SpeechMetadata = stryMutAct_9fa48("917") ? {} : (stryCov_9fa48("917"), {
            duration: stryMutAct_9fa48("918") ? audioData.length * (options.sampleRate || 16000) : (stryCov_9fa48("918"), audioData.length / (stryMutAct_9fa48("921") ? options.sampleRate && 16000 : stryMutAct_9fa48("920") ? false : stryMutAct_9fa48("919") ? true : (stryCov_9fa48("919", "920", "921"), options.sampleRate || 16000))),
            // Estimate duration
            sampleRate: stryMutAct_9fa48("924") ? options.sampleRate && 16000 : stryMutAct_9fa48("923") ? false : stryMutAct_9fa48("922") ? true : (stryCov_9fa48("922", "923", "924"), options.sampleRate || 16000),
            channels: 1,
            // Assume mono
            confidence,
            processingTime,
            language: stryMutAct_9fa48("927") ? options.language && "en" : stryMutAct_9fa48("926") ? false : stryMutAct_9fa48("925") ? true : (stryCov_9fa48("925", "926", "927"), options.language || (stryMutAct_9fa48("928") ? "" : (stryCov_9fa48("928"), "en"))),
            engine: stryMutAct_9fa48("929") ? "" : (stryCov_9fa48("929"), "sherpa-onnx")
          });
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("930") ? {} : (stryCov_9fa48("930"), {
            type: ContentType.AUDIO,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("931") ? "" : (stryCov_9fa48("931"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            speechMetadata
          });
          return stryMutAct_9fa48("932") ? {} : (stryCov_9fa48("932"), {
            text: hasText ? text : stryMutAct_9fa48("933") ? "" : (stryCov_9fa48("933"), "Audio: No speech detected or transcription failed"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("934")) {
          {}
        } else {
          stryCov_9fa48("934");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createFallbackResult(stryMutAct_9fa48("935") ? `` : (stryCov_9fa48("935"), `Speech processing error: ${errorMessage}`), Date.now());
        }
      }
    }
  }

  /**
   * Transcribe audio from a file
   */
  async transcribeFromFile(filePath: string, options: {
    language?: string;
    sampleRate?: number;
  } = {}): Promise<{
    text: string;
    metadata: SpeechContentMetadata;
  }> {
    if (stryMutAct_9fa48("936")) {
      {}
    } else {
      stryCov_9fa48("936");
      try {
        if (stryMutAct_9fa48("937")) {
          {}
        } else {
          stryCov_9fa48("937");
          const buffer = fs.readFileSync(filePath);
          return await this.transcribeFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("938")) {
          {}
        } else {
          stryCov_9fa48("938");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("939") ? {} : (stryCov_9fa48("939"), {
            type: ContentType.AUDIO,
            language: stryMutAct_9fa48("940") ? "" : (stryCov_9fa48("940"), "unknown"),
            encoding: stryMutAct_9fa48("941") ? "" : (stryCov_9fa48("941"), "unknown"),
            hasText: stryMutAct_9fa48("942") ? true : (stryCov_9fa48("942"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("943") ? {} : (stryCov_9fa48("943"), {
            text: stryMutAct_9fa48("944") ? `` : (stryCov_9fa48("944"), `Audio File Error: Failed to read file - ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Check if a file format is supported for speech recognition
   */
  isSupportedAudioFormat(buffer: Buffer): boolean {
    if (stryMutAct_9fa48("945")) {
      {}
    } else {
      stryCov_9fa48("945");
      // Check common audio file signatures
      const signatures = stryMutAct_9fa48("946") ? [] : (stryCov_9fa48("946"), [Buffer.from(stryMutAct_9fa48("947") ? [] : (stryCov_9fa48("947"), [0x52, 0x49, 0x46, 0x46])),
      // RIFF (WAV)
      Buffer.from(stryMutAct_9fa48("948") ? [] : (stryCov_9fa48("948"), [0x66, 0x74, 0x79, 0x70])),
      // ftyp (MP4/M4A)
      Buffer.from(stryMutAct_9fa48("949") ? [] : (stryCov_9fa48("949"), [0x49, 0x44, 0x33])),
      // ID3 (MP3)
      Buffer.from(stryMutAct_9fa48("950") ? [] : (stryCov_9fa48("950"), [0x4f, 0x67, 0x67, 0x53])),
      // OggS (OGG)
      Buffer.from(stryMutAct_9fa48("951") ? [] : (stryCov_9fa48("951"), [0x66, 0x4c, 0x61, 0x43])) // fLaC (FLAC)
      ]);
      return stryMutAct_9fa48("952") ? signatures.every(signature => buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("952"), signatures.some(stryMutAct_9fa48("953") ? () => undefined : (stryCov_9fa48("953"), signature => stryMutAct_9fa48("956") ? buffer.subarray(0, 4).equals(signature) && buffer.subarray(0, signature.length).equals(signature) : stryMutAct_9fa48("955") ? false : stryMutAct_9fa48("954") ? true : (stryCov_9fa48("954", "955", "956"), buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)))));
    }
  }

  /**
   * Convert audio buffer to float32 array (simplified implementation)
   * In practice, you'd need proper audio decoding based on format
   */
  private convertBufferToAudioData(buffer: Buffer): Float32Array | null {
    if (stryMutAct_9fa48("957")) {
      {}
    } else {
      stryCov_9fa48("957");
      try {
        if (stryMutAct_9fa48("958")) {
          {}
        } else {
          stryCov_9fa48("958");
          // This is a very simplified implementation
          // In practice, you'd need to:
          // 1. Detect audio format (WAV, MP3, etc.)
          // 2. Decode the audio to raw PCM data
          // 3. Convert to Float32Array

          // For now, return null to indicate unsupported format
          // This would need to be implemented with proper audio decoding libraries
          return null;
        }
      } catch (error) {
        if (stryMutAct_9fa48("959")) {
          {}
        } else {
          stryCov_9fa48("959");
          return null;
        }
      }
    }
  }

  /**
   * Create a fallback result when speech recognition is not available
   */
  private createFallbackResult(reason: string, startTime: number): {
    text: string;
    metadata: SpeechContentMetadata;
  } {
    if (stryMutAct_9fa48("960")) {
      {}
    } else {
      stryCov_9fa48("960");
      const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("961") ? {} : (stryCov_9fa48("961"), {
        type: ContentType.AUDIO,
        language: stryMutAct_9fa48("962") ? "" : (stryCov_9fa48("962"), "unknown"),
        encoding: stryMutAct_9fa48("963") ? "" : (stryCov_9fa48("963"), "unknown"),
        hasText: stryMutAct_9fa48("964") ? true : (stryCov_9fa48("964"), false),
        wordCount: 0,
        characterCount: 0,
        speechMetadata: stryMutAct_9fa48("965") ? {} : (stryCov_9fa48("965"), {
          processingTime: stryMutAct_9fa48("966") ? Date.now() + startTime : (stryCov_9fa48("966"), Date.now() - startTime),
          language: stryMutAct_9fa48("967") ? "" : (stryCov_9fa48("967"), "unknown"),
          engine: stryMutAct_9fa48("968") ? "" : (stryCov_9fa48("968"), "none")
        })
      });
      return stryMutAct_9fa48("969") ? {} : (stryCov_9fa48("969"), {
        text: stryMutAct_9fa48("970") ? `` : (stryCov_9fa48("970"), `Audio: ${reason}`),
        metadata: contentMetadata
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("971")) {
      {}
    } else {
      stryCov_9fa48("971");
      if (stryMutAct_9fa48("974") ? !text && text.length === 0 : stryMutAct_9fa48("973") ? false : stryMutAct_9fa48("972") ? true : (stryCov_9fa48("972", "973", "974"), (stryMutAct_9fa48("975") ? text : (stryCov_9fa48("975"), !text)) || (stryMutAct_9fa48("977") ? text.length !== 0 : stryMutAct_9fa48("976") ? false : (stryCov_9fa48("976", "977"), text.length === 0)))) return stryMutAct_9fa48("978") ? "" : (stryCov_9fa48("978"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("981") ? text.match(englishWords) && [] : stryMutAct_9fa48("980") ? false : stryMutAct_9fa48("979") ? true : (stryCov_9fa48("979", "980", "981"), text.match(englishWords) || (stryMutAct_9fa48("982") ? ["Stryker was here"] : (stryCov_9fa48("982"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("985") ? text.match(spanishWords) && [] : stryMutAct_9fa48("984") ? false : stryMutAct_9fa48("983") ? true : (stryCov_9fa48("983", "984", "985"), text.match(spanishWords) || (stryMutAct_9fa48("986") ? ["Stryker was here"] : (stryCov_9fa48("986"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("989") ? text.match(frenchWords) && [] : stryMutAct_9fa48("988") ? false : stryMutAct_9fa48("987") ? true : (stryCov_9fa48("987", "988", "989"), text.match(frenchWords) || (stryMutAct_9fa48("990") ? ["Stryker was here"] : (stryCov_9fa48("990"), [])))).length;
      const maxMatches = stryMutAct_9fa48("991") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("991"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("994") ? maxMatches !== 0 : stryMutAct_9fa48("993") ? false : stryMutAct_9fa48("992") ? true : (stryCov_9fa48("992", "993", "994"), maxMatches === 0)) return stryMutAct_9fa48("995") ? "" : (stryCov_9fa48("995"), "unknown");
      if (stryMutAct_9fa48("998") ? maxMatches !== englishMatches : stryMutAct_9fa48("997") ? false : stryMutAct_9fa48("996") ? true : (stryCov_9fa48("996", "997", "998"), maxMatches === englishMatches)) return stryMutAct_9fa48("999") ? "" : (stryCov_9fa48("999"), "en");
      if (stryMutAct_9fa48("1002") ? maxMatches !== spanishMatches : stryMutAct_9fa48("1001") ? false : stryMutAct_9fa48("1000") ? true : (stryCov_9fa48("1000", "1001", "1002"), maxMatches === spanishMatches)) return stryMutAct_9fa48("1003") ? "" : (stryCov_9fa48("1003"), "es");
      if (stryMutAct_9fa48("1006") ? maxMatches !== frenchMatches : stryMutAct_9fa48("1005") ? false : stryMutAct_9fa48("1004") ? true : (stryCov_9fa48("1004", "1005", "1006"), maxMatches === frenchMatches)) return stryMutAct_9fa48("1007") ? "" : (stryCov_9fa48("1007"), "fr");
      return stryMutAct_9fa48("1008") ? "" : (stryCov_9fa48("1008"), "unknown");
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("1009")) {
      {}
    } else {
      stryCov_9fa48("1009");
      if (stryMutAct_9fa48("1011") ? false : stryMutAct_9fa48("1010") ? true : (stryCov_9fa48("1010", "1011"), this.recognizer)) {
        if (stryMutAct_9fa48("1012")) {
          {}
        } else {
          stryCov_9fa48("1012");
          this.recognizer.free();
          this.recognizer = null;
        }
      }
      if (stryMutAct_9fa48("1014") ? false : stryMutAct_9fa48("1013") ? true : (stryCov_9fa48("1013", "1014"), this.model)) {
        if (stryMutAct_9fa48("1015")) {
          {}
        } else {
          stryCov_9fa48("1015");
          this.model.free();
          this.model = null;
        }
      }
      this.initialized = stryMutAct_9fa48("1016") ? true : (stryCov_9fa48("1016"), false);
    }
  }

  /**
   * Check if the speech processor is ready
   */
  isReady(): boolean {
    if (stryMutAct_9fa48("1017")) {
      {}
    } else {
      stryCov_9fa48("1017");
      return stryMutAct_9fa48("1020") ? this.initialized || this.recognizer !== null : stryMutAct_9fa48("1019") ? false : stryMutAct_9fa48("1018") ? true : (stryCov_9fa48("1018", "1019", "1020"), this.initialized && (stryMutAct_9fa48("1022") ? this.recognizer === null : stryMutAct_9fa48("1021") ? true : (stryCov_9fa48("1021", "1022"), this.recognizer !== null)));
    }
  }
}