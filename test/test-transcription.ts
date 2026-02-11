/**
 * Test audio transcription on the test video.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_PATH = path.resolve(__dirname, "test-files/test-video.mp4");
const AUDIO_PATH = "/tmp/transcription-test-audio.wav";

async function extractAudio() {
  if (fs.existsSync(AUDIO_PATH)) {
    console.log("Audio already extracted, reusing...");
    return;
  }
  console.log("Extracting audio from video...");
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-i", VIDEO_PATH, "-vn",
      "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
      "-y", AUDIO_PATH,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg failed: ${stderr.slice(-200)}`)));
    proc.on("error", reject);
  });
  const stat = fs.statSync(AUDIO_PATH);
  console.log(`Audio extracted: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
}

async function transcribeWithWhisper() {
  console.log("\nRunning Whisper.cpp transcription...");
  try {
    const { nodewhisper } = await import("nodejs-whisper");
    const start = Date.now();
    const transcript = await nodewhisper(AUDIO_PATH, {
      modelName: "base",
      whisperOptions: {
        language: "en",
        word_timestamps: true,
        no_speech_threshold: 0.6,
        temperature: 0.0,
      },
    });
    const elapsed = (Date.now() - start) / 1000;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = typeof transcript === "string" ? transcript : (transcript as any).text || JSON.stringify(transcript);
    const words = text.split(/\s+/).filter((w: string) => w.length > 0);

    console.log(`\nTranscription complete in ${elapsed.toFixed(1)}s`);
    console.log(`Words: ${words.length}`);
    console.log(`Characters: ${text.length}`);

    // Check for timestamp segments
    const segmentRegex = /\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})]\s*([^[]*)/g;
    const segments: Array<{ start: string; end: string; text: string }> = [];
    let match;
    while ((match = segmentRegex.exec(text)) !== null) {
      segments.push({ start: match[1], end: match[2], text: match[3].trim() });
    }

    if (segments.length > 0) {
      console.log(`\nSegments: ${segments.length}`);
      console.log("\nFirst 15 segments:");
      segments.slice(0, 15).forEach((seg, _i) => {
        console.log(`  [${seg.start} -> ${seg.end}] ${seg.text.substring(0, 100)}`);
      });
      console.log("\nLast 5 segments:");
      segments.slice(-5).forEach((seg) => {
        console.log(`  [${seg.start} -> ${seg.end}] ${seg.text.substring(0, 100)}`);
      });
    } else {
      console.log("\nNo timestamp segments found. Raw output (first 1000 chars):");
      console.log(text.substring(0, 1000));
    }

    // Save full transcript for inspection
    const outPath = path.resolve(__dirname, "test-files/test-video-transcript.txt");
    fs.writeFileSync(outPath, text);
    console.log(`\nFull transcript saved to: ${outPath}`);

    return text;
  } catch (err) {
    console.error("Whisper.cpp failed:", err);
    return null;
  }
}

async function main() {
  console.log("Audio Transcription Test");
  console.log("========================\n");

  await extractAudio();
  await transcribeWithWhisper();
}

main().catch(console.error);
