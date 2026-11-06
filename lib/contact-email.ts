import type { ContactInput } from "@/lib/contact"

export const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

/** The notification email: HTML plus a plain-text twin (better deliverability, readable anywhere). */
export function buildContactEmail({ name, email, message }: ContactInput) {
  return {
    subject: `Portfolio message from ${name}`.slice(0, 120),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      </div>
    `,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  }
}
