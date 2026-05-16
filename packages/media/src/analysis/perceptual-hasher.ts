import sharp from "sharp";
import type { PerceptualHash } from "../types.js";

const DHASH_WIDTH = 9;
const DHASH_HEIGHT = 8;

export class PerceptualHasher {
  /**
   * Compute a dHash (difference hash) from an image file.
   *
   * Algorithm:
   * 1. Resize to 9x8 grayscale
   * 2. Compare adjacent pixels horizontally (left > right = 1, else 0)
   * 3. Produces a 64-bit hash (8 rows * 8 comparisons per row)
   */
  async hashImage(imagePath: string): Promise<bigint> {
    const buffer = await sharp(imagePath)
      .resize(DHASH_WIDTH, DHASH_HEIGHT, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    return this.computeDHash(buffer);
  }

  /**
   * Compute a dHash from an image buffer (PNG, JPEG, etc).
   */
  async hashBuffer(imageBuffer: Buffer): Promise<bigint> {
    const buffer = await sharp(imageBuffer)
      .resize(DHASH_WIDTH, DHASH_HEIGHT, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    return this.computeDHash(buffer);
  }

  /**
   * Hash multiple images, returning results with their paths.
   */
  async hashBatch(imagePaths: string[]): Promise<PerceptualHash[]> {
    const results: PerceptualHash[] = [];
    for (const imagePath of imagePaths) {
      const hash = await this.hashImage(imagePath);
      results.push({ hash, imagePath });
    }
    return results;
  }

  /**
   * Compute dHash from a raw 9x8 grayscale pixel buffer.
   * Each pixel is a single byte (0-255).
   */
  private computeDHash(pixels: Buffer): bigint {
    let hash = 0n;

    for (let y = 0; y < DHASH_HEIGHT; y++) {
      for (let x = 0; x < DHASH_WIDTH - 1; x++) {
        const left = pixels[y * DHASH_WIDTH + x];
        const right = pixels[y * DHASH_WIDTH + x + 1];

        hash <<= 1n;
        if (left > right) {
          hash |= 1n;
        }
      }
    }

    return hash;
  }
}
