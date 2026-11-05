import { bio } from "@/lib/data/about"
import { caseStudies } from "@/lib/data/case-studies"
import { projectPeriod, projectSlug, projects } from "@/lib/data/projects"
import { roles } from "@/lib/data/profile"
import { skillGroups } from "@/lib/data/skills"
import { socials } from "@/lib/data/socials"
import { isPublished, posts } from "@/lib/data/writing"
import { site } from "@/lib/site"

/* Everything "Ask my portfolio" is allowed to know, as small passages built from the same data
   that renders the site. One source of truth: edit a project or a post and Ask follows.
   Nothing here is invented; anything not in these passages is, by design, "not on the site". */

export interface Chunk {
  id: string
  title: string
  text: string
  /** where a visitor can read more: a site path or an external URL */
  href: string
}

/** Names a visitor might use that the site's own copy doesn't. */
const aliases: Record<string, string[]> = { educampus: ["CampusPilot"] }

export function buildCorpus(): Chunk[] {
  const chunks: Chunk[] = []
  const add = (id: string, title: string, text: string, href: string) => chunks.push({ id, title, text, href })

  add("about", "About Tavonga", `${bio.join(" ")} Roles: ${roles.join(", ")}.`, "/#profile")

  add(
    "contact",
    "Contact and links",
    `Email: ${site.email}. There is a contact form at the bottom of the home page. Résumé (PDF): ${site.url}${site.resume}. ` +
      socials.filter((s) => !s.href.startsWith("mailto:")).map((s) => `${s.label}: ${s.href}`).join(". ") + ".",
    "/#connect",
  )

  add(
    "site",
    "About this website",
    "This portfolio is built with Next.js 16, React 19, Tailwind CSS 4 and Framer Motion, written in TypeScript and deployed on Vercel. It has a loading animation made of binary digits, a command palette (Ctrl or Cmd + K) and this Ask box.",
    "/",
  )

  for (const p of projects) {
    const slug = projectSlug(p)
    const study = caseStudies[slug]
    const href = study ? `/projects/${slug}` : "/projects"
    const also = aliases[slug]?.length ? ` Also known as ${aliases[slug].join(", ")}.` : ""
    const facts = [p.role && `Role: ${p.role}.`, p.status && `Status: ${p.status.toLowerCase()}.`, projectPeriod(p) && `Period: ${projectPeriod(p)}.`]
      .filter(Boolean)
      .join(" ")

    add(`project-${slug}`, `${p.name} overview`, `${p.description}${also} ${facts} Tech: ${p.tags.join(", ")}. ${(p.highlights ?? []).join(" ")}`.trim(), href)

    if (study) {
      add(`project-${slug}-problem`, `${p.name}: the problem`, `${study.tagline} ${study.problem.join(" ")}`, href)
      study.decisions.forEach((d, i) => add(`project-${slug}-decision-${i + 1}`, `${p.name}: ${d.title}`, d.body, href))
      add(`project-${slug}-stack`, `${p.name}: tech stack`, study.stack.map((s) => `${s.layer}: ${s.items.join(", ")}`).join(". ") + ".", href)
      add(`project-${slug}-status`, `${p.name}: ${study.results.heading.toLowerCase()}`, study.results.items.join(" "), href)
    }
  }

  skillGroups.forEach((g) => {
    const learning = g.items.filter((s) => s.learning).map((s) => s.name)
    add(
      `skills-${g.id}`,
      `Skills: ${g.title}`,
      `${g.blurb} ${g.items.map((s) => s.name).join(", ")}.${learning.length ? ` Currently learning: ${learning.join(", ")}.` : ""}`,
      "/skills",
    )
  })

  posts.forEach((post, i) => {
    add(
      `writing-${i + 1}`,
      `Writing: ${post.title}`,
      `${post.kind} on ${post.venue}, ${post.date}. ${post.summary} ${isPublished(post) ? `Read it at ${post.href}.` : "Not published yet."}`,
      isPublished(post) ? post.href : "/writing",
    )
  })

  return chunks
}
