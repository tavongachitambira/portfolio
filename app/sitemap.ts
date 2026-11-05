import type { MetadataRoute } from "next"

import { caseStudies } from "@/lib/data/case-studies"
import { projectSlug, projects } from "@/lib/data/projects"
import { site } from "@/lib/site"

const routes = [
  "",
  "/projects",
  "/writing",
  "/skills",
  ...projects.filter((p) => caseStudies[projectSlug(p)]).map((p) => `/projects/${projectSlug(p)}`),
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }))
}