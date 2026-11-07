"use client"

import { useSyncExternalStore } from "react"
import { Search, Sparkles } from "lucide-react"

import { useAssist } from "@/components/assist/AssistProvider"
import { Button } from "@/components/ui/button"

const never = () => () => {}
const isApple = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

/* The two always-visible ways in: the ⌘K palette, and Ask when it is switched on. */
export function AssistTriggers() {
  const { askEnabled, openPalette, openAsk } = useAssist()
  // the server can't know the platform, so it renders "Ctrl" and a Mac corrects it after hydration
  const apple = useSyncExternalStore(never, isApple, () => false)

  return (
    <div className="fixed top-16 right-4 z-60 flex items-center gap-2 lg:top-6 lg:right-6">
      {askEnabled && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openAsk()}
          aria-haspopup="dialog"
          aria-label="Ask my portfolio"
          className="max-sm:size-10 max-sm:px-0"
        >
          <Sparkles className="text-primary" />
          <span className="max-sm:sr-only">Ask</span>
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-label="Search pages and actions"
        aria-keyshortcuts={apple ? "Meta+K" : "Control+K"}
        className="max-sm:size-10 max-sm:px-0"
      >
        <Search />
        <span className="max-sm:sr-only">Search</span>
        <kbd aria-hidden className="hidden rounded-md bg-foreground/8 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline">
          {apple ? "⌘K" : "Ctrl K"}
        </kbd>
      </Button>
    </div>
  )
}
