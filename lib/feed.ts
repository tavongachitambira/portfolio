import { isPublished, type Post } from "@/lib/data/writing"

/* RSS 2.0 for /writing. Every item points at the post's real home (Medium, a blog, a journal), so
   the feed works as a "link blog": readers subscribe here and read there. Only published posts
   appear. No clock is read: the channel date is the newest post's date, so the output is stable. */

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString()

export const publishedPosts = (posts: Post[]) =>
  posts.filter(isPublished).sort((a, b) => b.date.localeCompare(a.date))

export function buildFeed(
  posts: Post[],
  channel: { title: string; description: string; siteUrl: string; feedUrl: string },
) {
  const items = publishedPosts(posts)
  const newest = items[0]?.date

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(channel.title)}</title>
    <link>${xml(channel.siteUrl)}</link>
    <description>${xml(channel.description)}</description>
    <language>en</language>
${newest ? `    <lastBuildDate>${rfc822(newest)}</lastBuildDate>\n` : ""}    <atom:link href="${xml(channel.feedUrl)}" rel="self" type="application/rss+xml" />
${items
  .map(
    (p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${xml(p.href)}</link>
      <guid isPermaLink="true">${xml(p.href)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${xml(`${p.summary} (${p.kind}, ${p.venue})`)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`
}
