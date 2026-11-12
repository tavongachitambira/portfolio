import { useLayoutEffect, type RefObject } from "react"

/* Lines the right column up with the left aside (desktop).

   The aside is a block centred in the viewport, so where its first row ("Hi, my name is") and its last
   row (the social chips) land moves with the viewport height and the fluid type sizes. This measures
   them and writes three CSS variables on `host`, which the landing layout reads (styles in globals.css,
   `.landing`):

   --hi-y        top of the first row, from the top of the viewport  -> where the top bar sits
   --row-bottom  space under the last row, to the bottom of the viewport -> the footer's end padding
   --sb-w        width of the scroller's scrollbar (0 for overlay scrollbars) -> keeps the bar's right
                 edge on the text column's right edge

   The rows are found by `data-row="first"` / `data-row="last"` (see Sidebar). The page stays mounted but
   hidden when you leave it, and a hidden aside measures 0 high, so that case keeps the last values. */
export function useRowAlign(
  hostRef: RefObject<HTMLElement | null>,
  asideRef: RefObject<HTMLElement | null>,
  scrollerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const host = hostRef.current
    const aside = asideRef.current
    const scroller = scrollerRef.current
    if (!enabled || !host || !aside) return

    const first = aside.querySelector<HTMLElement>("[data-row='first']")
    const last = aside.querySelector<HTMLElement>("[data-row='last']")

    const measure = () => {
      const a = aside.getBoundingClientRect()
      if (a.height === 0) return
      if (first) host.style.setProperty("--hi-y", `${(first.getBoundingClientRect().top - a.top).toFixed(1)}px`)
      if (last) host.style.setProperty("--row-bottom", `${(a.bottom - last.getBoundingClientRect().bottom).toFixed(1)}px`)
      if (scroller) host.style.setProperty("--sb-w", `${scroller.offsetWidth - scroller.clientWidth}px`)
    }

    measure()

    // the block is centred, so a size change in any child moves the rows
    const observer = new ResizeObserver(measure)
    observer.observe(aside)
    for (const child of Array.from(aside.children)) observer.observe(child)
    if (scroller) observer.observe(scroller)
    window.addEventListener("resize", measure)
    let disposed = false
    void document.fonts?.ready.then(() => {
      if (!disposed) measure()
    })

    return () => {
      disposed = true
      observer.disconnect()
      window.removeEventListener("resize", measure)
      for (const name of ["--hi-y", "--row-bottom", "--sb-w"]) host.style.removeProperty(name)
    }
  }, [hostRef, asideRef, scrollerRef, enabled])
}
