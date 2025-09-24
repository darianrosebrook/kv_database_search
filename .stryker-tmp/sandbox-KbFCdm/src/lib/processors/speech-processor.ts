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
import { ContentType, ContentMetadata } from "../../types/index";
import { detectLanguage } from "../utils";
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
  private initialized = stryMutAct_9fa48("3760") ? true : (stryCov_9fa48("3760"), false);

  /**
   * Initialize the speech recognition model
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("3761")) {
      {}
    } else {
      stryCov_9fa48("3761");
      if (stryMutAct_9fa48("3763") ? false : stryMutAct_9fa48("3762") ? true : (stryCov_9fa48("3762", "3763"), this.initialized)) return;
      try {
        if (stryMutAct_9fa48("3764")) {
          {}
        } else {
          stryCov_9fa48("3764");
          // Configure the model for speech recognition
          // Using a pre-built model configuration for English
          const modelConfig: ModelConfig = stryMutAct_9fa48("3765") ? {} : (stryCov_9fa48("3765"), {
            encoder: stryMutAct_9fa48("3766") ? "" : (stryCov_9fa48("3766"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/encoder-epoch-99-avg-1.onnx"),
            decoder: stryMutAct_9fa48("3767") ? "" : (stryCov_9fa48("3767"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/decoder-epoch-99-avg-1.onnx"),
            joiner: stryMutAct_9fa48("3768") ? "" : (stryCov_9fa48("3768"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/joiner-epoch-99-avg-1.onnx"),
            tokens: stryMutAct_9fa48("3769") ? "" : (stryCov_9fa48("3769"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/tokens.txt"),
            numThreads: 2,
            provider: stryMutAct_9fa48("3770") ? "" : (stryCov_9fa48("3770"), "cpu")
          });
          const recognizerConfig: RecognizerConfig = stryMutAct_9fa48("3771") ? {} : (stryCov_9fa48("3771"), {
            modelConfig,
            decodingMethod: stryMutAct_9fa48("3772") ? "" : (stryCov_9fa48("3772"), "greedy_search"),
            maxActivePaths: 4,
            enableEndpoint: stryMutAct_9fa48("3773") ? false : (stryCov_9fa48("3773"), true),
            rule1MinTrailingSilence: 2.4,
            rule2MinTrailingSilence: 1.2,
            rule3MinUtteranceLength: 20
          });

          // Create model and recognizer
          this.model = createModel(modelConfig);
          this.recognizer = createRecognizer(recognizerConfig);
          this.initialized = stryMutAct_9fa48("3774") ? false : (stryCov_9fa48("3774"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3775")) {
          {}
        } else {
          stryCov_9fa48("3775");
          console.warn(stryMutAct_9fa48("3776") ? "" : (stryCov_9fa48("3776"), "Speech recognition model initialization failed:"), error);
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
    if (stryMutAct_9fa48("3777")) {
      {}
    } else {
      stryCov_9fa48("3777");
      try {
        if (stryMutAct_9fa48("3778")) {
          {}
        } else {
          stryCov_9fa48("3778");
          await this.initialize();
          const startTime = Date.now();

          // If we don't have a working model, return a placeholder
          if (stryMutAct_9fa48("3781") ? false : stryMutAct_9fa48("3780") ? true : stryMutAct_9fa48("3779") ? this.recognizer : (stryCov_9fa48("3779", "3780", "3781"), !this.recognizer)) {
            if (stryMutAct_9fa48("3782")) {
              {}
            } else {
              stryCov_9fa48("3782");
              return this.createFallbackResult(stryMutAct_9fa48("3783") ? "" : (stryCov_9fa48("3783"), "Speech recognition model not available"), startTime);
            }
          }

          // Convert buffer to the format expected by sherpa-onnx
          // This is a simplified implementation - in practice, you'd need proper audio decoding
          const audioData = this.convertBufferToAudioData(buffer);
          if (stryMutAct_9fa48("3786") ? false : stryMutAct_9fa48("3785") ? true : stryMutAct_9fa48("3784") ? audioData : (stryCov_9fa48("3784", "3785", "3786"), !audioData)) {
            if (stryMutAct_9fa48("3787")) {
              {}
            } else {
              stryCov_9fa48("3787");
              return this.createFallbackResult(stryMutAct_9fa48("3788") ? "" : (stryCov_9fa48("3788"), "Unsupported audio format"), startTime);
            }
          }

          // Reset recognizer for new audio
          this.recognizer.reset();

          // Process audio in chunks
          const stream = this.recognizer.createStream();
          const samplesPerChunk = 1024; // Process in chunks

          for (let i = 0; stryMutAct_9fa48("3791") ? i >= audioData.length : stryMutAct_9fa48("3790") ? i <= audioData.length : stryMutAct_9fa48("3789") ? false : (stryCov_9fa48("3789", "3790", "3791"), i < audioData.length); stryMutAct_9fa48("3792") ? i -= samplesPerChunk : (stryCov_9fa48("3792"), i += samplesPerChunk)) {
            if (stryMutAct_9fa48("3793")) {
              {}
            } else {
              stryCov_9fa48("3793");
              const chunk = stryMutAct_9fa48("3794") ? audioData : (stryCov_9fa48("3794"), audioData.slice(i, stryMutAct_9fa48("3795") ? i - samplesPerChunk : (stryCov_9fa48("3795"), i + samplesPerChunk)));
              stream.acceptWaveform(chunk);
            }
          }

          // Get the final result
          stream.inputFinished();
          const result = this.recognizer.getResult();
          const processingTime = stryMutAct_9fa48("3796") ? Date.now() + startTime : (stryCov_9fa48("3796"), Date.now() - startTime);
          const text = stryMutAct_9fa48("3799") ? result.text?.trim() && "" : stryMutAct_9fa48("3798") ? false : stryMutAct_9fa48("3797") ? true : (stryCov_9fa48("3797", "3798", "3799"), (stryMutAct_9fa48("3801") ? result.text.trim() : stryMutAct_9fa48("3800") ? result.text : (stryCov_9fa48("3800", "3801"), result.text?.trim())) || (stryMutAct_9fa48("3802") ? "Stryker was here!" : (stryCov_9fa48("3802"), "")));
          const words = stryMutAct_9fa48("3803") ? text.split(/\s+/) : (stryCov_9fa48("3803"), text.split(stryMutAct_9fa48("3805") ? /\S+/ : stryMutAct_9fa48("3804") ? /\s/ : (stryCov_9fa48("3804", "3805"), /\s+/)).filter(stryMutAct_9fa48("3806") ? () => undefined : (stryCov_9fa48("3806"), word => stryMutAct_9fa48("3810") ? word.length <= 0 : stryMutAct_9fa48("3809") ? word.length >= 0 : stryMutAct_9fa48("3808") ? false : stryMutAct_9fa48("3807") ? true : (stryCov_9fa48("3807", "3808", "3809", "3810"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3813") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3812") ? false : stryMutAct_9fa48("3811") ? true : (stryCov_9fa48("3811", "3812", "3813"), (stryMutAct_9fa48("3816") ? text.length <= 0 : stryMutAct_9fa48("3815") ? text.length >= 0 : stryMutAct_9fa48("3814") ? true : (stryCov_9fa48("3814", "3815", "3816"), text.length > 0)) && (stryMutAct_9fa48("3819") ? words.length <= 0 : stryMutAct_9fa48("3818") ? words.length >= 0 : stryMutAct_9fa48("3817") ? true : (stryCov_9fa48("3817", "3818", "3819"), words.length > 0)));

          // Estimate confidence (simplified - sherpa-onnx doesn't provide direct confidence)
          const confidence = hasText ? 0.8 : 0.0;
          const speechMetadata: SpeechMetadata = stryMutAct_9fa48("3820") ? {} : (stryCov_9fa48("3820"), {
            duration: stryMutAct_9fa48("3821") ? audioData.length * (options.sampleRate || 16000) : (stryCov_9fa48("3821"), audioData.length / (stryMutAct_9fa48("3824") ? options.sampleRate && 16000 : stryMutAct_9fa48("3823") ? false : stryMutAct_9fa48("3822") ? true : (stryCov_9fa48("3822", "3823", "3824"), options.sampleRate || 16000))),
            // Estimate duration
            sampleRate: stryMutAct_9fa48("3827") ? options.sampleRate && 16000 : stryMutAct_9fa48("3826") ? false : stryMutAct_9fa48("3825") ? true : (stryCov_9fa48("3825", "3826", "3827"), options.sampleRate || 16000),
            channels: 1,
            // Assume mono
            confidence,
            processingTime,
            language: stryMutAct_9fa48("3830") ? options.language && "en" : stryMutAct_9fa48("3829") ? false : stryMutAct_9fa48("3828") ? true : (stryCov_9fa48("3828", "3829", "3830"), options.language || (stryMutAct_9fa48("3831") ? "" : (stryCov_9fa48("3831"), "en"))),
            engine: stryMutAct_9fa48("3832") ? "" : (stryCov_9fa48("3832"), "sherpa-onnx")
          });
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("3833") ? {} : (stryCov_9fa48("3833"), {
            type: ContentType.AUDIO,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3834") ? "" : (stryCov_9fa48("3834"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            speechMetadata
          });
          return stryMutAct_9fa48("3835") ? {} : (stryCov_9fa48("3835"), {
            text: hasText ? text : stryMutAct_9fa48("3836") ? "" : (stryCov_9fa48("3836"), "Audio: No speech detected or transcription failed"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3837")) {
          {}
        } else {
          stryCov_9fa48("3837");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createFallbackResult(stryMutAct_9fa48("3838") ? `` : (stryCov_9fa48("3838"), `Speech processing error: ${errorMessage}`), Date.now());
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
    if (stryMutAct_9fa48("3839")) {
      {}
    } else {
      stryCov_9fa48("3839");
      try {
        if (stryMutAct_9fa48("3840")) {
          {}
        } else {
          stryCov_9fa48("3840");
          const buffer = fs.readFileSync(filePath);
          return await this.transcribeFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3841")) {
          {}
        } else {
          stryCov_9fa48("3841");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("3842") ? {} : (stryCov_9fa48("3842"), {
            type: ContentType.AUDIO,
            language: stryMutAct_9fa48("3843") ? "" : (stryCov_9fa48("3843"), "unknown"),
            encoding: stryMutAct_9fa48("3844") ? "" : (stryCov_9fa48("3844"), "unknown"),
            hasText: stryMutAct_9fa48("3845") ? true : (stryCov_9fa48("3845"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3846") ? {} : (stryCov_9fa48("3846"), {
            text: stryMutAct_9fa48("3847") ? `` : (stryCov_9fa48("3847"), `Audio File Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("3848")) {
      {}
    } else {
      stryCov_9fa48("3848");
      // Check common audio file signatures
      const signatures = stryMutAct_9fa48("3849") ? [] : (stryCov_9fa48("3849"), [Buffer.from(stryMutAct_9fa48("3850") ? [] : (stryCov_9fa48("3850"), [0x52, 0x49, 0x46, 0x46])),
      // RIFF (WAV)
      Buffer.from(stryMutAct_9fa48("3851") ? [] : (stryCov_9fa48("3851"), [0x66, 0x74, 0x79, 0x70])),
      // ftyp (MP4/M4A)
      Buffer.from(stryMutAct_9fa48("3852") ? [] : (stryCov_9fa48("3852"), [0x49, 0x44, 0x33])),
      // ID3 (MP3)
      Buffer.from(stryMutAct_9fa48("3853") ? [] : (stryCov_9fa48("3853"), [0x4f, 0x67, 0x67, 0x53])),
      // OggS (OGG)
      Buffer.from(stryMutAct_9fa48("3854") ? [] : (stryCov_9fa48("3854"), [0x66, 0x4c, 0x61, 0x43])) // fLaC (FLAC)
      ]);
      return stryMutAct_9fa48("3855") ? signatures.every(signature => buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("3855"), signatures.some(stryMutAct_9fa48("3856") ? () => undefined : (stryCov_9fa48("3856"), signature => stryMutAct_9fa48("3859") ? buffer.subarray(0, 4).equals(signature) && buffer.subarray(0, signature.length).equals(signature) : stryMutAct_9fa48("3858") ? false : stryMutAct_9fa48("3857") ? true : (stryCov_9fa48("3857", "3858", "3859"), buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)))));
    }
  }

  /**
   * Convert audio buffer to float32 array (simplified implementation)
   * In practice, you'd need proper audio decoding based on format
   */
  private convertBufferToAudioData(_buffer: Buffer): Float32Array | null {
    if (stryMutAct_9fa48("3860")) {
      {}
    } else {
      stryCov_9fa48("3860");
      // This is a very simplified implementation
      // In practice, you'd need to:
      // 1. Detect audio format (WAV, MP3, etc.)
      // 2. Decode the audio to raw PCM data
      // 3. Convert to Float32Array

      // For now, return null to indicate unsupported format
      // This would need to be implemented with proper audio decoding libraries
      return null;
    }
  }

  /**
   * Create a fallback result when speech recognition is not available
   */
  private createFallbackResult(reason: string, startTime: number): {
    text: string;
    metadata: SpeechContentMetadata;
  } {
    if (stryMutAct_9fa48("3861")) {
      {}
    } else {
      stryCov_9fa48("3861");
      const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("3862") ? {} : (stryCov_9fa48("3862"), {
        type: ContentType.AUDIO,
        language: stryMutAct_9fa48("3863") ? "" : (stryCov_9fa48("3863"), "unknown"),
        encoding: stryMutAct_9fa48("3864") ? "" : (stryCov_9fa48("3864"), "unknown"),
        hasText: stryMutAct_9fa48("3865") ? true : (stryCov_9fa48("3865"), false),
        wordCount: 0,
        characterCount: 0,
        speechMetadata: stryMutAct_9fa48("3866") ? {} : (stryCov_9fa48("3866"), {
          processingTime: stryMutAct_9fa48("3867") ? Date.now() + startTime : (stryCov_9fa48("3867"), Date.now() - startTime),
          language: stryMutAct_9fa48("3868") ? "" : (stryCov_9fa48("3868"), "unknown"),
          engine: stryMutAct_9fa48("3869") ? "" : (stryCov_9fa48("3869"), "none")
        })
      });
      return stryMutAct_9fa48("3870") ? {} : (stryCov_9fa48("3870"), {
        text: stryMutAct_9fa48("3871") ? `` : (stryCov_9fa48("3871"), `Audio: ${reason}`),
        metadata: contentMetadata
      });
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("3872")) {
      {}
    } else {
      stryCov_9fa48("3872");
      if (stryMutAct_9fa48("3874") ? false : stryMutAct_9fa48("3873") ? true : (stryCov_9fa48("3873", "3874"), this.recognizer)) {
        if (stryMutAct_9fa48("3875")) {
          {}
        } else {
          stryCov_9fa48("3875");
          this.recognizer.free();
          this.recognizer = null;
        }
      }
      if (stryMutAct_9fa48("3877") ? false : stryMutAct_9fa48("3876") ? true : (stryCov_9fa48("3876", "3877"), this.model)) {
        if (stryMutAct_9fa48("3878")) {
          {}
        } else {
          stryCov_9fa48("3878");
          this.model.free();
          this.model = null;
        }
      }
      this.initialized = stryMutAct_9fa48("3879") ? true : (stryCov_9fa48("3879"), false);
    }
  }

  /**
   * Check if the speech processor is ready
   */
  isReady(): boolean {
    if (stryMutAct_9fa48("3880")) {
      {}
    } else {
      stryCov_9fa48("3880");
      return stryMutAct_9fa48("3883") ? this.initialized || this.recognizer !== null : stryMutAct_9fa48("3882") ? false : stryMutAct_9fa48("3881") ? true : (stryCov_9fa48("3881", "3882", "3883"), this.initialized && (stryMutAct_9fa48("3885") ? this.recognizer === null : stryMutAct_9fa48("3884") ? true : (stryCov_9fa48("3884", "3885"), this.recognizer !== null)));
    }
  }
}