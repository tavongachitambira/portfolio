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
// Was: the bare icon button used by the dock and by the pair in the phone's section pill. Both are clay now (puff).
// const bare = cn(
//   "grid size-8 place-items-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
//   focus,
//   press,
// )

// The icon button of the dock and of the phone's pair: puffy clay, with its own hover lift and press (styles/clay.css).
// Add `clay-flat` for the quiet kind that only rises when you reach for it, `clay-glaze` for the glowing one.
const puff = cn("clay clay-btn grid size-9 shrink-0 place-items-center rounded-full", focus)
// The line between Search and Ask: a groove cut into the clay (a tiny well), not a drawn rule.
const groove = "clay-well mx-1 h-5 w-[3px] shrink-0 [--clay-radius:999px] [--clay-elev:var(--e-well-sm)]"

/* The always-visible way in: ⌘K search and, when it is switched on, Ask.

   "bar" is a frosted-glass pill that sits in the flow, never over content. It spells out its
   labels only when the row it sits in is wide enough for them (a container query, so the
   parent row must be an `@container`); narrower, it shrinks to two icons.

   "topbar" is the landing page's clay bar across the top of the right column (desktop): it fills the
   width its parent gives it and is as tall as --bar-h (its vertical padding is --bar-py, in globals.css).
   "icons" lives in the phone's section pill (components/layout/MobileNav): Search, a groove, and Ask as
   the one glowing button. "dock" is the corner pill the inner pages use (components/assist/AssistDock
   hides it on the landing page): a raised clay pill with the same two buttons and the groove between
   them. */
export function AssistTriggers({
  className,
  variant = "bar",
}: {
  className?: string
  variant?: "bar" | "icons" | "dock" | "topbar"
}) {
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

  if (variant === "topbar") {
    // Clay, following the depth rules in styles/clay.css: the bar is raised, the search sits in a recessed
    // well (it is where you type), and Ask is the one glowing button (the call to action).
    // --clay-radius is inherited, so the well and the button are pills too; the well sets its own
    // --clay-elev because it would otherwise inherit the bar's raised shadow.
    return (
      <div
        role="group"
        aria-label="Search and ask"
        // Was: "clay clay-sm flex h-(--bar-h) items-center gap-1.5 p-1 [--clay-radius:999px]". The padding now comes from
        // --bar-py / --bar-px (globals.css, .landing), so one line there slims or fattens the bar.
        className={cn(
          "clay clay-sm flex h-(--bar-h) items-center gap-1.5 px-[var(--bar-px,0.125rem)] py-[var(--bar-py,0.125rem)] [--clay-radius:999px]",
          className,
        )}
      >
        <button
          {...search}
          className={cn(
            "clay-well flex h-full min-w-0 flex-1 items-center gap-3 px-4 text-left text-sm font-medium text-muted-foreground [--clay-elev:var(--e-well)]",
            "transition-colors duration-200 hover:text-foreground motion-reduce:transition-none",
            focus,
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Search pages and actions</span>
          <kbd
            aria-hidden
            className="ml-auto shrink-0 rounded-md border border-foreground/12 bg-foreground/8 px-1.5 py-1 font-sans text-[11px] leading-none font-medium text-foreground/55"
          >
            {shortcut}
          </kbd>
        </button>

        {askEnabled && (
          <button
            {...ask}
            className={cn(
              "clay clay-glaze clay-btn flex h-full shrink-0 items-center gap-2 px-5 text-sm font-semibold text-on-glaze",
              focus,
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            Ask
          </button>
        )}
      </div>
    )
  }

  if (variant === "dock") {
    // A small corner dock: icons only, fixed to the bottom-right on every screen size. A raised clay pill
    // holding two puffy buttons with a groove between them; the sparkle stays in the accent colour so it
    // still reads as "something to try".
    // Was (quiet frosted glass, bare icons): className "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-0.5 rounded-full border border-foreground/10 bg-background/70 p-1 backdrop-blur-md shadow-[0_6px_20px_-10px_rgb(0_0_0/0.55)]",
    // its buttons were `bare` (size-9, hover:bg-foreground/10) and there was no line between them.
    return (
      <div
        role="group"
        aria-label="Search and ask"
        className={cn(
          "clay clay-sm fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center p-1 [--clay-radius:999px]",
          className,
        )}
      >
        <button {...search} className={cn(puff, "text-foreground/70 hover:text-foreground")}>
          <Search className="size-[18px]" aria-hidden />
        </button>
        {askEnabled && (
          <>
            <span aria-hidden className={groove} />
            <button {...ask} className={puff}>
              <Sparkles className="size-[18px] text-primary" aria-hidden />
            </button>
          </>
        )}
      </div>
    )
  }

  if (variant === "icons") {
    // The pair at the right of the phone's section pill: the same pieces as the dock, with a groove between
    // them, but Ask is the one glowing button, glazed like "Explore my work" (the default Button is
    // clay + clay-glaze + clay-btn + text-on-glaze, and so is this).
    // Was (bare icons, size-9 tap targets, no line between them, the sparkle in text-primary):
    // <div className="flex items-center gap-0.5"> <button className={cn(bare, "size-9")}> ... </button> </div>
    return (
      <div role="group" aria-label="Search and ask" className={cn("flex items-center", className)}>
        <button {...search} className={cn(puff, "text-foreground/70 hover:text-foreground")}>
          <Search className="size-4" aria-hidden />
        </button>
        {askEnabled && (
          <>
            <span aria-hidden className={groove} />
            <button {...ask} className={cn(puff, "clay-glaze text-on-glaze")}>
              <Sparkles className="size-4" aria-hidden />
            </button>
          </>
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
