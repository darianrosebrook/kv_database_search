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
  private initialized = stryMutAct_9fa48("1955") ? true : (stryCov_9fa48("1955"), false);

  /**
   * Initialize the speech recognition model
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("1956")) {
      {}
    } else {
      stryCov_9fa48("1956");
      if (stryMutAct_9fa48("1958") ? false : stryMutAct_9fa48("1957") ? true : (stryCov_9fa48("1957", "1958"), this.initialized)) return;
      try {
        if (stryMutAct_9fa48("1959")) {
          {}
        } else {
          stryCov_9fa48("1959");
          // Configure the model for speech recognition
          // Using a pre-built model configuration for English
          const modelConfig: ModelConfig = stryMutAct_9fa48("1960") ? {} : (stryCov_9fa48("1960"), {
            encoder: stryMutAct_9fa48("1961") ? "" : (stryCov_9fa48("1961"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/encoder-epoch-99-avg-1.onnx"),
            decoder: stryMutAct_9fa48("1962") ? "" : (stryCov_9fa48("1962"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/decoder-epoch-99-avg-1.onnx"),
            joiner: stryMutAct_9fa48("1963") ? "" : (stryCov_9fa48("1963"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/joiner-epoch-99-avg-1.onnx"),
            tokens: stryMutAct_9fa48("1964") ? "" : (stryCov_9fa48("1964"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/tokens.txt"),
            numThreads: 2,
            provider: stryMutAct_9fa48("1965") ? "" : (stryCov_9fa48("1965"), "cpu")
          });
          const recognizerConfig: RecognizerConfig = stryMutAct_9fa48("1966") ? {} : (stryCov_9fa48("1966"), {
            modelConfig,
            decodingMethod: stryMutAct_9fa48("1967") ? "" : (stryCov_9fa48("1967"), "greedy_search"),
            maxActivePaths: 4,
            enableEndpoint: stryMutAct_9fa48("1968") ? false : (stryCov_9fa48("1968"), true),
            rule1MinTrailingSilence: 2.4,
            rule2MinTrailingSilence: 1.2,
            rule3MinUtteranceLength: 20
          });

          // Create model and recognizer
          this.model = createModel(modelConfig);
          this.recognizer = createRecognizer(recognizerConfig);
          this.initialized = stryMutAct_9fa48("1969") ? false : (stryCov_9fa48("1969"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1970")) {
          {}
        } else {
          stryCov_9fa48("1970");
          console.warn(stryMutAct_9fa48("1971") ? "" : (stryCov_9fa48("1971"), "Speech recognition model initialization failed:"), error);
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
    if (stryMutAct_9fa48("1972")) {
      {}
    } else {
      stryCov_9fa48("1972");
      try {
        if (stryMutAct_9fa48("1973")) {
          {}
        } else {
          stryCov_9fa48("1973");
          await this.initialize();
          const startTime = Date.now();

          // If we don't have a working model, return a placeholder
          if (stryMutAct_9fa48("1976") ? false : stryMutAct_9fa48("1975") ? true : stryMutAct_9fa48("1974") ? this.recognizer : (stryCov_9fa48("1974", "1975", "1976"), !this.recognizer)) {
            if (stryMutAct_9fa48("1977")) {
              {}
            } else {
              stryCov_9fa48("1977");
              return this.createFallbackResult(stryMutAct_9fa48("1978") ? "" : (stryCov_9fa48("1978"), "Speech recognition model not available"), startTime);
            }
          }

          // Convert buffer to the format expected by sherpa-onnx
          // This is a simplified implementation - in practice, you'd need proper audio decoding
          const audioData = this.convertBufferToAudioData(buffer);
          if (stryMutAct_9fa48("1981") ? false : stryMutAct_9fa48("1980") ? true : stryMutAct_9fa48("1979") ? audioData : (stryCov_9fa48("1979", "1980", "1981"), !audioData)) {
            if (stryMutAct_9fa48("1982")) {
              {}
            } else {
              stryCov_9fa48("1982");
              return this.createFallbackResult(stryMutAct_9fa48("1983") ? "" : (stryCov_9fa48("1983"), "Unsupported audio format"), startTime);
            }
          }

          // Reset recognizer for new audio
          this.recognizer.reset();

          // Process audio in chunks
          const stream = this.recognizer.createStream();
          const samplesPerChunk = 1024; // Process in chunks

          for (let i = 0; stryMutAct_9fa48("1986") ? i >= audioData.length : stryMutAct_9fa48("1985") ? i <= audioData.length : stryMutAct_9fa48("1984") ? false : (stryCov_9fa48("1984", "1985", "1986"), i < audioData.length); stryMutAct_9fa48("1987") ? i -= samplesPerChunk : (stryCov_9fa48("1987"), i += samplesPerChunk)) {
            if (stryMutAct_9fa48("1988")) {
              {}
            } else {
              stryCov_9fa48("1988");
              const chunk = stryMutAct_9fa48("1989") ? audioData : (stryCov_9fa48("1989"), audioData.slice(i, stryMutAct_9fa48("1990") ? i - samplesPerChunk : (stryCov_9fa48("1990"), i + samplesPerChunk)));
              stream.acceptWaveform(chunk);
            }
          }

          // Get the final result
          stream.inputFinished();
          const result = this.recognizer.getResult();
          const processingTime = stryMutAct_9fa48("1991") ? Date.now() + startTime : (stryCov_9fa48("1991"), Date.now() - startTime);
          const text = stryMutAct_9fa48("1994") ? result.text?.trim() && "" : stryMutAct_9fa48("1993") ? false : stryMutAct_9fa48("1992") ? true : (stryCov_9fa48("1992", "1993", "1994"), (stryMutAct_9fa48("1996") ? result.text.trim() : stryMutAct_9fa48("1995") ? result.text : (stryCov_9fa48("1995", "1996"), result.text?.trim())) || (stryMutAct_9fa48("1997") ? "Stryker was here!" : (stryCov_9fa48("1997"), "")));
          const words = stryMutAct_9fa48("1998") ? text.split(/\s+/) : (stryCov_9fa48("1998"), text.split(stryMutAct_9fa48("2000") ? /\S+/ : stryMutAct_9fa48("1999") ? /\s/ : (stryCov_9fa48("1999", "2000"), /\s+/)).filter(stryMutAct_9fa48("2001") ? () => undefined : (stryCov_9fa48("2001"), word => stryMutAct_9fa48("2005") ? word.length <= 0 : stryMutAct_9fa48("2004") ? word.length >= 0 : stryMutAct_9fa48("2003") ? false : stryMutAct_9fa48("2002") ? true : (stryCov_9fa48("2002", "2003", "2004", "2005"), word.length > 0))));
          const hasText = stryMutAct_9fa48("2008") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("2007") ? false : stryMutAct_9fa48("2006") ? true : (stryCov_9fa48("2006", "2007", "2008"), (stryMutAct_9fa48("2011") ? text.length <= 0 : stryMutAct_9fa48("2010") ? text.length >= 0 : stryMutAct_9fa48("2009") ? true : (stryCov_9fa48("2009", "2010", "2011"), text.length > 0)) && (stryMutAct_9fa48("2014") ? words.length <= 0 : stryMutAct_9fa48("2013") ? words.length >= 0 : stryMutAct_9fa48("2012") ? true : (stryCov_9fa48("2012", "2013", "2014"), words.length > 0)));

          // Estimate confidence (simplified - sherpa-onnx doesn't provide direct confidence)
          const confidence = hasText ? 0.8 : 0.0;
          const speechMetadata: SpeechMetadata = stryMutAct_9fa48("2015") ? {} : (stryCov_9fa48("2015"), {
            duration: stryMutAct_9fa48("2016") ? audioData.length * (options.sampleRate || 16000) : (stryCov_9fa48("2016"), audioData.length / (stryMutAct_9fa48("2019") ? options.sampleRate && 16000 : stryMutAct_9fa48("2018") ? false : stryMutAct_9fa48("2017") ? true : (stryCov_9fa48("2017", "2018", "2019"), options.sampleRate || 16000))),
            // Estimate duration
            sampleRate: stryMutAct_9fa48("2022") ? options.sampleRate && 16000 : stryMutAct_9fa48("2021") ? false : stryMutAct_9fa48("2020") ? true : (stryCov_9fa48("2020", "2021", "2022"), options.sampleRate || 16000),
            channels: 1,
            // Assume mono
            confidence,
            processingTime,
            language: stryMutAct_9fa48("2025") ? options.language && "en" : stryMutAct_9fa48("2024") ? false : stryMutAct_9fa48("2023") ? true : (stryCov_9fa48("2023", "2024", "2025"), options.language || (stryMutAct_9fa48("2026") ? "" : (stryCov_9fa48("2026"), "en"))),
            engine: stryMutAct_9fa48("2027") ? "" : (stryCov_9fa48("2027"), "sherpa-onnx")
          });
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("2028") ? {} : (stryCov_9fa48("2028"), {
            type: ContentType.AUDIO,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("2029") ? "" : (stryCov_9fa48("2029"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            speechMetadata
          });
          return stryMutAct_9fa48("2030") ? {} : (stryCov_9fa48("2030"), {
            text: hasText ? text : stryMutAct_9fa48("2031") ? "" : (stryCov_9fa48("2031"), "Audio: No speech detected or transcription failed"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("2032")) {
          {}
        } else {
          stryCov_9fa48("2032");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createFallbackResult(stryMutAct_9fa48("2033") ? `` : (stryCov_9fa48("2033"), `Speech processing error: ${errorMessage}`), Date.now());
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
    if (stryMutAct_9fa48("2034")) {
      {}
    } else {
      stryCov_9fa48("2034");
      try {
        if (stryMutAct_9fa48("2035")) {
          {}
        } else {
          stryCov_9fa48("2035");
          const buffer = fs.readFileSync(filePath);
          return await this.transcribeFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("2036")) {
          {}
        } else {
          stryCov_9fa48("2036");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("2037") ? {} : (stryCov_9fa48("2037"), {
            type: ContentType.AUDIO,
            language: stryMutAct_9fa48("2038") ? "" : (stryCov_9fa48("2038"), "unknown"),
            encoding: stryMutAct_9fa48("2039") ? "" : (stryCov_9fa48("2039"), "unknown"),
            hasText: stryMutAct_9fa48("2040") ? true : (stryCov_9fa48("2040"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("2041") ? {} : (stryCov_9fa48("2041"), {
            text: stryMutAct_9fa48("2042") ? `` : (stryCov_9fa48("2042"), `Audio File Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("2043")) {
      {}
    } else {
      stryCov_9fa48("2043");
      // Check common audio file signatures
      const signatures = stryMutAct_9fa48("2044") ? [] : (stryCov_9fa48("2044"), [Buffer.from(stryMutAct_9fa48("2045") ? [] : (stryCov_9fa48("2045"), [0x52, 0x49, 0x46, 0x46])),
      // RIFF (WAV)
      Buffer.from(stryMutAct_9fa48("2046") ? [] : (stryCov_9fa48("2046"), [0x66, 0x74, 0x79, 0x70])),
      // ftyp (MP4/M4A)
      Buffer.from(stryMutAct_9fa48("2047") ? [] : (stryCov_9fa48("2047"), [0x49, 0x44, 0x33])),
      // ID3 (MP3)
      Buffer.from(stryMutAct_9fa48("2048") ? [] : (stryCov_9fa48("2048"), [0x4f, 0x67, 0x67, 0x53])),
      // OggS (OGG)
      Buffer.from(stryMutAct_9fa48("2049") ? [] : (stryCov_9fa48("2049"), [0x66, 0x4c, 0x61, 0x43])) // fLaC (FLAC)
      ]);
      return stryMutAct_9fa48("2050") ? signatures.every(signature => buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("2050"), signatures.some(stryMutAct_9fa48("2051") ? () => undefined : (stryCov_9fa48("2051"), signature => stryMutAct_9fa48("2054") ? buffer.subarray(0, 4).equals(signature) && buffer.subarray(0, signature.length).equals(signature) : stryMutAct_9fa48("2053") ? false : stryMutAct_9fa48("2052") ? true : (stryCov_9fa48("2052", "2053", "2054"), buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)))));
    }
  }

  /**
   * Convert audio buffer to float32 array (simplified implementation)
   * In practice, you'd need proper audio decoding based on format
   */
  private convertBufferToAudioData(buffer: Buffer): Float32Array | null {
    if (stryMutAct_9fa48("2055")) {
      {}
    } else {
      stryCov_9fa48("2055");
      try {
        if (stryMutAct_9fa48("2056")) {
          {}
        } else {
          stryCov_9fa48("2056");
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
        if (stryMutAct_9fa48("2057")) {
          {}
        } else {
          stryCov_9fa48("2057");
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
    if (stryMutAct_9fa48("2058")) {
      {}
    } else {
      stryCov_9fa48("2058");
      const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("2059") ? {} : (stryCov_9fa48("2059"), {
        type: ContentType.AUDIO,
        language: stryMutAct_9fa48("2060") ? "" : (stryCov_9fa48("2060"), "unknown"),
        encoding: stryMutAct_9fa48("2061") ? "" : (stryCov_9fa48("2061"), "unknown"),
        hasText: stryMutAct_9fa48("2062") ? true : (stryCov_9fa48("2062"), false),
        wordCount: 0,
        characterCount: 0,
        speechMetadata: stryMutAct_9fa48("2063") ? {} : (stryCov_9fa48("2063"), {
          processingTime: stryMutAct_9fa48("2064") ? Date.now() + startTime : (stryCov_9fa48("2064"), Date.now() - startTime),
          language: stryMutAct_9fa48("2065") ? "" : (stryCov_9fa48("2065"), "unknown"),
          engine: stryMutAct_9fa48("2066") ? "" : (stryCov_9fa48("2066"), "none")
        })
      });
      return stryMutAct_9fa48("2067") ? {} : (stryCov_9fa48("2067"), {
        text: stryMutAct_9fa48("2068") ? `` : (stryCov_9fa48("2068"), `Audio: ${reason}`),
        metadata: contentMetadata
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("2069")) {
      {}
    } else {
      stryCov_9fa48("2069");
      if (stryMutAct_9fa48("2072") ? !text && text.length === 0 : stryMutAct_9fa48("2071") ? false : stryMutAct_9fa48("2070") ? true : (stryCov_9fa48("2070", "2071", "2072"), (stryMutAct_9fa48("2073") ? text : (stryCov_9fa48("2073"), !text)) || (stryMutAct_9fa48("2075") ? text.length !== 0 : stryMutAct_9fa48("2074") ? false : (stryCov_9fa48("2074", "2075"), text.length === 0)))) return stryMutAct_9fa48("2076") ? "" : (stryCov_9fa48("2076"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("2079") ? text.match(englishWords) && [] : stryMutAct_9fa48("2078") ? false : stryMutAct_9fa48("2077") ? true : (stryCov_9fa48("2077", "2078", "2079"), text.match(englishWords) || (stryMutAct_9fa48("2080") ? ["Stryker was here"] : (stryCov_9fa48("2080"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("2083") ? text.match(spanishWords) && [] : stryMutAct_9fa48("2082") ? false : stryMutAct_9fa48("2081") ? true : (stryCov_9fa48("2081", "2082", "2083"), text.match(spanishWords) || (stryMutAct_9fa48("2084") ? ["Stryker was here"] : (stryCov_9fa48("2084"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("2087") ? text.match(frenchWords) && [] : stryMutAct_9fa48("2086") ? false : stryMutAct_9fa48("2085") ? true : (stryCov_9fa48("2085", "2086", "2087"), text.match(frenchWords) || (stryMutAct_9fa48("2088") ? ["Stryker was here"] : (stryCov_9fa48("2088"), [])))).length;
      const maxMatches = stryMutAct_9fa48("2089") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("2089"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("2092") ? maxMatches !== 0 : stryMutAct_9fa48("2091") ? false : stryMutAct_9fa48("2090") ? true : (stryCov_9fa48("2090", "2091", "2092"), maxMatches === 0)) return stryMutAct_9fa48("2093") ? "" : (stryCov_9fa48("2093"), "unknown");
      if (stryMutAct_9fa48("2096") ? maxMatches !== englishMatches : stryMutAct_9fa48("2095") ? false : stryMutAct_9fa48("2094") ? true : (stryCov_9fa48("2094", "2095", "2096"), maxMatches === englishMatches)) return stryMutAct_9fa48("2097") ? "" : (stryCov_9fa48("2097"), "en");
      if (stryMutAct_9fa48("2100") ? maxMatches !== spanishMatches : stryMutAct_9fa48("2099") ? false : stryMutAct_9fa48("2098") ? true : (stryCov_9fa48("2098", "2099", "2100"), maxMatches === spanishMatches)) return stryMutAct_9fa48("2101") ? "" : (stryCov_9fa48("2101"), "es");
      if (stryMutAct_9fa48("2104") ? maxMatches !== frenchMatches : stryMutAct_9fa48("2103") ? false : stryMutAct_9fa48("2102") ? true : (stryCov_9fa48("2102", "2103", "2104"), maxMatches === frenchMatches)) return stryMutAct_9fa48("2105") ? "" : (stryCov_9fa48("2105"), "fr");
      return stryMutAct_9fa48("2106") ? "" : (stryCov_9fa48("2106"), "unknown");
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("2107")) {
      {}
    } else {
      stryCov_9fa48("2107");
      if (stryMutAct_9fa48("2109") ? false : stryMutAct_9fa48("2108") ? true : (stryCov_9fa48("2108", "2109"), this.recognizer)) {
        if (stryMutAct_9fa48("2110")) {
          {}
        } else {
          stryCov_9fa48("2110");
          this.recognizer.free();
          this.recognizer = null;
        }
      }
      if (stryMutAct_9fa48("2112") ? false : stryMutAct_9fa48("2111") ? true : (stryCov_9fa48("2111", "2112"), this.model)) {
        if (stryMutAct_9fa48("2113")) {
          {}
        } else {
          stryCov_9fa48("2113");
          this.model.free();
          this.model = null;
        }
      }
      this.initialized = stryMutAct_9fa48("2114") ? true : (stryCov_9fa48("2114"), false);
    }
  }

  /**
   * Check if the speech processor is ready
   */
  isReady(): boolean {
    if (stryMutAct_9fa48("2115")) {
      {}
    } else {
      stryCov_9fa48("2115");
      return stryMutAct_9fa48("2118") ? this.initialized || this.recognizer !== null : stryMutAct_9fa48("2117") ? false : stryMutAct_9fa48("2116") ? true : (stryCov_9fa48("2116", "2117", "2118"), this.initialized && (stryMutAct_9fa48("2120") ? this.recognizer === null : stryMutAct_9fa48("2119") ? true : (stryCov_9fa48("2119", "2120"), this.recognizer !== null)));
    }
  }
}