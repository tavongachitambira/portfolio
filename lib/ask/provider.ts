import { anthropicProvider } from "@/lib/ask/providers/anthropic"
import { openAiProvider } from "@/lib/ask/providers/openai-compatible"
import type { AskProvider, ProviderConfig } from "@/lib/ask/providers/types"

type Env = Record<string, string | undefined>

interface Preset {
  /** the environment variable that holds this provider's API key */
  key: string
  baseUrl: string
  model: string
  /** the reasoning setting used when ASK_EFFORT is unset; undefined leaves it to the model */
  effort?: string
  create(config: ProviderConfig): AskProvider
}

/* Adding a provider that speaks one of the two dialects is one entry here. */
const PRESETS = {
  anthropic: {
    key: "ANTHROPIC_API_KEY",
    baseUrl: "https://api.anthropic.com",
    model: "claude-haiku-5-5",
    effort: "low",
    create: anthropicProvider,
  },
  gemini: {
    key: "GEMINI_API_KEY",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.1-flash-lite",
    create: (config) => openAiProvider("gemini", config, "max_tokens"),
  },
  xai: {
    key: "XAI_API_KEY",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-4.7",
    effort: "low",
    create: (config) => openAiProvider("xai", config, "max_completion_tokens"),
  },
} satisfies Record<string, Preset>

export type ProviderName = keyof typeof PRESETS
export const PROVIDER_NAMES = Object.keys(PRESETS) as ProviderName[]

const ALIASES: Record<string, ProviderName> = { claude: "anthropic", google: "gemini", grok: "xai" }

const text = (value: string | undefined) => value?.trim() || undefined

const warned = new Set<string>()
function warnOnce(message: string) {
  if (warned.has(message)) return
  warned.add(message)
  console.warn(`ask: ${message}`)
}

/** The provider Ask should talk to, or null when none is set up (which switches Ask off).

    ASK_PROVIDER picks one by name. Without it, the first key found wins, in the order
    Anthropic, Gemini, Grok, so a deployment with a single key needs no other setting. */
export function resolveProvider(env: Env = process.env): AskProvider | null {
  const asked = text(env.ASK_PROVIDER)?.toLowerCase()
  const name = asked ? (ALIASES[asked] ?? asked) : PROVIDER_NAMES.find((n) => text(env[PRESETS[n].key]))
  if (!name) return null

  if (!Object.hasOwn(PRESETS, name)) {
    warnOnce(`ASK_PROVIDER "${asked}" is not one of ${PROVIDER_NAMES.join(", ")}, so Ask is off.`)
    return null
  }
  const preset: Preset = PRESETS[name as ProviderName]
  const apiKey = text(env[preset.key])
  if (!apiKey) {
    warnOnce(`ASK_PROVIDER=${name} needs ${preset.key}, so Ask is off.`)
    return null
  }

  const effort = env.ASK_EFFORT === undefined ? preset.effort : text(env.ASK_EFFORT)
  const requested = Number(text(env.ASK_MAX_TOKENS))
  const baseUrl = text(env.ASK_BASE_URL) ?? (name === "anthropic" ? text(env.ANTHROPIC_BASE_URL) : undefined) ?? preset.baseUrl

  return preset.create({
    apiKey,
    model: text(env.ASK_MODEL) ?? preset.model,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    // 0 sends no limit, for an API that mishandles the field; an explicit 0 is the only way to get that
    maxTokens: text(env.ASK_MAX_TOKENS) === "0" ? undefined : Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 2048,
    effort: effort && effort.toLowerCase() !== "none" ? effort : undefined,
  })
}
