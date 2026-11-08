"use client"

import { useSyncExternalStore } from "react"
import { Search, Sparkles } from "lucide-react"

import { useAssist } from "@/components/assist/AssistProvider"
import { cn } from "@/lib/utils"

const never = () => () => {}
const isApple = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

const segment =
  "flex h-9 items-center gap-2 rounded-full text-sm font-medium text-foreground/75 transition-[background-color,color,transform] duration-200 hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"

/* The always-visible way in: one frosted-glass bar holding the ⌘K search and, when it is switched on,
   Ask. Each page decides where it sits (className), so it can follow that page's layout. */
export function AssistTriggers({ className }: { className?: string }) {
  const { askEnabled, openPalette, openAsk } = useAssist()
  // the server can't know the platform, so it renders "Ctrl" and a Mac corrects it after hydration
  const apple = useSyncExternalStore(never, isApple, () => false)

  return (
    <div
      role="group"
      aria-label="Search and ask"
      className={cn(
        "flex items-center rounded-full border border-foreground/15 bg-background/85 p-1",
        // frosted where the browser can blur what is behind it, a little more solid where it can't
        "supports-[backdrop-filter]:bg-foreground/[0.07] backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6),inset_0_1px_0_0_rgb(255_255_255/0.2)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-label="Search pages and actions"
        aria-keyshortcuts={apple ? "Meta+K" : "Control+K"}
        className={cn(segment, "px-3.5 max-sm:size-9 max-sm:justify-center max-sm:px-0 sm:min-w-52")}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="max-sm:sr-only">Search</span>
        <kbd
          aria-hidden
          className="ml-auto hidden rounded-md border border-foreground/12 bg-foreground/8 px-1.5 py-1 font-sans text-[11px] leading-none font-medium text-foreground/55 sm:inline"
        >
          {apple ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      {askEnabled && (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-foreground/15" />
          <button
            type="button"
            onClick={() => openAsk()}
            aria-haspopup="dialog"
            aria-label="Ask my portfolio"
            className={cn(segment, "px-3.5 max-sm:size-9 max-sm:justify-center max-sm:px-0")}
          >
            <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="max-sm:sr-only">Ask</span>
          </button>
        </>
      )}
    </div>
  )
}
