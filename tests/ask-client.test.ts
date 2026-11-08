import { describe, expect, it } from "vitest"

import { buildRequestMessages, failureMessage, readEvents, type Turn } from "@/lib/ask/client"
import { LIMITS, parseMessages } from "@/lib/ask/messages"
import { line } from "@/lib/ask/stream"

const turn = (i: number): Turn => ({ question: `question ${i}`, answer: `answer ${i}` })

describe("buildRequestMessages", () => {
  it("is just the question for a fresh chat", () => {
    expect(buildRequestMessages([], "  hello  ")).toEqual([{ role: "user", content: "hello" }])
  })

  it("replays earlier exchanges as alternating turns", () => {
    const messages = buildRequestMessages([turn(1), turn(2)], "next")
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant", "user"])
    expect(messages.at(-1)).toEqual({ role: "user", content: "next" })
  })

  it("always produces something the server accepts, however long the chat gets", () => {
    for (let n = 0; n <= 12; n++) {
      const history = Array.from({ length: n }, (_, i) => turn(i))
      const messages = buildRequestMessages(history, "latest")
      expect(messages.length).toBeLessThanOrEqual(LIMITS.turns)
      expect(parseMessages(messages)).not.toBeNull()
      expect(messages.at(-1)?.content).toBe("latest")
    }
  })

  it("keeps the most recent exchanges when it has to drop some", () => {
    const history = Array.from({ length: 9 }, (_, i) => turn(i))
    const contents = buildRequestMessages(history, "latest").map((m) => m.content)
    expect(contents).toContain("question 8")
    expect(contents).not.toContain("question 0")
  })

  it("skips exchanges with no answer (stopped or failed) so roles can't stack", () => {
    const messages = buildRequestMessages([turn(1), { question: "no reply", answer: "" }, turn(3)], "next")
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant", "user"])
    expect(messages.map((m) => m.content)).not.toContain("no reply")
  })

  it("trims to the length limits", () => {
    const messages = buildRequestMessages([{ question: "q".repeat(900), answer: "a".repeat(5000) }], "z".repeat(900))
    expect(messages[0].content).toHaveLength(LIMITS.user)
    expect(messages[1].content).toHaveLength(LIMITS.assistant)
    expect(messages[2].content).toHaveLength(LIMITS.user)
    expect(parseMessages(messages)).not.toBeNull()
  })
})

describe("readEvents", () => {
  const stream = (chunks: Uint8Array[]) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const chunk of chunks) c.enqueue(chunk)
        c.close()
      },
    })
  const collect = async (s: ReadableStream<Uint8Array>) => {
    const out = []
    for await (const e of readEvents(s)) out.push(e)
    return out
  }

  const wire = [
    line({ type: "sources", sources: [{ n: 1, title: "T", href: "/x" }] }),
    line({ type: "text", text: "Hello " }),
    line({ type: "text", text: "wörld ✓" }),
    line({ type: "done" }),
  ]
  const bytes = new Uint8Array(wire.flatMap((b) => [...b]))

  it("reads every event", async () => {
    const events = await collect(stream([bytes]))
    expect(events.map((e) => e.type)).toEqual(["sources", "text", "text", "done"])
  })

  it("survives any chunk boundary, including inside a multi-byte character", async () => {
    for (const size of [1, 2, 5, 13]) {
      const chunks: Uint8Array[] = []
      for (let i = 0; i < bytes.length; i += size) chunks.push(bytes.slice(i, i + size))
      const events = await collect(stream(chunks))
      const text = events.filter((e) => e.type === "text").map((e) => (e as { text: string }).text).join("")
      expect(text).toBe("Hello wörld ✓")
      expect(events.at(-1)).toEqual({ type: "done" })
    }
  })

  it("ignores blank lines, junk and unknown event types", async () => {
    const junk = new TextEncoder().encode(`\n{not json}\n{"type":"mystery"}\n{"type":"text","text":5}\n`)
    const events = await collect(stream([junk, line({ type: "done" })]))
    expect(events).toEqual([{ type: "done" }])
  })

  it("reads a last event that has no trailing newline", async () => {
    const events = await collect(stream([new TextEncoder().encode('{"type":"done"}')]))
    expect(events).toEqual([{ type: "done" }])
  })

  it("passes through an in-band error", async () => {
    const events = await collect(stream([line({ type: "error", message: "cut off" })]))
    expect(events).toEqual([{ type: "error", message: "cut off" }])
  })
})

describe("failureMessage", () => {
  it("prefers the server's own wording", () => {
    expect(failureMessage(503, "Ask is resting for today.")).toBe("Ask is resting for today.")
  })
  it("has a sensible default per status", () => {
    expect(failureMessage(429)).toMatch(/try again in a few minutes/)
    expect(failureMessage(413)).toMatch(/shorter/)
    expect(failureMessage(502)).toMatch(/unavailable/)
  })
})
