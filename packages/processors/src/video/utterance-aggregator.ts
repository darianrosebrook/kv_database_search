/**
 * Aggregate Whisper word-level segments into readable utterances.
 *
 * Whisper with wordTimestamps emits one segment per word (and one per
 * punctuation token). The raw output is the right shape for word-precise
 * search and alignment, but unreadable when rendered as prose — every
 * word becomes its own line with its own timestamp.
 *
 * This module groups consecutive word segments into utterances bounded by
 * sentence-final punctuation, with a soft time cap that prevents runaway
 * utterances when Whisper misses punctuation entirely. The original
 * word-level segments are not mutated and remain the authoritative source
 * for downstream alignment.
 */

export interface WordSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface Utterance {
  start: number;
  end: number;
  text: string;
  wordCount: number;
  /** Average confidence across the words that compose the utterance. */
  confidence?: number;
}

const SENTENCE_FINAL = /[.!?]$/;
const SOFT_CAP_SECONDS = 12;

/**
 * Group word-level segments into utterances.
 *
 * Rules:
 * - Open a new utterance on the first word.
 * - Append words to the current utterance, attaching punctuation directly
 *   to the previous word (no leading space).
 * - Close the utterance on sentence-final punctuation (. ! ?).
 * - Close the utterance if appending the next word would push its span
 *   beyond SOFT_CAP_SECONDS (defends against Whisper output that drops
 *   punctuation entirely on long runs of speech).
 *
 * Returns utterances with monotonically non-decreasing `start` times.
 */
export function aggregateUtterances(words: WordSegment[]): Utterance[] {
  const utterances: Utterance[] = [];
  if (words.length === 0) return utterances;

  let buffer: string[] = [];
  let bufferStart: number | null = null;
  let bufferEnd = 0;
  let wordCount = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  const flush = () => {
    if (buffer.length === 0 || bufferStart === null) return;
    const text = buffer.join("").trim();
    if (text.length === 0) {
      buffer = [];
      bufferStart = null;
      wordCount = 0;
      confidenceSum = 0;
      confidenceCount = 0;
      return;
    }
    utterances.push({
      start: bufferStart,
      end: bufferEnd,
      text,
      wordCount,
      confidence:
        confidenceCount > 0 ? confidenceSum / confidenceCount : undefined,
    });
    buffer = [];
    bufferStart = null;
    wordCount = 0;
    confidenceSum = 0;
    confidenceCount = 0;
  };

  for (const seg of words) {
    const raw = seg.text ?? "";
    const token = raw.trim();
    if (token.length === 0) continue;

    const isPunctuation = /^[.,!?;:)\]"']+$/.test(token);
    const isContraction = /^['"][a-zA-Z]+$/.test(token); // 's, 'll, 're, etc.
    const isOpeningPunct = /^[("[']+$/.test(token);

    // Soft-cap: close the current utterance before starting one that
    // would exceed the cap. Only enforced once we have content.
    if (
      bufferStart !== null &&
      seg.start - bufferStart > SOFT_CAP_SECONDS &&
      !isPunctuation
    ) {
      flush();
    }

    if (bufferStart === null) {
      bufferStart = seg.start;
    }

    // Attach punctuation / contractions to the previous token without a
    // leading space; otherwise prepend a space when we already have text.
    if (buffer.length === 0) {
      buffer.push(token);
    } else if (isPunctuation || isContraction) {
      buffer.push(token);
    } else if (isOpeningPunct) {
      buffer.push(" ", token);
    } else {
      buffer.push(" ", token);
    }

    bufferEnd = seg.end;
    if (!isPunctuation) {
      wordCount += 1;
    }
    if (typeof seg.confidence === "number") {
      confidenceSum += seg.confidence;
      confidenceCount += 1;
    }

    if (SENTENCE_FINAL.test(token)) {
      flush();
    }
  }

  flush();
  return utterances;
}
