"use client"

import { useReducedMotion } from "framer-motion"

import Plasma from "@/components/Plasma"
import { useIsMobile } from "@/hooks/useIsMobile"

/* Plasma replaces the previous Glass Flow layer while the studio base and grain remain. */
export function Ambient() {
  const isMobile = useIsMobile()
  const reduce = useReducedMotion()

  return (
    <>
      <div aria-hidden className="studio clay-grain pointer-events-none fixed inset-0 -z-20" />

      {!reduce && (
        <div
          aria-hidden
          className="fixed inset-0 -z-10 opacity-65 lg:opacity-80"
        >
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
          />
        </div>
      )}
    </>
  )
}
