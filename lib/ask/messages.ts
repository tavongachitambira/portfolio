/* The chat history comes from the browser, so it is treated as untrusted: bounded in count and
   size, and it must end on a user turn (the model API rejects a trailing assistant message). */

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export const LIMITS = { turns: 8, user: 500, assistant: 2000 } as const

export function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > LIMITS.turns) return null

  const out: ChatMessage[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") return null
    const { role, content } = item as Record<string, unknown>
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null
    const text = content.trim()
    if (!text || text.length > LIMITS[role]) return null
    out.push({ role, content: text })
  }

  if (out[0].role !== "user" || out[out.length - 1].role !== "user") return null
  // strict alternation keeps a forged history from stacking instructions in one role
  for (let i = 1; i < out.length; i++) if (out[i].role === out[i - 1].role) return null
  return out
}

/** What to search for: the latest question, plus the one before it when it is too short to stand alone. */
export function searchQuery(messages: ChatMessage[]): string {
  const users = messages.filter((m) => m.role === "user")
  const last = users[users.length - 1].content
  return last.split(/\s+/).length < 5 && users.length > 1 ? `${users[users.length - 2].content} ${last}` : last
}
