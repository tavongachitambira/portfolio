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

import { DigitField } from "@/components/layout/DigitField"
import { roles } from "@/lib/data/profile"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

const MIN_MS = 1800 // minimum on-screen time so the sequence is always readable
const FILL_MS = 450 // final fill to 100% once ready
const EXIT_S = 0.9
const EASE = [0.76, 0, 0.24, 1] as const
const EASE_OUT = [0.2, 0, 0, 1] as const

const BAR_DIGITS = 24
const STAGES = [
  { from: 0, label: "Fetching assets" },
  { from: 28, label: "Compiling interface" },
  { from: 60, label: "Decoding profile" },
  { from: 92, label: "Ready" },
] as const

// the digit field fades out behind the text so the name stays readable
const FIELD_MASK =
  "radial-gradient(ellipse 60% 52% at 50% 50%, rgb(0 0 0 / 0.08) 0%, rgb(0 0 0 / 0.35) 45%, #000 100%)"

const [FIRST_NAME, ...REST_NAME] = site.name.split(" ")
const LAST_NAME = REST_NAME.join(" ")

type Phase = "loading" | "exit" | "done"

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const stageLabel = (pct: number): string =>
  STAGES.reduce<string>((label, stage) => (pct >= stage.from ? stage.label : label), STAGES[0].label)

// Keep the loader out of client-side route changes, but replay it on full reloads.
let hasCompletedInitialLoad = false

/* First-visit preloader.

   Behind everything: a live field of binary digits streaming down the screen, which is the
   site owner's name encoded as ASCII (see DigitField). The middle fades out so the content
   stays readable.
   On top: the name, filled in left to right as the load advances (first name, then surname),
   the cycling role, a progress bar made of the digits themselves (0 -> 1), the current stage,
   and a large counter. Progress follows the real page load; on exit the screen lifts away. */
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

  useEffect(() => smooth.on("change", (v) => setPct(Math.round(v))), [smooth])

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
  const litDigits = Math.round((pct / 100) * BAR_DIGITS)

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
      {/* live binary field, middle faded out */}
      <div aria-hidden className="absolute inset-0" style={{ maskImage: FIELD_MASK, WebkitMaskImage: FIELD_MASK }}>
        <DigitField text={site.name} progress={smooth} reducedMotion={Boolean(reduceMotion)} />
      </div>

      {/* soft glow behind the name */}
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
            className="text-[clamp(2.25rem,12.5vw,3rem)] leading-none font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
          >
            <NameLine text={FIRST_NAME} progress={firstFill} />
            <NameLine text={LAST_NAME} progress={lastFill} accent />
          </motion.h1>

          <div className="text-primary mt-6 flex h-5 items-center gap-2.5 overflow-hidden font-mono text-xs font-semibold tracking-[0.22em] uppercase sm:text-sm">
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

          <div className="mt-10 flex flex-col items-center gap-3">
            {/* progress bar drawn with the digits themselves: 0 = to do, 1 = done */}
            <p aria-hidden className="pl-[0.3em] font-mono text-xs leading-none tracking-[0.3em] select-none sm:text-sm">
              <span className="text-primary [text-shadow:0_0_12px_color-mix(in_oklab,var(--primary)_55%,transparent)]">
                {"1".repeat(litDigits)}
              </span>
              <span className="text-foreground/25">{"0".repeat(BAR_DIGITS - litDigits)}</span>
            </p>
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase sm:text-xs">
              {stageLabel(pct)}
            </p>
          </div>
        </div>

        <Counter pct={pct} />
      </motion.div>
    </motion.div>
  )
}

/* One line of the name: a dim base with the real text revealed over it from the left.
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
    <span className="relative mx-auto block w-fit">
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

/* 000 -> 100, leading zeros dimmed */
function Counter({ pct }: { pct: number }) {
  const digits = String(pct).padStart(3, "0")
  const zeros = digits.length - String(pct).length

  return (
    <div
      aria-hidden
      className="absolute right-6 bottom-6 flex items-end gap-1.5 font-mono leading-none tabular-nums sm:right-10 sm:bottom-8"
    >
      <span className="text-6xl font-light tracking-tighter sm:text-8xl">
        <span className="opacity-20">{digits.slice(0, zeros)}</span>
        {digits.slice(zeros)}
      </span>
      <span className="text-muted-foreground pb-1 text-base sm:pb-2 sm:text-xl">%</span>
    </div>
  )
}
