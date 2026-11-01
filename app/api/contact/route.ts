import { NextResponse } from "next/server"

import { site } from "@/lib/site"

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_EMAIL || site.email
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>"

  if (!resendApiKey) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 500 })
  }

  try {
    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    const { Resend } = await import("resend")
    const resend = new Resend(resendApiKey)

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `Portfolio message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        </div>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err) {
    console.error("Contact email error:", err)
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 })
  }
}