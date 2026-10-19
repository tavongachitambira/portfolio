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
  },{
    title: "Why crosrs-tenant requests should return 404, not 403",
    summary: "A short note on information leaks in multi-tenant APIs and how SyncBoard avoids them.",
    kind: "Article",
    venue: "Personal blog",
    date: "2026-09-24",
    href: "#",
  },{
    title: "Why crotss-tenant requests should return 404, not 403",
    summary: "A short note on information leaks in multi-tenant APIs and how SyncBoard avoids them.",
    kind: "Article",
    venue: "Personal blog",
    date: "2026-09-23",
    href: "#",
  },
 
]

export const WRITING_PREVIEW_COUNT = 4
export const previewPosts = posts.slice(0, WRITING_PREVIEW_COUNT)

const fmt = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
export const formatPostDate = (iso: string) => fmt.format(new Date(`${iso}T00:00:00`))
export const postYear = (iso: string) => iso.slice(0, 4)