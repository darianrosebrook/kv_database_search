import type {
  ExtractedFrameInfo,
  DeduplicationResult,
  DeduplicationOptions,
  DuplicateCluster,
} from "../types.js";
import { PerceptualHasher } from "./perceptual-hasher.js";
import { hammingDistance } from "./hamming-distance.js";

const DEFAULT_HAMMING_THRESHOLD = 5;

export class FrameDeduplicator {
  constructor(private hasher: PerceptualHasher) {}

  /**
   * Remove visually similar consecutive frames using perceptual hashing.
   *
   * Walks frames sequentially — if a frame's hash is within the threshold
   * of the previous unique frame's hash, it's marked as a duplicate.
   */
  async deduplicate(
    frames: ExtractedFrameInfo[],
    options?: DeduplicationOptions,
  ): Promise<DeduplicationResult> {
    const threshold = options?.hammingThreshold ?? DEFAULT_HAMMING_THRESHOLD;

    if (frames.length === 0) {
      return { uniqueFrames: [], duplicatesRemoved: 0, clusters: [] };
    }

    // Hash all frames
    const hashes: bigint[] = [];
    for (const frame of frames) {
      try {
        const hash = await this.hasher.hashImage(frame.imagePath);
        hashes.push(hash);
      } catch {
        // If hashing fails, use a unique sentinel so the frame is kept
        hashes.push(BigInt(Date.now()) ^ BigInt(hashes.length));
      }
    }

    // Walk sequentially, grouping into clusters
    const clusters: DuplicateCluster[] = [];
    let currentCluster: DuplicateCluster = {
      representative: frames[0],
      duplicates: [],
    };
    let currentHash = hashes[0];

    for (let i = 1; i < frames.length; i++) {
      const dist = hammingDistance(currentHash, hashes[i]);
      if (dist <= threshold) {
        // Similar to current representative — mark as duplicate
        currentCluster.duplicates.push(frames[i]);
      } else {
        // New unique frame — finalize current cluster, start new one
        clusters.push(currentCluster);
        currentCluster = {
          representative: frames[i],
          duplicates: [],
        };
        currentHash = hashes[i];
      }
    }
    clusters.push(currentCluster);

    const uniqueFrames = clusters.map((c) => c.representative);
    const duplicatesRemoved = frames.length - uniqueFrames.length;

    return { uniqueFrames, duplicatesRemoved, clusters };
  }
}
