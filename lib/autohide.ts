/* Where the landing page's top bar should be as its column scrolls: away while the visitor scrolls
   down, back as soon as they scroll up, and always there at the very top. Kept pure so it can be
   tested (tests/autohide.test.ts); hooks/useAutoHide.ts feeds it scroll positions and applies the result. */

/** Within this many px of the top the bar is always shown. */
export const TOP_ZONE = 8
/** Scrolling down this far in one direction hides the bar (a nudge or a jittery trackpad doesn't). */
export const HIDE_AFTER = 12
/** Scrolling up this far brings it back; a little shorter than HIDE_AFTER so it returns promptly. */
export const SHOW_AFTER = 8

export type BarState = {
  /** scroll position at the last step */
  y: number
  /** px travelled in the current direction: positive is down, negative is up */
  run: number
  hidden: boolean
}

/** The state to start from, on mount or once a jump has finished, at scroll position y. */
export const barAt = (y: number): BarState => ({ y, run: 0, hidden: y > TOP_ZONE })

export function stepBar(state: BarState, y: number): BarState {
  if (y <= TOP_ZONE) return { y, run: 0, hidden: false }
  const dy = y - state.y
  if (dy === 0) return state
  // a change of direction starts a new run, so back-and-forth wobble never adds up
  const run = Math.sign(dy) === Math.sign(state.run) ? state.run + dy : dy
  const hidden = run > HIDE_AFTER ? true : run < -SHOW_AFTER ? false : state.hidden
  return { y, run, hidden }
}

/** Fired by anything that scrolls the page on the visitor's behalf (a nav link, the palette), so the bar
    stays out of the way until the page stops instead of reading a jump upward as "scrolled up". */
export const JUMP_EVENT = "portfolio:scroll-jump"
export const announceJump = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(JUMP_EVENT))
}
