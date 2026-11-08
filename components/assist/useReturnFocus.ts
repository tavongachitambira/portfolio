"use client"

import { useCallback, useRef } from "react"

/* Radix hands focus back to a <Dialog.Trigger> when a dialog closes. These dialogs have none (they
   open from a shortcut, a button elsewhere, or a palette command), so without this focus would
   drop to <body> and a keyboard user would have to tab in from the top of the page again.

   remember: call when the dialog opens (onOpenAutoFocus). restore: pass to onCloseAutoFocus.
   skipNext: call when the close is the result of an action that moved the user somewhere else. */
export function useReturnFocus() {
  const target = useRef<HTMLElement | null>(null)
  const skip = useRef(false)

  const remember = useCallback(() => {
    const el = document.activeElement
    target.current = el instanceof HTMLElement && el !== document.body ? el : null
    skip.current = false
  }, [])

  const restore = useCallback((event: Event) => {
    event.preventDefault()
    if (!skip.current && target.current?.isConnected) target.current.focus()
    target.current = null
  }, [])

  const skipNext = useCallback(() => {
    skip.current = true
  }, [])

  return { remember, restore, skipNext }
}
