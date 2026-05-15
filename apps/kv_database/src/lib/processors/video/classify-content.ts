import { detectLanguage } from "../../utils.ts";
import { ExtractedFrame, VideoContentMetadata } from "./types.ts";

/**
 * Classify video content based on extracted text patterns.
 *
 * Heuristic: looks for screen-recording, UI, code-syntax, and presentation
 * markers in the combined OCR + transcription text. Returns confidence in
 * [0, 1].
 */
export function classifyVideoContent(
  _frames: ExtractedFrame[],
  combinedText: string,
): VideoContentMetadata["contentClassification"] {
  let confidence = 0;
  const text = combinedText.toLowerCase();

  // Screen recording indicators
  const screenPatterns = [
    "screen recording",
    "cursor",
    "click",
    "menu",
    "window",
    "application",
  ];
  const screenMatches = screenPatterns.filter((p) => text.includes(p)).length;
  const isScreenRecording = screenMatches > 2;
  confidence += screenMatches * 0.1;

  // UI element indicators
  const uiPatterns = [
    "button",
    "dialog",
    "input",
    "form",
    "dropdown",
    "navigation",
    "tab",
    "panel",
  ];
  const uiMatches = uiPatterns.filter((p) => text.includes(p)).length;
  const hasUI = uiMatches > 3;
  confidence += uiMatches * 0.05;

  // Code indicators — look for actual code syntax, not just spoken keywords
  const codeSyntaxPatterns = [
    /[a-z]+\([^)]*\)\s*\{/, // function calls with braces: foo() {
    /[a-z]+\.[a-z]+\(/, // method calls: obj.method(
    /\b(?:const|let|var)\s+\w+\s*=/, // variable declarations
    /=>\s*\{/, // arrow functions
    /import\s+\{[^}]+\}\s+from/, // import statements
    /if\s*\([^)]+\)\s*\{/, // if statements with braces
    /\bclass\s+[A-Z]\w+/, // class declarations
    /\breturn\s+[^;]+;/, // return statements
  ];
  const codeMatches = codeSyntaxPatterns.filter((p) => p.test(text)).length;
  let hasCode = codeMatches > 2;
  confidence += codeMatches * 0.1;

  // Presentation indicators — natural presenter language
  const presentationPatterns = [
    "slide",
    "presentation",
    "agenda",
    "overview",
    "conclusion",
    "talk",
    "audience",
    "demo",
    "demonstration",
    "walkthrough",
    "let me show",
    "as you can see",
    "questions",
    "thank you",
    "welcome",
    "conference",
  ];
  const presentationMatches = presentationPatterns.filter((p) =>
    text.includes(p),
  ).length;
  const hasPresentation = presentationMatches > 1;
  confidence += presentationMatches * 0.15;

  // If presentation detected but code was only marginally matched,
  // it's a talk ABOUT code, not a screen recording of code.
  if (hasPresentation && codeMatches <= 3) {
    hasCode = false;
  }

  return {
    isScreenRecording,
    hasUI,
    hasCode,
    hasPresentation,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * Summarize the OCR text-blocks across all frames: count, average confidence,
 * detected languages, and dominant language.
 */
export function createTextSummary(
  frames: ExtractedFrame[],
): VideoContentMetadata["textSummary"] {
  const textBlocks = frames.filter((f) => f.ocrText && f.ocrText.trim());
  const languages = new Set<string>();
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const frame of textBlocks) {
    if (frame.ocrText) {
      languages.add(detectLanguage(frame.ocrText));
    }
    if (frame.ocrConfidence) {
      totalConfidence += frame.ocrConfidence;
      confidenceCount++;
    }
  }

  const averageConfidence =
    confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
  const languageArray = Array.from(languages);

  return {
    totalTextBlocks: textBlocks.length,
    averageConfidence,
    languages: languageArray,
    dominantLanguage: languageArray[0] || "unknown",
  };
}

/**
 * Detect keyframes by comparing consecutive frames' OCR text. A frame is
 * marked as a keyframe when its text differs significantly (Jaccard < 0.5)
 * from the previous frame and contains at least 20 characters.
 */
export function detectKeyframes(
  frames: ExtractedFrame[],
): VideoContentMetadata["keyframes"] {
  const keyframeTimestamps: number[] = [];
  let previousText = "";

  for (const frame of frames) {
    const currentText = frame.ocrText || "";
    const similarity = jaccardSimilarity(previousText, currentText);
    if (similarity < 0.5 && currentText.length > 20) {
      keyframeTimestamps.push(frame.timestamp);
    }
    previousText = currentText;
  }

  return {
    count: keyframeTimestamps.length,
    intervals: keyframeTimestamps,
  };
}

/**
 * Word-level Jaccard similarity in [0, 1]. Two empty strings return 1
 * (identical), one empty returns 0.
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  if (!text1 && !text2) return 1;
  if (!text1 || !text2) return 0;

  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}
