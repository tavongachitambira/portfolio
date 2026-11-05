import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send }
  },
}))

import { POST } from "@/app/api/contact/route"

const good = { name: "Ada Lovelace", email: "ada@example.com", message: "Hello there" }

// every test gets its own client IP so the rate limiter's shared memory never leaks between them
let ipCounter = 0
const post = (body: unknown, headers: Record<string, string> = {}, ip = `10.1.0.${++ipCounter}`) =>
  POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": ip, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  )

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test")
  vi.stubEnv("CONTACT_EMAIL", "me@example.com")
  vi.stubEnv("TURNSTILE_SECRET_KEY", "")
  send.mockReset()
  send.mockResolvedValue({ data: { id: "email_1" }, error: null })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.unstubAllGlobals())

describe("POST /api/contact", () => {
  it("sends the message and replies ok", async () => {
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(res.headers.get("cache-control")).toBe("no-store")

    expect(send).toHaveBeenCalledTimes(1)
    const mail = send.mock.calls[0][0]
    expect(mail.to).toBe("me@example.com")
    expect(mail.replyTo).toBe("ada@example.com")
    expect(mail.subject).toBe("Portfolio message from Ada Lovelace")
    expect(mail.text).toContain("Hello there")
  })

  it("escapes HTML in what visitors write", async () => {
    await post({ ...good, message: "<img src=x onerror=alert(1)>" })
    expect(send.mock.calls[0][0].html).not.toContain("<img")
  })

  it("answers 503 (so the form falls back to email) when delivery isn't configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const res = await post(good)
    expect(res.status).toBe(503)
    expect(send).not.toHaveBeenCalled()
  })

  it("rejects bad fields with 400 and per-field messages", async () => {
    const res = await post({ name: "", email: "nope", message: "" })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(Object.keys(body.fields).sort()).toEqual(["email", "message", "name"])
    expect(send).not.toHaveBeenCalled()
  })

  it("rejects malformed or non-object JSON with 400", async () => {
    expect((await post("{not json")).status).toBe(400)
    expect((await post("[1,2]")).status).toBe(400)
    expect((await post("null")).status).toBe(400)
  })

  it("rejects an oversized body with 413", async () => {
    const res = await post({ ...good, message: "x".repeat(20_000) })
    expect(res.status).toBe(413)
    expect(send).not.toHaveBeenCalled()
  })

  it("pretends the honeypot submission worked, and sends nothing", async () => {
    const res = await post({ ...good, website: "https://spam.example" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(send).not.toHaveBeenCalled()
  })

  it("ignores a blank honeypot", async () => {
    await post({ ...good, website: "  " })
    expect(send).toHaveBeenCalledTimes(1)
  })

  it("rate-limits one client to 5 messages per window, with Retry-After", async () => {
    const ip = "198.51.100.7"
    for (let i = 0; i < 5; i++) expect((await post(good, {}, ip)).status).toBe(200)

    const blocked = await post(good, {}, ip)
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0)
    expect(send).toHaveBeenCalledTimes(5)

    // someone else is unaffected
    expect((await post(good, {}, "198.51.100.8")).status).toBe(200)
  })

  it("never leaks the email provider's error text", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "domain not verified: secret.example" } })
    const res = await post(good)
    expect(res.status).toBe(502)
    const text = JSON.stringify(await res.json())
    expect(text).not.toContain("secret.example")
    expect(text).toContain("Couldn't send")
  })

  it("answers 500 with a generic message when sending throws", async () => {
    send.mockRejectedValue(new Error("ECONNRESET to 10.9.9.9"))
    const res = await post(good)
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain("10.9.9.9")
  })

  describe("with Turnstile enabled", () => {
    beforeEach(() => vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA"))

    it("requires a token (403) and sends nothing without one", async () => {
      const res = await post(good)
      expect(res.status).toBe(403)
      expect(send).not.toHaveBeenCalled()
    })

    it("rejects a token Cloudflare refuses (403)", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: false, "error-codes": ["invalid-input-response"] })))
      const res = await post({ ...good, turnstileToken: "bad" })
      expect(res.status).toBe(403)
      expect(send).not.toHaveBeenCalled()
    })

    it("accepts a verified token and checks it for the contact action", async () => {
      const fetchMock = vi.fn(async () => Response.json({ success: true, action: "contact" }))
      vi.stubGlobal("fetch", fetchMock)
      const res = await post({ ...good, turnstileToken: "good" }, {}, "192.0.2.50")
      expect(res.status).toBe(200)
      expect(send).toHaveBeenCalledTimes(1)

      const form = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as URLSearchParams
      expect(form.get("response")).toBe("good")
      expect(form.get("remoteip")).toBe("192.0.2.50")
    })

    it("answers 503 when Cloudflare can't be reached, so the form falls back to email", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline") }))
      const res = await post({ ...good, turnstileToken: "good" })
      expect(res.status).toBe(503)
      expect(send).not.toHaveBeenCalled()
    })

    it("doesn't spend a Cloudflare call on a form that fails validation", async () => {
      const fetchMock = vi.fn(async () => Response.json({ success: true }))
      vi.stubGlobal("fetch", fetchMock)
      const res = await post({ name: "", email: "x", message: "", turnstileToken: "t" })
      expect(res.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
