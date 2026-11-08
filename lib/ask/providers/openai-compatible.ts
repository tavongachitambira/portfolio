import { logLabel, type AskProvider, type ProviderConfig } from "@/lib/ask/providers/types"
import { sseData, type ModelEvent } from "@/lib/ask/stream"

/* The OpenAI chat-completions dialect, which Gemini (its OpenAI-compatible endpoint) and Grok both speak:
   POST {base}/chat/completions, `Authorization: Bearer`, SSE of `choices[0].delta` chunks ending in [DONE]. */

interface Chunk {
  error?: unknown
  choices?: { delta?: { content?: unknown }; finish_reason?: string | null }[]
}

async function* events(stream: ReadableStream<Uint8Array>): AsyncGenerator<ModelEvent> {
  for await (const data of sseData(stream)) {
    if (data === "[DONE]") {
      yield { type: "end" }
      return
    }

    let chunk: Chunk | null
    try {
      chunk = JSON.parse(data)
    } catch {
      continue
    }
    if (!chunk || typeof chunk !== "object") continue
    if (chunk.error) {
      yield { type: "error" }
      return
    }

    // only delta.content is visible text: a model's reasoning (Grok's delta.reasoning_content) is never forwarded
    const choice = chunk.choices?.[0]
    const text = choice?.delta?.content
    if (typeof text === "string" && text) yield { type: "text", text }

    if (choice?.finish_reason) {
      if (choice.finish_reason === "content_filter") yield { type: "refusal" }
      yield { type: "end" }
      return
    }
  }
}

function errorLabel(payload: unknown): string | undefined {
  // Gemini wraps its error in an array, and Grok sends a plain string next to a short `code`
  const body = Array.isArray(payload) ? payload[0] : payload
  if (!body || typeof body !== "object") return undefined
  const { error, code } = body as { error?: unknown; code?: unknown }
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>
    return logLabel(e.status) ?? logLabel(e.type) ?? logLabel(e.code)
  }
  return logLabel(code)
}

/** `tokenLimit` is the name this API gives the output cap: the two providers disagree. */
export function openAiProvider(
  id: "gemini" | "xai",
  config: ProviderConfig,
  tokenLimit: "max_tokens" | "max_completion_tokens",
): AskProvider {
  return {
    id,
    model: config.model,
    url: `${config.baseUrl}/chat/completions`,
    headers: { Authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
    body: ({ system, messages }) =>
      JSON.stringify({
        model: config.model,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
        ...(config.maxTokens ? { [tokenLimit]: config.maxTokens } : {}),
        ...(config.effort ? { reasoning_effort: config.effort } : {}),
      }),
    events,
    errorLabel,
  }
}
