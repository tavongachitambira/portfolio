/* Server-side Cloudflare Turnstile check. Off unless TURNSTILE_SECRET_KEY is set, so the site
   works with no setup; the widget side lives in hooks/useTurnstile.ts. */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const MAX_TOKEN_LENGTH = 2048 // Cloudflare's documented limit

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" }

export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY)

export async function verifyTurnstile(
  token: unknown,
  ip: string,
  expectedAction?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true }
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "missing" }

  const form = new URLSearchParams({ secret, response: token })
  if (ip && ip !== "unknown") form.set("remoteip", ip)

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return { ok: false, reason: "unavailable" }

    const data = (await res.json()) as { success?: boolean; action?: string }
    if (!data.success) return { ok: false, reason: "invalid" }
    // a token minted for another widget or page must not unlock this one
    if (expectedAction && data.action && data.action !== expectedAction) return { ok: false, reason: "invalid" }
    return { ok: true }
  } catch (error) {
    console.error("turnstile: verification request failed.", error instanceof Error ? error.message : error)
    return { ok: false, reason: "unavailable" }
  }
}
