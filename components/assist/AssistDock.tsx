"use client"

import { usePathname } from "next/navigation"

import { AssistTriggers } from "@/components/assist/AssistTriggers"

/* The corner dock for every page except the landing page. There, Search and Ask live in the top bar
   (desktop) and the section pill (phone), so the dock would be a second copy. */
export function AssistDock() {
  const pathname = usePathname()
  if (pathname === "/") return null
  return <AssistTriggers variant="dock" />
}
