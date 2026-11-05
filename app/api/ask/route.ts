import { LIMITS, parseMessages, searchQuery } from "@/lib/ask/messages"
import { buildSystemPrompt, NOT_ON_SITE } from "@/lib/ask/prompt"
import { retrieve } from "@/lib/ask/retrieve"
import { line, toNdjson, type SourceRef } from "@/lib/ask/stream"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const maxDuration = 30

const PER_IP = { limit: 12, windowSec: 10 * 60 }
const MAX_BODY_BYTES = 16 * 1024
const UPSTREAM_TIMEOUT_MS = 25_000

const json = (body: Record<string, unknown>, status: number, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } })

const ndjson = (body: BodyInit) =>
  new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  })

/** A complete answer in the same wire format as a streamed one. */
function fixedAnswer(text: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(line({ type: "sources", sources: [] }))
      controller.enqueue(line({ type: "text", text }))
      controller.enqueue(line({ type: "done" }))
      controller.close()
    },
  })
}

/* Order: switch -> rate limits -> body -> retrieval -> model.
   Questions the site can't answer never reach the model, so they cost nothing. */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || process.env.ASK_DISABLED === "true") return json({ error: "Ask is not available right now." }, 503)

  const ip = clientIp(request.headers)
  const mine = await rateLimit({ scope: "ask", id: ip, ...PER_IP })
  if (!mine.ok) {
    return json({ error: "You've asked a lot of questions. Please try again in a few minutes." }, 429, {
      "Retry-After": String(mine.retryAfter),
    })
  }
  // a daily ceiling on the whole site bounds the worst-case bill
  const cap = Number(process.env.ASK_DAILY_CAP) || 500
  const everyone = await rateLimit({ scope: "ask-all", id: "all", limit: cap, windowSec: 24 * 60 * 60 })
  if (!everyone.ok) {
    return json({ error: "Ask is resting for today. Try again tomorrow." }, 503, { "Retry-After": String(everyone.retryAfter) })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return json({ error: "That request is too large." }, 413)

  let messages
  try {
    messages = parseMessages((JSON.parse(raw) as { messages?: unknown })?.messages)
  } catch {
    messages = null
  }
  if (!messages) {
    return json({ error: `Send up to ${LIMITS.turns} messages, ending with your question (max ${LIMITS.user} characters).` }, 400)
  }

  const hits = retrieve(searchQuery(messages))
  if (!hits.length) return ndjson(fixedAnswer(NOT_ON_SITE))

  const sources: SourceRef[] = hits.map((h, i) => ({ n: i + 1, title: h.chunk.title, href: h.chunk.href }))
  const effort = process.env.ASK_EFFORT ?? "low"
  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "")

  let upstream: Response
  try {
    upstream = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ASK_MODEL || "claude-haiku-5-5",
        // thinking tokens count against this, so leave room for the answer itself
        max_tokens: Number(process.env.ASK_MAX_TOKENS) || 2048,
        stream: true,
        system: buildSystemPrompt(hits),
        messages,
        ...(effort && effort !== "none" ? { output_config: { effort } } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    })
  } catch (error) {
    console.error("ask: upstream request failed.", error instanceof Error ? error.name : error)
    return json({ error: "Ask is unavailable right now." }, 502)
  }

  if (!upstream.ok || !upstream.body) {
    // status and error type only: never the prompt, the key or the visitor's words
    const type = await upstream
      .json()
      .then((b: { error?: { type?: string } }) => b?.error?.type)
      .catch(() => undefined)
    console.error("ask: upstream error.", upstream.status, type)
    return json({ error: "Ask is unavailable right now." }, upstream.status === 429 || upstream.status === 529 ? 503 : 502)
  }

  return ndjson(toNdjson(upstream.body, sources))
}
