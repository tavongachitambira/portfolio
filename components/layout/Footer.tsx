"use client"

import { useState, type FormEvent } from "react"
import { Send } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTurnstile } from "@/hooks/useTurnstile"
import { contactTurnstileAction, validateContact, type ContactErrors } from "@/lib/contact"
import { motionEase } from "@/lib/motion"
import { site } from "@/lib/site"

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function Footer() {
  const [notice, setNotice] = useState("")
  const [errors, setErrors] = useState<ContactErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { attach: attachTurnstile, prepare: prepareTurnstile, getToken, reset: resetTurnstile, enabled: turnstileOn } =
    useTurnstile({ siteKey: turnstileSiteKey, action: contactTurnstileAction })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Capture now: React sets event.currentTarget to null once the handler yields at its first await.
    const form = event.currentTarget
    const data = new FormData(form)
    // same rules as the API route, so what passes here passes there
    const checked = validateContact({
      name: data.get("name"),
      email: data.get("email"),
      message: data.get("message"),
    })
    if (!checked.ok) {
      setErrors(checked.errors)
      setNotice("")
      return
    }
    const { name, email, message } = checked.value
    const website = String(data.get("website") ?? "") // honeypot: people never see it

    setErrors({})
    setIsSubmitting(true)

    try {
      let turnstileToken = ""
      if (turnstileOn) {
        setNotice("Verifying…")
        turnstileToken = await getToken()
      }

      setNotice("Sending…")
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website, turnstileToken }),
      })

      if (response.ok) {
        form.reset()
        setNotice("Message sent. Thank you!")
        return
      }

      // Problems the visitor can act on stay on the page. Anything else falls through to email.
      const result = await response.json().catch(() => null)
      if (response.status === 400 && result?.fields) {
        setErrors(result.fields)
        setNotice("")
        return
      }
      if (response.status === 429) {
        setNotice("Too many messages. Please try again in a few minutes.")
        return
      }
      if (response.status === 403) {
        setNotice("Verification failed. Reload the page and try again.")
        return
      }
      throw new Error(`Contact API responded ${response.status}`)
    } catch (error) {
      console.error("Contact form error:", error)
      const subject = encodeURIComponent(`Portfolio message from ${name}`)
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
      setNotice("Couldn't send. Opening your email app instead.")
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`
    } finally {
      setIsSubmitting(false)
      if (turnstileOn) resetTurnstile() // tokens are single-use
    }
  }

  return (
    <motion.footer
      id="connect"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: motionEase }}
      className="scroll-mt-[68px] pt-4 lg:scroll-mt-5"
    >
      <section aria-labelledby="connect-title" className="clay clay-md p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-primary uppercase">Open to conversation</p>
            <h2 id="connect-title" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Let&apos;s connect.</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Have a product, an idea, or a problem worth solving? Leave a note and I&apos;ll get back to you.
            </p>
          </div>

          <form
            noValidate
            onSubmit={submit}
            onFocusCapture={prepareTurnstile}
            className="grid gap-4"
            aria-describedby="connect-note"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} onChange={() => setErrors((prev) => ({ ...prev, name: undefined }))} />
                {errors.name && <p id="contact-name-error" className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} onChange={() => setErrors((prev) => ({ ...prev, email: undefined }))} />
                {errors.email && <p id="contact-email-error" className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-message">What&apos;s on your mind?</Label>
              <Textarea id="contact-message" name="message" rows={4} maxLength={1000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} onChange={() => setErrors((prev) => ({ ...prev, message: undefined }))} />
              {errors.message && <p id="contact-message-error" className="text-xs text-destructive">{errors.message}</p>}
            </div>
            {/* honeypot: off-screen and out of the tab order, so only bots fill it in */}
            <div aria-hidden className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden opacity-0">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            {/* Turnstile mounts here; it stays invisible unless Cloudflare needs a click */}
            <div ref={attachTurnstile} />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send message"}
                <Send aria-hidden="true" />
              </Button>
              {/* status only: stays empty (but mounted, so screen readers hear updates) until there is something to say */}
              <p id="connect-note" className="text-xs text-muted-foreground" aria-live="polite">
                {notice}
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Was: className="flex flex-col gap-3 pt-8 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between"
          On desktop this row is as tall as the social chips in the left aside (--ctl) with its text centred
          in it, so at the end of the scroll it sits on the same line as that row (the scroller's end padding
          is --row-bottom, measured from it). mt-8 replaces pt-8 so the minimum height is the row itself. */}
      <div className="mt-8 flex flex-col gap-3 text-xs text-muted-foreground lg:min-h-(--ctl) lg:flex-row lg:items-center lg:justify-between">
        <p className="order-2 text-[11px] tracking-wide text-muted-foreground/70 lg:order-1">© 2026
        <span className="font-semibold pl-1">Tavonga Chitambira</span>
        . All rights reserved.</p>
        <p className="order-1 lg:order-2">
          <a href="https://github.com/cypherx72/portfolio" target="_blank" rel="noopener noreferrer" className="transition-colors font-medium tracking-wide text-[11px] hover:text-primary">View Source</a>
        </p>
      </div>
    </motion.footer>
  )
}