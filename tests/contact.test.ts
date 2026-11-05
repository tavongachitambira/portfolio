import { describe, expect, it } from "vitest"

import { contactLimits, validateContact } from "@/lib/contact"
import { buildContactEmail, escapeHtml } from "@/lib/contact-email"

const good = { name: "Ada Lovelace", email: "ada@example.com", message: "Hello there" }

describe("validateContact", () => {
  it("accepts a valid message and trims it", () => {
    const r = validateContact({ name: "  Ada  ", email: " ada@example.com ", message: "  Hi  " })
    expect(r).toEqual({ ok: true, value: { name: "Ada", email: "ada@example.com", message: "Hi" } })
  })

  it("reports each bad field with the form's wording", () => {
    const r = validateContact({ name: "A", email: "nope", message: "   " })
    expect(r).toEqual({
      ok: false,
      errors: {
        name: "Please enter your name.",
        email: "Enter a valid email address.",
        message: "Please add a message.",
      },
    })
  })

  it("treats missing or non-string fields as empty instead of throwing", () => {
    expect(validateContact(undefined).ok).toBe(false)
    expect(validateContact(null).ok).toBe(false)
    expect(validateContact("text").ok).toBe(false)
    const r = validateContact({ name: 42, email: ["a@b.co"], message: { x: 1 } })
    expect(r.ok).toBe(false)
  })

  it("enforces the length limits", () => {
    const longName = validateContact({ ...good, name: "x".repeat(contactLimits.nameMax + 1) })
    expect(longName.ok === false && longName.errors.name).toMatch(/under 80/)

    const longMessage = validateContact({ ...good, message: "x".repeat(contactLimits.messageMax + 1) })
    expect(longMessage.ok === false && longMessage.errors.message).toMatch(/under 1000/)

    expect(validateContact({ ...good, message: "x".repeat(contactLimits.messageMax) }).ok).toBe(true)

    const longEmail = `${"a".repeat(250)}@b.co`
    expect(validateContact({ ...good, email: longEmail }).ok).toBe(false)
  })

  it("counts CRLF newlines as one character, like the textarea does", () => {
    // 600 lines of "ab\r\n" is 1800 raw characters but 1800 - 600 = 1200 once normalised; use a size
    // that only fits after normalising: 500 x "a\r\n" = 1500 raw, 1000 normalised
    const message = "a\r\n".repeat(499) + "a"
    const r = validateContact({ ...good, message })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.message).not.toContain("\r")
  })

  it("collapses newlines in single-line fields so they can't smuggle headers", () => {
    const r = validateContact({ ...good, name: "Ada\r\nBcc: victim@example.com" })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.name).toBe("Ada Bcc: victim@example.com")
  })

  it("strips control characters but keeps newlines and tabs in the message", () => {
    const r = validateContact({ ...good, message: "line1\n\tline2\u0000\u0007" })
    expect(r.ok && r.value.message).toBe("line1\n\tline2")
  })

  it("rejects emails with spaces or a missing domain dot", () => {
    for (const email of ["a b@c.co", "a@b", "@b.co", "a@@b.co", ""]) {
      expect(validateContact({ ...good, email }).ok).toBe(false)
    }
  })
})

describe("buildContactEmail", () => {
  it("escapes HTML in the html body but leaves the text version raw", () => {
    const mail = buildContactEmail({
      name: `<b>Eve</b>`,
      email: "eve@example.com",
      message: `<script>alert("x")</script>\nsecond line`,
    })
    expect(mail.html).not.toContain("<script>")
    expect(mail.html).toContain("&lt;script&gt;")
    expect(mail.html).toContain("<br />")
    expect(mail.text).toContain("<script>")
    expect(mail.subject).toBe("Portfolio message from <b>Eve</b>")
  })

  it("keeps the subject to one sensible line", () => {
    const mail = buildContactEmail({ name: "x".repeat(80), email: "a@b.co", message: "m" })
    expect(mail.subject.length).toBeLessThanOrEqual(120)
    expect(mail.subject).not.toMatch(/[\r\n]/)
  })
})

describe("escapeHtml", () => {
  it("escapes the five characters that matter", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;")
  })
})
