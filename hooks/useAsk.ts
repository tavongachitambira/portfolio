"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"

import { buildRequestMessages, failureMessage, readEvents } from "@/lib/ask/client"
import { LIMITS } from "@/lib/ask/messages"
import type { SourceRef } from "@/lib/ask/stream"

export type TurnStatus = "streaming" | "done" | "stopped" | "error"

export interface AskTurn {
  id: number
  question: string
  answer: string
  sources: SourceRef[]
  status: TurnStatus
  /** what to tell the visitor, when status is "error" */
  error?: string
  /** whether asking again could help (false for a rate limit or a rejected question) */
  retryable?: boolean
}

type Action =
  | { type: "start"; id: number; question: string }
  | { type: "sources"; id: number; sources: SourceRef[] }
  | { type: "text"; id: number; text: string }
  | { type: "end"; id: number; status: Exclude<TurnStatus, "streaming">; error?: string; retryable?: boolean }
  | { type: "drop"; id: number }
  | { type: "clear" }

const patch = (turns: AskTurn[], id: number, change: (turn: AskTurn) => AskTurn) =>
  turns.map((turn) => (turn.id === id ? change(turn) : turn))

function reducer(turns: AskTurn[], action: Action): AskTurn[] {
  switch (action.type) {
    case "start":
      return [...turns, { id: action.id, question: action.question, answer: "", sources: [], status: "streaming" }]
    case "sources":
      return patch(turns, action.id, (turn) => ({ ...turn, sources: action.sources }))
    case "text":
      return patch(turns, action.id, (turn) => ({ ...turn, answer: turn.answer + action.text }))
    case "end":
      return patch(turns, action.id, (turn) => ({
        ...turn,
        status: action.status,
        error: action.error,
        retryable: action.retryable,
      }))
    case "drop":
      return turns.filter((turn) => turn.id !== action.id)
    case "clear":
      return []
  }
}

/* The conversation with /api/ask: one question at a time, streamed in, and cancellable.
   The callbacks keep the same identity for the life of the page, so putting them in a context
   doesn't re-render every consumer on each streamed word. */
export function useAsk() {
  const [turns, dispatch] = useReducer(reducer, [])
  const turnsRef = useRef(turns)
  const controller = useRef<AbortController | null>(null)
  const nextId = useRef(0)

  useEffect(() => {
    turnsRef.current = turns
  }, [turns])

  // leaving the page cancels whatever is still streaming
  useEffect(() => () => controller.current?.abort(), [])

  const ask = useCallback(async (raw: string) => {
    const question = raw.trim().slice(0, LIMITS.user)
    // one answer at a time: a second question while one is streaming is ignored
    if (!question || controller.current) return

    const abort = new AbortController()
    controller.current = abort
    const id = ++nextId.current
    // only answers that finished go back to the model as context
    const history = turnsRef.current.filter((turn) => turn.status === "done")
    dispatch({ type: "start", id, question })

    let received = ""
    let ended = false
    const end = (status: "done" | "stopped" | "error", error?: string, retryable = true) => {
      if (ended) return
      ended = true
      dispatch({ type: "end", id, status, error, retryable })
    }

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: buildRequestMessages(history, question) }),
        signal: abort.signal,
      })

      if (!response.ok || !response.body) {
        const detail = await response
          .json()
          .then((body: { error?: unknown }) => (typeof body?.error === "string" ? body.error : undefined))
          .catch(() => undefined)
        // a 4xx (rate limit, rejected question) will answer the same way if asked again at once
        end("error", failureMessage(response.status, detail), response.status >= 500)
        return
      }

      for await (const event of readEvents(response.body)) {
        if (event.type === "sources") {
          dispatch({ type: "sources", id, sources: event.sources })
        } else if (event.type === "text") {
          received += event.text
          dispatch({ type: "text", id, text: event.text })
        } else if (event.type === "done") {
          if (received.trim()) end("done")
          else end("error", "No answer came back. Please try again.")
          return
        } else {
          end("error", event.message)
          return
        }
      }
      // the stream closed without a final event
      end("error", "The answer was cut off. Please try again.")
    } catch {
      if (abort.signal.aborted) end("stopped")
      else end("error", "Couldn't reach the server. Check your connection and try again.")
    } finally {
      if (controller.current === abort) controller.current = null
    }
  }, [])

  /** Stops the answer that is streaming; what has arrived stays on screen. */
  const stop = useCallback(() => {
    controller.current?.abort()
    // free the slot now, so a question asked straight after doesn't hit "one at a time"
    controller.current = null
  }, [])

  /** Starts a new conversation. */
  const reset = useCallback(() => {
    stop()
    dispatch({ type: "clear" })
  }, [stop])

  /** Asks a failed question again, in its place. */
  const retry = useCallback(
    (id: number) => {
      const turn = turnsRef.current.find((t) => t.id === id)
      if (!turn || turn.status === "streaming" || controller.current) return
      dispatch({ type: "drop", id })
      void ask(turn.question)
    },
    [ask],
  )

  const busy = turns.length > 0 && turns[turns.length - 1].status === "streaming"
  return { turns, busy, ask, stop, reset, retry }
}
