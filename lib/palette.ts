import { caseStudies } from "@/lib/data/case-studies"
import { navLinks } from "@/lib/data/nav"
import { projectSlug, projects } from "@/lib/data/projects"
import { socials } from "@/lib/data/socials"
import { isPublished, posts } from "@/lib/data/writing"
import { LIMITS } from "@/lib/ask/messages"
import { site } from "@/lib/site"

/* The command palette's model: what can be run, and how a typed query ranks it.
   Pure data and functions, so it is unit-tested without a browser; components/assist renders it. */

export type CommandGroup = "Go to" | "Pages" | "Actions" | "Links"

export type CommandAction =
  | { type: "section"; id: string }
  | { type: "route"; href: string }
  | { type: "external"; href: string }
  | { type: "copy-email" }
  | { type: "toggle-theme" }
  | { type: "ask"; question?: string }

export interface Command {
  id: string
  label: string
  group: CommandGroup
  /** short note on the right */
  hint?: string
  /** extra words that should also find this command */
  keywords?: string
  /** key into the icon map in the component */
  icon: string
  action: CommandAction
}

export interface PaletteOptions {
  askEnabled: boolean
  /** current theme; labels the theme command */
  theme?: "light" | "dark"
}

const sectionLabels: Record<string, string> = {
  profile: "Profile",
  projects: "Projects",
  writing: "Writing",
  skills: "Skills",
}

export function buildCommands({ askEnabled, theme }: PaletteOptions): Command[] {
  const list: Command[] = []

  for (const link of navLinks) {
    list.push({
      id: `go-${link.id}`,
      label: sectionLabels[link.id] ?? link.label,
      group: "Go to",
      hint: "Section",
      keywords: link.label,
      icon: link.id,
      action: { type: "section", id: link.id },
    })
  }
  list.push({
    id: "go-connect",
    label: "Contact",
    group: "Go to",
    hint: "Section",
    keywords: "connect message email form hire get in touch",
    icon: "connect",
    action: { type: "section", id: "connect" },
  })

  list.push({
    id: "page-projects",
    label: "All projects",
    group: "Pages",
    hint: "Page",
    keywords: "work portfolio",
    icon: "projects",
    action: { type: "route", href: "/projects" },
  })
  for (const p of projects) {
    const slug = projectSlug(p)
    if (!caseStudies[slug]) continue
    list.push({
      id: `case-${slug}`,
      label: `${p.name} case study`,
      group: "Pages",
      hint: "Case study",
      keywords: `${p.name} ${p.tags.join(" ")} architecture diagram`,
      icon: "case",
      action: { type: "route", href: `/projects/${slug}` },
    })
  }
  list.push(
    {
      id: "page-writing",
      label: "All writing",
      group: "Pages",
      hint: "Page",
      keywords: "articles posts blog",
      icon: "writing",
      action: { type: "route", href: "/writing" },
    },
    {
      id: "page-skills",
      label: "Skills & activity",
      group: "Pages",
      hint: "Page",
      keywords: "stack tools github leetcode",
      icon: "skills",
      action: { type: "route", href: "/skills" },
    },
  )

  if (askEnabled) {
    list.push({
      id: "ask",
      label: "Ask my portfolio",
      group: "Actions",
      hint: "AI",
      keywords: "question chat assistant claude answer",
      icon: "ask",
      action: { type: "ask" },
    })
  }
  list.push(
    {
      id: "copy-email",
      label: "Copy email address",
      group: "Actions",
      hint: site.email,
      keywords: "mail contact clipboard",
      icon: "copy",
      action: { type: "copy-email" },
    },
    {
      id: "resume",
      label: "Open résumé",
      group: "Actions",
      hint: "PDF",
      keywords: "cv resume download",
      icon: "resume",
      action: { type: "external", href: site.resume },
    },
    {
      id: "theme",
      label: theme === "light" ? "Switch to dark theme" : theme === "dark" ? "Switch to light theme" : "Toggle light or dark theme",
      group: "Actions",
      hint: "Theme",
      keywords: "dark light mode appearance colors",
      icon: "theme",
      action: { type: "toggle-theme" },
    },
  )

  for (const s of socials) {
    if (s.href.startsWith("mailto:")) continue
    list.push({
      id: `link-${s.label.toLowerCase()}`,
      label: s.label,
      group: "Links",
      hint: new URL(s.href).hostname.replace(/^www\./, ""),
      icon: s.label.toLowerCase(),
      action: { type: "external", href: s.href },
    })
  }
  // only offer the feed once there is something in it (same rule as the <head> link)
  if (posts.some(isPublished)) {
    list.push({
      id: "link-rss",
      label: "RSS feed",
      group: "Links",
      hint: "Writing",
      keywords: "subscribe atom xml",
      icon: "rss",
      action: { type: "external", href: "/feed.xml" },
    })
  }

  return list
}

/* ---------- matching ---------- */

/** Lowercase and drop accents, so "resume" finds "résumé". */
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
const words = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean)

function isSubsequence(needle: string, haystack: string) {
  let i = 0
  for (const ch of haystack) if (ch === needle[i] && ++i === needle.length) return true
  return needle.length === 0
}

/** How well one query word matches one command: 0 means "doesn't". Label beats keywords beats fuzzy. */
function tokenScore(token: string, c: Command): number {
  const label = norm(c.label)
  const labelWords = words(label)
  if (label === token) return 6
  if (labelWords.includes(token)) return 5
  if (labelWords.some((w) => w.startsWith(token))) return 4
  if (label.includes(token)) return 3

  const extra = norm(`${c.keywords ?? ""} ${c.hint ?? ""} ${c.group}`)
  const extraWords = words(extra)
  if (extraWords.includes(token)) return 2.5
  if (extraWords.some((w) => w.startsWith(token))) return 2
  if (extra.includes(token)) return 1.5

  if (token.length >= 3 && isSubsequence(token, label)) return 1
  return 0
}

/** Commands matching every word of the query, best first. An empty query returns them all, in order. */
export function filterCommands(commands: Command[], query: string): Command[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return commands

  return commands
    .map((command, index) => {
      let score = 0
      for (const t of tokens) {
        const s = tokenScore(t, command)
        if (!s) return null
        score += s
      }
      return { command, score, index }
    })
    .filter((r): r is { command: Command; score: number; index: number } => r !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.command)
}

/** What the palette lists for a query: the matches, plus (when Ask is on) an "Ask about …" last resort. */
export function searchCommands(commands: Command[], query: string, askEnabled: boolean): Command[] {
  const matches = filterCommands(commands, query)
  const question = query.trim().slice(0, LIMITS.user)
  if (!askEnabled || question.length < 3) return matches

  return [
    ...matches,
    {
      id: "ask-about",
      label: `Ask: “${question}”`,
      group: "Actions",
      hint: "AI",
      icon: "ask",
      action: { type: "ask", question },
    },
  ]
}

/** Section headings for the unfiltered list. Order follows first appearance. */
export function groupCommands(commands: Command[]): { group: CommandGroup; items: Command[] }[] {
  const groups: { group: CommandGroup; items: Command[] }[] = []
  for (const c of commands) {
    const g = groups.find((x) => x.group === c.group)
    if (g) g.items.push(c)
    else groups.push({ group: c.group, items: [c] })
  }
  return groups
}
