"use client"
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react"

import TearTicket from "@/components/TearTicket"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useIsMobile } from "@/hooks/useIsMobile"
import type { Project } from "@/lib/data/projects"

const TICKET_COLOURS = [
  { paper: "#0e4a46", stub: "#e4a66c", ink: "#f8f1e5" },
  { paper: "#5c3844", stub: "#93bcb0", ink: "#fff7ed" },
  { paper: "#5a4931", stub: "#cf8470", ink: "#fff9e9" },
]

function serialFor(name: string, index: number) {
  const value = [...name].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 900000, 17000 + index * 7919)
  return `JX-${String(value).padStart(6, "0")}`
}

export function ProjectTicket({ project, index }: { project: Project; index: number }) {
  const [used, setUsed] = useState(false)
  const isPhone = useIsMobile(640)
  const palette = TICKET_COLOURS[index % TICKET_COLOURS.length]
  const serial = useMemo(() => serialFor(project.name, index), [project.name, index])
  const destination = project.link ?? project.github ?? "/"

  const openProject = () => {
    setUsed(true)
    window.location.assign(destination)
  }

  return (
    <TearTicket
      stub={
        isPhone ? (
          /* Phone: stub sits at the bottom as a wide, short strip */
          <div
            className="flex h-full items-center justify-between gap-3 px-5"
            style={{ color: palette.paper }}
          >
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase">Tear to open</p>
              <h3 className="mt-1 text-base leading-tight font-extrabold">
                {used ? "Opened" : "View project"}
              </h3>
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
              {used ? "Loading" : "Swipe →"}
            </span>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between px-4 py-5" style={{ color: palette.paper }}>
            <div>
              <p className="font-mono text-[9px] font-bold tracking-[0.16em] uppercase">Tear to open</p>
              <h3 className="mt-2 text-base font-extrabold">{used ? "Opened" : "View project"}</h3>
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
              {used ? "Loading" : serial}
            </span>
          </div>
        )
      }
      orientation={isPhone ? "vertical" : "horizontal"}
      torn={used}
      onTear={openProject}
      width={isPhone ? 340 : 740}
      height={isPhone ? 460 : 265}
      stubSize={isPhone ? 84 : 165}
      radius={16}
      holes={14}
      holeSize={6}
      notch={3}
      roughness={0.75}
      tearAngle={30}
      stretch={30}
      resistance={0.45}
      rotate={0}
      tilt={false}
      tiltMax={5}
      tiltReach={260}
      parallax={3}
      perspective={1000}
      background={palette.paper}
      stubBackground={palette.stub}
      color={palette.ink}
      border
      borderWidth={1}
      recenter
      className="project-ticket mx-auto"
      ariaLabel={`Tear to open ${project.name}`}
    >
      {isPhone ? (
        <div className="flex h-full min-w-0 flex-col gap-3 p-4">
          <div className="h-28 w-full shrink-0 overflow-hidden rounded-[10px] border border-white/15 bg-black/10">
            {project.thumb ? (
              <img src={project.thumb} alt="" className="h-full w-full object-cover" draggable={false} />
            ) : (
              <div className="grid h-full place-items-center font-mono text-xs tracking-widest uppercase text-white/60">
                Project image
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-white/65 uppercase">
              {project.status ?? "Project"} · {serial}
            </p>
            <h2 className="mt-1.5 text-2xl leading-tight font-extrabold tracking-tight">{project.name}</h2>
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-white/85">{project.description}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/18 bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-white/85"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid h-full grid-cols-[41%_1fr] gap-6 p-5 sm:p-6">
          <div className="self-start">
            <div className="aspect-square w-full overflow-hidden rounded-[10px] border border-white/15 bg-black/10">
              {project.thumb ? (
                <img src={project.thumb} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="grid h-full place-items-center font-mono text-xs tracking-widest uppercase text-white/60">
                  Project image
                </div>
              )}
            </div>
          </div>
          <div className="flex min-w-0 flex-col py-1 pr-1">
            <div>
              <p className="font-mono text-[9px] font-semibold tracking-[0.18em] text-white/65 uppercase">
                {project.status ?? "Project"} · {serial}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{project.name}</h2>
              <HoverCard openDelay={180} closeDelay={120}>
                <HoverCardTrigger asChild>
                  <p
                    tabIndex={0}
                    className="mt-3 line-clamp-2 cursor-help text-sm leading-relaxed text-white/82 outline-none focus-visible:underline"
                  >
                    {project.description}
                  </p>
                </HoverCardTrigger>
                <HoverCardContent className="w-72 border-white/15 bg-[#123f3b] p-3 text-xs leading-relaxed text-white shadow-xl">
                  {project.description}
                </HoverCardContent>
              </HoverCard>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/18 bg-white/10 px-2 py-1 font-mono text-[9px] font-semibold text-white/82"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </TearTicket>
  )
}