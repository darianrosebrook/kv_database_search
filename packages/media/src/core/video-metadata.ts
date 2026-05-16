import ffmpeg from "fluent-ffmpeg";
import type { VideoMetadata } from "../types.js";
import { MediaProcessingError } from "../errors.js";

/**
 * Parse a frame rate string like "30/1" or "24000/1001" into a number.
 * Avoids eval() which is a security risk.
 */
function parseFrameRate(rateStr: string | undefined): number {
  if (!rateStr) return 0;
  const parts = rateStr.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    return den !== 0 ? num / den : 0;
  }
  return parseFloat(rateStr) || 0;
}

export class VideoMetadataExtractor {
  /**
   * Extract video metadata using FFprobe.
   */
  async extract(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(
            new MediaProcessingError(
              `FFprobe failed: ${err.message}`,
              "FFPROBE_ERROR",
              { videoPath },
            ),
          );
          return;
        }

        try {
          const videoStream = metadata.streams.find(
            (s) => s.codec_type === "video",
          );
          const audioStream = metadata.streams.find(
            (s) => s.codec_type === "audio",
          );

          if (!videoStream) {
            reject(
              new MediaProcessingError(
                "No video stream found",
                "NO_VIDEO_STREAM",
                { videoPath },
              ),
            );
            return;
          }

          const duration = parseFloat(String(metadata.format.duration || "0"));
          const width = videoStream.width || 0;
          const height = videoStream.height || 0;

          resolve({
            duration,
            width,
            height,
            frameRate: parseFrameRate(videoStream.r_frame_rate),
            codec: videoStream.codec_name || "unknown",
            bitrate:
              parseInt(String(videoStream.bit_rate || "0")) || undefined,
            format: metadata.format.format_name || "unknown",
            size: parseInt(String(metadata.format.size || "0")),
            aspectRatio:
              videoStream.display_aspect_ratio || `${width}:${height}`,
            audioCodec: audioStream?.codec_name,
            hasAudio: !!audioStream,
            creationTime: metadata.format.tags?.creation_time
              ? new Date(metadata.format.tags.creation_time)
              : undefined,
          });
        } catch (parseError) {
          reject(
            new MediaProcessingError(
              `Metadata parsing failed: ${parseError}`,
              "METADATA_PARSE_ERROR",
              { videoPath },
            ),
          );
        }
      });
    });
  }
}
