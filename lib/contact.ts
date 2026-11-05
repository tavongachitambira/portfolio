/* Contact-form validation, shared by the form (instant feedback) and the API route (the real
   check), so both always agree on what a valid message is. Pure: no server imports. */

export const contactLimits = { nameMin: 2, nameMax: 80, emailMax: 254, messageMax: 1000 } as const

/** The Turnstile "action" the form's widget is rendered with; the API route checks it comes back. */
export const contactTurnstileAction = "contact"

export type ContactField = "name" | "email" | "message"
export type ContactInput = Record<ContactField, string>
export type ContactErrors = Partial<Record<ContactField, string>>
export type ContactResult = { ok: true; value: ContactInput } | { ok: false; errors: ContactErrors }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// every control character except tab and newline (those are handled separately)
const controlChars = /[\u0000-\u0008\u000b-\u001f\u007f]/g

/** Name and email are single-line: any whitespace run, newlines included, becomes one space. */
const oneLine = (v: unknown) =>
  typeof v === "string" ? v.replace(controlChars, " ").replace(/\s+/g, " ").trim() : ""

/** Browsers submit textareas with CRLF; normalise so the length matches what the user sees. */
const multiLine = (v: unknown) =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(controlChars, "").trim() : ""

export function validateContact(raw: unknown): ContactResult {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const name = oneLine(src.name)
  const email = oneLine(src.email)
  const message = multiLine(src.message)
  const errors: ContactErrors = {}

  if (name.length < contactLimits.nameMin) errors.name = "Please enter your name."
  else if (name.length > contactLimits.nameMax) errors.name = `Keep your name under ${contactLimits.nameMax} characters.`

  if (!emailPattern.test(email) || email.length > contactLimits.emailMax) errors.email = "Enter a valid email address."

  if (!message) errors.message = "Please add a message."
  else if (message.length > contactLimits.messageMax)
    errors.message = `Keep your message under ${contactLimits.messageMax} characters.`

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { name, email, message } }
}
