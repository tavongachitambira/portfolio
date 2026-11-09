/* Geometry for the loader's ring display (components/layout/RingGauge). Pure functions, so the
   numbers behind the picture are unit-tested; the component only decides where things go. */

/** Perimeter of an ellipse, by Ramanujan's second approximation (off by far less than a pixel here). */
export function ellipsePerimeter(rx: number, ry: number): number {
  const h = ((rx - ry) / (rx + ry)) ** 2
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}

/** An ellipse as a closed path (two half arcs), so two of them can be filled with the evenodd rule to make a ring. */
export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`
}

/** A dash pattern ("dash gap") that cuts a closed path of `length` into `count` equal dashes, `gap` apart.
    The pattern repeats exactly `count` times, so there is no seam where the path closes. */
export function segmentDash(length: number, count: number, gap: number): string {
  const period = length / count
  const dash = Math.max(period - gap, 0)
  return `${round(dash)} ${round(Math.min(gap, period))}`
}

/** Angles in degrees for `count` evenly spaced marks around a circle, starting at 12 o'clock and going clockwise. */
export function marks(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i * 360) / count)
}

/** A progress value (0..100, any number) as the dash pattern that fills that much of a closed path of `length`,
    in CSS pixels (so it works as a style value on an SVG shape). */
export function arcDash(percent: number, length: number): string {
  const filled = (Math.min(Math.max(percent, 0), 100) / 100) * length
  return `${round(filled)}px ${round(length)}px`
}

const round = (n: number) => Math.round(n * 1000) / 1000
