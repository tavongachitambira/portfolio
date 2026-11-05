import type { Metadata } from "next"

import Link from "next/link"

import { PageShell } from "@/components/layout/PageShell"
import { ProjectTicket } from "@/components/projects/ProjectTicket"
import { caseStudies } from "@/lib/data/case-studies"
import { projectSlug, sortedProjects } from "@/lib/data/projects"
import { ComingSoon } from "@/components/ui/coming-soon"
export const metadata: Metadata = { title: "Projects" }

export default function ProjectsPage() {
  return (
    <PageShell
      eyebrow="02. Projects"
      title="Everything I've built"
      intro="Shipped work, work in progress, and a few experiments. Newest and most active first."
    >
      <div className="flex flex-col gap-6">
        {sortedProjects.map((project, i) => (
          <div key={project.name}>
            <ProjectTicket project={project} index={i} />
            {caseStudies[projectSlug(project)] && (
              <p className="mt-3 text-center text-sm">
                <Link href={`/projects/${projectSlug(project)}`} className="font-semibold text-primary hover:underline">
                  Read the {project.name} case study →
                </Link>
              </p>
            )}
          </div>
        ))}
        <ComingSoon  message="More projects are in the works." />
      </div>
    </PageShell>
  )
}
