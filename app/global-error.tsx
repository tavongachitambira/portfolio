"use client"

import { StatusPage } from "@/components/layout/StatusPage"
import "./globals.css"

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body>
        <StatusPage
          hardNav
          code="500"
          title="Something went wrong"
          message="An unexpected error happened on my end. Head back home and try again."
          digest={error.digest}
        />
      </body>
    </html>
  )
}