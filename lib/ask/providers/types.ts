import type { ChatMessage } from "@/lib/ask/messages"
import type { ModelEvent } from "@/lib/ask/stream"

/** What the environment resolved to, before a provider turns it into a request. */
export interface ProviderConfig {
  apiKey: string
  model: string
  /** no trailing slash */
  baseUrl: string
  /** undefined: send no limit (only the OpenAI-style providers allow that) */
  maxTokens: number | undefined
  /** undefined: send no reasoning setting and let the model use its own default */
  effort: string | undefined
}

/* One model API: how to ask it a question and how to read its streamed answer. */
export interface AskProvider {
  id: "anthropic" | "gemini" | "xai"
  model: string
  url: string
  headers: Record<string, string>
  /** the JSON request body for one streamed answer */
  body(input: { system: string; messages: ChatMessage[] }): string
  /** the provider's SSE stream, reduced to text and how it ended */
  events(stream: ReadableStream<Uint8Array>): AsyncIterable<ModelEvent>
  /** a short machine label from a failed response ("rate_limit_error", "RESOURCE_EXHAUSTED"), never message text */
  errorLabel(payload: unknown): string | undefined
}

/** Only a short identifier-like value may reach the logs, so an error body can never carry a prompt or a key out. */
export function logLabel(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined
  const text = String(value)
  return /^[\w .:-]{1,60}$/.test(text) ? text : undefined
}
