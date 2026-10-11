"use client";

import { useState } from "react";
import Image from "next/image";
import { TiltCard } from "@/components/ui/tilt-card";
import { FaGithub, FaRegCalendar, FaStar, FaUserTie, FaUsers } from "react-icons/fa";
import { MdLink } from "react-icons/md";
import { RiArrowRightUpLine } from "react-icons/ri";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { Project, ProjectStatus } from "@/lib/data/projects";

const statusStyle: Record<ProjectStatus, { label: string; text: string; dot: string }> = {
  "IN PROGRESS": {
    label: "In Progress",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500 animate-pulse",
  },
  COMPLETED: { label: "Completed", text: "text-primary", dot: "bg-primary" },
  ARCHIVED: {
    label: "Archived",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

function Thumbnail({ project }: { project: Project }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="clay-well relative h-44 w-full shrink-0 overflow-hidden sm:h-28">
      {project.thumb ? (
        <>
          {!loaded && <Skeleton className="absolute inset-0 z-10" />}
          <Image
            ref={(img) => {
              // cached images can finish before hydration, so onLoad never fires
              if (img?.complete) setLoaded(true);
            }}
            src={project.thumb}
            alt={project.name}
            width={500}
            height={500}
            onLoad={() => setLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <RiArrowRightUpLine size={22} className="text-muted-foreground" />
        </div>
      )}

      {project.featured && (
        <span className="clay clay-sm absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <FaStar size={9} /> Featured
        </span>
      )}
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
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
  );
}

export function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const status = p.status ? statusStyle[p.status] : null;

  return (
    <TiltCard
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="clay grid gap-5 p-5 hover:-translate-y-1 sm:grid-cols-[160px_1fr]"
    >
      <Thumbnail project={p} />

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h3 className="truncate text-base font-bold text-foreground">{p.name}</h3>
            {status && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  status.text,
                )}
              >
                <span className={cn("size-1.5 rounded-full", status.dot)} />
                {status.label}
              </Badge>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {p.github && (
              <IconLink href={p.github} label={`${p.name} on GitHub`}>
                <FaGithub size={14} />
              </IconLink>
            )}
            {p.link && (
              <IconLink href={p.link} label={`${p.name} live site`}>
                <MdLink size={16} />
              </IconLink>
            )}
          </div>
        </div>

        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {p.description}
        </p>

        {(p.role || p.startDate || p.teamSize) && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-muted-foreground">
            {p.role && (
              <li className="flex items-center gap-1.5">
                <FaUserTie className="text-primary" /> {p.role}
              </li>
            )}
            {p.startDate && (
              <li className="flex items-center gap-1.5">
                <FaRegCalendar className="text-primary" /> {p.startDate}
                {p.endDate && ` — ${p.endDate}`}
              </li>
            )}
            {p.teamSize && (
              <li className="flex items-center gap-1.5">
                <FaUsers className="text-primary" /> {p.teamSize}{" "}
                {p.teamSize === 1 ? "person" : "people"}
              </li>
            )}
          </ul>
        )}

        <ul className="flex flex-wrap gap-2 pt-1">
          {p.tags.map((tag) => (
            <Badge
              key={tag}
              asChild
              variant="secondary"
              className="text-[11px] font-semibold"
            >
              <li>{tag}</li>
            </Badge>
          ))}
        </ul>
      </div>
    </TiltCard>
  );
}
