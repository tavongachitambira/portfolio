import { describe, expect, it } from "vitest"

import { arcDash, ellipsePath, ellipsePerimeter, marks, segmentDash } from "@/lib/rings"

describe("ellipsePerimeter", () => {
  it("is 2πr for a circle", () => {
    expect(ellipsePerimeter(10, 10)).toBeCloseTo(2 * Math.PI * 10, 9)
  })

  it("matches a known ellipse (5 × 3 is 25.5270)", () => {
    expect(ellipsePerimeter(5, 3)).toBeCloseTo(25.527, 3)
  })

  it("stays within a hair of numerical integration for the flat rings the loader draws", () => {
    for (const [rx, ry] of [[214, 53.5], [238, 59.5], [124, 31]] as const) {
      let sum = 0
      const n = 20000
      for (let i = 0; i < n; i++) {
        const t = ((i + 0.5) / n) * 2 * Math.PI
        sum += Math.hypot(rx * Math.sin(t), ry * Math.cos(t)) * ((2 * Math.PI) / n)
      }
      expect(Math.abs(ellipsePerimeter(rx, ry) - sum) / sum).toBeLessThan(1e-6)
    }
  })

  it("does not depend on which radius is larger", () => {
    expect(ellipsePerimeter(3, 8)).toBeCloseTo(ellipsePerimeter(8, 3), 9)
  })
})

describe("ellipsePath", () => {
  it("starts at the left edge and closes", () => {
    expect(ellipsePath(100, 50, 40, 10)).toBe("M60 50a40 10 0 1 0 80 0a40 10 0 1 0 -80 0Z")
  })
})

describe("segmentDash", () => {
  it("cuts a path into equal dashes with the gap between them", () => {
    expect(segmentDash(100, 4, 2)).toBe("23 2")
  })

  it("repeats exactly `count` times over the length, so the path closes without a seam", () => {
    const length = 713.37
    const count = 60
    const [dash, gap] = segmentDash(length, count, 3.2).split(" ").map(Number)
    expect((dash + gap) * count).toBeCloseTo(length, 1)
  })

  it("never returns a negative dash when the gap is wider than the period", () => {
    const [dash, gap] = segmentDash(10, 5, 9).split(" ").map(Number)
    expect(dash).toBe(0)
    expect(gap).toBe(2)
  })
})

describe("marks", () => {
  it("spaces marks evenly from 12 o'clock", () => {
    expect(marks(4)).toEqual([0, 90, 180, 270])
    expect(marks(10)).toHaveLength(10)
    expect(marks(10)[1]).toBe(36)
  })
})

describe("arcDash", () => {
  it("fills the matching share of the path", () => {
    expect(arcDash(50, 200)).toBe("100px 200px")
    expect(arcDash(0, 200)).toBe("0px 200px")
    expect(arcDash(100, 200)).toBe("200px 200px")
  })

  it("clamps to 0..100 so a spring overshoot never draws past the circle", () => {
    expect(arcDash(103.4, 200)).toBe("200px 200px")
    expect(arcDash(-2, 200)).toBe("0px 200px")
  })
})
