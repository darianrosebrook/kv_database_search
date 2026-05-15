import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";

const execFileAsync = promisify(execFile);

const YT_DLP_CANDIDATES = [
  "/opt/homebrew/bin/yt-dlp",
  "/usr/local/bin/yt-dlp",
  "/usr/bin/yt-dlp",
  "yt-dlp",
];

let resolvedPath: string | null = null;

/**
 * Locate the yt-dlp executable by probing common install locations and
 * verifying with --version. Caches the result. Throws if no working binary
 * is found.
 *
 * Uses execFile (no shell) so candidate paths are never subject to shell
 * metacharacter interpretation.
 */
async function getYtDlpPath(): Promise<string> {
  if (resolvedPath) return resolvedPath;
  for (const candidate of YT_DLP_CANDIDATES) {
    try {
      await execFileAsync(candidate, ["--version"]);
      resolvedPath = candidate;
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error(
    "yt-dlp not found in PATH or common Homebrew locations. " +
      "Install with: brew install yt-dlp",
  );
}

export interface FetchedVideo {
  /** Absolute path to the downloaded video file. */
  filePath: string;
  /** The temp directory containing the file; caller must rm -rf it when done. */
  tempDir: string;
  /** Title yt-dlp resolved from the URL, if available. */
  title?: string;
}

export interface FetchOptions {
  /** yt-dlp format selector. Defaults to "best" (single muxed file). */
  format?: string;
  /** Called with each yt-dlp output line as it streams. */
  onProgress?: (line: string) => void;
}

/**
 * Download a single video to a fresh per-job temp directory using yt-dlp.
 *
 * Returns the file path and the temp directory; the caller is responsible
 * for removing the temp directory when extraction is complete.
 *
 * Security: all arguments — including the URL — are passed via execFile's
 * argv array. The shell never sees them, so URL contents containing quotes,
 * backticks, or $(...) cannot trigger command injection.
 */
export async function fetchVideo(
  url: string,
  options: FetchOptions = {},
): Promise<FetchedVideo> {
  if (!url || typeof url !== "string") {
    throw new Error("fetchVideo: a URL string is required");
  }

  const ytdlpPath = await getYtDlpPath();
  const tempDir = path.join(
    os.tmpdir(),
    `kv-ytdlp-${crypto.randomBytes(8).toString("hex")}`,
  );
  fs.mkdirSync(tempDir, { recursive: true });

  // %(id)s.%(ext)s gives a stable, predictable filename we can resolve
  // afterwards by listing the directory. yt-dlp picks the extension based
  // on the resolved format.
  const outputTemplate = path.join(tempDir, "%(id)s.%(ext)s");

  const args = [
    "--no-playlist",
    "--newline",
    "--restrict-filenames",
    "-f",
    options.format ?? "best",
    "-o",
    outputTemplate,
    "--print",
    "after_move:filepath",
    "--",
    url,
  ];

  // We use spawn-equivalent (execFile with maxBuffer) here. For interactive
  // progress, callers can wrap in spawn themselves; for the CLI batch case,
  // execFile is sufficient and simpler.
  const { stdout } = await execFileAsync(ytdlpPath, args, {
    maxBuffer: 50 * 1024 * 1024,
  });

  if (options.onProgress) {
    for (const line of stdout.split("\n")) {
      if (line.trim()) options.onProgress(line);
    }
  }

  // The --print after_move:filepath emits the final path on stdout, one per
  // download. Take the last non-empty line that exists on disk.
  const candidates = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => fs.existsSync(l));

  const filePath = candidates[candidates.length - 1];

  if (!filePath) {
    // Fall back: scan the temp dir for the largest file (yt-dlp wrote
    // something but the print line wasn't captured).
    const entries = fs.readdirSync(tempDir).map((name) => ({
      name,
      full: path.join(tempDir, name),
      size: fs.statSync(path.join(tempDir, name)).size,
    }));
    if (entries.length === 0) {
      throw new Error(
        "yt-dlp completed but produced no output file in " + tempDir,
      );
    }
    entries.sort((a, b) => b.size - a.size);
    return { filePath: entries[0].full, tempDir };
  }

  return { filePath, tempDir };
}
