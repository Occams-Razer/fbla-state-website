import { randomBytes } from "node:crypto";

export type SniffResult = { ok: true; mime: string; ext: string } | { ok: false; reason: string };

/** Match declared MIME to magic bytes (first ~12 bytes). */
export function sniffImageType(buffer: Buffer): SniffResult {
  if (buffer.length < 12) {
    return { ok: false, reason: "File too small to be a valid image" };
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ok: true, mime: "image/jpeg", ext: ".jpg" };
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ok: true, mime: "image/png", ext: ".png" };
  }
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { ok: true, mime: "image/gif", ext: ".gif" };
  }
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ok: true, mime: "image/webp", ext: ".webp" };
  }
  return { ok: false, reason: "Unrecognized image format" };
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function isAllowedClientMime(type: string | undefined): boolean {
  return !!type && ALLOWED_MIME.has(type);
}

export function randomImageFilename(sniff: { ext: string }): string {
  return `${Date.now()}-${randomBytes(8).toString("hex")}${sniff.ext}`;
}
