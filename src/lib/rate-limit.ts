/**
 * Simple in-memory fixed-window rate limiter (per server instance).
 * Suitable for single-instance / local dev; use Redis for multi-instance production.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; resetAt: number };

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  if (bucket.count >= max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec), resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return {
    ok: true,
    remaining: max - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitHeaders(result: Extract<RateLimitResult, { ok: true }>): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
