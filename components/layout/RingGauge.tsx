"use client"

import { useId, type CSSProperties, type ReactNode } from "react"
import { motion, useTransform, type MotionValue } from "framer-motion"

import { arcDash, ellipsePath, ellipsePerimeter, marks, segmentDash } from "@/lib/rings"

/* The loader's centrepiece: a funnel of rings seen from above at an angle, with the percentage floating over it.

   The top ring is the gauge. Its band fills clockwise from 12 o'clock as the load advances, with a hot tip at the
   leading edge, a numbered scale around it and a fine bezel outside that. Under it hang thinner rings (a broken one,
   a dashed one, a ticked one, a shaded plate), each smaller and fainter than the one above, turning at their own
   speeds in alternating directions.

   It is one SVG, drawn flat and then squashed by K, which turns every circle into the ellipse a tilted ring makes;
   hairlines are drawn as true ellipses so they stay one pixel thick all the way round. Under reduced motion the
   rings stand still (motion.css), and the arc and the number still follow the real progress. */

const VIEW_W = 640
const VIEW_H = 420
const CX = VIEW_W / 2
const K = 0.25 // how flat the rings lie: the vertical squash of a circle seen from above at an angle
const EASE_OUT = [0.2, 0, 0, 1] as const

/* the gauge: centre height, radius of the band's centre line, band width, and how far the band's side wall shows */
const GAUGE = { cy: 150, r: 214, band: 30, wall: 7 }
const GAUGE_LEN = 2 * Math.PI * GAUGE.r
const TIP = 5 // length of the hot tip along the arc (viewBox units)

const SCALE_R = 250 // inner end of the tick marks
const LABEL_R = 274
const BEZEL_RX = 294

/* the rings below, top to bottom: centre height and horizontal radius (the vertical one follows from K) */
const RING_B = { cy: 208, rx: 238 }
const RING_C = { cy: 268, rx: 182 }
const RING_D = { cy: 322, rx: 124 }
const PLATE = { cy: 372, rx: 116, hole: 62 }

const TICKS = marks(100)
const LABELS = marks(10)

const flat = (cy: number) => `translate(${CX} ${cy}) scale(1 ${K})`
const css = (vars: Record<string, string | number>) => vars as CSSProperties

