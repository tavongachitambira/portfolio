"use client"

import { useEffect, useState } from "react"
import type { MotionValue } from "framer-motion"

import { cn } from "@/lib/utils"
import LetterGlitch from "../LetterGlitch"

// Same props as before so existing call sites keep working.
// text / progress / fontSize / reducedMotion are no longer needed:
// LetterGlitch handles reduced motion itself.
type Props = {
  text?: string
  progress?: MotionValue<number>
  fontSize?: number
  reducedMotion?: boolean
  className?: string
}

// The canvas can't resolve var(--x), so read the real color values from the theme.
const readToken = (name: string, fallback: string) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) return fallback
  if (CSS.supports("color", raw)) return raw
  if (CSS.supports("color", `hsl(${raw})`)) return `hsl(${raw})` // "0 0% 100%" style tokens
  return fallback
}

const readColors = () => ({
  foreground: readToken("--foreground", "#ffffff"),
  primary: readToken("--primary", "#61dca3"),
})

export function GlyphField({ className }: Props) {
  const [colors, setColors] = useState({ foreground: "#ffffff", primary: "#61dca3" })

  useEffect(() => {
    const update = () => setColors(readColors())
    const frame = window.requestAnimationFrame(update)
    // follow light/dark theme switches
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    })
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <LetterGlitch
        baseColor={colors.primary}
        glitchColors={[colors.foreground, colors.primary]}
      />
    </div>
  )
}