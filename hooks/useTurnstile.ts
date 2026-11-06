"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

/* Cloudflare Turnstile, loaded only when it's needed.

   The widget renders in "interaction-only" mode: invisible for nearly everyone, and it only shows
   itself when Cloudflare wants a human to click. The script is injected on the first interaction
   with the form (prepare), not on page load, so it costs nothing for visitors who never write. */

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
  ready?: (callback: () => void) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

let loading: Promise<TurnstileApi> | null = null

/** Adds Cloudflare's script once. A failed load isn't cached, so a later attempt can succeed. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading

  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => {
      const api = window.turnstile
      if (!api) {
        loading = null
        reject(new Error("Turnstile did not initialise"))
      } else if (api.ready) api.ready(() => resolve(api))
      else resolve(api)
    }
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error("Turnstile script failed to load"))
    }
    document.head.appendChild(script)
  })
  return loading
}

export interface TurnstileHandle {
  /** callback ref for an empty div; the widget renders inside it */
  attach: (element: HTMLDivElement | null) => void
  /** false when no site key is configured: the form then skips verification entirely */
  enabled: boolean
  /** start loading and solving ahead of the submit; safe to call any number of times */
  prepare: () => void
  /** resolves with a fresh single-use token; rejects if verification can't complete */
  getToken: (timeoutMs?: number) => Promise<string>
  /** throw the used token away and start on the next one */
  reset: () => void
}

export function useTurnstile({ siteKey, action }: { siteKey?: string; action: string }): TurnstileHandle {
  const { resolvedTheme } = useTheme()
  const [container, attach] = useState<HTMLDivElement | null>(null)
  const widgetId = useRef<string | null>(null)
  const started = useRef(false)
  const token = useRef<string | null>(null)
  const waiters = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void }[]>([])

  const settle = useCallback((value: string | null, error?: Error) => {
    for (const w of waiters.current.splice(0)) {
      if (value) w.resolve(value)
      else w.reject(error ?? new Error("Verification failed"))
    }
  }, [])

  const prepare = useCallback(() => {
    if (!siteKey || started.current) return
    started.current = true

    loadTurnstile()
      .then((api) => {
        if (!container) {
          started.current = false
          return
        }
        widgetId.current = api.render(container, {
          sitekey: siteKey,
          action,
          appearance: "interaction-only",
          size: "flexible",
          theme: resolvedTheme === "light" ? "light" : "dark",
          callback: (value: string) => {
            token.current = value
            settle(value)
          },
          // Cloudflare retries on its own after an error; only waiters give up
          "error-callback": () => {
            token.current = null
            settle(null, new Error("Verification failed"))
          },
          "expired-callback": () => {
            token.current = null
          },
          "timeout-callback": () => {
            token.current = null
          },
        })
      })
      .catch((error: Error) => {
        started.current = false // let the next attempt retry the script
        settle(null, error)
      })
  }, [siteKey, action, resolvedTheme, container, settle])

  const getToken = useCallback(
    (timeoutMs = 12_000) => {
      if (!siteKey) return Promise.resolve("")
      prepare()
      if (token.current) return Promise.resolve(token.current)

      return new Promise<string>((resolve, reject) => {
        const waiter = {
          resolve: (t: string) => {
            window.clearTimeout(timer)
            resolve(t)
          },
          reject: (e: Error) => {
            window.clearTimeout(timer)
            reject(e)
          },
        }
        const timer = window.setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== waiter)
          reject(new Error("Verification timed out"))
        }, timeoutMs)
        waiters.current.push(waiter)
      })
    },
    [siteKey, prepare],
  )

  const reset = useCallback(() => {
    token.current = null
    if (widgetId.current !== null) window.turnstile?.reset(widgetId.current)
  }, [])

  useEffect(
    () => () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current)
      widgetId.current = null
      started.current = false
    },
    [],
  )

  return { attach, enabled: Boolean(siteKey), prepare, getToken, reset }
}