export function RingGauge({
  pct,
  progress,
  still = false,
}: {
  /** the whole-number percentage shown above the rings */
  pct: number
  /** the same progress as a motion value (0..100), so the arc moves smoothly between whole numbers */
  progress: MotionValue<number>
  /** no entrance animation (the rings' own turning is switched off by reduced motion in motion.css) */
  still?: boolean
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const ref = (name: string) => `url(#${uid}-${name})`

  const arc = useTransform(progress, (v) => arcDash(v, GAUGE_LEN))
  // a short dash riding the end of the arc: the pattern is slid forward until its dash sits at the leading edge
  const tipOffset = useTransform(progress, (v) => `${-(Math.min(Math.max(v, 0), 100) / 100 * GAUGE_LEN - TIP)}px`)

  return (
    <div className="@container relative w-[min(108vw,44rem,70vh)] select-none" aria-hidden>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block h-auto w-full overflow-visible">
        <defs>
          {/* farther away is fainter: the back of the scale fades, the front stays bright */}
          <linearGradient id={`${uid}-depth`} gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="235">
            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id={`${uid}-fade`} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
            <rect width={VIEW_W} height={VIEW_H} fill={ref("depth")} />
          </mask>
          <filter id={`${uid}-bloom`} x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0" style={{ stopColor: "var(--primary)", stopOpacity: 0.14 }} />
            <stop offset="1" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* a soft pool of light the rings hang in */}
        <ellipse cx={CX} cy={230} rx={330} ry={190} fill={ref("glow")} />

        {/* plate at the bottom: a shaded ring with its spokes */}
        <Layer index={4} still={still}>
          <path
            d={`${ellipsePath(CX, PLATE.cy, PLATE.rx, PLATE.rx * K)}${ellipsePath(CX, PLATE.cy, PLATE.hole, PLATE.hole * K)}`}
            fillRule="evenodd"
            className="fill-foreground/[0.07] stroke-foreground/20"
            strokeWidth={1}
          />
          <g transform={flat(PLATE.cy)}>
            <g className="ring-spin" style={css({ "--ring-dur": "48s" })}>
              {marks(8).map((a) => (
                <line
                  key={a}
                  x1={PLATE.hole}
                  x2={PLATE.rx}
                  transform={`rotate(${a + 22.5})`}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-foreground/15"
                  strokeWidth={1}
                />
              ))}
            </g>
          </g>
        </Layer>

        {/* small ring with fine tick marks (a wide stroke cut into hair-thin dashes) */}
        <Layer index={3} still={still}>
          <Ring {...RING_D} className="stroke-foreground/40" />
          <Ring {...RING_D} className="stroke-foreground/30" width={8} count={60} dash={1.2} turn={22} reverse />
        </Layer>

        {/* dashed ring, turning the other way */}
        <Layer index={2} still={still}>
          <Ring {...RING_C} className="stroke-foreground/55" width={1.5} count={72} gapShare={0.55} turn={30} reverse />
        </Layer>

        {/* broken ring: four arcs and four gaps, the gaps travelling round */}
        <Layer index={1} still={still}>
          <Ring {...RING_B} className="stroke-foreground/80" width={1.25} count={4} gap={14} turn={24} />
        </Layer>

        {/* the gauge */}
        <Layer index={0} still={still}>
          {/* fine bezel and the numbered scale, faint at the back */}
          <g mask={ref("fade")}>
            <Ring cy={GAUGE.cy} rx={BEZEL_RX} className="stroke-foreground/35" width={5} count={144} dash={1.2} turn={36} />
            <g transform={flat(GAUGE.cy)}>
              {TICKS.map((a, i) => (
                <line
                  key={a}
                  y1={-SCALE_R}
                  y2={-SCALE_R - (i % 10 === 0 ? 10 : 5)}
                  transform={`rotate(${a})`}
                  vectorEffect="non-scaling-stroke"
                  className={i % 10 === 0 ? "stroke-foreground/80" : "stroke-foreground/40"}
                  strokeWidth={1}
                />
              ))}
              {LABELS.map((a, i) => (
                <text
                  key={a}
                  transform={`rotate(${a}) translate(0 ${-LABEL_R})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  className="fill-foreground/60 font-mono"
                >
                  {i * 10}
                </text>
              ))}
            </g>
          </g>

          <ellipse cx={CX} cy={GAUGE.cy} rx={GAUGE.r + 26} ry={(GAUGE.r + 26) * K} fill="none" className="stroke-foreground/25" strokeWidth={1} />
          <ellipse cx={CX} cy={GAUGE.cy} rx={GAUGE.r - 24} ry={(GAUGE.r - 24) * K} fill="none" className="stroke-foreground/20" strokeWidth={1} />

          {/* the band: an empty track, and the arc filling it, each with the thickness of its side wall below */}
          <g transform={flat(GAUGE.cy + GAUGE.wall)}>
            <circle r={GAUGE.r} fill="none" strokeWidth={GAUGE.band} className="stroke-foreground/[0.04]" />
            <motion.circle
              r={GAUGE.r}
              fill="none"
              strokeWidth={GAUGE.band}
              transform="rotate(-90)"
              className="stroke-foreground/30"
              style={{ strokeDasharray: arc }}
            />
          </g>
          <g transform={flat(GAUGE.cy)}>
            <circle r={GAUGE.r} fill="none" strokeWidth={GAUGE.band} className="stroke-foreground/[0.09]" />
            <motion.circle
              r={GAUGE.r}
              fill="none"
              strokeWidth={GAUGE.band}
              transform="rotate(-90)"
              className="stroke-foreground"
              filter={ref("bloom")}
              opacity={0.55}
              style={{ strokeDasharray: arc }}
            />
            <motion.circle
              r={GAUGE.r}
              fill="none"
              strokeWidth={GAUGE.band}
              transform="rotate(-90)"
              className="stroke-foreground"
              style={{ strokeDasharray: arc }}
            />
            <motion.circle
              r={GAUGE.r}
              fill="none"
              strokeWidth={GAUGE.band + 6}
              transform="rotate(-90)"
              className="stroke-glaze-rose"
              style={{ strokeDasharray: `${TIP}px ${GAUGE_LEN}px`, strokeDashoffset: tipOffset }}
            />
          </g>
        </Layer>
      </svg>

      {/* the number floats over the back of the top ring, sized by the figure's own width */}
      <div className="pointer-events-none absolute inset-x-0 top-[2.5%] flex flex-col items-center">
        <span className="text-[15cqw] leading-[0.9] font-bold tracking-tight tabular-nums [text-shadow:0_0_32px_color-mix(in_oklab,var(--primary)_30%,transparent)]">
          {pct}
        </span>
        <span className="mt-[1.1cqw] pl-[0.3em] text-[2.6cqw] font-medium tracking-[0.3em] text-foreground/80 uppercase">
          percent
        </span>
      </div>
    </div>
  )
}

/* One layer of the stack: drops into place from above, a little later for each one further down. */
function Layer({ index, still, children }: { index: number; still: boolean; children: ReactNode }) {
  return (
    <motion.g
      // the markup must not depend on reduced motion (the server can't know it), so the layers always start
      // hidden and `still` only makes the entrance instant
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={still ? { duration: 0 } : { duration: 0.8, delay: 0.1 + index * 0.1, ease: EASE_OUT }}
    >
      {children}
    </motion.g>
  )
}

/* A hairline ring, drawn as a true ellipse. With `count` it is cut into that many dashes, sized by `dash`, by `gap`,
   or by `gapShare` (the gap as a share of each period; half by default), and with `turn` the dashes run round the
   ring, one lap in that many seconds. */
function Ring({
  cy,
  rx,
  className,
  width = 1,
  count,
  dash,
  gap,
  gapShare = 0.5,
  turn,
  reverse = false,
}: {
  cy: number
  rx: number
  className: string
  width?: number
  count?: number
  dash?: number
  gap?: number
  gapShare?: number
  turn?: number
  reverse?: boolean
}) {
  const ry = rx * K
  const length = ellipsePerimeter(rx, ry)

  let pattern: string | undefined
  if (count) {
    const period = length / count
    pattern = segmentDash(length, count, gap ?? (dash === undefined ? period * gapShare : period - dash))
  }

  return (
    <ellipse
      cx={CX}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      strokeWidth={width}
      strokeDasharray={pattern}
      className={[className, pattern && turn ? "ring-run" : "", reverse ? "ring-reverse" : ""].filter(Boolean).join(" ")}
      style={turn ? css({ "--ring-len": length, "--ring-dur": `${turn}s` }) : undefined}
    />
  )
}
