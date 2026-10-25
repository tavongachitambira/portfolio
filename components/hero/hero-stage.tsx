"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import {
  easeIn,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"

import { XOrb } from "@/components/clay/x-orb"
import { BoardMock } from "@/components/hero/board-mock"
import { NeuralViz } from "@/components/hero/neural-viz"
import { stagePanes, type StagePane } from "@/lib/data/stage"
import { cn } from "@/lib/utils"

/* Web x ML: two stacked blocks pinned together by the screw.
   Scrolling toward #about unscrews it:
   - the screw spins counter-clockwise and lifts slightly, then vanishes
   - the web block starts first: it swings left around the screw, falls
     toward its heavy side, and drops out of the viewport
   - the ML block follows a bit later: it swings right around the screw
   Scrolling back up reverses everything. */

const RADIUS = 36 // = --clay-r-lg
const SECTION_ID = "profile"
const TURNS = 3 // screw rotations over the scroll range

export function HeroStage({
  scrollContainerRef,
  isMobile,
}: {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  isMobile: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollY = useMotionValue(0)
  const [end, setEnd] = useState(700)
    const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useEffect(() => {
    const scroller = isMobile ? null : scrollContainerRef.current

    const target: HTMLElement | Window = scroller ?? window
    const read = () => (scroller ? scroller.scrollTop : window.scrollY)
    const onScroll = () => scrollY.set(read())

    function measure() {
      const el = document.getElementById(SECTION_ID)
      const base = scroller ? scroller.getBoundingClientRect().top : 0
      const viewportHeight = scroller?.clientHeight ?? window.innerHeight
      const top = el ? el.getBoundingClientRect().top - base + read() : viewportHeight
      setEnd(Math.max(top - viewportHeight * 0.35, 200))
    }

    onScroll()
    measure()
          const root = rootRef.current
      if (scroller && root) {
        const r = root.getBoundingClientRect()
        setBox({ left: r.left, top: r.top + scroller.scrollTop, width: r.width, height: r.height })
      } else {
        setBox(null)
      }

    target.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", measure)
    return () => {
      target.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", measure)
    }
  }, [isMobile, scrollContainerRef, scrollY])

    const layerY = useTransform(scrollY, (v) => -v) // fixed layer follows the content
  const raw = useTransform(scrollY, [0, end], [0, 1], { clamp: true })
  const progress = useSpring(raw, { stiffness: 70, damping: 22, mass: 0.8 })

  // screw: unscrews (counter-clockwise), rises a little, then disappears
  const screwRotate = useTransform(progress, [0, 1], [0, -360 * TURNS])
  const screwY = useTransform(progress, [0, 0.5, 1], [0, -10, -24])
  const screwOpacity = useTransform(progress, [0, 0.75, 1], [1, 1, 0])

    const floating = !isMobile && box !== null

  return (
    <div ref={rootRef} className="relative z-20 mx-auto w-full max-w-68 overflow-visible min-[420px]:max-sm:max-w-80 sm:max-md:max-w-92 md:max-lg:max-w-104 lg:max-xl:max-w-112 lg:max-xl:h-[clamp(620px,76vh,760px)] xl:max-w-120 xl:h-[calc(100vh+2rem)] xl:max-h-none">
      <motion.div
        style={floating ? { left: box.left, top: box.top, width: box.width, height: box.height, y: layerY } : undefined}
        className={cn(
          "flex flex-col items-center justify-center",
          floating ? "pointer-events-none fixed z-10" : "relative w-full py-8 md:py-12 lg:h-full lg:py-0",
        )}
      >
        <Pane pane={stagePanes.web} progress={progress} />

        {/* zero-height spacer sitting exactly on the seam between the blocks */}
        <div aria-hidden className="relative z-20 h-0">
          <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              style={{
                rotate: screwRotate,
                y: screwY,
                opacity: screwOpacity,
                transformOrigin: "center",
                willChange: "transform",
              }}
            >
              <XOrb mode="multiply" className="clay-lg size-17" />
            </motion.div>
          </div>
        </div>

        <Pane pane={stagePanes.ml} progress={progress} />
      </motion.div>
    </div>
  )
}

function Pane({
  pane,
  progress,
}: {
  pane: StagePane
  progress: MotionValue<number>
}) {
  const isWeb = pane.side === "web"

  // web goes first, ML follows later (staggered, not all at once)
  const range = isWeb ? [0.1, 0.9] : [0.35, 1]
  const t = useTransform(progress, range, [0, 1], { clamp: true, ease: easeIn })

  // swing around the screw: web falls left (counter-clockwise), ML swings right (clockwise)
  const rotate = useTransform(t, [0, 1], [0, isWeb ? -75 : 55])
  const x = useTransform(t, [0, 1], ["0%", isWeb ? "-130%" : "70%"])
  const y = useTransform(t, [0, 1], ["0%", isWeb ? "90%" : "60%"])

  // stays solid while it's still visibly attached, vanishes as it leaves the viewport
  const opacity = useTransform(t, [0, 0.55, 1], [1, 1, 0])
  const blurPx = useTransform(t, [0, 0.55, 1], [0, 0, 8])
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`)

  // transform-origin = the screw, in each pane's own coordinates.
  // Panes are 84% wide of the container; the screw is at 50% of the container,
  // on the seam between them. ML pane sits 16% in and 1.25rem (mt-5) below the seam.
  const transformOrigin = isWeb
    ? "59.5% calc(100% + 0.625rem)"
    : "40.5% calc(-1.25rem + 0.625rem)"

  return (
    // pivot layer: owns only the swing/fall/fade, so the entry animation below is untouched
    <motion.div
      style={{ rotate, x, y, opacity, filter, transformOrigin }}
           className={cn(
        "relative w-[84%] min-w-0 will-change-transform",
        isWeb ? "z-10" : "z-5 mt-5 ml-auto",
      )}
    >
      {/* the slab: entry animation unchanged */}
      <motion.div
        initial={{ opacity: 0, y: isWeb ? -72 : 72 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ borderRadius: RADIUS }}
        aria-hidden
        className={cn(
          "clay clay-lg max-lg:[--clay-elev:var(--e-md)] p-3.5 sm:p-4 md:p-5",
          isWeb
            ? "[--clay-surface:var(--tone-rose)]"
            : "[--clay-surface:var(--tone-plum)]",
          isWeb ? "animate-float-a -rotate-2" : "animate-float-b rotate-[1.6deg]",
        )}
      >
        <span className="block text-base font-bold tracking-tight sm:text-lg md:text-xl">{pane.title}</span>

        {isWeb ? (
          <BoardMock className="mt-2 text-[0.46rem] min-[420px]:text-[0.54rem] sm:text-[0.6rem] md:text-[0.7rem] lg:text-[0.8rem] md:mt-3" />
        ) : (
          <div className="clay-well mt-2 p-2 [--clay-radius:var(--clay-r-sm)] sm:p-2.5 md:mt-3 md:p-3">
            <NeuralViz />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}