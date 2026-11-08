import type { Metadata } from "next"

import { PageShell } from "@/components/layout/PageShell"
import { CaseStudyLink } from "@/components/projects/CaseStudyLink"
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
            {caseStudies[projectSlug(project)] && <CaseStudyLink slug={projectSlug(project)} name={project.name} />}
          </div>
        ))}
        <ComingSoon  message="More projects are in the works." />
      </div>
    </PageShell>
  )
}
