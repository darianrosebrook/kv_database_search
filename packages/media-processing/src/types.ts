export interface SceneChange {
  timestamp: number;
  sceneScore: number;
}

export interface SceneDetectionOptions {
  /** Scene change sensitivity 0.0-1.0. Lower = more sensitive. Default: 0.3 */
  threshold?: number;
  /** Minimum seconds between scene changes to prevent noise. Default: 1.0 */
  minSceneLength?: number;
}

export interface ExtractedFrameInfo {
  timestamp: number;
  frameNumber: number;
  imagePath: string;
  width?: number;
  height?: number;
}

export interface FrameExtractionOptions {
  outputFormat?: "png" | "jpeg";
  outputDir?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  bitrate?: number;
  format: string;
  size: number;
  aspectRatio: string;
  audioCodec?: string;
  hasAudio: boolean;
  creationTime?: Date;
}

export interface PerceptualHash {
  hash: bigint;
  imagePath?: string;
}

export interface DuplicateCluster {
  representative: ExtractedFrameInfo;
  duplicates: ExtractedFrameInfo[];
}

export interface DeduplicationResult {
  uniqueFrames: ExtractedFrameInfo[];
  duplicatesRemoved: number;
  clusters: DuplicateCluster[];
}

export interface DeduplicationOptions {
  /** Max Hamming distance to consider frames as duplicates. Default: 5 */
  hammingThreshold?: number;
}

export interface AdaptiveExtractionOptions {
  /** Scene change sensitivity 0.0-1.0. Default: 0.3 */
  sceneThreshold?: number;
  /** Minimum seconds between scene changes. Default: 1.0 */
  minSceneLength?: number;
  /** Run perceptual hash deduplication on extracted frames. Default: true */
  enableDeduplication?: boolean;
  /** Hamming distance threshold for deduplication. Default: 5 */
  hammingThreshold?: number;
  /** Maximum frames to return. Default: 200 */
  maxFrames?: number;
  /** Seconds between frames when no scene changes detected. Default: 30 */
  fallbackInterval?: number;
  /** Output directory for frame images. Default: system temp */
  outputDir?: string;
  /** Output image format. Default: "png" */
  outputFormat?: "png" | "jpeg";
}

export interface AdaptiveExtractionStats {
  totalDuration: number;
  scenesDetected: number;
  framesExtracted: number;
  duplicatesRemoved: number;
  strategy: "scene-based" | "fixed-interval" | "hybrid";
}

export interface AdaptiveExtractionResult {
  frames: ExtractedFrameInfo[];
  sceneChanges: SceneChange[];
  stats: AdaptiveExtractionStats;
}
