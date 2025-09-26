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
  function createModel(config);
  function createRecognizer(config);

  // Export interfaces/types that might exist
  interface ModelConfig {
    modelPath?: string;
    modelType?: "transducer" | "paraNet";
  }

  interface RecognizerConfig {
    modelConfig?: ModelConfig;
    sampleRate?: number;
    featureDim?: number;
  }

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
