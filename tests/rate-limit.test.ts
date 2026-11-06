import { afterEach, describe, expect, it, vi } from "vitest"

import { clientIp, rateLimit } from "@/lib/rate-limit"

// the in-memory store is module state, so every test uses its own scope
let n = 0
const scope = () => `test-${++n}`

describe("rateLimit (memory)", () => {
  it("allows up to the limit, then blocks", async () => {
    const opts = { scope: scope(), id: "1.1.1.1", limit: 3, windowSec: 60 }
    const results = []
    for (let i = 0; i < 4; i++) results.push(await rateLimit(opts, 1_000))

    expect(results.map((r) => r.ok)).toEqual([true, true, true, false])
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0])
  })

  it("reports how long until the window resets", async () => {
    const opts = { scope: scope(), id: "a", limit: 1, windowSec: 60 }
    await rateLimit(opts, 0)
    const blocked = await rateLimit(opts, 20_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBe(40)
  })

  it("starts a fresh window once the old one has passed", async () => {
    const opts = { scope: scope(), id: "a", limit: 1, windowSec: 10 }
    expect((await rateLimit(opts, 0)).ok).toBe(true)
    expect((await rateLimit(opts, 5_000)).ok).toBe(false)
    expect((await rateLimit(opts, 10_001)).ok).toBe(true)
  })

  it("keeps clients and scopes apart", async () => {
    const s = scope()
    expect((await rateLimit({ scope: s, id: "a", limit: 1, windowSec: 60 }, 0)).ok).toBe(true)
    expect((await rateLimit({ scope: s, id: "b", limit: 1, windowSec: 60 }, 0)).ok).toBe(true)
    expect((await rateLimit({ scope: scope(), id: "a", limit: 1, windowSec: 60 }, 0)).ok).toBe(true)
    expect((await rateLimit({ scope: s, id: "a", limit: 1, windowSec: 60 }, 0)).ok).toBe(false)
  })
})

describe("rateLimit (Upstash)", () => {
  afterEach(() => vi.unstubAllGlobals())

  const env = () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io/")
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token")
  }

  it("counts in Redis with one pipelined call and never sends the raw IP", async () => {
    env()
    const fetchMock = vi.fn(async () =>
      Response.json([{ result: "OK" }, { result: 2 }, { result: 540 }]),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await rateLimit({ scope: "contact", id: "203.0.113.9", limit: 5, windowSec: 600 })

    expect(result).toEqual({ ok: true, limit: 5, remaining: 3, retryAfter: 540 })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://example.upstash.io/pipeline")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-token")

    const commands = JSON.parse(init.body as string) as string[][]
    expect(commands.map((c) => c[0])).toEqual(["SET", "INCR", "TTL"])
    expect(commands[0].slice(2)).toEqual(["0", "EX", "600", "NX"])
    expect(commands[0][1]).toMatch(/^rl:contact:[0-9a-f]{16}$/)
    expect(init.body as string).not.toContain("203.0.113.9")
  })

  it("blocks once Redis says the count is over the limit", async () => {
    env()
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([{ result: null }, { result: 6 }, { result: 30 }])))
    const result = await rateLimit({ scope: "contact", id: "x", limit: 5, windowSec: 600 })
    expect(result).toEqual({ ok: false, limit: 5, remaining: 0, retryAfter: 30 })
  })

  it("falls back to memory when Redis is down, and still limits", async () => {
    env()
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    const opts = { scope: scope(), id: "a", limit: 1, windowSec: 60 }
    expect((await rateLimit(opts, 0)).ok).toBe(true)
    expect((await rateLimit(opts, 1)).ok).toBe(false)
    expect(log).toHaveBeenCalled()
  })

  it("falls back to memory on a malformed reply", async () => {
    env()
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([{ error: "WRONGTYPE" }])))
    vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await rateLimit({ scope: scope(), id: "a", limit: 2, windowSec: 60 }, 0)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(1)
  })
})

describe("clientIp", () => {
  const h = (init: Record<string, string>) => new Headers(init)

  it("prefers the platform headers over x-forwarded-for", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("1.1.1.1")
    expect(clientIp(h({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("2.2.2.2")
  })

  it("takes the first address of x-forwarded-for", () => {
    expect(clientIp(h({ "x-forwarded-for": " 3.3.3.3 , 10.0.0.1" }))).toBe("3.3.3.3")
  })

  it("falls back to 'unknown' and caps the length", () => {
    expect(clientIp(h({}))).toBe("unknown")
    expect(clientIp(h({ "x-real-ip": "9".repeat(200) })).length).toBe(64)
  })
})
