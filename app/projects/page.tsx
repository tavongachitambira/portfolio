import type { Metadata } from "next"

import { PageShell } from "@/components/layout/PageShell"
import { ProjectTicket } from "@/components/projects/ProjectTicket"
import { sortedProjects } from "@/lib/data/projects"
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
          <ProjectTicket key={project.name} project={project} index={i} />
        ))}
        <ComingSoon  message="More projects are in the works." />
      </div>
    </PageShell>
  )
}
