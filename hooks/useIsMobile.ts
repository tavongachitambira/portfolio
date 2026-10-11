import { useSyncExternalStore } from "react";

export function useIsMobile(breakpoint = 1024) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}