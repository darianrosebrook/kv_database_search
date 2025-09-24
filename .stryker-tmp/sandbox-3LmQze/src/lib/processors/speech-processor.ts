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
  private initialized = stryMutAct_9fa48("3864") ? true : (stryCov_9fa48("3864"), false);

  /**
   * Initialize the speech recognition model
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("3865")) {
      {}
    } else {
      stryCov_9fa48("3865");
      if (stryMutAct_9fa48("3867") ? false : stryMutAct_9fa48("3866") ? true : (stryCov_9fa48("3866", "3867"), this.initialized)) return;
      try {
        if (stryMutAct_9fa48("3868")) {
          {}
        } else {
          stryCov_9fa48("3868");
          // Configure the model for speech recognition
          // Using a pre-built model configuration for English
          const modelConfig: ModelConfig = stryMutAct_9fa48("3869") ? {} : (stryCov_9fa48("3869"), {
            encoder: stryMutAct_9fa48("3870") ? "" : (stryCov_9fa48("3870"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/encoder-epoch-99-avg-1.onnx"),
            decoder: stryMutAct_9fa48("3871") ? "" : (stryCov_9fa48("3871"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/decoder-epoch-99-avg-1.onnx"),
            joiner: stryMutAct_9fa48("3872") ? "" : (stryCov_9fa48("3872"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/joiner-epoch-99-avg-1.onnx"),
            tokens: stryMutAct_9fa48("3873") ? "" : (stryCov_9fa48("3873"), "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/tokens.txt"),
            numThreads: 2,
            provider: stryMutAct_9fa48("3874") ? "" : (stryCov_9fa48("3874"), "cpu")
          });
          const recognizerConfig: RecognizerConfig = stryMutAct_9fa48("3875") ? {} : (stryCov_9fa48("3875"), {
            modelConfig,
            decodingMethod: stryMutAct_9fa48("3876") ? "" : (stryCov_9fa48("3876"), "greedy_search"),
            maxActivePaths: 4,
            enableEndpoint: stryMutAct_9fa48("3877") ? false : (stryCov_9fa48("3877"), true),
            rule1MinTrailingSilence: 2.4,
            rule2MinTrailingSilence: 1.2,
            rule3MinUtteranceLength: 20
          });

          // Create model and recognizer
          this.model = createModel(modelConfig);
          this.recognizer = createRecognizer(recognizerConfig);
          this.initialized = stryMutAct_9fa48("3878") ? false : (stryCov_9fa48("3878"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3879")) {
          {}
        } else {
          stryCov_9fa48("3879");
          console.warn(stryMutAct_9fa48("3880") ? "" : (stryCov_9fa48("3880"), "Speech recognition model initialization failed:"), error);
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
    if (stryMutAct_9fa48("3881")) {
      {}
    } else {
      stryCov_9fa48("3881");
      try {
        if (stryMutAct_9fa48("3882")) {
          {}
        } else {
          stryCov_9fa48("3882");
          await this.initialize();
          const startTime = Date.now();

          // If we don't have a working model, return a placeholder
          if (stryMutAct_9fa48("3885") ? false : stryMutAct_9fa48("3884") ? true : stryMutAct_9fa48("3883") ? this.recognizer : (stryCov_9fa48("3883", "3884", "3885"), !this.recognizer)) {
            if (stryMutAct_9fa48("3886")) {
              {}
            } else {
              stryCov_9fa48("3886");
              return this.createFallbackResult(stryMutAct_9fa48("3887") ? "" : (stryCov_9fa48("3887"), "Speech recognition model not available"), startTime);
            }
          }

          // Convert buffer to the format expected by sherpa-onnx
          // This is a simplified implementation - in practice, you'd need proper audio decoding
          const audioData = this.convertBufferToAudioData(buffer);
          if (stryMutAct_9fa48("3890") ? false : stryMutAct_9fa48("3889") ? true : stryMutAct_9fa48("3888") ? audioData : (stryCov_9fa48("3888", "3889", "3890"), !audioData)) {
            if (stryMutAct_9fa48("3891")) {
              {}
            } else {
              stryCov_9fa48("3891");
              return this.createFallbackResult(stryMutAct_9fa48("3892") ? "" : (stryCov_9fa48("3892"), "Unsupported audio format"), startTime);
            }
          }

          // Reset recognizer for new audio
          this.recognizer.reset();

          // Process audio in chunks
          const stream = this.recognizer.createStream();
          const samplesPerChunk = 1024; // Process in chunks

          for (let i = 0; stryMutAct_9fa48("3895") ? i >= audioData.length : stryMutAct_9fa48("3894") ? i <= audioData.length : stryMutAct_9fa48("3893") ? false : (stryCov_9fa48("3893", "3894", "3895"), i < audioData.length); stryMutAct_9fa48("3896") ? i -= samplesPerChunk : (stryCov_9fa48("3896"), i += samplesPerChunk)) {
            if (stryMutAct_9fa48("3897")) {
              {}
            } else {
              stryCov_9fa48("3897");
              const chunk = stryMutAct_9fa48("3898") ? audioData : (stryCov_9fa48("3898"), audioData.slice(i, stryMutAct_9fa48("3899") ? i - samplesPerChunk : (stryCov_9fa48("3899"), i + samplesPerChunk)));
              stream.acceptWaveform(chunk);
            }
          }

          // Get the final result
          stream.inputFinished();
          const result = this.recognizer.getResult();
          const processingTime = stryMutAct_9fa48("3900") ? Date.now() + startTime : (stryCov_9fa48("3900"), Date.now() - startTime);
          const text = stryMutAct_9fa48("3903") ? result.text?.trim() && "" : stryMutAct_9fa48("3902") ? false : stryMutAct_9fa48("3901") ? true : (stryCov_9fa48("3901", "3902", "3903"), (stryMutAct_9fa48("3905") ? result.text.trim() : stryMutAct_9fa48("3904") ? result.text : (stryCov_9fa48("3904", "3905"), result.text?.trim())) || (stryMutAct_9fa48("3906") ? "Stryker was here!" : (stryCov_9fa48("3906"), "")));
          const words = stryMutAct_9fa48("3907") ? text.split(/\s+/) : (stryCov_9fa48("3907"), text.split(stryMutAct_9fa48("3909") ? /\S+/ : stryMutAct_9fa48("3908") ? /\s/ : (stryCov_9fa48("3908", "3909"), /\s+/)).filter(stryMutAct_9fa48("3910") ? () => undefined : (stryCov_9fa48("3910"), word => stryMutAct_9fa48("3914") ? word.length <= 0 : stryMutAct_9fa48("3913") ? word.length >= 0 : stryMutAct_9fa48("3912") ? false : stryMutAct_9fa48("3911") ? true : (stryCov_9fa48("3911", "3912", "3913", "3914"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3917") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3916") ? false : stryMutAct_9fa48("3915") ? true : (stryCov_9fa48("3915", "3916", "3917"), (stryMutAct_9fa48("3920") ? text.length <= 0 : stryMutAct_9fa48("3919") ? text.length >= 0 : stryMutAct_9fa48("3918") ? true : (stryCov_9fa48("3918", "3919", "3920"), text.length > 0)) && (stryMutAct_9fa48("3923") ? words.length <= 0 : stryMutAct_9fa48("3922") ? words.length >= 0 : stryMutAct_9fa48("3921") ? true : (stryCov_9fa48("3921", "3922", "3923"), words.length > 0)));

          // Estimate confidence (simplified - sherpa-onnx doesn't provide direct confidence)
          const confidence = hasText ? 0.8 : 0.0;
          const speechMetadata: SpeechMetadata = stryMutAct_9fa48("3924") ? {} : (stryCov_9fa48("3924"), {
            duration: stryMutAct_9fa48("3925") ? audioData.length * (options.sampleRate || 16000) : (stryCov_9fa48("3925"), audioData.length / (stryMutAct_9fa48("3928") ? options.sampleRate && 16000 : stryMutAct_9fa48("3927") ? false : stryMutAct_9fa48("3926") ? true : (stryCov_9fa48("3926", "3927", "3928"), options.sampleRate || 16000))),
            // Estimate duration
            sampleRate: stryMutAct_9fa48("3931") ? options.sampleRate && 16000 : stryMutAct_9fa48("3930") ? false : stryMutAct_9fa48("3929") ? true : (stryCov_9fa48("3929", "3930", "3931"), options.sampleRate || 16000),
            channels: 1,
            // Assume mono
            confidence,
            processingTime,
            language: stryMutAct_9fa48("3934") ? options.language && "en" : stryMutAct_9fa48("3933") ? false : stryMutAct_9fa48("3932") ? true : (stryCov_9fa48("3932", "3933", "3934"), options.language || (stryMutAct_9fa48("3935") ? "" : (stryCov_9fa48("3935"), "en"))),
            engine: stryMutAct_9fa48("3936") ? "" : (stryCov_9fa48("3936"), "sherpa-onnx")
          });
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("3937") ? {} : (stryCov_9fa48("3937"), {
            type: ContentType.AUDIO,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3938") ? "" : (stryCov_9fa48("3938"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            speechMetadata
          });
          return stryMutAct_9fa48("3939") ? {} : (stryCov_9fa48("3939"), {
            text: hasText ? text : stryMutAct_9fa48("3940") ? "" : (stryCov_9fa48("3940"), "Audio: No speech detected or transcription failed"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3941")) {
          {}
        } else {
          stryCov_9fa48("3941");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createFallbackResult(stryMutAct_9fa48("3942") ? `` : (stryCov_9fa48("3942"), `Speech processing error: ${errorMessage}`), Date.now());
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
    if (stryMutAct_9fa48("3943")) {
      {}
    } else {
      stryCov_9fa48("3943");
      try {
        if (stryMutAct_9fa48("3944")) {
          {}
        } else {
          stryCov_9fa48("3944");
          const buffer = fs.readFileSync(filePath);
          return await this.transcribeFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3945")) {
          {}
        } else {
          stryCov_9fa48("3945");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("3946") ? {} : (stryCov_9fa48("3946"), {
            type: ContentType.AUDIO,
            language: stryMutAct_9fa48("3947") ? "" : (stryCov_9fa48("3947"), "unknown"),
            encoding: stryMutAct_9fa48("3948") ? "" : (stryCov_9fa48("3948"), "unknown"),
            hasText: stryMutAct_9fa48("3949") ? true : (stryCov_9fa48("3949"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3950") ? {} : (stryCov_9fa48("3950"), {
            text: stryMutAct_9fa48("3951") ? `` : (stryCov_9fa48("3951"), `Audio File Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("3952")) {
      {}
    } else {
      stryCov_9fa48("3952");
      // Check common audio file signatures
      const signatures = stryMutAct_9fa48("3953") ? [] : (stryCov_9fa48("3953"), [Buffer.from(stryMutAct_9fa48("3954") ? [] : (stryCov_9fa48("3954"), [0x52, 0x49, 0x46, 0x46])),
      // RIFF (WAV)
      Buffer.from(stryMutAct_9fa48("3955") ? [] : (stryCov_9fa48("3955"), [0x66, 0x74, 0x79, 0x70])),
      // ftyp (MP4/M4A)
      Buffer.from(stryMutAct_9fa48("3956") ? [] : (stryCov_9fa48("3956"), [0x49, 0x44, 0x33])),
      // ID3 (MP3)
      Buffer.from(stryMutAct_9fa48("3957") ? [] : (stryCov_9fa48("3957"), [0x4f, 0x67, 0x67, 0x53])),
      // OggS (OGG)
      Buffer.from(stryMutAct_9fa48("3958") ? [] : (stryCov_9fa48("3958"), [0x66, 0x4c, 0x61, 0x43])) // fLaC (FLAC)
      ]);
      return stryMutAct_9fa48("3959") ? signatures.every(signature => buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("3959"), signatures.some(stryMutAct_9fa48("3960") ? () => undefined : (stryCov_9fa48("3960"), signature => stryMutAct_9fa48("3963") ? buffer.subarray(0, 4).equals(signature) && buffer.subarray(0, signature.length).equals(signature) : stryMutAct_9fa48("3962") ? false : stryMutAct_9fa48("3961") ? true : (stryCov_9fa48("3961", "3962", "3963"), buffer.subarray(0, 4).equals(signature) || buffer.subarray(0, signature.length).equals(signature)))));
    }
  }

  /**
   * Convert audio buffer to float32 array (simplified implementation)
   * In practice, you'd need proper audio decoding based on format
   */
  private convertBufferToAudioData(_buffer: Buffer): Float32Array | null {
    if (stryMutAct_9fa48("3964")) {
      {}
    } else {
      stryCov_9fa48("3964");
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
    if (stryMutAct_9fa48("3965")) {
      {}
    } else {
      stryCov_9fa48("3965");
      const contentMetadata: SpeechContentMetadata = stryMutAct_9fa48("3966") ? {} : (stryCov_9fa48("3966"), {
        type: ContentType.AUDIO,
        language: stryMutAct_9fa48("3967") ? "" : (stryCov_9fa48("3967"), "unknown"),
        encoding: stryMutAct_9fa48("3968") ? "" : (stryCov_9fa48("3968"), "unknown"),
        hasText: stryMutAct_9fa48("3969") ? true : (stryCov_9fa48("3969"), false),
        wordCount: 0,
        characterCount: 0,
        speechMetadata: stryMutAct_9fa48("3970") ? {} : (stryCov_9fa48("3970"), {
          processingTime: stryMutAct_9fa48("3971") ? Date.now() + startTime : (stryCov_9fa48("3971"), Date.now() - startTime),
          language: stryMutAct_9fa48("3972") ? "" : (stryCov_9fa48("3972"), "unknown"),
          engine: stryMutAct_9fa48("3973") ? "" : (stryCov_9fa48("3973"), "none")
        })
      });
      return stryMutAct_9fa48("3974") ? {} : (stryCov_9fa48("3974"), {
        text: stryMutAct_9fa48("3975") ? `` : (stryCov_9fa48("3975"), `Audio: ${reason}`),
        metadata: contentMetadata
      });
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("3976")) {
      {}
    } else {
      stryCov_9fa48("3976");
      if (stryMutAct_9fa48("3978") ? false : stryMutAct_9fa48("3977") ? true : (stryCov_9fa48("3977", "3978"), this.recognizer)) {
        if (stryMutAct_9fa48("3979")) {
          {}
        } else {
          stryCov_9fa48("3979");
          this.recognizer.free();
          this.recognizer = null;
        }
      }
      if (stryMutAct_9fa48("3981") ? false : stryMutAct_9fa48("3980") ? true : (stryCov_9fa48("3980", "3981"), this.model)) {
        if (stryMutAct_9fa48("3982")) {
          {}
        } else {
          stryCov_9fa48("3982");
          this.model.free();
          this.model = null;
        }
      }
      this.initialized = stryMutAct_9fa48("3983") ? true : (stryCov_9fa48("3983"), false);
    }
  }

  /**
   * Check if the speech processor is ready
   */
  isReady(): boolean {
    if (stryMutAct_9fa48("3984")) {
      {}
    } else {
      stryCov_9fa48("3984");
      return stryMutAct_9fa48("3987") ? this.initialized || this.recognizer !== null : stryMutAct_9fa48("3986") ? false : stryMutAct_9fa48("3985") ? true : (stryCov_9fa48("3985", "3986", "3987"), this.initialized && (stryMutAct_9fa48("3989") ? this.recognizer === null : stryMutAct_9fa48("3988") ? true : (stryCov_9fa48("3988", "3989"), this.recognizer !== null)));
    }
  }
}