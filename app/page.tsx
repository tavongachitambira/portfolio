"use client"

import { useRef } from "react"

import { HeroStage } from "@/components/hero/hero-stage"
import { Profile } from "@/components/home/Profile"
import { ProjectTabs } from "@/components/home/ProjectTabs"
import { Section } from "@/components/home/Section"
import { SkillsPreview } from "@/components/home/SkillsPreview"
import { WritingList } from "@/components/home/WritingList"
import { Footer } from "@/components/layout/Footer"
import { InitialLoader } from "@/components/layout/InitialLoader"
import { MobileNav } from "@/components/layout/MobileNav"
import { Sidebar } from "@/components/layout/Sidebar"
import { useActiveSection } from "@/hooks/useActiveSection"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useWheelForward } from "@/hooks/useWheelForward"
import { labelOf, sectionIds } from "@/lib/data/nav"
import { previewPosts } from "@/lib/data/writing"

export default function Home() {
  const isMobile = useIsMobile()
  const leftRef = useRef<HTMLElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const activeSection = useActiveSection(sectionIds, rightRef, isMobile)
  useWheelForward(leftRef, rightRef, !isMobile)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const el = document.getElementById(href.slice(1))
    if (!el) return

    if (isMobile) {
      const top = el.getBoundingClientRect().top + window.scrollY - 48 - 20
      window.scrollTo({ top, behavior: "smooth" })
    } else {
      rightRef.current?.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" })
    }
  }

  return (
    <>
      <InitialLoader />
      <main className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <Sidebar asideRef={leftRef} activeSection={activeSection} onNavigate={handleNavClick} />

        <div className="relative lg:h-screen lg:w-2/3 lg:overflow-hidden xl:w-3/5">
          <MobileNav isMobile={isMobile} activeSection={activeSection} />

          <div
            ref={rightRef}
            className="scrollbar-clay w-full overflow-x-hidden overflow-y-auto pb-10 lg:h-screen lg:pr-8 lg:pb-10 lg:pl-8 xl:pr-12 xl:pb-12 xl:pl-10"
          >
            <HeroStage scrollContainerRef={rightRef} isMobile={isMobile} />

            <div className="space-y-24 px-6">
              <Section id="profile" title={labelOf("profile")}>
                <Profile />
              </Section>

              <Section
                id="projects"
                title={labelOf("projects")}
                more={{ href: "/projects", label: "View all projects" }}
              >
                <ProjectTabs />
                
              </Section>

              <Section
                id="writing"
                title={labelOf("writing")}
                more={previewPosts.length ? { href: "/writing", label: "View all writing" } : undefined}
              >
                <WritingList posts={previewPosts} />
              </Section>

              <Section
                id="skills"
                title={labelOf("skills")}
                more={{ href: "/skills", label: "View skills & activity" }}
              >
                <SkillsPreview />
              </Section>

              <Footer />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
