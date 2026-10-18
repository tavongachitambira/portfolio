import type { Metadata } from "next"

import { StatusPage } from "@/components/layout/StatusPage"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      message="That page doesn't exist or has moved. Let's get you back."
    />
  )
}