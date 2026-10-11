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
