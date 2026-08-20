import "server-only";

/**
 * Fixed-window, in-memory rate limiter.
 *
 * LIMITATION — read before trusting this:
 * State lives in the process, so on serverless each instance keeps its own
 * counters. A determined attacker spread across many cold starts gets more
 * than `limit` attempts globally. It still blunts the common cases
 * (credential stuffing and scripted abuse from one source) at zero
 * infrastructure cost. For hard guarantees, move the counter to Redis
 * (e.g. @upstash/ratelimit) or enable Vercel's WAF rate limiting — the
 * call sites below won't need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
  // Hard cap so a spray of unique keys can't grow the map without bound.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const excess = buckets.size - MAX_TRACKED_KEYS;
    let i = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++i >= excess) break;
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (Math.random() < 0.01) sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }
  return { ok: true, remaining: limit - existing.count, retryAfter };
}

/**
 * Best-effort client IP. On Vercel `x-forwarded-for` is set by the platform
 * edge; the left-most entry is the real client. Falls back to a constant so
 * a missing header degrades to a shared bucket rather than no limit at all.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** 429 response with the standard Retry-After header. */
export function tooManyRequests(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
