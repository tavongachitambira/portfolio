"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FaGithub } from "react-icons/fa"
import { MdLink } from "react-icons/md"

import { Badge } from "@/components/ui/badge"
import { previewProjects, projectPeriod } from "@/lib/data/projects"
import { cn } from "@/lib/utils"

/* Vertical tabs on desktop, a horizontal strip on phones. */
export function ProjectTabs() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const project = previewProjects[active]
  const bullets = project.highlights?.length ? project.highlights : [project.description]

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (active + step + previewProjects.length) % previewProjects.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
      <div
        role="tablist"
        aria-label="Projects"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="scrollbar-clay relative flex shrink-0 overflow-x-auto sm:w-44 sm:flex-col sm:overflow-visible"
      >
        {/* the track the active bar slides along */}
        <span aria-hidden className="absolute bottom-0 left-0 h-px w-full bg-border sm:inset-y-0 sm:h-auto sm:w-px" />

        {previewProjects.map((p, i) => {
          const selected = i === active
          return (
            <button
              key={p.name}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`project-tab-${i}`}
              aria-selected={selected}
              aria-controls="project-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "relative px-4 py-3 text-left font-mono text-xs whitespace-nowrap transition-colors duration-200 sm:h-11 sm:py-0 sm:leading-[2.75rem]",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="project-tab-bar"
                  aria-hidden
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-primary sm:inset-y-0 sm:h-auto sm:w-0.5"
                />
              )}
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="min-h-72 min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={project.name}
            role="tabpanel"
            id="project-panel"
            aria-labelledby={`project-tab-${active}`}
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="outline-none"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-xl leading-tight font-semibold">
                {project.role ?? "Builder"}{" "}
                <span className="text-primary">@ {project.name}</span>
              </h3>

              <div className="flex items-center gap-2">
                {project.github && (
                  <IconLink href={project.github} label={`${project.name} on GitHub`}>
                    <FaGithub size={14} />
                  </IconLink>
                )}
                {project.link && (
                  <IconLink href={project.link} label={`${project.name} live site`}>
                    <MdLink size={16} />
                  </IconLink>
                )}
              </div>
            </div>

            <p className="mt-1.5 font-mono text-xs text-muted-foreground">{projectPeriod(project)}</p>

            <ul className="mt-5 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden className="mt-px text-primary">▹</span>
                  {b}
                </li>
              ))}
            </ul>

            <ul className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} asChild variant="secondary" className="text-[11px]">
                  <li>{tag}</li>
                </Badge>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="clay clay-sm clay-press flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
    >
      {children}
    </a>
  )
}