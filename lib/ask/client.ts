import { LIMITS, type ChatMessage } from "@/lib/ask/messages"
import type { AskEvent } from "@/lib/ask/stream"

/* Browser side of the Ask wire format: build the request, read the NDJSON reply.
   Pure functions, so they are tested without a DOM. */

/** One finished exchange. Failed or stopped answers are left out of what is sent back. */
export interface Turn {
  question: string
  answer: string
}

/** Past exchanges plus the new question, trimmed to what the API accepts: alternating roles,
    starting and ending on a user turn, at most LIMITS.turns messages. */
export function buildRequestMessages(history: Turn[], question: string): ChatMessage[] {
  const maxPairs = Math.floor((LIMITS.turns - 1) / 2)
  const pairs = history.filter((t) => t.question.trim() && t.answer.trim()).slice(-maxPairs)

  return [
    ...pairs.flatMap((t): ChatMessage[] => [
      { role: "user", content: t.question.trim().slice(0, LIMITS.user) },
      { role: "assistant", content: t.answer.trim().slice(0, LIMITS.assistant) },
    ]),
    { role: "user", content: question.trim().slice(0, LIMITS.user) },
  ]
}

function parseEvent(raw: string): AskEvent | null {
  try {
    const e = JSON.parse(raw) as Record<string, unknown>
    switch (e.type) {
      case "sources":
        return Array.isArray(e.sources) ? (e as unknown as AskEvent) : null
      case "text":
        return typeof e.text === "string" ? { type: "text", text: e.text } : null
      case "done":
        return { type: "done" }
      case "error":
        return { type: "error", message: typeof e.message === "string" ? e.message : "Something went wrong." }
      default:
        return null
    }
  } catch {
    return null
  }
}

/** Yields each event of the reply as it arrives, however the bytes are split across chunks. */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AskEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      let end: number
      while ((end = buffer.indexOf("\n")) !== -1) {
        const raw = buffer.slice(0, end).trim()
        buffer = buffer.slice(end + 1)
        const event = raw && parseEvent(raw)
        if (event) yield event
      }
      if (done) {
        const event = buffer.trim() && parseEvent(buffer.trim())
        if (event) yield event
        return
      }
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

/** What to tell the visitor when the request itself failed (no stream). */
export function failureMessage(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage
  if (status === 429) return "You've asked a lot of questions. Please try again in a few minutes."
  if (status === 413 || status === 400) return "That question couldn't be sent. Try a shorter one."
  return "Ask is unavailable right now."
}
