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
   Scrolling back up reverses everything.

   On desktop the blocks live in a fixed layer that mirrors the in-flow slot (rootRef).
   Both the layer's box and the swing pivots are re-measured whenever the layout can have
   changed, never cached from the first paint.

   The slot is as tall as the scroller, which starts under the landing top bar, so the bar and the
   blocks fill the first screen. A fixed layer is not clipped by the scroller's overflow, so it sits in a
   viewport-sized wrapper that is cut at the scroller's top edge (clipTop): the blocks, like the text,
   disappear under the bar instead of sliding over it. */

const RADIUS = 36 // = --clay-r-lg
const SECTION_ID = "profile"
const TURNS = 3 // screw rotations over the scroll range

type Box = { left: number; top: number; width: number; height: number }
type Pivots = { web: string; ml: string }

const sameBox = (a: Box, b: Box) =>
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5

export function HeroStage({
  scrollContainerRef,
  isMobile,
}: {
  scrollContainerRef: RefObject<HTMLDivElement | null>
  isMobile: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const seamRef = useRef<HTMLDivElement>(null)
  const screwRef = useRef<HTMLDivElement>(null)
  const webRef = useRef<HTMLDivElement>(null)
  const mlRef = useRef<HTMLDivElement>(null)

  const scrollY = useMotionValue(0)
  const [end, setEnd] = useState(700)
  const [box, setBox] = useState<Box | null>(null)
  const [pivots, setPivots] = useState<Pivots | null>(null)
  // viewport y of the scroller's top edge (right under the landing top bar). The fixed layer is not
  // clipped by the scroller, so it is cut at this line itself: nothing scrolls up past the bar.
  const [clipTop, setClipTop] = useState(0)

  useEffect(() => {
    const scroller = isMobile ? null : scrollContainerRef.current

    const target: HTMLElement | Window = scroller ?? window
    const read = () => (scroller ? scroller.scrollTop : window.scrollY)
    const onScroll = () => scrollY.set(read())

    function measure() {
      // scroll distance over which the screw comes undone
      const section = document.getElementById(SECTION_ID)
      const base = scroller ? scroller.getBoundingClientRect().top : 0
      const viewportHeight = scroller?.clientHeight ?? window.innerHeight
      const top = section ? section.getBoundingClientRect().top - base + read() : viewportHeight
      setEnd(Math.max(top - viewportHeight * 0.35, 200))

      // desktop: the layer is fixed, so it has to be told where the in-flow slot currently is
      const root = rootRef.current
      if (scroller && root) {
        const r = root.getBoundingClientRect()
        const next = { left: r.left, top: r.top + scroller.scrollTop, width: r.width, height: r.height }
        setBox((prev) => (prev && sameBox(prev, next) ? prev : next))
      } else {
        setBox(null)
      }
      const nextClip = scroller ? Math.round(scroller.getBoundingClientRect().top) : 0
      setClipTop((prev) => (prev === nextClip ? prev : nextClip))

      // swing pivot = the screw, in each pane's own coordinates. offset* values come from
      // layout, so they ignore the rotate/translate the panes are wearing mid-scroll.
      const seam = seamRef.current
      const screw = screwRef.current
      const web = webRef.current
      const ml = mlRef.current
      if (seam && screw && web && ml) {
        const x = seam.offsetLeft + screw.offsetLeft
        const y = seam.offsetTop + screw.offsetTop
        const next = {
          web: `${x - web.offsetLeft}px ${y - web.offsetTop}px`,
          ml: `${x - ml.offsetLeft}px ${y - ml.offsetTop}px`,
        }
        setPivots((prev) => (prev && prev.web === next.web && prev.ml === next.ml ? prev : next))
      }
    }

    let disposed = false
    let frame = 0
    const remeasure = () => {
      if (disposed) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    onScroll()
    measure()

    target.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", remeasure)

    // layout also moves without a window resize: breakpoint jumps, fonts arriving, content reflowing
    const observer = new ResizeObserver(remeasure)
    for (const el of [rootRef.current, scroller, webRef.current, mlRef.current]) {
      if (el) observer.observe(el)
    }
    void document.fonts?.ready.then(remeasure)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      target.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", remeasure)
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
    // Slot height, before the top bar: lg:max-xl:h-[clamp(620px,76vh,760px)] xl:h-[calc(100vh+2rem)] xl:max-h-none
    // Now (desktop) the slot is exactly the scroller's height, i.e. the viewport minus the top bar, so the
    // bar and the two blocks fill the first screen; --stage-w (globals.css, .landing) sizes the blocks to fit.
    <div ref={rootRef} className="relative z-20 mx-auto w-full max-w-68 overflow-visible min-[420px]:max-sm:max-w-80 sm:max-md:max-w-92 md:max-lg:max-w-104 lg:h-full lg:max-w-(--stage-w)">
      {/* Floating (desktop): a viewport-sized, click-through layer cut at the scroller's top edge, holding
          the stage. `contents` otherwise, so the stage keeps its place in the flow and never remounts. */}
      <div
        className={floating ? "pointer-events-none fixed inset-0 z-10" : "contents"}
        style={floating ? { clipPath: `inset(${clipTop}px 0 0 0)` } : undefined}
      >
        <motion.div
          style={floating ? { left: box.left, top: box.top, width: box.width, height: box.height, y: layerY } : undefined}
          className={cn(
            "flex flex-col items-center justify-center",
            // was "pointer-events-none fixed z-10": the fixed + z-10 moved up to the clipping layer
            floating ? "pointer-events-none absolute" : "relative w-full py-8 md:py-12 lg:h-full lg:py-0",
          )}
        >
          <Pane pane={stagePanes.web} progress={progress} origin={pivots?.web} paneRef={webRef} />

          {/* zero-height spacer sitting exactly on the seam between the blocks */}
          <div ref={seamRef} aria-hidden className="relative z-20 h-0">
            <div
              ref={screwRef}
              className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
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

          <Pane pane={stagePanes.ml} progress={progress} origin={pivots?.ml} paneRef={mlRef} />
        </motion.div>
      </div>
    </div>
  )
}

function Pane({
  pane,
  progress,
  origin,
  paneRef,
}: {
  pane: StagePane
  progress: MotionValue<number>
  /** the screw's position in this pane's own coordinates (px), measured by HeroStage */
  origin?: string
  paneRef: RefObject<HTMLDivElement | null>
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

  return (
    // pivot layer: owns only the swing/fall/fade, so the entry animation below is untouched
    <motion.div
      ref={paneRef}
      style={{ rotate, x, y, opacity, filter, transformOrigin: origin }}
      className={cn(
        "relative w-full min-w-0 will-change-transform sm:w-[90%]",
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
          // from lg up the mock's em follows the stage width (--stage-w in globals.css; 0.8rem at the full 30rem)
          <BoardMock className="mt-2 text-[0.46rem] min-[420px]:text-[0.54rem] sm:text-[0.6rem] md:text-[0.7rem] lg:text-[length:calc(var(--stage-w)*0.0267)] md:mt-3" />
        ) : (
          <div className="clay-well mt-2 p-2 [--clay-radius:var(--clay-r-sm)] sm:p-2.5 md:mt-3 md:p-3">
            <NeuralViz />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
