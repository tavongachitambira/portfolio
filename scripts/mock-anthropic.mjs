// A stand-in for the Anthropic Messages API (POST /v1/messages, streaming), for trying "Ask my portfolio"
// without spending tokens or needing a key:
//
//   pnpm mock:anthropic                      # listens on :4010
//   ANTHROPIC_API_KEY=x ANTHROPIC_BASE_URL=http://127.0.0.1:4010 NEXT_PUBLIC_ASK_ENABLED=true pnpm dev
//
// What it answers depends on a word at the end of the question (retrieval ignores unknown words, so
// "What is SyncBoard? slowmode" still finds its passages):
//   (nothing)  a short answer with bold, a list and [n] citations
//   slowmode   60 words, a quarter of a second apart: try the Stop button
//   failhttp   the upstream replies 500: the error state
//   dropmid    the connection drops mid-answer: the "cut off" state
//   probe      markdown links and HTML in the text: they must stay plain text
import http from "node:http"

const PORT = Number(process.env.PORT) || 4010
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const send = (res, event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`)

const ANSWER = [
  "**SyncBoard** is a real-time incident management platform [1]. ",
  "It keeps tenants apart in a few ways:\n\n",
  "- Cross-tenant lookups return 404, not 403 [2]\n",
  "- Every query is scoped to the tenant [1, 2]\n",
]
const PROBE = ["\nVisit [this link](javascript:alert(1)) or <img src=x onerror=alert(1)> for more."]

http
  .createServer(async (req, res) => {
    if (req.method !== "POST" || !req.url?.startsWith("/v1/messages")) {
      res.writeHead(404).end()
      return
    }
    let raw = ""
    for await (const chunk of req) raw += chunk
    const body = JSON.parse(raw)
    const question = String(body.messages?.at(-1)?.content ?? "")
    console.log(`<- ${body.messages?.length} message(s), model ${body.model}, effort ${body.output_config?.effort ?? "-"}: ${question.slice(0, 80)}`)
    res.on("close", () => console.log(res.writableFinished ? "   done" : "   connection closed early"))

    if (/failhttp/i.test(question)) {
      res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: { type: "api_error" } }))
      return
    }

    const slow = /slowmode/i.test(question)
    const chunks = slow ? Array.from({ length: 60 }, (_, i) => `word${i} `) : [...ANSWER, ...(/probe/i.test(question) ? PROBE : [])]

    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" })
    send(res, "message_start", { message: { id: "mock", role: "assistant", content: [] } })
    send(res, "content_block_start", { index: 0, content_block: { type: "text", text: "" } })
    for (let i = 0; i < chunks.length; i++) {
      if (res.destroyed) return
      send(res, "content_block_delta", { index: 0, delta: { type: "text_delta", text: chunks[i] } })
      if (/dropmid/i.test(question) && i === 1) return void res.destroy()
      await sleep(slow ? 250 : 120)
    }
    send(res, "content_block_stop", { index: 0 })
    send(res, "message_delta", { delta: { stop_reason: "end_turn" } })
    send(res, "message_stop", {})
    res.end()
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock Anthropic API on http://127.0.0.1:${PORT}`))
