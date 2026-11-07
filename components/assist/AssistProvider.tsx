"use client"

import dynamic from "next/dynamic"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { CommandPalette } from "@/components/assist/CommandPalette"
import { useAsk } from "@/hooks/useAsk"

// The Ask sheet is only fetched once it is wanted (and warmed up when the browser is idle).
const AskPanel = dynamic(() => import("@/components/assist/AskPanel").then((m) => m.AskPanel), { ssr: false })

/** Ask also needs the server key; this flag only decides whether the site shows it at all. */
export const ASK_ENABLED = process.env.NEXT_PUBLIC_ASK_ENABLED === "true"

interface Assist {
  askEnabled: boolean
  openPalette: () => void
  /** Opens the Ask sheet; with a question, asks it straight away. */
  openAsk: (question?: string) => void
  /** A brief confirmation at the bottom of the screen. */
  notify: (message: string) => void
}

const AssistContext = createContext<Assist>({
  askEnabled: false,
  openPalette: () => {},
  openAsk: () => {},
  notify: () => {},
})
export const useAssist = () => useContext(AssistContext)

/* Owns the two overlays that sit above every page (the ⌘K palette and the Ask sheet), so any
   component can open them and only one is ever open at a time. Closing Ask cancels an answer
   that is still streaming; the conversation itself is kept until "New chat" or a reload. */
export function AssistProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [askLoaded, setAskLoaded] = useState(false)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const toastId = useRef(0)
  const toastTimer = useRef<number | undefined>(undefined)
  const { turns, busy, ask, stop, reset, retry } = useAsk()

  const closeAsk = useCallback(() => {
    setAskOpen(false)
    stop()
  }, [stop])

  const openPalette = useCallback(() => {
    closeAsk()
    setPaletteOpen(true)
  }, [closeAsk])

  const openAsk = useCallback(
    (question?: string) => {
      if (!ASK_ENABLED) return
      setPaletteOpen(false)
      setAskLoaded(true)
      setAskOpen(true)
      if (question?.trim()) void ask(question)
    },
    [ask],
  )

  const changeAskOpen = useCallback((open: boolean) => (open ? setAskOpen(true) : closeAsk()), [closeAsk])

  const notify = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ id: ++toastId.current, text })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // fetch the Ask sheet while the browser is idle, so the first open is instant
  useEffect(() => {
    if (!ASK_ENABLED) return
    const warm = () => void import("@/components/assist/AskPanel")
    // Safari has no requestIdleCallback
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm)
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(warm, 2500)
    return () => window.clearTimeout(id)
  }, [])

  // Cmd+K on macOS, Ctrl+K elsewhere
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      // nothing to search behind the loading screen
      if (document.querySelector("[data-initial-loader]")) return
      event.preventDefault()
      if (event.repeat) return
      if (paletteOpen) setPaletteOpen(false)
      else openPalette()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [paletteOpen, openPalette])

  const value = useMemo<Assist>(
    () => ({ askEnabled: ASK_ENABLED, openPalette, openAsk, notify }),
    [openPalette, openAsk, notify],
  )

  return (
    <AssistContext.Provider value={value}>
      {children}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {askLoaded && (
        <AskPanel
          open={askOpen}
          onOpenChange={changeAskOpen}
          turns={turns}
          busy={busy}
          onAsk={ask}
          onStop={stop}
          onReset={reset}
          onRetry={retry}
        />
      )}

      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-95 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            className="clay clay-sm animate-in fade-in-0 slide-in-from-bottom-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground motion-reduce:animate-none"
          >
            {toast.text}
          </p>
        )}
      </div>
    </AssistContext.Provider>
  )
}
