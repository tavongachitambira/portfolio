"use client"

import CardSwap, { Card } from "@/components/CardSwap"

import { UNPUBLISHED_HINT, formatPostDate, isPublished, type Post } from "@/lib/data/writing"
import { cn } from "@/lib/utils"

export function WritingCards({ posts }: { posts: Post[] }) {
  return (
    <div className="h-[360px] w-full max-w-[460px]" aria-label="Featured writing">
      <CardSwap
        width={420}
        height={300}
        delay={8000}
        theme="clay"
        cardDistance={28}
        verticalDistance={24}
        depth={50}
        visibleCards={Math.max(1, posts.length)}
        cardRadius={18}
      >
        {posts.map((post) => {
          const live = isPublished(post)

          const inner = (
            <>
              <div className={cn("transition duration-300", !live && "group-hover:opacity-40 group-hover:grayscale [@media(hover:none)]:opacity-40 [@media(hover:none)]:grayscale")}>
                <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                  {post.kind} · {formatPostDate(post.date)}
                </p>
                <h3 className="mt-4 text-2xl leading-tight font-bold tracking-tight">{post.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
              </div>
              <span
                className={cn(
                  "font-mono text-xs text-muted-foreground transition duration-300",
                  !live && "group-hover:opacity-40 [@media(hover:none)]:opacity-40",
                )}
              >
                {post.venue}
                {live ? " ↗" : ""}
              </span>

              {/* unpublished: tag fades in on hover (mouse) and is always shown on touch screens, where there is no hover */}
              {!live && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-popover px-4 py-1.5 font-mono text-[10px] tracking-widest whitespace-nowrap text-popover-foreground uppercase opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  {UNPUBLISHED_HINT}
                </span>
              )}
            </>
          )

          return (
            <Card key={post.title}>
              {live ? (
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-full flex-col justify-between p-7 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                >
                  {inner}
                </a>
              ) : (
                <div
                  aria-disabled="true"
                  aria-label={`${post.title}. ${UNPUBLISHED_HINT}`}
                  className="group relative flex h-full cursor-not-allowed flex-col justify-between p-7"
                >
                  {inner}
                </div>
              )}
            </Card>
          )
        })}
      </CardSwap>
    </div>
  )
}