/* A model's streaming reply is Server-Sent Events, in a dialect that depends on the provider
   (Anthropic's own, or the OpenAI style that Gemini and Grok speak). Each provider module turns its
   dialect into the small ModelEvent vocabulary below. This file turns that into what the browser
   gets: one JSON object per line (NDJSON), so the client needs no SSE parser.

     {"type":"sources","sources":[{"n":1,"title":"…","href":"…"}]}   first, once
     {"type":"text","text":"…"}                                       zero or more
     {"type":"done"}  or  {"type":"error","message":"…"}              last, once

   Errors can't change the HTTP status once streaming has begun, so they travel in-band. */

export interface SourceRef {
  n: number
  title: string
  href: string
}

export type AskEvent =
  | { type: "sources"; sources: SourceRef[] }
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }

const encoder = new TextEncoder()
export const line = (event: AskEvent) => encoder.encode(`${JSON.stringify(event)}\n`)

/** What any provider's stream boils down to. Thinking and reasoning output is not part of it. */
export type ModelEvent =
  | { type: "text"; text: string }
  | { type: "refusal" }
  | { type: "end" }
  | { type: "error" }

/** Yields the `data:` payload of each SSE frame, however the bytes happen to be chunked. */
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n")

      let end: number
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const data = frame
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).replace(/^ /, ""))
          .join("\n")
        if (data) yield data
      }
      if (done) return
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

/** The same, parsed as JSON. A malformed frame is skipped rather than ending the answer. */
export async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  for await (const data of sseData(body)) {
    let parsed: unknown
    try {
      parsed = JSON.parse(data)
    } catch {
      continue
    }
    if (parsed && typeof parsed === "object") yield parsed as Record<string, unknown>
  }
}

export const REFUSED = "I can't help with that one."
export const INTERRUPTED = "The answer was cut off. Please try again."

/** Model events in, NDJSON out. Only visible text is forwarded. */
export function toNdjson(events: AsyncIterable<ModelEvent>, sources: SourceRef[]): ReadableStream<Uint8Array> {
  let cancelled = false

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AskEvent) => {
        if (!cancelled) controller.enqueue(line(event))
      }
      const close = () => {
        if (!cancelled) controller.close()
      }

      send({ type: "sources", sources })
      let sentText = false
      try {
        for await (const event of events) {
          if (cancelled) return
          if (event.type === "text") {
            sentText = true
            send({ type: "text", text: event.text })
          } else if (event.type === "refusal") {
            if (!sentText) send({ type: "text", text: REFUSED })
            sentText = true
          } else if (event.type === "error") {
            send({ type: "error", message: INTERRUPTED })
            return close()
          } else {
            send({ type: "done" })
            return close()
          }
        }
        // the connection ended without a closing event
        send({ type: "error", message: INTERRUPTED })
      } catch {
        send({ type: "error", message: INTERRUPTED })
      }
      close()
    },
    cancel() {
      // the visitor closed the panel: the loop above stops, and its generators cancel the upstream reader
      cancelled = true
    },
  })
}
