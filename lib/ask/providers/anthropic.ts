import { logLabel, type AskProvider, type ProviderConfig } from "@/lib/ask/providers/types"
import { sseEvents, type ModelEvent } from "@/lib/ask/stream"

/* Anthropic Messages API: POST {base}/v1/messages, `x-api-key`, a stream of typed SSE events. */

async function* events(stream: ReadableStream<Uint8Array>): AsyncGenerator<ModelEvent> {
  for await (const event of sseEvents(stream)) {
    if (event.type === "content_block_delta") {
      const delta = event.delta as { type?: string; text?: string } | undefined
      // thinking arrives as thinking_delta blocks and is never forwarded
      if (delta?.type === "text_delta" && delta.text) yield { type: "text", text: delta.text }
    } else if (event.type === "message_delta") {
      const stop = (event.delta as { stop_reason?: string } | undefined)?.stop_reason
      if (stop === "refusal") yield { type: "refusal" }
    } else if (event.type === "error") {
      yield { type: "error" }
      return
    } else if (event.type === "message_stop") {
      yield { type: "end" }
      return
    }
  }
}

const errorLabel = (payload: unknown) => logLabel((payload as { error?: { type?: unknown } } | null)?.error?.type)

export function anthropicProvider(config: ProviderConfig): AskProvider {
  return {
    id: "anthropic",
    model: config.model,
    url: `${config.baseUrl}/v1/messages`,
    headers: { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: ({ system, messages }) =>
      JSON.stringify({
        model: config.model,
        // thinking tokens count against this, so leave room for the answer itself
        max_tokens: config.maxTokens ?? 2048,
        stream: true,
        system,
        messages,
        ...(config.effort ? { output_config: { effort: config.effort } } : {}),
      }),
    events,
    errorLabel,
  }
}
