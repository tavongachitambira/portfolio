"use client"

import Link from "next/link"
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import { ArrowUp, Sparkles, Square, SquarePen, TriangleAlert, X } from "lucide-react"
import { Dialog } from "radix-ui"

import { useReturnFocus } from "@/components/assist/useReturnFocus"
import { Button } from "@/components/ui/button"
import type { AskTurn } from "@/hooks/useAsk"
import { LIMITS } from "@/lib/ask/messages"
import { citedNumbers, parseAnswer, type Inline } from "@/lib/ask/render"
import type { SourceRef } from "@/lib/ask/stream"
import { askSuggestions } from "@/lib/ask/suggestions"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

interface AskPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turns: AskTurn[]
  busy: boolean
  onAsk: (question: string) => void
  onStop: () => void
  onReset: () => void
  onRetry: (id: number) => void
}

const firstName = site.name.split(" ")[0]
const finePointer = () => window.matchMedia("(pointer: fine)").matches

/* The "Ask my portfolio" panel: a side sheet on desktop, a bottom sheet on a phone.
   It only renders what the page's own data produced: answers are parsed into a few safe shapes
   (lib/ask/render.ts) and [n] markers link to the passages they came from. */
export function AskPanel({ open, onOpenChange, turns, busy, onAsk, onStop, onReset, onRetry }: AskPanelProps) {
  const [draft, setDraft] = useState("")
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const { remember, restore } = useReturnFocus()

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || busy) return
    onAsk(question)
    setDraft("")
    // on a phone, drop the keyboard so the answer isn't hidden behind it
    if (finePointer()) fieldRef.current?.focus()
    else fieldRef.current?.blur()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  // grow with the text, up to a few lines
  useLayoutEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = "auto"
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`
  }, [draft, open])

  const closeAfter = () => onOpenChange(false)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-90 bg-background/55 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          // a keyboard on a phone would cover the sheet, so only a pointer device focuses the field
          onOpenAutoFocus={(event) => {
            remember()
            if (!finePointer()) return
            event.preventDefault()
            fieldRef.current?.focus()
          }}
          onCloseAutoFocus={restore}
          className={cn(
            "clay clay-lg fixed z-91 flex flex-col overflow-hidden outline-none [--clay-radius:1.75rem]",
            // phone: a sheet rising from the bottom edge
            "inset-x-2 bottom-2 h-[min(42rem,calc(100dvh-4rem))]",
            // desktop: a full-height sheet on the right
            "lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-3 lg:h-auto lg:w-[29rem]",
            "duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:slide-in-from-bottom-8",
            "lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-right-8 lg:data-[state=open]:slide-in-from-right-8",
            "motion-reduce:animate-none",
          )}
        >
          <header className="flex items-center gap-3 px-5 pt-5 pb-3">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-sm leading-tight font-bold">Ask my portfolio</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                AI answers from this site, may be wrong.
              </Dialog.Description>
            </div>
            {turns.length > 0 && (
              <Button variant="ghost" size="icon-sm" onClick={onReset} aria-label="New chat" title="New chat">
                <SquarePen />
              </Button>
            )}
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close" title="Close">
                <X />
              </Button>
            </Dialog.Close>
          </header>

          <Conversation turns={turns} busy={busy} onAsk={onAsk} onRetry={onRetry} onNavigate={closeAfter} />

          <form onSubmit={submit} className="px-4 pt-1 pb-4">
            <div className="clay-well flex items-end gap-2 p-2 pl-4 [--clay-radius:1.5rem]">
              <textarea
                ref={fieldRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={LIMITS.user}
                placeholder="Ask a question…"
                aria-label="Your question"
                enterKeyHint="send"
                className="scrollbar-clay max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-sm"
              />
              {busy ? (
                <Button type="button" variant="secondary" size="icon-sm" onClick={onStop} aria-label="Stop answering" title="Stop">
                  <Square className="fill-current" />
                </Button>
              ) : (
                <Button type="submit" size="icon-sm" disabled={!draft.trim()} aria-label="Send question" title="Send">
                  <ArrowUp />
                </Button>
              )}
            </div>
            {draft.length > LIMITS.user - 80 && (
              <p className="mt-1.5 pr-3 text-right text-[11px] text-muted-foreground tabular-nums" aria-hidden>
                {draft.length}/{LIMITS.user}
              </p>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- conversation ---------- */

function Conversation({
  turns,
  busy,
  onAsk,
  onRetry,
  onNavigate,
}: {
  turns: AskTurn[]
  busy: boolean
  onAsk: (question: string) => void
  onRetry: (id: number) => void
  onNavigate: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true) // follow the newest text, unless the reader has scrolled up
  const count = useRef(turns.length)

  const onScroll = () => {
    const el = scrollRef.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (turns.length !== count.current) {
      count.current = turns.length
      stick.current = true // a new question always scrolls into view
    }
    if (stick.current) el.scrollTop = el.scrollHeight
  }, [turns])

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
      aria-busy={busy}
      aria-label="Conversation"
      className="scrollbar-clay min-h-0 flex-1 overflow-y-auto px-5 py-3"
    >
      {turns.length === 0 ? (
        <div className="flex min-h-full flex-col justify-center gap-5 pb-6">
          <div>
            <p className="text-lg font-bold tracking-tight">What would you like to know?</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {firstName}&rsquo;s projects, skills and writing, and how to reach him. Answers come only from this site.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {askSuggestions.map((question) => (
              <li key={question}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAsk(question)}
                  className="h-auto min-h-9 py-2 text-left leading-snug font-medium whitespace-normal"
                >
                  {question}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className="space-y-6">
          {turns.map((turn, index) => (
            <li key={turn.id} className="space-y-3">
              <p className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-primary/12 px-3.5 py-2 text-sm leading-relaxed break-words text-foreground">
                {turn.question}
              </p>
              <Answer turn={turn} isLast={index === turns.length - 1} onRetry={onRetry} onNavigate={onNavigate} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Answer({
  turn,
  isLast,
  onRetry,
  onNavigate,
}: {
  turn: AskTurn
  isLast: boolean
  onRetry: (id: number) => void
  onNavigate: () => void
}) {
  const blocks = useMemo(() => parseAnswer(turn.answer, turn.sources.length), [turn.answer, turn.sources.length])
  const cited = useMemo(() => citedNumbers(blocks), [blocks])
  const streaming = turn.status === "streaming"

  return (
    <div className="text-sm leading-relaxed text-foreground/90">
      {blocks.map((block, i) =>
        block.kind === "p" ? (
          <p key={i} className="mb-2.5 break-words last:mb-0">
            <Inlines items={block.inline} sources={turn.sources} onNavigate={onNavigate} />
          </p>
        ) : (
          <ul key={i} className="mb-2.5 list-disc space-y-1 pl-5 marker:text-primary/60 last:mb-0">
            {block.items.map((item, j) => (
              <li key={j} className="break-words">
                <Inlines items={item} sources={turn.sources} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        ),
      )}

      {streaming && !turn.answer && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="flex gap-1">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-1.5 rounded-full bg-primary/70 motion-safe:animate-pulse"
                style={{ animationDelay: `${dot * 160}ms` }}
              />
            ))}
          </span>
          Searching the site…
        </p>
      )}

      {!streaming && cited.length > 0 && (
        <ul aria-label="Sources" className="mt-3 flex flex-wrap gap-1.5">
          {cited.map((n) => {
            const source = turn.sources[n - 1]
            return (
              source && (
                <li key={n}>
                  <SourceLink
                    source={source}
                    onNavigate={onNavigate}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-foreground/6 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="font-mono text-[10px] font-bold text-primary">{n}</span>
                    <span className="truncate">{source.title}</span>
                  </SourceLink>
                </li>
              )
            )
          })}
        </ul>
      )}

      {turn.status === "stopped" && <p className="mt-2 text-xs text-muted-foreground">Stopped.</p>}

      {turn.status === "error" && (
        <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-xs leading-relaxed text-foreground">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <span className="min-w-0 flex-1">{turn.error}</span>
          {isLast && turn.retryable !== false && (
            <button
              type="button"
              onClick={() => onRetry(turn.id)}
              className="shrink-0 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Inlines({ items, sources, onNavigate }: { items: Inline[]; sources: SourceRef[]; onNavigate: () => void }) {
  return (
    <>
      {items.map((item, i) => {
        switch (item.kind) {
          case "text":
            return <Fragment key={i}>{item.text}</Fragment>
          case "strong":
            return (
              <strong key={i} className="font-semibold text-foreground">
                {item.text}
              </strong>
            )
          case "code":
            return (
              <code key={i} className="rounded bg-foreground/8 px-1 py-0.5 font-mono text-[0.85em]">
                {item.text}
              </code>
            )
          case "cite": {
            const source = sources[item.n - 1]
            if (!source) return <Fragment key={i}>[{item.n}]</Fragment>
            return (
              <SourceLink
                key={i}
                source={source}
                onNavigate={onNavigate}
                label={`Source ${item.n}: ${source.title}`}
                className="mx-0.5 inline-flex h-5 min-w-5 -translate-y-px items-center justify-center rounded-full bg-primary/15 px-1 align-middle font-mono text-[10px] font-bold text-primary no-underline transition-colors hover:bg-primary/25 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                {item.n}
              </SourceLink>
            )
          }
        }
      })}
    </>
  )
}

/* Sources are our own pages (client-side navigation, and the sheet gets out of the way) or the
   owner's profiles (a new tab). Both come from the site's data, never from the model's text. */
function SourceLink({
  source,
  onNavigate,
  label,
  className,
  children,
}: {
  source: SourceRef
  onNavigate: () => void
  label?: string
  className?: string
  children: ReactNode
}) {
  if (/^https?:\/\//i.test(source.href)) {
    return (
      <a href={source.href} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={source.href} onClick={onNavigate} aria-label={label} className={className}>
      {children}
    </Link>
  )
}
