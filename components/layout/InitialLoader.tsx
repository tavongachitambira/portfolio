"use client"

import { useEffect, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"

import LetterGlitch from "@/components/LetterGlitch"
import { roles } from "@/lib/data/profile"

const NAME = "Tavonga Chitambira"
const MIN_MS = 1800 // minimum on-screen time so the sequence is always readable
const FILL_MS = 450 // final fill to 100% once ready
const EXIT_S = 0.9
const EASE = [0.76, 0, 0.24, 1] as const
const EASE_OUT = [0.2, 0, 0, 1] as const

type Phase = "loading" | "exit" | "done"

// Keep the loader out of client-side route changes, but replay it on full reloads.
let hasCompletedInitialLoad = false

/* First-visit preloader: a field of glitching letters fills the screen with the middle
   cleared for content. The name, the cycling role, a status line that follows the real
   progress, a counter and a progress line sit on top. On exit the screen lifts away. */
export function InitialLoader() {
  const [phase, setPhase] = useState<Phase>(() => (hasCompletedInitialLoad ? "done" : "loading"))
  const [pct, setPct] = useState(0)
  const [roleIndex, setRoleIndex] = useState(0)
  const [dark, setDark] = useState(false)
  const reduceMotion = useReducedMotion()

  const target = useMotionValue(0) // 0..100
  const smooth = useSpring(target, { stiffness: 90, damping: 24, mass: 0.6 })
  const fill = useTransform(smooth, (v) => Math.min(Math.max(v / 100, 0), 1))

  useEffect(() => smooth.on("change", (v) => setPct(Math.round(v))), [smooth])

  // match the glitch colours to the site theme
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  // cycle the role line while loading
  useEffect(() => {
    if (phase !== "loading") return
    const id = window.setInterval(() => setRoleIndex((i) => (i + 1) % roles.length), 1100)
    return () => window.clearInterval(id)
  }, [phase])

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
      later(() => setPhase("done"), FILL_MS + 250 + (reduceMotion ? 0 : EXIT_S * 1000 + 150))
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

  const exiting = phase === "exit"

  return (
    <motion.div
      data-initial-loader
      role="status"
      aria-busy="true"
      aria-label="Loading Tavonga Chitambira's portfolio"
      className="bg-background fixed inset-0 z-100 overflow-hidden"
      animate={{ y: exiting ? "-100%" : "0%" }}
      transition={{ duration: reduceMotion ? 0 : EXIT_S, ease: EASE }}
    >
      {/* glitching letter field, middle cleared so the content stays readable */}
      <div aria-hidden className="absolute inset-0">
        <LetterGlitch
          lightMode={!dark}
          glitchAmount={0.6}
          speed={1}
          flow={0.5}
          density={0.9}
          baseOpacity={0.18}
          centerFade={0.9}
          edgeFade={0.1}
          clickEffect="none"
          fontSize={14}
          renderer="2d"
        />
      </div>

      {/* content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          aria-hidden
          className="text-4xl font-extrabold tracking-tight sm:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
        >
          {NAME}
        </motion.h1>

        <div className="text-primary mt-3 h-6 overflow-hidden text-base font-medium sm:text-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={roleIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            >
              {roles[roleIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-10 w-full max-w-xs">
          <div className="bg-border h-0.5 w-full overflow-hidden rounded-full">
            <motion.div className="bg-primary h-full w-full origin-left" style={{ scaleX: fill }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span
              className="text-foreground font-semibold"
              style={{ textShadow: "0 2px 12px rgb(0 0 0 / 45%)" }}
            >
              Loading your experience.
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}