import { NextResponse } from "next/server"

import { site } from "@/lib/site"

const toEmail = process.env.CONTACT_EMAIL || site.email
const resendApiKey = process.env.RESEND_API_KEY

export async function POST(request: Request) {
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Email delivery is not configured. Add RESEND_API_KEY and CONTACT_EMAIL." },
      { status: 500 },
    )
  }

  try {
    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    const { Resend } = await import("resend")
    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: toEmail,
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br />")}</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Contact email error:", error)
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 })
  }
}
