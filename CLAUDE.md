@AGENTS.md

---

# Handoff notes (latest session)

Branch: `feat/portfolio-features` (on top of `feat/binary-loader-and-resize-fixes`). Work is committed per feature. The owner will review later. Read `AGENTS.md` first (Next 16 docs live in `node_modules/next/dist/docs/`).

## Owner's request (turn 3)
Build: 1) contact spam protection, 3) case-study pages, 4) ⌘K palette, 5) OG images + RSS, 6) "Ask my portfolio". **Skip 2** (Playwright resize tests in CI; owner already verified). `/writing` entries are links to external posts (Medium etc.), so it stays an index of links: no on-site post pages; the RSS feed links to the original URLs. Owner is terse and wants production-shaped output.

## Done and committed
1. **Contact hardening**: `lib/rate-limit.ts` (Upstash REST or in-memory), `lib/contact.ts` (shared validation), `lib/contact-email.ts`, `lib/turnstile.ts`, `hooks/useTurnstile.ts`, `app/api/contact/route.ts`, Footer (honeypot, Turnstile, per-status messages; mail-app fallback only for 5xx/network).
3. **Case studies**: `/projects/[slug]` (`app/projects/[slug]/page.tsx`), copy in `lib/data/case-studies.ts`, layout maths in `lib/diagram.ts`, `components/projects/ArchitectureDiagram.tsx`. Only SyncBoard has a case study. **EduCampus is deliberately not on the site** (owner: "it isn't part of any projects, don't include it"): do not add it to `lib/data/projects.ts`, the case studies, the Ask corpus or any copy. Only sourced facts are used; no invented metrics.
5. **Share images + feed**: `lib/og.tsx` + `opengraph-image.tsx` files (home, projects, writing, skills, per project), fonts in `assets/fonts/` (OFL), `lib/feed.ts` + `app/feed.xml/route.ts`, `metadataBase`/title template in `app/layout.tsx`. The feed is advertised in `<head>` only once a post is published (currently the only post is an unpublished placeholder).
6. **Ask backend**: `lib/ask/{corpus,retrieve,prompt,messages,stream}.ts` and `app/api/ask/route.ts`. BM25 retrieval over site data; no hit means the model is never called. Streams NDJSON (`sources`, `text`*, `done|error`). Default model `claude-haiku-5-5`, `output_config.effort: "low"`. Per-IP 12/10 min, global daily cap (`ASK_DAILY_CAP`, default 500).

## NOT done yet (do in this order)
- **Ask UI**: client panel (Radix Dialog from the `radix-ui` package; side sheet on desktop, bottom sheet on mobile): suggestion chips, streaming render of the NDJSON from `/api/ask` (read with `response.body.getReader()`; first line is sources), stop button (AbortController), `[n]` citations rendered as links to `sources[n-1].href`, no `dangerouslySetInnerHTML`, error states (429/503/502 JSON and in-band `error` events), "AI answers from this site, may be wrong" note. Gate with `NEXT_PUBLIC_ASK_ENABLED === "true"`.
- **⌘K palette**: `components/palette/` provider mounted once in `app/layout.tsx` (ThemeProvider already there). Commands: go to sections, pages, case studies, copy email (`site.email`), open résumé (`site.resume`), toggle theme (`next-themes`), open Ask (when enabled; also "Ask about “query”" when nothing matches). Combobox ARIA, arrow keys/Enter/Esc. Avoid `usePathname` in global components (Cache Components). Triggers go in the empty fixed div in `app/layout.tsx` (`top-16 right-4 z-60 lg:top-6 lg:right-6`); check it doesn't collide with `MobileNav` (fixed `top-3`) or the hero.
- **Section scrolling**: add `scroll-mt-[68px] lg:scroll-mt-5` to `components/home/Section.tsx` and use `element.scrollIntoView({ behavior: "smooth" })`; from other routes use `router.push("/#projects")`.
- **Docs**: README section for env vars/features (see `.env.example`), and the `NEXT_PUBLIC_ASK_ENABLED` flag.
- **Verify**: `pnpm test` (111 tests), `pnpm typecheck`, eslint on changed files, then a production build (see gotchas), Playwright pass for palette/Ask (use a local mock for `ANTHROPIC_BASE_URL`), check `og:image` URLs use the production origin in the built HTML, then push.

## Gotchas
- Cache Components is on: no `new Date()`/`Math.random()` in prerendered code; route files may only export HTTP verbs and config (put shared constants in `lib/`); dynamic routes need `generateStaticParams` with at least one entry.
- Google Fonts are blocked in the sandbox, so `pnpm build` fails offline. Build in a throwaway copy with the `app/layout.tsx` font imports stubbed. For screenshots inject `:root{--font-jakarta:Inter,sans-serif;--font-geist-mono:"DejaVu Sans Mono",monospace}`.
- Shell cwd resets: always `cd /home/claude/portfolio &&`. Don't `pkill -f "next dev"` (it matches the command itself); use `fuser -k 3000/tcp`. Restart the dev server after changing data modules if HMR goes stale.
- react-hooks lint rejects reading refs through a hook's returned object; return state setters/callbacks and destructure.
- Pre-existing, not mine: 2 lint errors + 1 warning (SkillsPreview, SkillMeters, Plasma), and a reduced-motion hydration mismatch in `components/layout/ambient.tsx`.
- Git: single-branch clone; to get upstream tracking add `remote.origin.fetch +refs/heads/<branch>:refs/remotes/origin/<branch>` then fetch.
- Commits end with the `Co-Authored-By` / `Claude-Session` lines. Don't commit to `main`.
