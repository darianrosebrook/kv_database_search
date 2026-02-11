const DEFAULT_SIMILARITY_THRESHOLD = 5;

/**
 * Count the number of differing bits between two 64-bit hashes.
 * Uses XOR to find differing bits, then counts them.
 */
export function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b;
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

/**
 * Check if two hashes are perceptually similar.
 * @param threshold - Maximum Hamming distance to consider similar. Default: 5
 */
export function areSimilar(
  a: bigint,
  b: bigint,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): boolean {
  return hammingDistance(a, b) <= threshold;
}
