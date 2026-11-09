"use client"

import { useSyncExternalStore } from "react"
import { Search, Sparkles } from "lucide-react"

import { useAssist } from "@/components/assist/AssistProvider"
import { cn } from "@/lib/utils"

const never = () => () => {}
const isApple = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

const focus = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
const press = "transition-[background-color,color,transform] duration-200 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"

const segment = cn(
  "flex h-9 items-center gap-2 rounded-full text-sm font-medium text-foreground/75 hover:bg-foreground/10 hover:text-foreground",
  focus,
  press,
)
// the bare icon button used inside another bar (the phone's section pill)
const bare = cn(
  "grid size-8 place-items-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
  focus,
  press,
)

/* The always-visible way in: ⌘K search and, when it is switched on, Ask.

   "bar" is a frosted-glass pill that sits in the flow, never over content. It spells out its
   labels only when the row it sits in is wide enough for them (a container query, so the
   parent row must be an `@container`); narrower, it shrinks to two icons. "icons" is the same
   pair without the glass, for use inside a bar that already exists. */
export function AssistTriggers({ className, variant = "bar" }: { className?: string; variant?: "bar" | "icons" }) {
  const { askEnabled, openPalette, openAsk } = useAssist()
  // the server can't know the platform, so it renders "Ctrl" and a Mac corrects it after hydration
  const apple = useSyncExternalStore(never, isApple, () => false)
  const shortcut = apple ? "⌘K" : "Ctrl K"

  const search = {
    type: "button" as const,
    onClick: openPalette,
    "aria-haspopup": "dialog" as const,
    "aria-label": "Search pages and actions",
    "aria-keyshortcuts": apple ? "Meta+K" : "Control+K",
    title: `Search · ${shortcut}`,
  }
  const ask = {
    type: "button" as const,
    onClick: () => openAsk(),
    "aria-haspopup": "dialog" as const,
    "aria-label": "Ask my portfolio",
    title: "Ask my portfolio",
  }

  if (variant === "icons") {
    return (
      <div role="group" aria-label="Search and ask" className={cn("flex items-center gap-0.5", className)}>
        <button {...search} className={bare}>
          <Search className="size-4" aria-hidden />
        </button>
        {askEnabled && (
          <button {...ask} className={bare}>
            <Sparkles className="size-4 text-primary" aria-hidden />
          </button>
        )}
      </div>
    )
  }

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
        {...search}
        className={cn(segment, "w-9 justify-center @min-[25rem]:w-auto @min-[25rem]:min-w-40 @min-[25rem]:justify-start @min-[25rem]:px-3.5")}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="sr-only @min-[25rem]:not-sr-only">Search</span>
        <kbd
          aria-hidden
          className="ml-auto hidden rounded-md border border-foreground/12 bg-foreground/8 px-1.5 py-1 font-sans text-[11px] leading-none font-medium text-foreground/55 @min-[25rem]:inline"
        >
          {shortcut}
        </kbd>
      </button>

      {askEnabled && (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-foreground/15" />
          <button {...ask} className={cn(segment, "w-9 justify-center @min-[25rem]:w-auto @min-[25rem]:px-3.5")}>
            <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="sr-only @min-[25rem]:not-sr-only">Ask</span>
          </button>
        </>
      )}
    </div>
  )
}
