"use client"

import { useRef } from "react"

import { AssistTriggers } from "@/components/assist/AssistTriggers"
import { HeroStage } from "@/components/hero/hero-stage"
import { Profile } from "@/components/home/Profile"
import { ProjectTabs } from "@/components/home/ProjectTabs"
import { Section } from "@/components/home/Section"
import { SkillsPreview } from "@/components/home/SkillsPreview"
import { WritingList } from "@/components/home/WritingList"
import { WritingCards } from "@/components/home/WritingCards"
import { Footer } from "@/components/layout/Footer"
import { InitialLoader } from "@/components/layout/InitialLoader"
import { MobileNav } from "@/components/layout/MobileNav"
import { Sidebar } from "@/components/layout/Sidebar"
import { useActiveSection } from "@/hooks/useActiveSection"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useRowAlign } from "@/hooks/useRowAlign"
import { useWheelForward } from "@/hooks/useWheelForward"
import { labelOf, sectionIds } from "@/lib/data/nav"
import { previewPosts } from "@/lib/data/writing"

export default function Home() {
  const isMobile = useIsMobile()
  const mainRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const activeSection = useActiveSection(sectionIds, rightRef, isMobile)
  useWheelForward(leftRef, rightRef, !isMobile)
  // the top bar doesn't scroll, so the wheel over it (and over the gaps beside it) scrolls the column
  useWheelForward(barRef, rightRef, !isMobile)
  // lines the top bar up with "Hi, my name is" and the footer's last row with the social row
  useRowAlign(mainRef, leftRef, rightRef, !isMobile)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const el = document.getElementById(href.slice(1))
    if (!el) return

    if (isMobile) {
      const top = el.getBoundingClientRect().top + window.scrollY - 48 - 20
      window.scrollTo({ top, behavior: "smooth" })
    } else {
      // offsetTop is measured from the scroller itself (it is `relative`, see below)
      rightRef.current?.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" })
    }
  }

  return (
    <>
      <InitialLoader />
      {/* `landing` (globals.css) holds the desktop strip/bar variables that useRowAlign feeds */}
      <main ref={mainRef} className="landing flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <Sidebar asideRef={leftRef} activeSection={activeSection} onNavigate={handleNavClick} />

        {/* Right column. Desktop: [top bar] + [scroller], stacked, so the scroller starts under the bar.
            Was: <div className="relative lg:h-screen lg:w-2/3 lg:overflow-hidden xl:w-3/5"> */}
        <div className="relative lg:flex lg:h-screen lg:w-2/3 lg:flex-col lg:overflow-hidden xl:w-3/5">
          <MobileNav isMobile={isMobile} activeSection={activeSection} />

          {/* Desktop top bar: Search + Ask, as wide as the text column (the paddings below are the
              scroller's plus the content's: lg 24+24, xl 40+24 left and 48+24 right; --sb-w adds the
              scrollbar). Its height is --strip: the gap above it, which lines it up with "Hi, my name is",
              plus the bar. It sits outside the scroller, so it stays put, and whatever scrolls past it is
              cut at the scroller's top edge; the background shows through around it. On a phone the
              same two buttons sit in MobileNav's pill instead (shown once the hero has scrolled away). */}
          <div
            ref={barRef}
            className="relative z-30 hidden shrink-0 lg:block lg:h-(--strip) lg:pt-(--bar-y) lg:pr-[calc(3rem+var(--sb-w))] lg:pl-12 xl:pr-[calc(4.5rem+var(--sb-w))] xl:pl-16"
          >
            <AssistTriggers variant="topbar" />
          </div>

          {/* Was: <div ref={rightRef} className="scrollbar-clay w-full overflow-x-hidden overflow-y-auto pb-10 lg:h-screen lg:pr-6 lg:pb-8 lg:pl-6 xl:pr-12 xl:pb-12 xl:pl-10">
              Desktop: it fills what is left under the bar (flex-1 instead of h-screen), and the end padding
              moved to the content below (--row-bottom), so the hero slot can be exactly this tall. */}
          <div
            ref={rightRef}
            className="scrollbar-clay relative w-full overflow-x-hidden overflow-y-auto pb-10 lg:min-h-0 lg:flex-1 lg:pr-6 lg:pb-0 lg:pl-6 xl:pr-12 xl:pb-0 xl:pl-10"
          >
            <HeroStage scrollContainerRef={rightRef} isMobile={isMobile} />

            {/* Was: className="space-y-16 px-5 lg:px-6 xl:space-y-24 xl:px-6"
                lg:pb-(--row-bottom): the footer's last row ends on the line the social row ends on. */}
            <div className="space-y-16 px-5 lg:px-6 lg:pb-(--row-bottom) xl:space-y-24 xl:px-6">
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
                {previewPosts.length ? <WritingCards posts={previewPosts} /> : <WritingList posts={previewPosts} />}
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
