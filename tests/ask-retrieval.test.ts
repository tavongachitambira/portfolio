import { describe, expect, it } from "vitest"

import { buildCorpus } from "@/lib/ask/corpus"
import { retrieve } from "@/lib/ask/retrieve"

/* The eval set: real questions a visitor might type, and where the answer lives.
   If you change the data or the ranker, this tells you whether Ask still finds the right passage. */
const answerable: [question: string, expectedInTop3: string][] = [
  ["What is SyncBoard?", "project-syncboard"],
  ["What stack does SyncBoard use?", "project-syncboard-stack"],
  ["How does SyncBoard handle conflicting edits?", "project-syncboard-decision-2"],
  ["Why return 404 instead of 403 across tenants?", "project-syncboard-decision-5"],
  ["How does SyncBoard scale websockets?", "project-syncboard-decision-1"],
  ["How is billing metered without blocking sockets?", "project-syncboard-decision-3"],
  ["How does authentication work in SyncBoard?", "project-syncboard-decision-4"],
  ["What is EduCampus?", "project-educampus"],
  ["What is CampusPilot?", "project-educampus"],
  ["How many issues did the EduCampus audit fix?", "project-educampus-status"],
  ["How did you handle auth between Next.js and Express?", "project-educampus-decision-3"],
  ["What's your email address?", "contact"],
  ["Where can I find your GitHub and LinkedIn?", "contact"],
  ["Do you have a resume?", "contact"],
  ["Is Tavonga learning machine learning?", "about"],
  ["What frontend skills does he have?", "skills-frontend"],
  ["Which languages and tools is he learning right now?", "skills-ml"],
  ["Has he published any articles?", "writing-1"],
  ["What is this website built with?", "site"],
  ["Is there a keyboard shortcut for the command palette?", "site"],
]

const outOfScope = [
  "What's the weather in Pune?",
  "How much do you earn?",
  "Give me a pizza recipe",
  "Who won the cricket match yesterday?",
  "What is the capital of France?",
  "ok",
  "?!",
]

describe("retrieval eval", () => {
  it.each(answerable)("%s", (question, expected) => {
    const ids = retrieve(question, 3).map((h) => h.chunk.id)
    expect(ids).toContain(expected)
  })

  it("finds the right passage at rank 1 for most questions", () => {
    const top1 = answerable.filter(([q, id]) => retrieve(q, 1)[0]?.chunk.id === id).length
    expect(top1 / answerable.length).toBeGreaterThanOrEqual(0.6)
  })

  it.each(outOfScope)("finds nothing for %j, so the model is never called", (question) => {
    expect(retrieve(question)).toEqual([])
  })
})

describe("corpus", () => {
  const corpus = buildCorpus()

  it("has unique ids and non-empty passages", () => {
    expect(new Set(corpus.map((c) => c.id)).size).toBe(corpus.length)
    for (const c of corpus) {
      expect(c.text.trim().length).toBeGreaterThan(20)
      expect(c.href).toMatch(/^(\/|https?:\/\/)/)
    }
  })

  it("says plainly when a post isn't published, instead of linking nowhere", () => {
    const draft = corpus.find((c) => c.id === "writing-1")!
    expect(draft.text).toContain("Not published yet")
    expect(draft.href).toBe("/writing")
  })
})
