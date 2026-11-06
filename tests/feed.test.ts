import { describe, expect, it } from "vitest"

import type { Post } from "@/lib/data/writing"
import { buildFeed, publishedPosts } from "@/lib/feed"

const post = (over: Partial<Post>): Post => ({
  title: "T", summary: "S", kind: "Article", venue: "Medium", date: "2026-01-01", href: "https://medium.com/@x/t", ...over,
})
const channel = { title: "C", description: "D", siteUrl: "https://e.com/writing", feedUrl: "https://e.com/feed.xml" }

describe("feed", () => {
  it("lists only published posts, newest first", () => {
    const list = publishedPosts([post({ title: "old", date: "2025-01-01" }), post({ title: "draft", href: "#" }), post({ title: "empty", href: "" }), post({ title: "new", date: "2026-05-05" })])
    expect(list.map((p) => p.title)).toEqual(["new", "old"])
  })

  it("links each item to the post's real URL and escapes markup", () => {
    const xml = buildFeed([post({ title: "A & <B>", href: "https://m.com/p?a=1&b=2" })], channel)
    expect(xml).toContain("<title>A &amp; &lt;B&gt;</title>")
    expect(xml).toContain("<link>https://m.com/p?a=1&amp;b=2</link>")
    expect(xml).toContain('<guid isPermaLink="true">')
    expect(xml).toContain("<pubDate>Thu, 01 Jan 2026 00:00:00 GMT</pubDate>")
    expect(xml).toContain("<lastBuildDate>Thu, 01 Jan 2026 00:00:00 GMT</lastBuildDate>")
  })

  it("is still a valid, empty channel with no published posts", () => {
    const xml = buildFeed([post({ href: "#" })], channel)
    expect(xml).not.toContain("<item>")
    expect(xml).not.toContain("lastBuildDate")
    expect(xml).toContain('<atom:link href="https://e.com/feed.xml" rel="self"')
  })
})
