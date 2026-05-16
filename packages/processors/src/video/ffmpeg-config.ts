import { execFile } from "child_process";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";

const execFileAsync = promisify(execFile);

const FFMPEG_CANDIDATES = [
  "/opt/homebrew/bin/ffmpeg",
  "/usr/local/bin/ffmpeg",
  "/usr/bin/ffmpeg",
  "ffmpeg",
];

const FFPROBE_CANDIDATES = [
  "/opt/homebrew/bin/ffprobe",
  "/usr/local/bin/ffprobe",
  "/usr/bin/ffprobe",
  "ffprobe",
];

let configured = false;
let resolvedFfmpeg: string | null = null;
let resolvedFfprobe: string | null = null;

/**
 * Probe a list of candidate binary paths and return the first one that
 * actually executes successfully when invoked with `--version` (or `-version`
 * for ffmpeg, which uses the single-dash form).
 *
 * Uses execFile with an argv array, never a shell — so no path-component or
 * argument can be interpreted as shell metacharacters.
 */
async function probeFirstWorking(
  candidates: string[],
  versionFlag: string,
): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, [versionFlag]);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Configure FFmpeg/FFprobe paths by probing common install locations and
 * verifying each candidate actually runs. Sets the global path on
 * fluent-ffmpeg, which is process-wide.
 *
 * Idempotent: subsequent calls are no-ops once a working pair is found.
 * Logs which paths were chosen, or warns if neither was discoverable
 * (in which case fluent-ffmpeg will fall back to system PATH lookup).
 */
export async function configureFFmpegPaths(): Promise<void> {
  if (configured) return;

  resolvedFfmpeg = await probeFirstWorking(FFMPEG_CANDIDATES, "-version");
  resolvedFfprobe = await probeFirstWorking(FFPROBE_CANDIDATES, "-version");

  if (resolvedFfmpeg) {
    ffmpeg.setFfmpegPath(resolvedFfmpeg);
    console.log(`✅ FFmpeg configured: ${resolvedFfmpeg}`);
  } else {
    console.warn(
      "⚠️ FFmpeg not found in any known location; relying on system PATH",
    );
  }

  if (resolvedFfprobe) {
    ffmpeg.setFfprobePath(resolvedFfprobe);
    console.log(`✅ FFprobe configured: ${resolvedFfprobe}`);
  } else {
    console.warn(
      "⚠️ FFprobe not found in any known location; relying on system PATH",
    );
  }

  configured = true;
}

/**
 * Returns the resolved ffmpeg path after configureFFmpegPaths() has run,
 * or null if no working binary was found. Useful for callers that want to
 * exec ffmpeg directly (not via fluent-ffmpeg).
 */
export function getResolvedFfmpegPath(): string | null {
  return resolvedFfmpeg;
}

/**
 * Returns the resolved ffprobe path, or null. See getResolvedFfmpegPath.
 */
export function getResolvedFfprobePath(): string | null {
  return resolvedFfprobe;
}
