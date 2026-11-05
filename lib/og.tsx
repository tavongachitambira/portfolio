import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

/* One look for every share image: the same dark studio, peach accent and binary-digit texture as
   the site's loader. Fully deterministic (no randomness, no clock), so each image is rendered once
   at build time and served as a static file. */

export const ogSize = { width: 1200, height: 630 }

const fonts = () => {
  const dir = join(process.cwd(), "assets/fonts")
  return Promise.all([
    readFile(join(dir, "plus-jakarta-sans-latin-800-normal.woff")),
    readFile(join(dir, "plus-jakarta-sans-latin-500-normal.woff")),
  ])
}

/** The site owner's name as ASCII bits, wrapped into columns for the background texture. */
function digitColumns(columns: number, rows: number) {
  const bits = [...site.name].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join("")
  return Array.from({ length: columns }, (_, c) =>
    Array.from({ length: rows }, (_, r) => bits[(c * 7 + r * 3) % bits.length]).join("\n"),
  )
}

export interface OgOptions {
  eyebrow: string
  title: string
  subtitle?: string
  chips?: string[]
}

export async function renderOg({ eyebrow, title, subtitle, chips = [] }: OgOptions) {
  const [bold, medium] = await fonts()
  const size = title.length > 22 ? 84 : 104
  const columns = digitColumns(16, 14)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0b1615",
          color: "#f4efe6",
          fontFamily: "Jakarta",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 620, display: "flex", justifyContent: "space-around", opacity: 0.16 }}>
          {columns.map((col, i) => (
            <div key={i} style={{ display: "flex", whiteSpace: "pre", fontSize: 26, lineHeight: 1.5, color: i % 5 === 0 ? "#e4a66c" : "#7fb7ad", paddingTop: i % 2 ? 40 : 0 }}>
              {col}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, #0b1615 38%, rgba(11,22,21,0) 100%)" }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, fontWeight: 500, letterSpacing: 4, color: "#e4a66c", textTransform: "uppercase" }}>
            {eyebrow}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: size, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, maxWidth: 900 }}>{title}</div>
            {subtitle && (
              <div style={{ display: "flex", marginTop: 26, fontSize: 34, fontWeight: 500, lineHeight: 1.3, color: "#a9c2bd", maxWidth: 820 }}>{subtitle}</div>
            )}
            {chips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", marginTop: 32, gap: 12 }}>
                {chips.slice(0, 6).map((chip) => (
                  <div key={chip} style={{ display: "flex", padding: "8px 18px", borderRadius: 999, border: "2px solid #2a4743", fontSize: 24, fontWeight: 500, color: "#cfe3de" }}>
                    {chip}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", fontSize: 26, fontWeight: 500, color: "#6f8f89" }}>{site.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Jakarta", data: bold, weight: 800, style: "normal" },
        { name: "Jakarta", data: medium, weight: 500, style: "normal" },
      ],
    },
  )
}
