import { renderOg } from "@/lib/og"

export const alt = "Skills and activity of Tavonga Chitambira"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return renderOg({ eyebrow: "Skills", title: "Skills & activity", subtitle: "What I work with and how my GitHub and LeetCode activity looks." })
}
