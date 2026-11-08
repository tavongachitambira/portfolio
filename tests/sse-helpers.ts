/* Shared by the Ask tests: a body that streams SSE text, and readers for what comes back. */

/** Streams the frames as one chunk, or in pieces of `chunkSize` bytes to exercise chunk boundaries. */
export const sse = (frames: string[], chunkSize = 0) => {
  const bytes = new TextEncoder().encode(frames.join(""))
  return new ReadableStream<Uint8Array>({
    start(c) {
      if (!chunkSize) c.enqueue(bytes)
      else for (let i = 0; i < bytes.length; i += chunkSize) c.enqueue(bytes.slice(i, i + chunkSize))
      c.close()
    },
  })
}

/** Every NDJSON line of a reply, parsed. */
export const readAll = async (body: ReadableStream<Uint8Array> | null) => {
  const text = await new Response(body).text()
  return text.trim().split("\n").map((l) => JSON.parse(l))
}

/** One chunk of an OpenAI-style stream (what Gemini and Grok send). */
export const chatChunk = (delta: Record<string, unknown>, finish: string | null = null) =>
  `data: ${JSON.stringify({ id: "x", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`

export const DONE = "data: [DONE]\n\n"
