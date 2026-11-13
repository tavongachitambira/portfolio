import { afterEach, describe, expect, it, vi } from "vitest"

import {
  announceJump,
  barAt,
  HIDE_AFTER,
  JUMP_EVENT,
  SHOW_AFTER,
  stepBar,
  TOP_ZONE,
  type BarState,
} from "@/lib/autohide"

const scroll = (from: BarState, ...ys: number[]) => ys.reduce((s, y) => stepBar(s, y), from)
const shownAt = (y: number): BarState => ({ y, run: 0, hidden: false })
const hiddenAt = (y: number): BarState => ({ y, run: 0, hidden: true })

describe("barAt", () => {
  it("shows the bar at the top and hides it anywhere else", () => {
    expect(barAt(0).hidden).toBe(false)
    expect(barAt(TOP_ZONE).hidden).toBe(false)
    expect(barAt(TOP_ZONE + 1).hidden).toBe(true)
    expect(barAt(900).hidden).toBe(true)
  })
})

describe("stepBar", () => {
  it("hides the bar once the visitor has scrolled down far enough", () => {
    expect(scroll(barAt(0), 40).hidden).toBe(true)
  })

  it("ignores a nudge: the threshold is strictly more than HIDE_AFTER", () => {
    expect(scroll(shownAt(100), 100 + HIDE_AFTER).hidden).toBe(false)
    expect(scroll(shownAt(100), 100 + HIDE_AFTER + 1).hidden).toBe(true)
  })

  it("adds up small steps in the same direction", () => {
    expect(scroll(shownAt(100), 105, 110).hidden).toBe(false)
    expect(scroll(shownAt(100), 105, 110, 115).hidden).toBe(true)
  })

  it("brings the bar back as soon as the visitor scrolls up", () => {
    expect(scroll(hiddenAt(500), 500 - SHOW_AFTER).hidden).toBe(true)
    expect(scroll(hiddenAt(500), 500 - SHOW_AFTER - 1).hidden).toBe(false)
  })

  it("starts a new run when the direction changes, so a wobble never adds up", () => {
    // +10, -3, +10: the second +10 is its own run (10), not 17, so the bar stays
    const s = scroll(shownAt(100), 110, 107, 117)
    expect(s.hidden).toBe(false)
    expect(s.run).toBe(10)
  })

  it("keeps its state while the visitor keeps going the same way", () => {
    expect(scroll(hiddenAt(300), 320, 340, 400).hidden).toBe(true)
    expect(scroll(shownAt(900), 880, 850, 700).hidden).toBe(false)
  })

  it("is always shown at the very top, whatever it was doing", () => {
    expect(stepBar(hiddenAt(500), TOP_ZONE).hidden).toBe(false)
    expect(stepBar({ y: 500, run: 300, hidden: true }, 0)).toEqual({ y: 0, run: 0, hidden: false })
    expect(scroll(barAt(0), 4, 8).hidden).toBe(false)
  })

  it("does nothing when the position has not changed", () => {
    const s = hiddenAt(250)
    expect(stepBar(s, 250)).toBe(s)
  })
})

describe("announceJump", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("is a no-op where there is no window (the server)", () => {
    expect(() => announceJump()).not.toThrow()
  })

  it("tells listeners on window that a jump has started", () => {
    const fake = new EventTarget()
    vi.stubGlobal("window", fake)
    let heard = 0
    fake.addEventListener(JUMP_EVENT, () => heard++)
    announceJump()
    expect(heard).toBe(1)
  })
})
