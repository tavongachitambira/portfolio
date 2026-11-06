import { contactTurnstileAction, validateContact } from "@/lib/contact"
import { buildContactEmail } from "@/lib/contact-email"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { site } from "@/lib/site"
import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile"

const MAX_BODY_BYTES = 8 * 1024
const PER_IP = { limit: 5, windowSec: 10 * 60 } // 5 messages per 10 minutes per client
const ALL_CLIENTS = { limit: 100, windowSec: 60 * 60 } // and a ceiling for the whole site

const reply = (body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } })

/* The order matters: cheap checks first, anything that costs money or quota last.
   1 config -> 2 rate limit -> 3 body size/shape -> 4 honeypot -> 5 validation -> 6 Turnstile -> 7 send.
   Status codes are what the form keys off: 429/403 show a message, 5xx opens the visitor's mail app. */
export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return reply({ error: "Email delivery is not configured." }, 503)

  const ip = clientIp(request.headers)

  const mine = await rateLimit({ scope: "contact", id: ip, ...PER_IP })
  if (!mine.ok) {
    return reply({ error: "Too many messages. Please try again in a few minutes." }, 429, {
      "Retry-After": String(mine.retryAfter),
    })
  }
  const everyone = await rateLimit({ scope: "contact-all", id: "all", ...ALL_CLIENTS })
  if (!everyone.ok) {
    return reply({ error: "Messages are paused for a moment." }, 503, { "Retry-After": String(everyone.retryAfter) })
  }

  const declared = Number(request.headers.get("content-length") ?? 0)
  if (declared > MAX_BODY_BYTES) return reply({ error: "Message is too large." }, 413)

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return reply({ error: "Message is too large." }, 413)

  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object")
    body = parsed
  } catch {
    return reply({ error: "Invalid request." }, 400)
  }

  // Hidden field only a bot fills in. Say "sent" so it learns nothing, and send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") return reply({ ok: true })

  const parsed = validateContact(body)
  if (!parsed.ok) return reply({ error: "Please check the form and try again.", fields: parsed.errors }, 400)

  if (turnstileEnabled()) {
    const check = await verifyTurnstile(body.turnstileToken, ip, contactTurnstileAction)
    if (!check.ok) {
      return check.reason === "unavailable"
        ? reply({ error: "Verification is unavailable right now." }, 503)
        : reply({ error: "Verification failed. Please reload the page and try again." }, 403)
    }
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(resendApiKey)
    const { subject, html, text } = buildContactEmail(parsed.value)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL || site.email,
      replyTo: parsed.value.email,
      subject,
      html,
      text,
    })

    if (error) {
      // the provider's wording stays in the logs; visitors get a generic line
      console.error("contact: Resend rejected the message.", error.name, error.message)
      return reply({ error: "Couldn't send your message right now." }, 502)
    }
    return reply({ ok: true })
  } catch (err) {
    console.error("contact: sending failed.", err instanceof Error ? err.message : err)
    return reply({ error: "Couldn't send your message right now." }, 500)
  }
}
