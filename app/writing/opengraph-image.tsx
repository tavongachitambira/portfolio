import { renderOg } from "@/lib/og"

export const alt = "Writing by Tavonga Chitambira"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return renderOg({ eyebrow: "Writing", title: "Articles, papers & talks", subtitle: "Notes on building and scaling software." })
}
