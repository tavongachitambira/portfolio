"use client"

import CardSwap, { Card } from "@/components/CardSwap"

import { formatPostDate, type Post } from "@/lib/data/writing"

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
        {posts.map((post) => (
          <Card key={post.title}>
            <a
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col justify-between p-7 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
            >
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                  {post.kind} · {formatPostDate(post.date)}
                </p>
                <h3 className="mt-4 text-2xl leading-tight font-bold tracking-tight">{post.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{post.venue} ↗</span>
            </a>
          </Card>
        ))}
      </CardSwap>
    </div>
  )
}
