import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { PageShell } from "@/components/layout/PageShell"
import { ArchitectureDiagram } from "@/components/projects/ArchitectureDiagram"
import { Badge } from "@/components/ui/badge"
import { caseStudies } from "@/lib/data/case-studies"
import { projectPeriod, projectSlug, projects } from "@/lib/data/projects"

const withStudy = projects.filter((p) => caseStudies[projectSlug(p)])

// Cache Components needs at least one param here; every case study is known at build time.
export function generateStaticParams() {
  return withStudy.map((p) => ({ slug: projectSlug(p) }))
}

const find = (slug: string) => withStudy.find((p) => projectSlug(p) === slug)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = find((await params).slug)
  if (!project) return {}
  const study = caseStudies[projectSlug(project)]
  return {
    title: `${project.name} case study`,
    description: study.tagline,
    alternates: { canonical: `/projects/${projectSlug(project)}` },
  }
}

const h2 = "mb-5 font-mono text-xs font-bold tracking-[0.18em] text-primary uppercase"

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = find((await params).slug)
  if (!project) notFound()

  const study = caseStudies[projectSlug(project)]
  const meta = [project.role, projectPeriod(project), project.status && project.status.toLowerCase()].filter(Boolean)

  return (
    <PageShell eyebrow="Case study" title={project.name} intro={study.tagline}>
      {meta.length > 0 && (
        <ul className="-mt-6 mb-12 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
          {meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      <div className="space-y-16">
        <section aria-labelledby="problem">
          <h2 id="problem" className={h2}>The problem</h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {study.problem.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section aria-labelledby="architecture">
          <h2 id="architecture" className={h2}>Architecture</h2>
          <div className="clay clay-md p-4 sm:p-6 lg:-mx-20">
            <ArchitectureDiagram spec={study.diagram} />
          </div>
          {study.diagramNote && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{study.diagramNote}</p>}
        </section>

        <section aria-labelledby="decisions">
          <h2 id="decisions" className={h2}>Decisions that shaped it</h2>
          <ol className="space-y-6">
            {study.decisions.map((d, i) => (
              <li key={d.title} className="grid grid-cols-[2rem_1fr] gap-x-3">
                <span aria-hidden className="pt-0.5 font-mono text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{d.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="stack">
          <h2 id="stack" className={h2}>Stack</h2>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[8rem_1fr]">
            {study.stack.map((row) => (
              <div key={row.layer} className="contents">
                <dt className="pt-1 text-sm font-semibold text-foreground">{row.layer}</dt>
                <dd>
                  <ul className="flex flex-wrap gap-2">
                    {row.items.map((item) => (
                      <Badge key={item} asChild variant="secondary" className="text-[11px]">
                        <li>{item}</li>
                      </Badge>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="results">
          <h2 id="results" className={h2}>{study.results.heading}</h2>
          <ul className="space-y-3">
            {study.results.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-px text-primary">▹</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {(project.github || project.link) && (
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                Source on GitHub <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                Live site <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          <Link href="/projects" className="text-primary hover:underline">← All projects</Link>
        </p>
      </div>
    </PageShell>
  )
}
