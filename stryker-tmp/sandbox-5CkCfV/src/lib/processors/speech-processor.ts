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
  private initialized = stryMutAct_9fa48("1951") ? true : (stryCov_9fa48("1951"), false);

  /**
   * Initialize the speech recognition model
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("1952")) {
      {}
    } else {
      stryCov_9fa48("1952");
      if (stryMutAct_9fa48("1954") ? false : stryMutAct_9fa48("1953") ? true : (stryCov_9fa48("1953", "1954"), this.initialized)) return;
      try {
        if (stryMutAct_9fa48("1955")) {
          {}
        } else {
          stryCov_9fa48("1955");
          // Configure the model for speech recognition
          // Using a pre-built model configuration for English
          const modelConfig: ModelConfig = stryMutAct_9fa48("1956") ? {} : (stryCov_9fa48("1956"), {
            encoder: stryMutAct_9fa48("1957") ? "" : (stryCov_9fa48("1957"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/encoder-epoch-99-avg-1.onnx"),
            decoder: stryMutAct_9fa48("1958") ? "" : (stryCov_9fa48("1958"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/decoder-epoch-99-avg-1.onnx"),
            joiner: stryMutAct_9fa48("1959") ? "" : (stryCov_9fa48("1959"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/joiner-epoch-99-avg-1.onnx"),
            tokens: stryMutAct_9fa48("1960") ? "" : (stryCov_9fa48("1960"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/tokens.txt"),
            numThreads: 2,
            provider: stryMutAct_9fa48("1961") ? "" : (stryCov_9fa48("1961"), "cpu")
          });
          const recognizerConfig: RecognizerConfig = stryMutAct_9fa48("1962") ? {} : (stryCov_9fa48("1962"), {
            modelConfig,
            decodingMethod: stryMutAct_9fa48("1963") ? "" : (stryCov_9fa48("1963"), "greedy_search"),
            maxActivePaths: 4,
            enableEndpoint: stryMutAct_9fa48("1964") ? false : (stryCov_9fa48("1964"), true),
            rule1MinTrailingSilence: 2.4,
            rule2MinTrailingSilence: 1.2,
            rule3MinUtteranceLength: 20
          });

          // Create model and recognizer
          this.model = createModel(modelConfig);
          this.recognizer = createRecognizer(recognizerConfig);
          this.initialized = stryMutAct_9fa48("1965") ? false : (stryCov_9fa48("1965"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1966")) {
          {}
        } else {
          stryCov_9fa48("1966");
          console.warn(stryMutAct_9fa48("1967") ? "" : (stryCov_9fa48("1967"), "Speech recognition model initialization failed:"), error);
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
    if (stryMutAct_9fa48("1968")) {
      {}
    } else {
      stryCov_9fa48("1968");
      try {
        if (stryMutAct_9fa48("1969")) {
          {}
        } else {
          stryCov_9fa48("1969");
          await this.initialize();
          const startTime = Date.now();

          // If we don't have a working model, return a placeholder
          if (stryMutAct_9fa48("1972") ? false : stryMutAct_9fa48("1971") ? true : stryMutAct_9fa48("1970") ? this.recognizer : (stryCov_9fa48("1970", "1971", "1972"), !this.recognizer)) {
            if (stryMutAct_9fa48("1973")) {
              {}
            } else {
              stryCov_9fa48("1973");
              return this.createFallbackResult(stryMutAct_9fa48("1974") ? "" : (stryCov_9fa48("1974"), "Speech recognition model not available"), startTime);
            }
          }

          // Convert buffer to the format expected by sherpa-onnx
          // This is a simplified implementation - in practice, you'd need proper audio decoding
          const audioData = this.convertBufferToAudioData(buffer);
          if (stryMutAct_9fa48("1977") ? false : stryMutAct_9fa48("1976") ? true : stryMutAct_9fa48("1975") ? audioData : (stryCov_9fa48("1975", "1976", "1977"), !audioData)) {
            if (stryMutAct_9fa48("1978")) {
              {}
            } else {
              stryCov_9fa48("1978");
              return this.createFallbackResult(stryMutAct_9fa48("1979") ? "" : (stryCov_9fa48("1979"), "Unsupported audio format"), startTime);
            }
          }

          // Reset recognizer for new audio
          this.recognizer.reset();

          // Process audio in chunks
          const stream = this.recognizer.createStream();
          const samplesPerChunk = 1024; // Process in chunks

          for (let i = 0; stryMutAct_9fa48("1982") ? i >= audioData.length : stryMutAct_9fa48("1981") ? i <= audioData.length : stryMutAct_9fa48("1980") ? false : (stryCov_9fa48("1980", "1981", "1982"), i < audioData.length); stryMutAct_9fa48("1983") ? i -= samplesPerChunk : (stryCov_9fa48("1983"), i += samplesPerChunk)) {
            if (stryMutAct_9fa48("1984")) {
              {}
            } else {
              stryCov_9fa48("1984");
              const chunk = stryMutAct_9fa48("1985") ? audioData : (stryCov_9fa48("1985"), audioData.slice(i, stryMutAct_9fa48("1986") ? i - samplesPerChunk : (stryCov_9fa48("1986"), i + samplesPerChunk)));
              stream.acceptWaveform(chunk);
            }
          }

          // Get the final result
          stream.inputFinished();
          const result = this.recognizer.getResult();
          const processingTime = stryMutAct_9fa48("1987") ? Date.now() + startTime : (stryCov_9fa48("1987"), Date.now() - startTime);
          const text = stryMutAct_9fa48("1990") ? result.text?.trim() && "" : stryMutAct_9fa48("1989") ? false : stryMutAct_9fa48("1988") ? true : (stryCov_9fa48("1988", "1989", "1990"), (stryMutAct_9fa48("1992") ? result.text.trim() : stryMutAct_9fa48("1991") ? result.text : (stryCov_9fa48("1991", "1992"), result.text?.trim())) || (stryMutAct_9fa48("1993") ? "Stryker was here!" : (stryCov_9fa48("1993"), "")));
          const words = stryMutAct_9fa48("1994") ? text.split(/\s+/) : (stryCov_9fa48("1994"), text.split(stryMutAct_9fa48("1996") ? /\S+/ : stryMutAct_9fa48("1995") ? /\s/ : (stryCov_9fa48("1995", "1996"), /\s+/)).filter(stryMutAct_9fa48("1997") ? () => undefined : (stryCov_9fa48("1997"), word => stryMutAct_9fa48("2001") ? word.length <= 0 : stryMutAct_9fa48("2000") ? word.length >= 0 : stryMutAct_9fa48("1999") ? false : stryMutAct_9fa48("1998") ? true : (stryCov_9fa48("1998", "1999", "2000", "2001"), word.length > 0))));
          const hasText = stryMutAct_9fa48("2004") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("2003") ? false : stryMutAct_9fa48("2002") ? true : (stryCov_9fa48("2002", "2003", "2004"), (stryMutAct_9fa48("2007") ? text.length <= 0 : stryMutAct_9fa48("2006") ? text.length >= 0 : stryMutAct_9fa48("2005") ? true : (stryCov_9fa48("2005", "2006", "2007"), text.length > 0)) && (stryMutAct_9fa48("2010") ? words.length <= 0 : stryMutAct_9fa48("2009") ? words.length >= 0 : stryMutAct_9fa48("2008") ? true : (stryCov_9fa48("2008", "2009", "2010"), words.length > 0)));

          // Estimate confidence (simplified - sherpa-onnx doesn't provide direct confidence)
          const confidence = hasText ? 0.8 : 0.0;
          const speechMetadata: SpeechMetadata = stryMutAct_9fa48("2011") ? {} : (stryCov_9fa48("2011"), {
            duration: stryMutAct_9fa48("2012") ? audioData.length * (options.sampleRate || 16000) : (stryCov_9fa48("2012"), audioData.length / (stryMutAct_9fa48("2015") ? options.sampleRate && 16000 : stryMutAct_9fa48("2014") ? false : stryMutAct_9fa48("2013") ? true : (stryCov_9fa48("2013", "2014", "2015"), options.sampleRate || 16000))),
            // Estimate duration
            sampleRate: stryMutAct_9fa48("2018") ? options.sampleRate && 16000 : stryMutAct_9fa48("2017") ? false : stryMutAct_9fa48("2016") ? true : (stryCov_9fa48("2016", "2017", "2018"), options.sampleRate || 16000),
            channels: 1,
            // Assume mono
            confidence,
            processingTime,
            language: stryMutAct_9fa48("2021") ? options.language && "en" : stryMutAct_9fa48("2020") ? false : stryMutAct_9fa48("2019") ? true : (stryCov_9fa48("2019", "2020", "2021"), options.language || (stryMutAct_9fa48("2022") ? "" : (stryCov_9fa48("2022"), "en"))),
            engine: stryMutAct_9fa48("2023") ? "" : (stryCov_9fa48("2023"), "sherpa-onnx")
          });
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("2024") ? {} : (stryCov_9fa48("2024"), {
            type: ContentType.AUDIO,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("2025") ? "" : (stryCov_9fa48("2025"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            speechMetadata
          });
          return stryMutAct_9fa48("2026") ? {} : (stryCov_9fa48("2026"), {
            text: hasText ? text : stryMutAct_9fa48("2027") ? "" : (stryCov_9fa48("2027"), "Audio: No speech detected or transcription failed"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("2028")) {
          {}
        } else {
          stryCov_9fa48("2028");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createFallbackResult(stryMutAct_9fa48("2029") ? `` : (stryCov_9fa48("2029"), `Speech processing error: ${errorMessage}`), Date.now());
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
    if (stryMutAct_9fa48("2030")) {
      {}
    } else {
      stryCov_9fa48("2030");
      try {
        if (stryMutAct_9fa48("2031")) {
          {}
        } else {
          stryCov_9fa48("2031");
          const buffer = fs.readFileSync(filePath);
          return await this.transcribeFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("2032")) {
          {}
        } else {
          stryCov_9fa48("2032");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("2033") ? {} : (stryCov_9fa48("2033"), {
            type: ContentType.AUDIO,
            language: stryMutAct_9fa48("2034") ? "" : (stryCov_9fa48("2034"), "unknown"),
            encoding: stryMutAct_9fa48("2035") ? "" : (stryCov_9fa48("2035"), "unknown"),
            hasText: stryMutAct_9fa48("2036") ? true : (stryCov_9fa48("2036"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("2037") ? {} : (stryCov_9fa48("2037"), {
            text: stryMutAct_9fa48("2038") ? `` : (stryCov_9fa48("2038"), `Audio File Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("2039")) {
      {}
    } else {
      stryCov_9fa48("2039");
      // Check common audio file signatures
      const signatures = stryMutAct_9fa48("2040") ? [] : (stryCov_9fa48("2040"), [Buffer.from(stryMutAct_9fa48("2041") ? [] : (stryCov_9fa48("2041"), [0x52, 0x49, 0x46, 0x46])),
      // RIFF (WAV)
      Buffer.from(stryMutAct_9fa48("2042") ? [] : (stryCov_9fa48("2042"), [0x66, 0x74, 0x79, 0x70])),
      // ftyp (MP4/M4A)
      Buffer.from(stryMutAct_9fa48("2043") ? [] : (stryCov_9fa48("2043"), [0x49, 0x44, 0x33])),
      // ID3 (MP3)
      Buffer.from(stryMutAct_9fa48("2044") ? [] : (stryCov_9fa48("2044"), [0x4F, 0x67, 0x67, 0x53])),
      // OggS (OGG)
      Buffer.from(stryMutAct_9fa48("2045") ? [] : (stryCov_9fa48("2045"), [0x66, 0x4C, 0x61, 0x43])) // fLaC (FLAC)
      ]);
      return stryMutAct_9fa48("2046") ? signatures.every(signature => buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("2046"), signatures.some(stryMutAct_9fa48("2047") ? () => undefined : (stryCov_9fa48("2047"), signature => stryMutAct_9fa48("2050") ? buffer.subarray(0, 4).equals(signature) && buffer.subarray(0, signature.length).equals(signature) : stryMutAct_9fa48("2049") ? false : stryMutAct_9fa48("2048") ? true : (stryCov_9fa48("2048", "2049", "2050"), buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)))));
    }
  }

  /**
   * Convert audio buffer to float32 array (simplified implementation)
   * In practice, you'd need proper audio decoding based on format
   */
  private convertBufferToAudioData(buffer: Buffer): Float32Array | null {
    if (stryMutAct_9fa48("2051")) {
      {}
    } else {
      stryCov_9fa48("2051");
      try {
        if (stryMutAct_9fa48("2052")) {
          {}
        } else {
          stryCov_9fa48("2052");
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
        if (stryMutAct_9fa48("2053")) {
          {}
        } else {
          stryCov_9fa48("2053");
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
    if (stryMutAct_9fa48("2054")) {
      {}
    } else {
      stryCov_9fa48("2054");
      const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("2055") ? {} : (stryCov_9fa48("2055"), {
        type: ContentType.AUDIO,
        language: stryMutAct_9fa48("2056") ? "" : (stryCov_9fa48("2056"), "unknown"),
        encoding: stryMutAct_9fa48("2057") ? "" : (stryCov_9fa48("2057"), "unknown"),
        hasText: stryMutAct_9fa48("2058") ? true : (stryCov_9fa48("2058"), false),
        wordCount: 0,
        characterCount: 0,
        speechMetadata: stryMutAct_9fa48("2059") ? {} : (stryCov_9fa48("2059"), {
          processingTime: stryMutAct_9fa48("2060") ? Date.now() + startTime : (stryCov_9fa48("2060"), Date.now() - startTime),
          language: stryMutAct_9fa48("2061") ? "" : (stryCov_9fa48("2061"), "unknown"),
          engine: stryMutAct_9fa48("2062") ? "" : (stryCov_9fa48("2062"), "none")
        })
      });
      return stryMutAct_9fa48("2063") ? {} : (stryCov_9fa48("2063"), {
        text: stryMutAct_9fa48("2064") ? `` : (stryCov_9fa48("2064"), `Audio: ${reason}`),
        metadata: contentMetadata
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("2065")) {
      {}
    } else {
      stryCov_9fa48("2065");
      if (stryMutAct_9fa48("2068") ? !text && text.length === 0 : stryMutAct_9fa48("2067") ? false : stryMutAct_9fa48("2066") ? true : (stryCov_9fa48("2066", "2067", "2068"), (stryMutAct_9fa48("2069") ? text : (stryCov_9fa48("2069"), !text)) || (stryMutAct_9fa48("2071") ? text.length !== 0 : stryMutAct_9fa48("2070") ? false : (stryCov_9fa48("2070", "2071"), text.length === 0)))) return stryMutAct_9fa48("2072") ? "" : (stryCov_9fa48("2072"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("2075") ? text.match(englishWords) && [] : stryMutAct_9fa48("2074") ? false : stryMutAct_9fa48("2073") ? true : (stryCov_9fa48("2073", "2074", "2075"), text.match(englishWords) || (stryMutAct_9fa48("2076") ? ["Stryker was here"] : (stryCov_9fa48("2076"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("2079") ? text.match(spanishWords) && [] : stryMutAct_9fa48("2078") ? false : stryMutAct_9fa48("2077") ? true : (stryCov_9fa48("2077", "2078", "2079"), text.match(spanishWords) || (stryMutAct_9fa48("2080") ? ["Stryker was here"] : (stryCov_9fa48("2080"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("2083") ? text.match(frenchWords) && [] : stryMutAct_9fa48("2082") ? false : stryMutAct_9fa48("2081") ? true : (stryCov_9fa48("2081", "2082", "2083"), text.match(frenchWords) || (stryMutAct_9fa48("2084") ? ["Stryker was here"] : (stryCov_9fa48("2084"), [])))).length;
      const maxMatches = stryMutAct_9fa48("2085") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("2085"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("2088") ? maxMatches !== 0 : stryMutAct_9fa48("2087") ? false : stryMutAct_9fa48("2086") ? true : (stryCov_9fa48("2086", "2087", "2088"), maxMatches === 0)) return stryMutAct_9fa48("2089") ? "" : (stryCov_9fa48("2089"), "unknown");
      if (stryMutAct_9fa48("2092") ? maxMatches !== englishMatches : stryMutAct_9fa48("2091") ? false : stryMutAct_9fa48("2090") ? true : (stryCov_9fa48("2090", "2091", "2092"), maxMatches === englishMatches)) return stryMutAct_9fa48("2093") ? "" : (stryCov_9fa48("2093"), "en");
      if (stryMutAct_9fa48("2096") ? maxMatches !== spanishMatches : stryMutAct_9fa48("2095") ? false : stryMutAct_9fa48("2094") ? true : (stryCov_9fa48("2094", "2095", "2096"), maxMatches === spanishMatches)) return stryMutAct_9fa48("2097") ? "" : (stryCov_9fa48("2097"), "es");
      if (stryMutAct_9fa48("2100") ? maxMatches !== frenchMatches : stryMutAct_9fa48("2099") ? false : stryMutAct_9fa48("2098") ? true : (stryCov_9fa48("2098", "2099", "2100"), maxMatches === frenchMatches)) return stryMutAct_9fa48("2101") ? "" : (stryCov_9fa48("2101"), "fr");
      return stryMutAct_9fa48("2102") ? "" : (stryCov_9fa48("2102"), "unknown");
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("2103")) {
      {}
    } else {
      stryCov_9fa48("2103");
      if (stryMutAct_9fa48("2105") ? false : stryMutAct_9fa48("2104") ? true : (stryCov_9fa48("2104", "2105"), this.recognizer)) {
        if (stryMutAct_9fa48("2106")) {
          {}
        } else {
          stryCov_9fa48("2106");
          this.recognizer.free();
          this.recognizer = null;
        }
      }
      if (stryMutAct_9fa48("2108") ? false : stryMutAct_9fa48("2107") ? true : (stryCov_9fa48("2107", "2108"), this.model)) {
        if (stryMutAct_9fa48("2109")) {
          {}
        } else {
          stryCov_9fa48("2109");
          this.model.free();
          this.model = null;
        }
      }
      this.initialized = stryMutAct_9fa48("2110") ? true : (stryCov_9fa48("2110"), false);
    }
  }

  /**
   * Check if the speech processor is ready
   */
  isReady(): boolean {
    if (stryMutAct_9fa48("2111")) {
      {}
    } else {
      stryCov_9fa48("2111");
      return stryMutAct_9fa48("2114") ? this.initialized || this.recognizer !== null : stryMutAct_9fa48("2113") ? false : stryMutAct_9fa48("2112") ? true : (stryCov_9fa48("2112", "2113", "2114"), this.initialized && (stryMutAct_9fa48("2116") ? this.recognizer === null : stryMutAct_9fa48("2115") ? true : (stryCov_9fa48("2115", "2116"), this.recognizer !== null)));
    }
  }
}