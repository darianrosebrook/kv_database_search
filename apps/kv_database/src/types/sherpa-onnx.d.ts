declare module "sherpa-onnx" {
  interface SpeechRecognitionConfig {
    model?: {
      transducer: {
        encoder: string;
        decoder: string;
        joiner: string;
      };
      tokens: string;
      numThreads?: number;
      provider?: string;
    };
    maxActivePaths?: number;
    enableEndpoint?: boolean;
    rule1MinTrailingSilence?: number;
    rule2MinTrailingSilence?: number;
    rule3MinUtteranceLength?: number;
  }

  interface SpeechRecognitionResult {
    text: string;
    tokens: string[];
    timestamps: number[];
    sampleRate: number;
  }

  class SpeechRecognizer {
    constructor(config: SpeechRecognitionConfig);
    acceptWaveform(samples: Float32Array): void;
    isReady(): boolean;
    getResult(): SpeechRecognitionResult;
    reset(): void;
  }

  // Export functions that might exist in the module
  function createModel(config: any): any;
  function createRecognizer(config: any): any;

  // Export interfaces/types that might exist
  interface ModelConfig {}
  interface RecognizerConfig {}

  export {
    SpeechRecognizer,
    SpeechRecognitionConfig,
    SpeechRecognitionResult,
    createModel,
    createRecognizer,
    ModelConfig,
    RecognizerConfig,
  };
}
