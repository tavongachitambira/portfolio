"use client"

import { useState, type FormEvent } from "react"
import { Send } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motionEase } from "@/lib/motion"
import { site } from "@/lib/site"

type ContactField = "name" | "email" | "message"
type ContactErrors = Partial<Record<ContactField, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Footer() {
  const [notice, setNotice] = useState("")
  const [errors, setErrors] = useState<ContactErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()
    const message = String(data.get("message") ?? "").trim()
    const nextErrors: ContactErrors = {}

    if (name.length < 2) nextErrors.name = "Please enter your name."
    if (!emailPattern.test(email)) nextErrors.email = "Enter a valid email address."
    if (!message) nextErrors.message = "Please add a message."

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setNotice("")
      return
    }

    setErrors({})
    setIsSubmitting(true)
    setNotice("Sending your message...")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })

      if (!response.ok) {
        throw new Error("There was a problem sending the message.")
      }

      event.currentTarget.reset()
      setNotice("Your message has been sent successfully.")
    } catch (error) {
      const subject = encodeURIComponent(`Portfolio message from ${name}`)
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
      setNotice("The email service is unavailable right now. Your email app has been opened instead.")
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.footer
      id="connect"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: motionEase }}
      className="pt-4"
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

          <form noValidate onSubmit={submit} className="grid gap-4" aria-describedby="connect-note">
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
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send message"}
                <Send aria-hidden="true" />
              </Button>
              <p id="connect-note" className="text-xs text-muted-foreground" aria-live="polite">
                {notice || `Sends via a secure email provider when configured, otherwise opens your email app to ${site.email}.`}
              </p>
            </div>
          </form>
        </div>
      </section>

      <div className="flex flex-col gap-3 pt-8 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
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
