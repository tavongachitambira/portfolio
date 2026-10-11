import { useEffect, type RefObject } from "react";

/** Forwards wheel events from `from` to `to` (desktop split-panel scrolling). */
export function useWheelForward(
  from: RefObject<HTMLElement | null>,
  to: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const src = from.current;
    const dst = to.current;
    if (!enabled || !src || !dst) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dst.scrollBy({ top: e.deltaY, behavior: "instant" });
    };
    src.addEventListener("wheel", onWheel, { passive: false });
    return () => src.removeEventListener("wheel", onWheel);
  }, [from, to, enabled]);
}