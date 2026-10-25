"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { ComingSoon } from "@/components/ui/coming-soon"
import { fadeUp } from "@/lib/motion"
import {
  UNPUBLISHED_HINT,
  formatPostDate,
  isPublished,
  postYear,
  posts as allPosts,
  type Post,
} from "@/lib/data/writing"
import { cn } from "@/lib/utils"

/* An editorial index: date, title, where it ran. No cards, just hairlines. */
export function WritingList({
  posts = allPosts,
  groupByYear = false,
}: {
  posts?: Post[]
  groupByYear?: boolean
}) {
  if (!posts.length) {
   return <ComingSoon message="Articles, papers and talks will land here. Nothing published yet." />
 }
  if (!groupByYear) return <Rows posts={posts} />

  const years = [...new Set(posts.map((p) => postYear(p.date)))]
  return (
    <div className="space-y-12">
      {years.map((year) => (
        <div key={year}>
          <h2 className="mb-2 font-mono text-sm font-semibold text-primary">{year}</h2>
          <Rows posts={posts.filter((p) => postYear(p.date) === year)} />
        </div>
      ))}
    </div>
  )
}

function Rows({ posts }: { posts: Post[] }) {
  return (
    <ol className="divide-y divide-border border-y border-border">
      {posts.map((post, i) => (
        <motion.li
          key={post.title}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={i}
        >
          <RowLink post={post} />
        </motion.li>
      ))}
    </ol>
  )
}

/* Real link when published. Otherwise a non-clickable row: on hover (or keyboard focus)
   it greys out and a small "yet to upload" tag fades in. */
function RowLink({ post }: { post: Post }) {
  const live = isPublished(post)
  const className = cn(
    "group relative grid gap-1 py-5 sm:grid-cols-[5.5rem_1fr_auto] sm:items-baseline sm:gap-6",
    live
      ? "transition-transform duration-300 hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      : "cursor-not-allowed outline-none",
  )
  const grey =
    "transition duration-300 group-hover:opacity-40 group-hover:grayscale group-focus-visible:opacity-40 group-focus-visible:grayscale [@media(hover:none)]:opacity-40 [@media(hover:none)]:grayscale"

  const body = (
    <>
      <time dateTime={post.date} className={cn("font-mono text-xs text-muted-foreground", !live && grey)}>
        {formatPostDate(post.date)}
      </time>

      <div className={cn("min-w-0", !live && grey)}>
        <h3 className={cn("font-semibold text-foreground transition-colors", live && "group-hover:text-primary")}>
          {post.title}
          {live && (
            <ArrowUpRight
              aria-hidden
              className="ml-1 inline size-4 -translate-y-px opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
      </div>

      <span
        className={cn(
          "font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:text-right",
          !live && grey,
        )}
      >
        {post.kind} · {post.venue}
      </span>

      {!live && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-popover px-4 py-1.5 font-mono text-[10px] tracking-widest whitespace-nowrap text-popover-foreground uppercase opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100",
            /* touch screens have no hover: show the tag in the flow, under the row, all the time */
            "[@media(hover:none)]:static [@media(hover:none)]:col-span-full [@media(hover:none)]:mt-2 [@media(hover:none)]:translate-x-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:justify-self-start [@media(hover:none)]:opacity-100 [@media(hover:none)]:shadow-none",
          )}
        >
          {UNPUBLISHED_HINT}
        </span>
      )}
    </>
  )

  if (live) {
    return (
      <a href={post.href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    )
  }

  return (
    <div tabIndex={0} aria-disabled="true" aria-label={`${post.title}. ${UNPUBLISHED_HINT}`} className={className}>
      {body}
    </div>
  )
}