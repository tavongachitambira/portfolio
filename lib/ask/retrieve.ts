import { buildCorpus, type Chunk } from "@/lib/ask/corpus"

/* Plain BM25 over the corpus. No embeddings, no vector store: the whole site is a few dozen short
   passages, so keyword ranking is fast, free, deterministic and easy to test.
   If nothing scores, the API never calls the model at all. That is the first line of defence
   against made-up answers. */

const STOP = new Set(
  ("a an and are as at be but by can could do does for from has have how i if in into is it its me my of on or our so than that the their them then there these they this to us was we were what when where which who why will with would you your " +
    "tell about please give show explain describe hi hello hey thanks thank also any some more most very just only " +
    "tavonga chitambira he his him she her").split(" "),
)

export const stem = (w: string) => {
  if (w.length > 5 && w.endsWith("ies")) return `${w.slice(0, -3)}y`
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3)
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1)
  return w
}

/** Different words for the same thing, folded together before ranking. */
const SYNONYMS: Record<string, string> = {
  authentication: "auth",
  authenticate: "auth",
  authorization: "auth",
  login: "auth",
  signin: "auth",
  websocket: "socket",
  realtime: "real",
}

export const tokenize = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => stem(SYNONYMS[t] ?? t))

/** "What is X?" wants the overview, not whichever detail passage happens to repeat X the most. */
const DEFINITION = /\b(what is|what's|what are|who is|tell me about|about|overview|explain|describe)\b/i
const OVERVIEW_ID = /^(about|project-[a-z0-9]+)$/
const OVERVIEW_BOOST = 1.8

const K1 = 1.2
const B = 0.75
const TITLE_BOOST = 3
/** A word in a passage's title is that passage's subject. However common it is across the site
    (every SyncBoard passage says "SyncBoard"), a title match never counts for less than this. */
const TITLE_IDF_FLOOR = 1
/** A hit must beat this to count; tuned against tests/ask-retrieval.test.ts. */
export const MIN_SCORE = 1.2

interface Index {
  chunks: Chunk[]
  titleTerms: Set<string>[]
  tf: Map<string, number>[]
  len: number[]
  avg: number
  df: Map<string, number>
}

let cached: Index | null = null

function index(): Index {
  if (cached) return cached
  const chunks = buildCorpus()
  const tf = chunks.map((c) => {
    const m = new Map<string, number>()
    for (const t of tokenize(c.text)) m.set(t, (m.get(t) ?? 0) + 1)
    for (const t of tokenize(c.title)) m.set(t, (m.get(t) ?? 0) + TITLE_BOOST)
    return m
  })
  const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0))
  const df = new Map<string, number>()
  for (const m of tf) for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  const titleTerms = chunks.map((c) => new Set(tokenize(c.title)))
  cached = { chunks, titleTerms, tf, len, avg: len.reduce((a, b) => a + b, 0) / len.length, df }
  return cached
}

export interface Hit {
  chunk: Chunk
  score: number
}

export function retrieve(query: string, k = 5): Hit[] {
  const ix = index()
  const terms = [...new Set(tokenize(query))]
  if (!terms.length) return []

  const n = ix.chunks.length
  const definition = DEFINITION.test(query)
  const hits = ix.chunks.map((chunk, i): Hit => {
    let score = 0
    for (const t of terms) {
      const f = ix.tf[i].get(t)
      if (!f) continue
      const natural = Math.log(1 + (n - (ix.df.get(t) ?? 0) + 0.5) / ((ix.df.get(t) ?? 0) + 0.5))
      const idf = ix.titleTerms[i].has(t) ? Math.max(natural, TITLE_IDF_FLOOR) : natural
      score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * ix.len[i]) / ix.avg))
    }
    if (definition && OVERVIEW_ID.test(chunk.id)) score *= OVERVIEW_BOOST
    return { chunk, score }
  })

  return hits
    .filter((h) => h.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}
