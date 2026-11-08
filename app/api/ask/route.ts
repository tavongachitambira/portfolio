import { LIMITS, parseMessages, searchQuery } from "@/lib/ask/messages"
import { buildSystemPrompt, NOT_ON_SITE } from "@/lib/ask/prompt"
import { resolveProvider } from "@/lib/ask/provider"
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
  const provider = process.env.ASK_DISABLED === "true" ? null : resolveProvider()
  if (!provider) return json({ error: "Ask is not available right now." }, 503)

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

  let upstream: Response
  try {
    upstream = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: provider.body({ system: buildSystemPrompt(hits), messages }),
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    })
  } catch (error) {
    console.error("ask: upstream request failed.", provider.id, error instanceof Error ? error.name : error)
    return json({ error: "Ask is unavailable right now." }, 502)
  }

  if (!upstream.ok || !upstream.body) {
    // provider, status and a short error code only: never the prompt, the key or the visitor's words
    const label = await upstream.json().then(provider.errorLabel).catch(() => undefined)
    console.error("ask: upstream error.", provider.id, upstream.status, label)
    // out of quota or overloaded: worth trying again shortly. Anything else (a bad key or model) is on us
    const busy = upstream.status === 429 || upstream.status === 503 || upstream.status === 529
    return json({ error: busy ? "Ask is busy right now. Please try again in a minute." : "Ask is unavailable right now." }, busy ? 503 : 502)
  }

  return ndjson(toNdjson(provider.events(upstream.body), sources))
}
