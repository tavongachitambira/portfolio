# Tavonga Chitambira — Portfolio

Personal portfolio site built with Next.js, Tailwind CSS, and Framer Motion.

Live: [tavonga.dev](https://tavongachitambira.vercel.app) · GitHub: [@cypherx72](https://github.com/tavongachitambira)

## About the project

A single-page portfolio with a split-panel layout: a sticky left aside for navigation and identity, and a scrollable right panel for content sections (profile, projects, activity). Features a mouse-follow spotlight, animated section transitions via Framer Motion, active-section tracking, and a mobile-responsive sticky nav.

### Sections
- **Who's behind the code** — bio and core skill areas
- **Projects** — SyncBoard and NPFRS with stack badges and links
- **Activity & Progress** — GitHub contribution stats and learning activity

## Tech stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4, shadcn/ui, tw-animate-css |
| Animation | Framer Motion 12 |
| Icons | react-icons, lucide-react, @hugeicons/react |
| Lottie | @lottiefiles/dotlottie-react |
| Theming | next-themes |
| Analytics | @vercel/analytics |
| Language | TypeScript 5 |
| Deploy | Vercel |

## Getting started

```bash
git clone https://github.com/tavongachitambira/portfolio.git
cd portfolio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Command palette**: `⌘K` / `Ctrl+K`, or the Search button at the top right. Jump to a section, page or case study, copy the email address, open the résumé, switch theme. Needs no setup.
- **Case studies**: `/projects/<slug>`. The copy is in `lib/data/case-studies.ts` and the architecture diagram is laid out by `lib/diagram.ts`. Only a project with an entry there gets a page.
- **Writing**: `/writing` is an index of links to posts that live elsewhere (Medium, a blog). A post counts as published once its `href` in `lib/data/writing.ts` is a real URL; until then it shows as "coming soon". `/feed.xml` lists published posts with links to the original URLs, and the feed is only advertised in `<head>` once there is one.
- **Share images**: every page has an `opengraph-image` drawn at build time (fonts in `assets/fonts/`). The site origin comes from `site.url` in `lib/site.ts`, so set it to the production domain.
- **Contact form**: honeypot field, per-IP rate limit, optional Cloudflare Turnstile, and the same validation on the client and the server (`lib/contact.ts`).
- **Ask my portfolio** (optional): a question box that answers only from the site's own data. See below.

### Ask my portfolio

Ask retrieves the few passages of the site that match the question (BM25 over projects, case studies, skills, writing and contact details), and only then calls the model. If nothing matches, the model is never called and the visitor gets a fixed "not on this site" reply. Answers stream back as plain text with `[n]` citations that link to the passage they came from. The model's text is never rendered as HTML.

Limits: 12 questions per IP per 10 minutes, and a global daily cap (`ASK_DAILY_CAP`, default 500). Closing the panel cancels an answer that is still streaming.

**Models.** Ask talks to one provider. Set that provider's key and Ask switches itself on; if several keys are set, `ASK_PROVIDER` picks one, otherwise the first found wins (Anthropic, then Gemini, then Grok).

| Provider | Key | `ASK_PROVIDER` | Default model | Cost |
|---|---|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | `gemini` | `gemini-3.1-flash-lite` | Has a free tier (a key from Google AI Studio). Its per-minute and per-day quotas are small, and on the free tier Google may use prompts to improve its products. Your project's limits are shown in AI Studio; keep `ASK_DAILY_CAP` below the daily one. |
| xAI Grok | `XAI_API_KEY` | `xai` (or `grok`) | `grok-4.7` | Per token. xAI's docs list no free API tier. |
| Anthropic Claude | `ANTHROPIC_API_KEY` | `anthropic` | `claude-haiku-5-5` | Per token. |

Only the visitor's question, the earlier turns of that chat and the retrieved site passages are sent to the provider. When it is out of quota or overloaded, visitors see "Ask is busy right now"; any other failure (a wrong model name, a rejected key) shows "Ask is unavailable right now", and the server log says why in a few words, for example `ask: upstream error. gemini 404 NOT_FOUND`. The log never contains the key, the prompt or what the visitor typed.

When you change the site's data, `pnpm test` runs a retrieval eval (`tests/ask-retrieval.test.ts`) so a question that used to find its answer and no longer does is caught. Add a case there for anything new worth asking about.

## Configuration

Copy `.env.example` to `.env.local`. Everything is optional: the site runs with none of it, and each feature switches on when its keys exist.

| Variable | Turns on | Without it |
|---|---|---|
| `RESEND_API_KEY`, `CONTACT_EMAIL` (`RESEND_FROM_EMAIL`) | Sending the contact form | The form opens the visitor's mail app |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limits shared across serverless instances | Per-instance memory (fine locally, weak on Vercel) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile on the contact form | Honeypot and rate limit only |
| `GEMINI_API_KEY`, `XAI_API_KEY` or `ANTHROPIC_API_KEY` | Ask answers (server side), through that provider | `/api/ask` replies 503 |
| `ASK_PROVIDER` | Choosing a provider when several keys are set: `gemini`, `xai` (or `grok`), `anthropic` | The first key found |
| `NEXT_PUBLIC_ASK_ENABLED=true` | The Ask button and sheet, and "Ask" in the palette | Ask is hidden |
| `ASK_MODEL`, `ASK_EFFORT`, `ASK_MAX_TOKENS`, `ASK_BASE_URL`, `ASK_DAILY_CAP`, `ASK_DISABLED` | Tuning Ask | The provider's model and address, effort `low` (Gemini: the model's own), `2048`, `500` |

`ASK_EFFORT` goes to the provider as its reasoning setting (`low`, `medium` or `high`); `none` sends nothing. `ASK_MAX_TOKENS=0` sends no output limit (Gemini and Grok only; Anthropic requires one).

`NEXT_PUBLIC_*` values are inlined at build time, so redeploy after changing one. To try Ask without a key or any spend, run `pnpm mock:ask` and start the app with `ASK_BASE_URL=http://127.0.0.1:4010`, a dummy key for any one provider and `NEXT_PUBLIC_ASK_ENABLED=true`. The mock speaks all three providers' formats; its header lists the words that trigger errors and slow answers.

Checks: `pnpm test`, `pnpm typecheck`, `pnpm lint`.

## Project structure

```
app/
  layout.tsx        # Root layout, fonts, theme provider
  page.tsx          # Main page — split panel, nav, all sections
  globals.css       # CSS variables, base styles
components/
  section/
    Projects.tsx    # Project cards grid
    Stats.tsx       # GitHub stats and activity
  ui/               # Shared primitives (Button, Item, Separator, etc.)
lib/
  utils.ts          # cn() utility
public/
  svg/              # Skill icons
  resume.pdf        # Downloadable résumé
```

## Using this design

This portfolio is open for inspiration and reuse under **CC BY 4.0**. See [`LICENSE`](./LICENSE) and [`ATTRIBUTION.md`](./ATTRIBUTION.md) for what that means and what's expected.

## License

[Creative Commons Attribution 4.0 International](./LICENSE) © 2026 Tavonga Chitambira
