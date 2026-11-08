import { describe, expect, it, vi } from "vitest"

import { PROVIDER_NAMES, resolveProvider } from "@/lib/ask/provider"
import { anthropicProvider } from "@/lib/ask/providers/anthropic"
import { logLabel } from "@/lib/ask/providers/types"
import { toNdjson } from "@/lib/ask/stream"
import { chatChunk, DONE, readAll, sse } from "./sse-helpers"

const messages = [{ role: "user" as const, content: "What is SyncBoard?" }]
const input = { system: "RULES", messages }
const requestOf = (env: Record<string, string>) => {
  const provider = resolveProvider(env)
  if (!provider) throw new Error("expected a provider")
  return { provider, body: JSON.parse(provider.body(input)) }
}

describe("resolveProvider", () => {
  it("is off when nothing is configured, or the keys are blank", () => {
    expect(resolveProvider({})).toBeNull()
    expect(resolveProvider({ ANTHROPIC_API_KEY: "", GEMINI_API_KEY: "  ", XAI_API_KEY: "" })).toBeNull()
  })

  it("follows the key that is set", () => {
    expect(resolveProvider({ ANTHROPIC_API_KEY: "a" })?.id).toBe("anthropic")
    expect(resolveProvider({ GEMINI_API_KEY: "g" })?.id).toBe("gemini")
    expect(resolveProvider({ XAI_API_KEY: "x" })?.id).toBe("xai")
  })

  it("prefers Anthropic, then Gemini, then Grok when several keys are set", () => {
    expect(resolveProvider({ ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g", XAI_API_KEY: "x" })?.id).toBe("anthropic")
    expect(resolveProvider({ GEMINI_API_KEY: "g", XAI_API_KEY: "x" })?.id).toBe("gemini")
  })

  it("lets ASK_PROVIDER choose, by name or by the name people use", () => {
    const keys = { ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g", XAI_API_KEY: "x" }
    expect(resolveProvider({ ...keys, ASK_PROVIDER: "xai" })?.id).toBe("xai")
    expect(resolveProvider({ ...keys, ASK_PROVIDER: "Grok" })?.id).toBe("xai")
    expect(resolveProvider({ ...keys, ASK_PROVIDER: " google " })?.id).toBe("gemini")
    expect(resolveProvider({ ...keys, ASK_PROVIDER: "claude" })?.id).toBe("anthropic")
    expect(PROVIDER_NAMES).toEqual(["anthropic", "gemini", "xai"])
  })

  it("switches Ask off, and says why once, when ASK_PROVIDER can't be honoured", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(resolveProvider({ ASK_PROVIDER: "gemini", ANTHROPIC_API_KEY: "a" })).toBeNull()
    expect(resolveProvider({ ASK_PROVIDER: "gemini", ANTHROPIC_API_KEY: "a" })).toBeNull()
    expect(resolveProvider({ ASK_PROVIDER: "mistral", GEMINI_API_KEY: "g" })).toBeNull()
    expect(resolveProvider({ ASK_PROVIDER: "constructor", GEMINI_API_KEY: "g" })).toBeNull()
    expect(warn.mock.calls.map((c) => c[0] as string)).toEqual([
      "ask: ASK_PROVIDER=gemini needs GEMINI_API_KEY, so Ask is off.",
      'ask: ASK_PROVIDER "mistral" is not one of anthropic, gemini, xai, so Ask is off.',
      'ask: ASK_PROVIDER "constructor" is not one of anthropic, gemini, xai, so Ask is off.',
    ])
  })

  it("defaults the model and the address per provider", () => {
    expect(resolveProvider({ ANTHROPIC_API_KEY: "a" })).toMatchObject({ model: "claude-haiku-5-5", url: "https://api.anthropic.com/v1/messages" })
    expect(resolveProvider({ GEMINI_API_KEY: "g" })).toMatchObject({
      model: "gemini-3.1-flash-lite",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    })
    expect(resolveProvider({ XAI_API_KEY: "x" })).toMatchObject({ model: "grok-4.7", url: "https://api.x.ai/v1/chat/completions" })
  })

  it("honours ASK_MODEL and ASK_BASE_URL, and ANTHROPIC_BASE_URL for Anthropic only", () => {
    expect(resolveProvider({ GEMINI_API_KEY: "g", ASK_MODEL: "gemini-x", ASK_BASE_URL: "http://localhost:4010//" })).toMatchObject({
      model: "gemini-x",
      url: "http://localhost:4010/chat/completions",
    })
    expect(resolveProvider({ ANTHROPIC_API_KEY: "a", ANTHROPIC_BASE_URL: "http://a.test/" })?.url).toBe("http://a.test/v1/messages")
    expect(resolveProvider({ ANTHROPIC_API_KEY: "a", ANTHROPIC_BASE_URL: "http://a.test", ASK_BASE_URL: "http://b.test" })?.url).toBe("http://b.test/v1/messages")
    expect(resolveProvider({ GEMINI_API_KEY: "g", ANTHROPIC_BASE_URL: "http://a.test" })?.url).toContain("generativelanguage")
  })

  describe("reasoning effort", () => {
    it("defaults to low for Anthropic and Grok, and to the model's own choice for Gemini", () => {
      expect(requestOf({ ANTHROPIC_API_KEY: "a" }).body.output_config).toEqual({ effort: "low" })
      expect(requestOf({ XAI_API_KEY: "x" }).body.reasoning_effort).toBe("low")
      expect(requestOf({ GEMINI_API_KEY: "g" }).body).not.toHaveProperty("reasoning_effort")
    })

    it("passes ASK_EFFORT through in each provider's own field", () => {
      expect(requestOf({ ANTHROPIC_API_KEY: "a", ASK_EFFORT: "high" }).body.output_config).toEqual({ effort: "high" })
      expect(requestOf({ GEMINI_API_KEY: "g", ASK_EFFORT: "low" }).body.reasoning_effort).toBe("low")
      expect(requestOf({ XAI_API_KEY: "x", ASK_EFFORT: "medium" }).body.reasoning_effort).toBe("medium")
    })

    it("sends nothing for none or an empty value", () => {
      for (const ASK_EFFORT of ["none", "NONE", "", "  "]) {
        expect(requestOf({ ANTHROPIC_API_KEY: "a", ASK_EFFORT }).body).not.toHaveProperty("output_config")
        expect(requestOf({ XAI_API_KEY: "x", ASK_EFFORT }).body).not.toHaveProperty("reasoning_effort")
      }
    })
  })

  describe("token limit", () => {
    it("defaults to 2048, under the name each API uses", () => {
      expect(requestOf({ ANTHROPIC_API_KEY: "a" }).body.max_tokens).toBe(2048)
      expect(requestOf({ GEMINI_API_KEY: "g" }).body.max_tokens).toBe(2048)
      expect(requestOf({ XAI_API_KEY: "x" }).body.max_completion_tokens).toBe(2048)
    })

    it("takes ASK_MAX_TOKENS, and ignores nonsense", () => {
      expect(requestOf({ GEMINI_API_KEY: "g", ASK_MAX_TOKENS: "600" }).body.max_tokens).toBe(600)
      for (const ASK_MAX_TOKENS of ["abc", "-5", "NaN"]) expect(requestOf({ GEMINI_API_KEY: "g", ASK_MAX_TOKENS }).body.max_tokens).toBe(2048)
    })

    it("ASK_MAX_TOKENS=0 sends no limit, except to Anthropic, which requires one", () => {
      const gemini = requestOf({ GEMINI_API_KEY: "g", ASK_MAX_TOKENS: "0" }).body
      expect(gemini).not.toHaveProperty("max_tokens")
      expect(gemini).not.toHaveProperty("max_completion_tokens")
      expect(requestOf({ ANTHROPIC_API_KEY: "a", ASK_MAX_TOKENS: "0" }).body.max_tokens).toBe(2048)
    })
  })
})

describe("request shapes", () => {
  it("Anthropic: x-api-key, a top-level system prompt, the messages as given", () => {
    const { provider, body } = requestOf({ ANTHROPIC_API_KEY: "sk-a" })
    expect(provider.headers).toMatchObject({ "x-api-key": "sk-a", "anthropic-version": "2023-06-01" })
    expect(body).toMatchObject({ model: "claude-haiku-5-5", stream: true, system: "RULES", messages })
  })

  it.each([
    ["Gemini", { GEMINI_API_KEY: "sk-g" }],
    ["Grok", { XAI_API_KEY: "sk-x" }],
  ])("%s: a Bearer token, and the system prompt as the first message", (_name, env) => {
    const { provider, body } = requestOf(env)
    expect(provider.headers.Authorization).toMatch(/^Bearer sk-/)
    expect(provider.headers).not.toHaveProperty("x-api-key")
    expect(body.stream).toBe(true)
    expect(body.messages).toEqual([{ role: "system", content: "RULES" }, ...messages])
    expect(body).not.toHaveProperty("system")
  })
})

describe("OpenAI-style stream -> NDJSON", () => {
  const provider = resolveProvider({ GEMINI_API_KEY: "g" })!
  const run = (frames: string[], size = 0) => readAll(toNdjson(provider.events(sse(frames, size)), [{ n: 1, title: "T", href: "/" }]))

  const happy = [
    chatChunk({ role: "assistant" }),
    chatChunk({ reasoning_content: "thinking" }),
    chatChunk({ content: "Hello " }),
    chatChunk({ content: null }),
    chatChunk({ content: "world" }),
    chatChunk({}, "stop"),
    DONE,
  ]

  it("forwards visible text only, however the bytes are split", async () => {
    for (const size of [0, 1, 7, 50]) {
      const events = await run(happy, size)
      expect(events.map((e) => e.type)).toEqual(["sources", "text", "text", "done"])
      expect(events.filter((e) => e.type === "text").map((e) => e.text).join("")).toBe("Hello world")
      expect(JSON.stringify(events)).not.toContain("thinking")
    }
  })

  it("finishes on [DONE] when no chunk carries a finish_reason", async () => {
    const events = await run([chatChunk({ content: "Hi" }), DONE])
    expect(events.map((e) => e.type)).toEqual(["sources", "text", "done"])
  })

  it("ignores chunks without choices, such as a trailing usage report", async () => {
    const usage = `data: ${JSON.stringify({ choices: [], usage: { total_tokens: 9 } })}\n\n`
    const events = await run([chatChunk({ content: "Hi" }), usage, chatChunk({}, "stop")])
    expect(events.map((e) => e.type)).toEqual(["sources", "text", "done"])
  })

  it("reports an error object in the stream without echoing it", async () => {
    const failure = `data: ${JSON.stringify({ error: { message: "quota used by g-key", code: 429 } })}\n\n`
    const events = await run([chatChunk({ content: "Hi" }), failure])
    expect(events.at(-1)).toMatchObject({ type: "error" })
    expect(JSON.stringify(events)).not.toContain("g-key")
  })

  it("reports an error when the stream ends without finishing", async () => {
    expect((await run([chatChunk({ content: "Hi" })])).at(-1)).toMatchObject({ type: "error" })
  })

  it("says so when the answer is filtered and nothing was written", async () => {
    const events = await run([chatChunk({}, "content_filter")])
    expect(events.some((e) => e.type === "text" && /can't help/.test(e.text))).toBe(true)
    expect(events.at(-1)).toEqual({ type: "done" })
  })

  it("skips frames that aren't JSON", async () => {
    const events = await run(["data: {nope}\n\n", "data: null\n\n", chatChunk({ content: "ok" }), DONE])
    expect(events.map((e) => e.type)).toEqual(["sources", "text", "done"])
  })
})

describe("errorLabel", () => {
  const anthropic = anthropicProvider({ apiKey: "k", model: "m", baseUrl: "http://x", maxTokens: 1, effort: undefined })
  const gemini = resolveProvider({ GEMINI_API_KEY: "g" })!

  it("reads each provider's own error shape", () => {
    expect(anthropic.errorLabel({ type: "error", error: { type: "rate_limit_error", message: "slow down" } })).toBe("rate_limit_error")
    expect(gemini.errorLabel([{ error: { code: 429, message: "m", status: "RESOURCE_EXHAUSTED" } }])).toBe("RESOURCE_EXHAUSTED")
    expect(gemini.errorLabel({ error: { message: "m", type: "invalid_request_error", code: "model_not_found" } })).toBe("invalid_request_error")
    expect(gemini.errorLabel({ error: { message: "m", code: 404 } })).toBe("404")
    expect(gemini.errorLabel({ code: "Some error", error: "Incorrect API key provided: xai-abc" })).toBe("Some error")
  })

  it("returns nothing for anything else", () => {
    for (const payload of [null, undefined, "text", 42, [], {}, { error: {} }, { error: { status: { nested: true } } }]) {
      expect(gemini.errorLabel(payload)).toBeUndefined()
      expect(anthropic.errorLabel(payload)).toBeUndefined()
    }
  })

  it("never passes along anything that looks like a sentence or a secret", () => {
    expect(logLabel("x".repeat(61))).toBeUndefined()
    expect(logLabel("line one\nline two")).toBeUndefined()
    expect(logLabel("key=sk-123!")).toBeUndefined()
    expect(logLabel("RESOURCE_EXHAUSTED")).toBe("RESOURCE_EXHAUSTED")
  })
})
