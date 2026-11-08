"use client"

import { useRouter } from "next/navigation"
import { memo, useCallback, useEffect, useId, useMemo, useState, type KeyboardEvent } from "react"
import { Dialog } from "radix-ui"
import {
  Copy,
  CornerDownLeft,
  Cpu,
  FileText,
  FolderKanban,
  Layers,
  Mail,
  PenLine,
  Rss,
  Search,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react"
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa"
import type { IconType } from "react-icons"

import { useAssist } from "@/components/assist/AssistProvider"
import { useReturnFocus } from "@/components/assist/useReturnFocus"
import { copyText } from "@/lib/clipboard"
import { buildCommands, groupCommands, searchCommands, type Command, type CommandAction } from "@/lib/palette"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

const icons: Record<string, LucideIcon | IconType> = {
  profile: User,
  projects: FolderKanban,
  writing: PenLine,
  skills: Cpu,
  connect: Mail,
  case: Layers,
  copy: Copy,
  resume: FileText,
  ask: Sparkles,
  rss: Rss,
  github: FaGithub,
  linkedin: FaLinkedin,
  instagram: FaInstagram,
}

/* Pages we have left stay mounted but hidden (Next keeps them to restore their state), so an id such as
   #connect can exist twice. Pick the copy that is actually on screen. */
const visibleById = (id: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`#${CSS.escape(id)}`)).find((el) => el.getClientRects().length > 0) ?? null

/* Scrolls to a section of the home page, or goes there first when on another page. */
function goToSection(id: string, push: (href: string) => void) {
  const el = visibleById(id)
  if (window.location.pathname === "/" && el) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // every section carries a scroll-margin, so this lands exactly where the nav links do
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  } else {
    push(`/#${id}`)
  }
}

/* The dialog shell. The part with state (the query, the highlighted row) lives in PaletteBody,
   which Radix mounts only while the palette is open, so every opening starts clean. */
export const CommandPalette = memo(function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { remember, restore, skipNext } = useReturnFocus()

  // running a command closes the palette; focus belongs to wherever that command went
  const finish = useCallback(() => {
    skipNext()
    onOpenChange(false)
  }, [skipNext, onOpenChange])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-90 bg-background/55 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          onOpenAutoFocus={remember}
          onCloseAutoFocus={restore}
          className="clay clay-lg fixed top-[12vh] left-1/2 z-91 flex max-h-[min(30rem,76dvh)] w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col overflow-hidden outline-none [--clay-radius:1.75rem] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search pages and actions. Use the arrow keys to move, Enter to run, Escape to close.
          </Dialog.Description>
          <PaletteBody onFinish={finish} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

function PaletteBody({ onFinish }: { onFinish: () => void }) {
  const router = useRouter()
  const { askEnabled, openAsk, notify } = useAssist()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const listId = useId()

  const commands = useMemo(() => buildCommands({ askEnabled }), [askEnabled])
  const results = useMemo(() => searchCommands(commands, query, askEnabled), [commands, query, askEnabled])
  const filtering = query.trim().length > 0
  const current = Math.min(active, Math.max(results.length - 1, 0))

  // what the list shows: ranked and flat while typing, grouped when the box is empty
  const sections = useMemo(
    () => (filtering ? [{ group: null, items: results }] : groupCommands(results)),
    [filtering, results],
  )
  const position = useMemo(() => new Map(results.map((command, i) => [command.id, i])), [results])

  const execute = useCallback(
    async (action: CommandAction) => {
      switch (action.type) {
        case "section":
          goToSection(action.id, router.push)
          break
        case "route":
          router.push(action.href)
          break
        case "external":
          window.open(action.href, "_blank", "noopener,noreferrer")
          break
        case "copy-email":
          notify((await copyText(site.email)) ? "Email address copied" : `Email: ${site.email}`)
          break
        case "ask":
          openAsk(action.question)
          break
      }
    },
    [router, notify, openAsk],
  )

  const run = (command: Command) => {
    onFinish()
    // after the dialog has started closing, so its focus handling doesn't fight the action
    window.setTimeout(() => void execute(command.action), 0)
  }

  // keep the highlighted row in view while arrowing through a long list
  useEffect(() => {
    document.getElementById(`${listId}-${current}`)?.scrollIntoView({ block: "nearest" })
  }, [current, listId])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    const last = results.length - 1
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActive(current >= last ? 0 : current + 1)
        break
      case "ArrowUp":
        event.preventDefault()
        setActive(current <= 0 ? last : current - 1)
        break
      case "Home":
        event.preventDefault()
        setActive(0)
        break
      case "End":
        event.preventDefault()
        setActive(Math.max(last, 0))
        break
      case "Enter":
        event.preventDefault()
        if (results[current]) run(results[current])
        break
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length ? `${listId}-${current}` : undefined}
          aria-autocomplete="list"
          aria-label="Search commands"
          placeholder={askEnabled ? "Search, or ask a question…" : "Search pages and actions…"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <kbd className="hidden rounded-md bg-foreground/8 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">Esc</kbd>
      </div>

      <div id={listId} role="listbox" aria-label="Commands" className="scrollbar-clay min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {results.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results for “{query.trim()}”.</p>
        )}
        {sections.map(({ group, items }) => (
          <div key={group ?? "results"} role={group ? "group" : "presentation"} aria-label={group ?? undefined}>
            {group && (
              <div aria-hidden className="px-3 pt-3 pb-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70 uppercase">
                {group}
              </div>
            )}
            {items.map((command) => {
              const i = position.get(command.id) ?? 0
              const isActive = i === current
              const Icon = icons[command.icon] ?? Search
              return (
                <div
                  key={command.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseMove={() => !isActive && setActive(i)}
                  onClick={() => run(command)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive ? "bg-primary/12 text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{command.label}</span>
                  {command.hint && (
                    <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-muted-foreground/70 sm:inline">{command.hint}</span>
                  )}
                  {isActive && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" aria-hidden />}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div aria-hidden className="hidden items-center gap-4 border-t border-border px-5 py-2.5 font-mono text-[10px] text-muted-foreground/70 sm:flex">
        <span>↑↓ move</span>
        <span>↵ run</span>
        <span>esc close</span>
      </div>
    </>
  )
}
