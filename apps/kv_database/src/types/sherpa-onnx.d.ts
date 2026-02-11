declare module "sherpa-onnx" {
  interface OnlineRecognizerConfig {
    featConfig?: {
      sampleRate?: number;
      featureDim?: number;
    };
    modelConfig?: {
      transducer?: {
        encoder: string;
        decoder: string;
        joiner: string;
      };
      tokens: string;
      numThreads?: number;
      provider?: string;
      debug?: number;
    };
    decoderConfig?: {
      decodingMethod?: string;
      maxActivePaths?: number;
    };
    enableEndpoint?: boolean;
    rule1MinTrailingSilence?: number;
    rule2MinTrailingSilence?: number;
    rule3MinUtteranceLength?: number;
  }

  interface SpeechRecognitionResult {
    text: string;
    tokens?: string[];
    timestamps?: number[];
    sampleRate?: number;
  }

  interface OnlineStream {
    acceptWaveform(samples: Float32Array): void;
    inputFinished(): void;
    isEndpoint(): boolean;
    reset(): void;
  }

  class OnlineRecognizer {
    constructor(config: OnlineRecognizerConfig);
    createStream(): OnlineStream;
    isReady(stream: OnlineStream): boolean;
    decode(stream: OnlineStream): void;
    getResult(stream: OnlineStream): SpeechRecognitionResult;
    reset(stream: OnlineStream): void;
    free(): void;
  }

  function createOnlineRecognizer(config: OnlineRecognizerConfig): OnlineRecognizer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createOfflineRecognizer(config: any): any;

  export {
    OnlineRecognizer,
    OnlineRecognizerConfig,
    OnlineStream,
    SpeechRecognitionResult,
    createOnlineRecognizer,
    createOfflineRecognizer,
  };
}
