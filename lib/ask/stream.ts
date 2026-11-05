/* Anthropic's streaming reply is Server-Sent Events. The browser gets something simpler:
   one JSON object per line (NDJSON), so the client needs no SSE parser.

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

/** Yields each parsed `data:` payload of an SSE stream, however the bytes happen to be chunked. */
export async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
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
        if (!data) continue
        try {
          yield JSON.parse(data)
        } catch {
          // a malformed frame is skipped rather than ending the answer
        }
      }
      if (done) return
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

export const REFUSED = "I can't help with that one."
export const INTERRUPTED = "The answer was cut off. Please try again."

/** Upstream SSE in, NDJSON out. Only visible text is forwarded: thinking blocks never reach the page. */
export function toNdjson(upstream: ReadableStream<Uint8Array>, sources: SourceRef[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(line({ type: "sources", sources }))
      let sentText = false
      try {
        for await (const event of sseEvents(upstream)) {
          if (event.type === "content_block_delta") {
            const delta = event.delta as { type?: string; text?: string } | undefined
            if (delta?.type === "text_delta" && delta.text) {
              sentText = true
              controller.enqueue(line({ type: "text", text: delta.text }))
            }
          } else if (event.type === "message_delta") {
            const stop = (event.delta as { stop_reason?: string } | undefined)?.stop_reason
            if (stop === "refusal" && !sentText) controller.enqueue(line({ type: "text", text: REFUSED }))
          } else if (event.type === "error") {
            controller.enqueue(line({ type: "error", message: INTERRUPTED }))
            return controller.close()
          } else if (event.type === "message_stop") {
            controller.enqueue(line({ type: "done" }))
            return controller.close()
          }
        }
        // the connection ended without message_stop
        controller.enqueue(line({ type: "error", message: INTERRUPTED }))
      } catch {
        controller.enqueue(line({ type: "error", message: INTERRUPTED }))
      }
      controller.close()
    },
    cancel() {
      // the visitor closed the panel: the generator's finally-block cancels the upstream reader
    },
  })
}
