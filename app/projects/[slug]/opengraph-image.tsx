import { notFound } from "next/navigation"

import { caseStudies } from "@/lib/data/case-studies"
import { projectSlug, projects } from "@/lib/data/projects"
import { renderOg } from "@/lib/og"

export const alt = "Project case study by Tavonga Chitambira"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const withStudy = projects.filter((p) => caseStudies[projectSlug(p)])

export function generateStaticParams() {
  return withStudy.map((p) => ({ slug: projectSlug(p) }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = withStudy.find((p) => projectSlug(p) === slug)
  if (!project) notFound()
  return renderOg({
    eyebrow: "Case study",
    title: project.name,
    subtitle: caseStudies[slug].tagline,
    chips: project.tags,
  })
}
