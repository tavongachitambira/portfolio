import type { Metadata } from "next"

import { WritingList } from "@/components/home/WritingList"
import { PageShell } from "@/components/layout/PageShell"
import { posts } from "@/lib/data/writing"

export const metadata: Metadata = { title: "Writing" }

export default function WritingPage() {
  return (
    <PageShell
      eyebrow="03. Writing"
      title="Articles, papers & talks"
      intro="Things I've written or presented, newest first."
    >
      <WritingList posts={posts} groupByYear />
    </PageShell>
  )
}