import { describe, it, expect } from "vitest";
import {
  aggregateUtterances,
  type WordSegment,
} from "../../src/video/utterance-aggregator";

const word = (
  text: string,
  start: number,
  end: number,
  confidence = 0.9,
): WordSegment => ({ text, start, end, confidence });

describe("aggregateUtterances", () => {
  it("returns empty array on empty input", () => {
    expect(aggregateUtterances([])).toEqual([]);
  });

  it("groups words into a single utterance terminated by a period", () => {
    const segs = [
      word("Hello", 0, 0.3),
      word("world", 0.3, 0.6),
      word(".", 0.6, 0.7),
    ];
    const result = aggregateUtterances(segs);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Hello world.");
    expect(result[0].start).toBeCloseTo(0);
    expect(result[0].end).toBeCloseTo(0.7);
    expect(result[0].wordCount).toBe(2);
  });

  it("splits on sentence-final punctuation", () => {
    const segs = [
      word("First", 0, 0.5),
      word("sentence", 0.5, 1),
      word(".", 1, 1.1),
      word("Second", 1.2, 1.6),
      word("one", 1.6, 2),
      word("?", 2, 2.1),
    ];
    const result = aggregateUtterances(segs);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("First sentence.");
    expect(result[1].text).toBe("Second one?");
  });

  it("attaches commas without a leading space", () => {
    const segs = [
      word("Yes", 0, 0.3),
      word(",", 0.3, 0.4),
      word("really", 0.4, 0.8),
      word(".", 0.8, 0.9),
    ];
    const result = aggregateUtterances(segs);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Yes, really.");
  });

  it("applies the soft cap when a sentence runs longer than 12s", () => {
    const segs: WordSegment[] = [];
    for (let i = 0; i < 30; i++) {
      segs.push(word(`word${i}`, i * 0.5, i * 0.5 + 0.4));
    }
    const result = aggregateUtterances(segs);
    expect(result.length).toBeGreaterThanOrEqual(2);
    for (const u of result) {
      expect(u.end - u.start).toBeLessThanOrEqual(13);
    }
  });

  it("averages confidence across words in an utterance", () => {
    const segs = [
      word("a", 0, 0.1, 0.8),
      word("b", 0.1, 0.2, 0.9),
      word(".", 0.2, 0.3, 1.0),
    ];
    const result = aggregateUtterances(segs);
    expect(result[0].confidence).toBeCloseTo(0.9, 2);
  });

  it("ignores empty or whitespace-only segments", () => {
    const segs = [
      word("Hi", 0, 0.3),
      word("", 0.3, 0.4),
      word("   ", 0.4, 0.5),
      word(".", 0.5, 0.6),
    ];
    const result = aggregateUtterances(segs);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Hi.");
  });
});
