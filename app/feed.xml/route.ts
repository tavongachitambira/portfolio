import { posts } from "@/lib/data/writing"
import { buildFeed } from "@/lib/feed"
import { site } from "@/lib/site"

// no request data and no clock, so this is built once at build time
export function GET() {
  const body = buildFeed(posts, {
    title: `${site.name}: writing`,
    description: `Articles, papers and talks by ${site.name}.`,
    siteUrl: `${site.url}/writing`,
    feedUrl: `${site.url}/feed.xml`,
  })
  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  })
}
