"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

import Plasma from "@/components/Plasma"
import { useIsMobile } from "@/hooks/useIsMobile"

const noopSubscribe = () => () => {}
/** false on the server and while hydrating, true once the client has taken over */
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false)

/* Plasma replaces the previous Glass Flow layer while the studio base and grain remain.

   The flame is WebGL2, and not every phone runs it the way a desktop does (iOS Safari treats
   WebGL canvases and lost contexts its own way). So:
   - it mounts only after hydration, once `isMobile` is final. Before, a phone first built a context
     with the desktop settings and threw it away a tick later;
   - Reduce Motion freezes it on a single frame instead of removing it, which used to leave an
     iPhone with that setting on a flat page;
   - where WebGL2 can't run at all, a still CSS flame (.ember) stands in. */
export function Ambient() {
  const isMobile = useIsMobile()
  const hydrated = useHydrated()
  const [webglFailed, setWebglFailed] = useState(false)
  const onUnsupported = useCallback(() => setWebglFailed(true), [])

  return (
    <>
      <div aria-hidden className="studio clay-grain pointer-events-none fixed inset-0 -z-20" />

      {/* h-lvh: on iOS a plain inset-0 layer resizes every time the URL bar slides, and every resize
          reallocates the canvas. The large-viewport height stays put (inset-0 is the fallback). */}
      <div
        aria-hidden
        data-flame={webglFailed ? "css" : "webgl"}
        className="fixed inset-0 -z-10 h-lvh opacity-65 lg:opacity-80"
      >
        {webglFailed ? (
          <div className="ember absolute inset-0" />
        ) : (
          hydrated && (
            <Plasma
              color="#ff6b35"
              speed={0.6}
              direction="forward"
              scale={1.1}
              opacity={0.8}
              mouseInteractive={!isMobile}
              renderScale={isMobile ? 0.4 : 0.55}
              maxDpr={isMobile ? 1 : 1.5}
              targetFps={isMobile ? 30 : 60}
              onUnsupported={onUnsupported}
            />
          )
        )}
      </div>
    </>
  )
}
