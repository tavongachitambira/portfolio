import type { Metadata } from "next"

import { PageShell } from "@/components/layout/PageShell"
import { SkillMeters } from "@/components/skills/SkillMeters"
import Stats from "@/components/stats/Stats"

export const metadata: Metadata = { title: "Skills" }

export default function SkillsPage() {
  return (
    <PageShell
      eyebrow="04. Skills"
      title="Skills & activity"
      intro="What I work with, how comfortable I am with it, and what my GitHub and LeetCode activity look like."
    >
      <SkillMeters />

      <section aria-labelledby="activity-title" className="mt-20">
        <h2 id="activity-title" className="mb-6 text-lg font-semibold">
          Activity
        </h2>
        <Stats />
      </section>
    </PageShell>
  )
}