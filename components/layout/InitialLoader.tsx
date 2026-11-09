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
  type MotionValue,
} from "framer-motion"

import { GlyphField } from "@/components/layout/GlyphField"
import { RingGauge } from "@/components/layout/RingGauge"
import { roles } from "@/lib/data/profile"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

const MIN_MS = 1800 // minimum on-screen time so the sequence is always readable
const FILL_MS = 450 // final fill to 100% once ready
const EXIT_S = 0.9
const EASE = [0.76, 0, 0.24, 1] as const
const EASE_OUT = [0.2, 0, 0, 1] as const

const STAGES = [
  { from: 0, label: "Fetching assets" },
  { from: 28, label: "Compiling interface" },
  { from: 60, label: "Decoding profile" },
  { from: 92, label: "Ready" },
] as const

// the letter field fades out behind the middle so the rings and the name stay readable
const FIELD_MASK =
  "radial-gradient(ellipse 60% 52% at 50% 50%, rgb(0 0 0 / 0.08) 0%, rgb(0 0 0 / 0.35) 45%, #000 100%)"

// what the letters in the background spell: the name, then the roles
const FIELD_TEXT = [site.name, ...roles].join(" ")

const [FIRST_NAME, ...REST_NAME] = site.name.split(" ")
const LAST_NAME = REST_NAME.join(" ")

type Phase = "loading" | "exit" | "done"

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const stageLabel = (pct: number): string =>
  STAGES.reduce<string>((label, stage) => (pct >= stage.from ? stage.label : label), STAGES[0].label)

// Keep the loader out of client-side route changes, but replay it on full reloads.
let hasCompletedInitialLoad = false

/* First-visit preloader.

   Behind everything: a live field of letters streaming down the screen, made of the site owner's
   name and roles (see GlyphField). The middle fades out so the content stays readable.
   On top, from the top down: the name, filled in left to right as the load advances (first name,
   then surname); the cycling role; then the ring display (see RingGauge), a tilted funnel of
   turning rings whose top ring fills with the percentage floating above it; and the current stage.
   Progress follows the real page load; on exit the screen lifts away. */
export function InitialLoader() {
  const [phase, setPhase] = useState<Phase>(() => (hasCompletedInitialLoad ? "done" : "loading"))
  const [pct, setPct] = useState(0)
  const [roleIndex, setRoleIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  const target = useMotionValue(0) // 0..100
  const smooth = useSpring(target, { stiffness: 90, damping: 24, mass: 0.6 })
  const fill = useTransform(smooth, (v) => clamp01(v / 100))
  const firstFill = useTransform(fill, [0, 0.5], [0, 1], { clamp: true })
  const lastFill = useTransform(fill, [0.5, 1], [0, 1], { clamp: true })

  useEffect(() => smooth.on("change", (v) => setPct(Math.min(Math.max(Math.round(v), 0), 100))), [smooth])

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
      aria-label={`Loading ${site.name}'s portfolio`}
      className="bg-background fixed inset-0 z-100 overflow-hidden"
      animate={{ y: exiting ? "-100%" : "0%" }}
      transition={{ duration: reduceMotion ? 0 : EXIT_S, ease: EASE }}
    >
      {/* live letter field, middle faded out */}
      <div aria-hidden className="absolute inset-0" style={{ maskImage: FIELD_MASK, WebkitMaskImage: FIELD_MASK }}>
        <GlyphField text={FIELD_TEXT} progress={smooth} reducedMotion={Boolean(reduceMotion)} />
      </div>

      {/* soft glow behind the middle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_65%)]"
      />

      {/* hairline progress across the top edge */}
      <motion.div
        aria-hidden
        className="bg-primary absolute inset-x-0 top-0 h-0.5 origin-left"
        style={{ scaleX: fill }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.h1
            aria-hidden
            className="flex items-baseline justify-center gap-x-[0.3em] text-[clamp(1.4rem,6.8vw,1.9rem)] leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-3xl lg:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
          >
            <NameLine text={FIRST_NAME} progress={firstFill} />
            <NameLine text={LAST_NAME} progress={lastFill} accent />
          </motion.h1>

          <div className="text-primary mt-3 flex h-5 items-center gap-2.5 overflow-hidden font-mono text-xs font-semibold tracking-[0.22em] uppercase [text-shadow:0_0_10px_var(--background),0_0_3px_var(--background)] sm:text-sm">
            <span aria-hidden className="bg-primary size-1.5 shrink-0 animate-pulse rounded-full" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={roleIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.25 }}
              >
                {roles[roleIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="mt-6 sm:mt-8">
            <RingGauge pct={pct} progress={smooth} still={Boolean(reduceMotion)} />
          </div>

          <p
            aria-hidden
            className="text-muted-foreground mt-1 font-mono text-[11px] tracking-[0.18em] uppercase [text-shadow:0_0_10px_var(--background),0_0_3px_var(--background)] sm:text-xs"
          >
            {stageLabel(pct)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* One word of the name: a dim base with the real text revealed over it from the left.
   Both layers share one box, so nothing shifts as the fill advances. */
function NameLine({
  text,
  progress,
  accent = false,
}: {
  text: string
  progress: MotionValue<number> // 0..1
  accent?: boolean
}) {
  // negative top/bottom insets keep descenders from being clipped
  const clip = useTransform(progress, (v) => `inset(-25% ${(1 - clamp01(v)) * 100}% -25% -2%)`)
  const edge = useTransform(progress, (v) => `${clamp01(v) * 100}%`)
  const edgeOpacity = useTransform(progress, [0, 0.03, 0.97, 1], [0, 1, 1, 0])

  return (
    <span className="relative block">
      <span className="text-foreground/10 block">{text}</span>
      <motion.span
        className={cn(
          "absolute inset-0 block",
          accent ? "from-primary to-glaze-rose bg-linear-to-r bg-clip-text text-transparent" : "text-foreground",
        )}
        style={{ clipPath: clip }}
      >
        {text}
      </motion.span>
      <motion.span
        aria-hidden
        className="bg-primary absolute inset-y-[6%] w-px shadow-[0_0_14px_2px_var(--primary)]"
        style={{ left: edge, opacity: edgeOpacity }}
      />
    </span>
  )
}
