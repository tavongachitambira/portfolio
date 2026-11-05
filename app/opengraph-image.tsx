import { renderOg } from "@/lib/og"

export const alt = "Tavonga Chitambira, full stack engineer and aspiring ML engineer"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return renderOg({ eyebrow: "Portfolio", title: "Tavonga Chitambira", subtitle: "Full Stack Engineer · ML Engineer" })
}
