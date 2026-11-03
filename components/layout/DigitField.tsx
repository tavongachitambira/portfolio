"use client"

import { useEffect, useRef } from "react"
import type { MotionValue } from "framer-motion"

import { cn } from "@/lib/utils"

/* A live field of encoding digits for the loader.

   Columns of 0s and 1s stream down the screen, each with a bright head and a fading tail,
   over a faint static grid of the same digits. The bits are not random: every column reads
   the ASCII encoding of `text` from its own offset, so the field is literally the name in
   binary. A few digits flip every frame so it is never quite the same twice.

   Two stacked canvases: the static grid is painted once (and patched cell by cell as digits
   flip), the streams are redrawn every frame on top. ~30fps, DPR capped at 2, paused while
   the tab is hidden, one still frame under reduced motion. Colours come from the theme
   tokens (--foreground / --primary), so light and dark both work. `progress` (0..100)
   wakes more columns as the load advances. */

type Column = {
  head: number // row of the bright head; fractional, and above the screen while waiting
  speed: number // rows per second
  len: number // tail length in rows
  rank: number // 0..1: the column wakes up once load progress passes this
  bits: Uint8Array // one bit per row
}

const AMBIENT_ALPHA = 0.07
const TAIL_ALPHA = 0.55
const HEAD_ALPHA = 0.95
const FRAME_MS = 1000 / 30
const MIN_AWAKE = 0.3 // share of columns already streaming at 0%
const FLIPS_PER_FRAME = 4

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/** "Hi" -> "0100100001101001" */
const encode = (text: string) =>
  Array.from(text, (ch) => (ch.charCodeAt(0) & 0xff).toString(2).padStart(8, "0")).join("")

export function DigitField({
  text,
  progress,
  fontSize = 14,
  reducedMotion = false,
  className,
}: {
  text: string
  progress?: MotionValue<number>
  fontSize?: number
  reducedMotion?: boolean
  className?: string
}) {
  const ambientRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ambient = ambientRef.current
    const live = liveRef.current
    const actx = ambient?.getContext("2d")
    const ctx = live?.getContext("2d")
    if (!ambient || !live || !actx || !ctx) return

    const stream = encode(text)

    let columns: Column[] = []
    let rows = 0
    let cellW = 0
    let cellH = 0
    let width = 0
    let height = 0
    let font = ""
    let headColor = ""
    let tailColor = ""

    const readTheme = () => {
      const own = getComputedStyle(live)
      const root = getComputedStyle(document.documentElement)
      const token = (name: string) => {
        const value = root.getPropertyValue(name).trim()
        return value && CSS.supports("color", value) ? value : own.color
      }
      headColor = token("--foreground")
      tailColor = token("--primary")
      font = `${fontSize}px ${own.fontFamily}`
    }

    const tailLength = () => 10 + Math.floor(Math.random() * 18)
    const streamSpeed = () => 5 + Math.random() * 10

    const spawn = (): Column => {
      const len = tailLength()
      const offset = Math.floor(Math.random() * stream.length)
      const bits = new Uint8Array(rows)
      for (let r = 0; r < rows; r++) bits[r] = stream.charCodeAt((offset + r) % stream.length) === 49 ? 1 : 0
      // first paint: heads already scattered over the screen, so it never opens empty
      return { head: -len + Math.random() * (rows + len), speed: streamSpeed(), len, rank: Math.random(), bits }
    }

    const respawn = (c: Column) => {
      c.len = tailLength()
      c.speed = streamSpeed()
      c.head = -c.len - Math.random() * rows * 0.6 // wait off-screen for a random while
    }

    const paintAmbientCell = (i: number, r: number) => {
      actx.clearRect(i * cellW, r * cellH, cellW, cellH)
      actx.fillText(columns[i].bits[r] ? "1" : "0", i * cellW, r * cellH)
    }

    const layout = () => {
      const w = live.clientWidth
      const h = live.clientHeight
      if (!w || !h) return
      width = w
      height = h

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const canvas of [ambient, live]) {
        canvas.width = Math.round(width * dpr) // resizing also resets the context state
        canvas.height = Math.round(height * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      actx.setTransform(dpr, 0, 0, dpr, 0, 0)

      readTheme()
      cellW = Math.round(fontSize * 1.7)
      cellH = Math.round(fontSize * 1.6)
      rows = Math.ceil(height / cellH) + 1
      columns = Array.from({ length: Math.ceil(width / cellW) }, spawn)

      actx.font = font
      actx.textBaseline = "top"
      actx.fillStyle = tailColor
      actx.globalAlpha = AMBIENT_ALPHA
      for (let i = 0; i < columns.length; i++) {
        for (let r = 0; r < rows; r++) actx.fillText(columns[i].bits[r] ? "1" : "0", i * cellW, r * cellH)
      }
    }

    const awake = () => MIN_AWAKE + (1 - MIN_AWAKE) * clamp01((progress?.get() ?? 100) / 100)

    const step = (dt: number) => {
      const limit = awake()
      for (const c of columns) {
        if (c.rank > limit) continue
        c.head += c.speed * dt
        if (c.head - c.len > rows) respawn(c)
      }
      for (let n = 0; n < FLIPS_PER_FRAME; n++) {
        const i = Math.floor(Math.random() * columns.length)
        const r = Math.floor(Math.random() * rows)
        if (!columns[i]) continue
        columns[i].bits[r] ^= 1
        paintAmbientCell(i, r)
      }
    }

    const draw = () => {
      if (!width || !height) return
      const limit = awake()

      ctx.clearRect(0, 0, width, height)
      ctx.font = font
      ctx.textBaseline = "top"

      ctx.fillStyle = tailColor
      for (let i = 0; i < columns.length; i++) {
        const c = columns[i]
        if (c.rank > limit) continue
        const head = Math.floor(c.head)
        for (let k = 1; k < c.len; k++) {
          const r = head - k
          if (r < 0 || r >= rows) continue
          ctx.globalAlpha = (1 - k / c.len) ** 2 * TAIL_ALPHA
          ctx.fillText(c.bits[r] ? "1" : "0", i * cellW, r * cellH)
        }
      }

      ctx.fillStyle = headColor
      ctx.globalAlpha = HEAD_ALPHA
      for (let i = 0; i < columns.length; i++) {
        const c = columns[i]
        const head = Math.floor(c.head)
        if (c.rank > limit || head < 0 || head >= rows) continue
        ctx.fillText(c.bits[head] ? "1" : "0", i * cellW, head * cellH)
      }
      ctx.globalAlpha = 1
    }

    let raf = 0
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < FRAME_MS - 2) return // small tolerance: on a 60Hz screen two vsyncs are 33.3ms, not always >= FRAME_MS
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      step(dt)
      draw()
    }
    const start = () => {
      if (raf || reducedMotion) return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    layout()
    draw()
    start()

    const observer = new ResizeObserver(() => {
      layout()
      draw()
    })
    observer.observe(live)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [text, progress, fontSize, reducedMotion])

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 font-mono", className)}>
      <canvas ref={ambientRef} className="absolute inset-0 size-full" />
      <canvas ref={liveRef} className="absolute inset-0 size-full" />
    </div>
  )
}
