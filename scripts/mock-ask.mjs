// A stand-in for the model APIs behind "Ask my portfolio", for trying it without a key or any spend.
// It speaks both dialects:
//   POST /v1/messages        Anthropic
//   POST …/chat/completions  OpenAI style, which is what Gemini and Grok speak
//
//   pnpm mock:ask                                              # listens on :4010
//   GEMINI_API_KEY=x ASK_BASE_URL=http://127.0.0.1:4010 NEXT_PUBLIC_ASK_ENABLED=true pnpm dev
//   (swap GEMINI_API_KEY for XAI_API_KEY or ANTHROPIC_API_KEY to try the other providers)
//
// What it answers depends on a word at the end of the question (retrieval ignores unknown words, so
// "What is SyncBoard? slowmode" still finds its passages):
//   (nothing)  a short answer with bold, a list and [n] citations
//   slowmode   60 words, a quarter of a second apart: try the Stop button
//   failhttp   the upstream replies 500: the error state
//   failquota  the upstream replies 429, as an exhausted free tier does: the "busy" state
//   dropmid    the connection drops mid-answer: the "cut off" state
//   probe      markdown links and HTML in the text: they must stay plain text
//
// Each request is logged with the dialect, model, reasoning setting, token cap and how the key arrived,
// so a provider's request shape can be checked without calling the real API.
import http from "node:http"

const PORT = Number(process.env.PORT) || 4010
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ANSWER = [
  "**SyncBoard** is a real-time incident management platform [1]. ",
  "It keeps tenants apart in a few ways:\n\n",
  "- Cross-tenant lookups return 404, not 403 [2]\n",
  "- Every query is scoped to the tenant [1, 2]\n",
]
const PROBE = ["\nVisit [this link](javascript:alert(1)) or <img src=x onerror=alert(1)> for more."]

// the two wire formats: how to start, say a piece of text, and finish
const dialects = {
  anthropic: {
    start: (res) => {
      event(res, "message_start", { message: { id: "mock", role: "assistant", content: [] } })
      event(res, "content_block_start", { index: 0, content_block: { type: "text", text: "" } })
    },
    text: (res, text) => event(res, "content_block_delta", { index: 0, delta: { type: "text_delta", text } }),
    finish: (res) => {
      event(res, "content_block_stop", { index: 0 })
      event(res, "message_delta", { delta: { stop_reason: "end_turn" } })
      event(res, "message_stop", {})
    },
    failure: (status) =>
      status === 429 ? { type: "error", error: { type: "rate_limit_error" } } : { type: "error", error: { type: "api_error" } },
  },
  openai: {
    start: (res) => {
      chunk(res, { role: "assistant", content: "" })
      // Grok streams its reasoning next to the answer; the site must not show it
      chunk(res, { reasoning_content: "(reasoning that must not appear)" })
    },
    text: (res, text) => chunk(res, { content: text }),
    finish: (res) => {
      chunk(res, {}, "stop")
      res.write("data: [DONE]\n\n")
    },
    // Gemini wraps its errors in an array
    failure: (status) =>
      status === 429
        ? [{ error: { code: 429, message: "Quota exceeded (mock)", status: "RESOURCE_EXHAUSTED" } }]
        : { error: { message: "mock failure", type: "server_error" } },
  },
}

const event = (res, name, data) => res.write(`event: ${name}\ndata: ${JSON.stringify({ type: name, ...data })}\n\n`)
const chunk = (res, delta, finish = null) =>
  res.write(`data: ${JSON.stringify({ id: "mock", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`)

http
  .createServer(async (req, res) => {
    const dialect = req.url?.startsWith("/v1/messages") ? "anthropic" : req.url?.endsWith("/chat/completions") ? "openai" : null
    if (req.method !== "POST" || !dialect) {
      res.writeHead(404).end()
      return
    }
    let raw = ""
    for await (const part of req) raw += part
    const body = JSON.parse(raw)
    const turns = (body.messages ?? []).filter((m) => m.role !== "system")
    const question = String(turns.at(-1)?.content ?? "")
    const cap = body.max_tokens !== undefined ? `max_tokens ${body.max_tokens}` : body.max_completion_tokens !== undefined ? `max_completion_tokens ${body.max_completion_tokens}` : "no cap"
    const key = dialect === "anthropic" ? (req.headers["x-api-key"] ? "x-api-key" : "NO KEY") : req.headers.authorization?.startsWith("Bearer ") ? "Bearer" : "NO KEY"
    console.log(`<- ${dialect}: ${turns.length} message(s), model ${body.model}, effort ${body.output_config?.effort ?? body.reasoning_effort ?? "-"}, ${cap}, ${key}: ${question.slice(0, 80)}`)
    res.on("close", () => console.log(res.writableFinished ? "   done" : "   connection closed early"))

    const d = dialects[dialect]
    for (const [word, status] of [["failhttp", 500], ["failquota", 429]]) {
      if (new RegExp(word, "i").test(question)) {
        res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(d.failure(status)))
        return
      }
    }

    const slow = /slowmode/i.test(question)
    const pieces = slow ? Array.from({ length: 60 }, (_, i) => `word${i} `) : [...ANSWER, ...(/probe/i.test(question) ? PROBE : [])]

    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" })
    d.start(res)
    for (let i = 0; i < pieces.length; i++) {
      if (res.destroyed) return
      d.text(res, pieces[i])
      if (/dropmid/i.test(question) && i === 1) return void res.destroy()
      await sleep(slow ? 250 : 120)
    }
    d.finish(res)
    res.end()
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock model API on http://127.0.0.1:${PORT} (Anthropic and OpenAI style)`))
