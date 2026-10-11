export type PostKind = "Article" | "Paper" | "Talk" | "Notes"

export interface Post {
  title: string
  summary: string
  kind: PostKind
  venue: string
  /** ISO date, YYYY-MM-DD */
  date: string
  href: string
}

/* DUMMY: replace with your real writing and publications. Newest first. */
export const posts: Post[] = [
  {
    title: "Why cross-tenant requests should return 404, not 403",
    summary: "A short note on information leaks in multi-tenant APIs and how SyncBoard avoids them.",
    kind: "Article",
    venue: "Personal blog",
    date: "2026-09-21",
    href: "#",
  },
  {
    title: "Yjs without the magic: how a CRDT merges two edits",
    summary: "Walking through the data structure that makes collaborative editing conflict-free.",
    kind: "Article",
    venue: "Dev.to",
    date: "2026-08-30",
    href: "#",
  },
  {
    title: "Evaluating anomaly detectors when you have almost no labels",
    summary: "Practical ways to compare models when ground truth is scarce.",
    kind: "Paper",
    venue: "University symposium",
    date: "2026-06-12",
    href: "#",
  },
  {
    title: "From notebook to endpoint: serving a scikit-learn model",
    summary: "Packaging, validation and latency budgets for a first production model.",
    kind: "Talk",
    venue: "Campus tech meetup",
    date: "2026-04-18",
    href: "#",
  },
  {
    title: "Optimistic UI with rollback: a state machine approach",
    summary: "Modelling pending, confirmed and rejected updates explicitly.",
    kind: "Article",
    venue: "Personal blog",
    date: "2026-02-03",
    href: "#",
  },
  {
    title: "Notes on backpropagation, from scratch",
    summary: "Linear algebra refresher and a tiny autograd engine in Python.",
    kind: "Notes",
    venue: "GitHub",
    date: "2025-11-09",
    href: "#",
  },
  {
    title: "Designing GraphQL schemas that survive a rewrite",
    summary: "Naming, nullability and pagination choices that age well.",
    kind: "Article",
    venue: "Dev.to",
    date: "2025-09-14",
    href: "#",
  },
]

export const WRITING_PREVIEW_COUNT = 4
export const previewPosts = posts.slice(0, WRITING_PREVIEW_COUNT)

const fmt = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
export const formatPostDate = (iso: string) => fmt.format(new Date(`${iso}T00:00:00`))
export const postYear = (iso: string) => iso.slice(0, 4)