"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion"
import { useReducedMotion } from "framer-motion"

const TEXT = "loading your experience."
const MIN_MS = 1600 // minimum on-screen time so the fill is always readable
const FILL_MS = 450 // final fill to 100% once ready
const EXIT_S = 0.75

type Phase = "loading" | "exit" | "done"

// This module stays alive during Next.js client-side route changes, so returning
// to Home does not replay the first-visit preloader.
let hasCompletedInitialLoad = false

/** First-visit preloader: dark surface, text that fills with colour as the page loads, shutter-lift exit. */
export function InitialLoader() {
  const [phase, setPhase] = useState<Phase>(() => (hasCompletedInitialLoad ? "done" : "loading"))
  const [pct, setPct] = useState(0)
  const reduceMotion = useReducedMotion()

  const target = useMotionValue(0) // 0..100
  const smooth = useSpring(target, { stiffness: 90, damping: 24, mass: 0.6 })
  const clip = useTransform(smooth, (v) => `inset(${100 - v}% 0 0 0)`) // fills bottom -> top
  const ring = useTransform(smooth, (v) => v / 100) // ring progress 0..1

  useEffect(() => smooth.on("change", (v) => setPct(Math.round(v))), [smooth])

  useEffect(() => {
    if (hasCompletedInitialLoad) return

    let minElapsed = false
    let ready = false
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))

    // creep towards 90% while resources load
    const creep = animate(target, 90, { duration: MIN_MS / 1000 + 1.2, ease: [0.1, 0.6, 0.3, 1] })

    const finish = () => {
      if (!minElapsed || !ready) return
      creep.stop()
      animate(target, 100, { duration: FILL_MS / 1000, ease: "easeOut" })
      hasCompletedInitialLoad = true
      later(() => setPhase(reduceMotion ? "done" : "exit"), FILL_MS + 250)
      later(() => setPhase("done"), FILL_MS + 250 + (reduceMotion ? 0 : EXIT_S * 1000 + 50))
    }

    const onLoad = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          ready = true
          finish()
        }),
      )

    later(() => {
      minElapsed = true
      finish()
    }, MIN_MS)

    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })

    return () => {
      creep.stop()
      timers.forEach((t) => clearTimeout(t))
      window.removeEventListener("load", onLoad)
    }
  }, [target, reduceMotion])

  useEffect(() => {
    if (phase === "done") return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [phase])

  if (phase === "done") return null

  const textClass = "text-center text-4xl font-bold tracking-tight sm:text-6xl"

  return (
    <motion.div
      role="status"
      aria-busy="true"
      aria-label="Loading Tavonga Chitambira's portfolio"
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background px-6"
      initial={{ clipPath: "inset(0% 0 0 0)" }}
      animate={{ clipPath: phase === "exit" ? "inset(0 0 100% 0)" : "inset(0% 0 0 0)" }} // lifts up
      transition={{ duration: EXIT_S, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="w-full max-w-3xl">
        {/* mark: ring tracks progress, "T" draws itself */}
        <svg viewBox="0 0 80 80" className="mx-auto mb-10 size-25" fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1.5" className="text-foreground/10" />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-primary"
            style={{ pathLength: ring, rotate: -90, transformOrigin: "40px 40px" }}
          />
          <motion.path
            d="M26 29 H54 M40 29 V54"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-primary"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, delay: 0.2, ease: [0.2, 0, 0, 1] }}
          />
        </svg>

        <div className="relative">
          {/* dim base text */}
          <p className={`${textClass} text-foreground/15`}>{TEXT}</p>
          {/* filled text, revealed bottom -> top */}
          <motion.p
            aria-hidden="true"
            className={`${textClass} absolute inset-0 text-primary`}
            style={{ clipPath: clip }}
          >
            {TEXT}
          </motion.p>
        </div>

        <div className="mt-6 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          <span>Tavonga / Portfolio</span>
          <span className="tabular-nums">{String(pct).padStart(3, "0")}%</span>
        </div>
      </div>
    </motion.div>
  )
}
