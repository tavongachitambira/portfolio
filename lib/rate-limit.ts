/* Fixed-window rate limiter for the API routes.

   With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set, counters live in Redis (Upstash's
   REST API, so no driver and it works on any runtime) and the limit holds across serverless
   instances. Without them it falls back to per-instance memory: still useful against one noisy
   client, but a determined one can spread across instances, so set Upstash in production.

   A Redis outage never takes a route down: the limiter logs it and uses memory for that call. */

export interface RateLimitOptions {
  /** bucket name, e.g. "contact" */
  scope: string
  /** who is being limited: usually the client IP */
  id: string
  limit: number
  windowSec: number
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  /** seconds until the window resets */
  retryAfter: number
}

interface Counter {
  count: number
  /** seconds left in the window */
  ttl: number
}

const MEMORY_SOFT_CAP = 2_000
const MEMORY_HARD_CAP = 10_000
const memory = new Map<string, { count: number; resetAt: number }>()

function memoryHit(key: string, windowSec: number, now: number): Counter {
  if (memory.size >= MEMORY_SOFT_CAP) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k)
    // still full of live entries: drop the oldest so the map can't grow without bound
    while (memory.size >= MEMORY_HARD_CAP) memory.delete(memory.keys().next().value as string)
  }

  let entry = memory.get(key)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowSec * 1000 }
    memory.set(key, entry)
  }
  entry.count += 1
  return { count: entry.count, ttl: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
}

/** Hashed so raw IPs never sit in a third-party store. */
async function digest(id: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id))
  return Array.from(new Uint8Array(bytes).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("")
}

async function redisHit(url: string, token: string, key: string, windowSec: number): Promise<Counter> {
  const res = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    // create-with-expiry if missing, then count, then read what is left of the window
    body: JSON.stringify([
      ["SET", key, "0", "EX", String(windowSec), "NX"],
      ["INCR", key],
      ["TTL", key],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(1500),
  })
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`)

  const out = (await res.json()) as { result?: unknown; error?: string }[]
  const failed = out.find((step) => step?.error)
  if (!Array.isArray(out) || out.length < 3 || failed) throw new Error(failed?.error ?? "Unexpected Upstash reply")

  const count = Number(out[1].result)
  const ttl = Number(out[2].result)
  if (!Number.isFinite(count)) throw new Error("Unexpected Upstash counter")
  return { count, ttl: ttl > 0 ? ttl : windowSec }
}

export async function rateLimit(opts: RateLimitOptions, now = Date.now()): Promise<RateLimitResult> {
  const { scope, id, limit, windowSec } = opts
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  let counter: Counter
  if (url && token) {
    try {
      counter = await redisHit(url, token, `rl:${scope}:${await digest(id)}`, windowSec)
    } catch (error) {
      console.error("rate-limit: Redis unavailable, using memory.", error instanceof Error ? error.message : error)
      counter = memoryHit(`${scope}:${id}`, windowSec, now)
    }
  } else {
    counter = memoryHit(`${scope}:${id}`, windowSec, now)
  }

  return {
    ok: counter.count <= limit,
    limit,
    remaining: Math.max(0, limit - counter.count),
    retryAfter: counter.ttl,
  }
}

/** Best-effort client IP. Trust depends on the host: Vercel sets these headers itself, so they
    can't be spoofed there; behind your own proxy, make sure it overwrites them. */
export function clientIp(headers: Headers): string {
  const ip =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0] ??
    ""
  return ip.trim().slice(0, 64) || "unknown"
}
