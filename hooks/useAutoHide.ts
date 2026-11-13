import { useEffect, type RefObject } from "react"

import { barAt, JUMP_EVENT, stepBar } from "@/lib/autohide"

/** A jump (a nav link, the palette) is over when the browser says the scroll ended (`scrollend`), or once the
    column has stood still this long: for browsers without `scrollend` and for jumps that don't move the page.
    Generous on purpose, because one slow frame can leave a long gap between two scroll events. */
const SETTLE_MS = 600

/** Sets `data-hidden` on `target` while `scroller` scrolls down and clears it when it scrolls up (or sits at
    the top). The CSS that slides the element away lives with the element (app/page.tsx). Jumps the page makes
    by itself (lib/autohide announceJump) keep it away until the page stops moving, so a nav link that scrolls
    up doesn't bring the bar in over the heading it just scrolled to. */
export function useAutoHide(
  scroller: RefObject<HTMLElement | null>,
  target: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const box = scroller.current
    const el = target.current
    if (!enabled || !box || !el) return

    // rubber-banding can push scrollTop past either end; that is not the visitor changing direction
    const position = () => Math.max(0, Math.min(box.scrollTop, box.scrollHeight - box.clientHeight))

    let state = barAt(position())
    let jumping = false
    let timer = 0
    // how far the column can scroll: when this changes under us (content loaded, the window resized) the browser
    // may move the scroll position on its own, which is not the visitor scrolling up
    let reach = box.scrollHeight - box.clientHeight
    const apply = () => el.toggleAttribute("data-hidden", state.hidden)
    apply()

    // when a jump is over the bar follows where the page landed: away anywhere but the top
    const finish = () => {
      window.clearTimeout(timer)
      jumping = false
      state = barAt(position())
      apply()
    }
    const settle = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(finish, SETTLE_MS)
    }
    const onScroll = () => {
      if (jumping) return settle()
      const now = box.scrollHeight - box.clientHeight
      const reflowed = now !== reach
      reach = now
      const y = position()
      // the browser pulled the position up because the content got shorter: we did not scroll up
      if (reflowed && y < state.y) {
        state = { ...state, y, run: 0 }
        return
      }
      state = stepBar(state, y)
      apply()
    }
    const onScrollEnd = () => {
      if (jumping) finish()
    }
    const onJump = () => {
      jumping = true
      state = { ...state, hidden: true }
      apply()
      settle()
    }

    box.addEventListener("scroll", onScroll, { passive: true })
    box.addEventListener("scrollend", onScrollEnd)
    window.addEventListener(JUMP_EVENT, onJump)
    return () => {
      window.clearTimeout(timer)
      box.removeEventListener("scroll", onScroll)
      box.removeEventListener("scrollend", onScrollEnd)
      window.removeEventListener(JUMP_EVENT, onJump)
      el.removeAttribute("data-hidden")
    }
  }, [scroller, target, enabled])
}
