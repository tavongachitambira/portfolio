import { afterEach, describe, expect, it, vi } from "vitest"

import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile"

afterEach(() => vi.unstubAllGlobals())

const enable = () => vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA")
const reply = (body: unknown, status = 200) => vi.fn(async () => Response.json(body, { status }))

describe("verifyTurnstile", () => {
  it("is off without a secret, so the site works with no setup", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "")
    expect(turnstileEnabled()).toBe(false)
    expect(await verifyTurnstile(undefined, "1.1.1.1")).toEqual({ ok: true })
  })

  it("rejects a missing, empty or oversized token without calling Cloudflare", async () => {
    enable()
    const fetchMock = reply({ success: true })
    vi.stubGlobal("fetch", fetchMock)

    for (const token of [undefined, "", 123, "x".repeat(2049)]) {
      expect(await verifyTurnstile(token, "1.1.1.1")).toEqual({ ok: false, reason: "missing" })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("posts the secret, token and client IP, and accepts success", async () => {
    enable()
    const fetchMock = reply({ success: true, action: "contact" })
    vi.stubGlobal("fetch", fetchMock)

    expect(await verifyTurnstile("tok", "203.0.113.9", "contact")).toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify")
    const form = init.body as URLSearchParams
    expect(form.get("secret")).toBe("1x0000000000000000000000000000000AA")
    expect(form.get("response")).toBe("tok")
    expect(form.get("remoteip")).toBe("203.0.113.9")
  })

  it("leaves remoteip out when the client IP is unknown", async () => {
    enable()
    const fetchMock = reply({ success: true })
    vi.stubGlobal("fetch", fetchMock)
    await verifyTurnstile("tok", "unknown")
    const form = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as URLSearchParams
    expect(form.has("remoteip")).toBe(false)
  })

  it("rejects a token Cloudflare says is invalid or already spent", async () => {
    enable()
    vi.stubGlobal("fetch", reply({ success: false, "error-codes": ["timeout-or-duplicate"] }))
    expect(await verifyTurnstile("tok", "1.1.1.1")).toEqual({ ok: false, reason: "invalid" })
  })

  it("rejects a token minted for a different action, but tolerates a reply with no action", async () => {
    enable()
    vi.stubGlobal("fetch", reply({ success: true, action: "login" }))
    expect(await verifyTurnstile("tok", "1.1.1.1", "contact")).toEqual({ ok: false, reason: "invalid" })

    vi.stubGlobal("fetch", reply({ success: true }))
    expect(await verifyTurnstile("tok", "1.1.1.1", "contact")).toEqual({ ok: true })
  })

  it("reports 'unavailable' (not 'invalid') when Cloudflare can't be reached", async () => {
    enable()
    vi.spyOn(console, "error").mockImplementation(() => {})

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down") }))
    expect(await verifyTurnstile("tok", "1.1.1.1")).toEqual({ ok: false, reason: "unavailable" })

    vi.stubGlobal("fetch", reply({}, 500))
    expect(await verifyTurnstile("tok", "1.1.1.1")).toEqual({ ok: false, reason: "unavailable" })
  })
})
