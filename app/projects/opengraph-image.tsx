import { renderOg } from "@/lib/og"

export const alt = "Projects by Tavonga Chitambira"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return renderOg({ eyebrow: "Projects", title: "Everything I've built", subtitle: "Real-time systems, data-driven platforms and experiments." })
}
