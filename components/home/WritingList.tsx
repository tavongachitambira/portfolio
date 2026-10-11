"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { fadeUp } from "@/lib/motion"
import { formatPostDate, postYear, posts as allPosts, type Post } from "@/lib/data/writing"

/* An editorial index: date, title, where it ran. No cards, just hairlines. */
export function WritingList({
  posts = allPosts,
  groupByYear = false,
}: {
  posts?: Post[]
  groupByYear?: boolean
}) {
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
          <a
            href={post.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid gap-1 py-5 transition-transform duration-300 hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[5.5rem_1fr_auto] sm:items-baseline sm:gap-6"
          >
            <time dateTime={post.date} className="font-mono text-xs text-muted-foreground">
              {formatPostDate(post.date)}
            </time>

            <div className="min-w-0">
              <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                {post.title}
                <ArrowUpRight
                  aria-hidden
                  className="ml-1 inline size-4 -translate-y-px opacity-0 transition-opacity group-hover:opacity-100"
                />
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
            </div>

            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:text-right">
              {post.kind} · {post.venue}
            </span>
          </a>
        </motion.li>
      ))}
    </ol>
  )
}