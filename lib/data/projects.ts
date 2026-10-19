export type ProjectStatus = "IN PROGRESS" | "COMPLETED" | "ARCHIVED"

export interface Project {
  name: string
  description: string
  /** Short bullets shown in the tabbed view. Falls back to `description`. */
  highlights?: string[]
  thumb?: string
  tags: string[]
  status?: ProjectStatus
  link?: string
  github?: string
  featured?: boolean
  startDate?: string
  endDate?: string
  teamSize?: number
  role?: string
}

/* Only SyncBoard is real. Everything marked DUMMY is placeholder: delete it as you ship. */
export const projects: Project[] = [
  {
    name: "SyncBoard",
    description:
      "Real-time multiplayer incident management workspace. Horizontally-scaled Socket.io cluster via Redis Pub/Sub, Yjs CRDT collaborative editing, optimistic locking with 409 rollback, and Stripe usage metering via BullMQ, all without blocking the socket hot path.",
    highlights: [
      "RS256 JWT auth with refresh-token rotation in Redis, no auth library.",
      "Cross-tenant requests always return 404, never 403, so tenants can't probe each other.",
      "Ownership transfers only through one dedicated, atomic route.",
    ],
    tags: ["Next.js", "Socket.io", "Yjs", "Redis", "PostgreSQL", "BullMQ", "Stripe", "Kubernetes"],
    thumb: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1000&q=85",
    role: "Solo Architect & Developer",
    status: "IN PROGRESS",
    startDate: "July 2026",
    // github: "https://github.com/cypherx72/syncboard",
  },
  
]

const statusOrder: Record<ProjectStatus, number> = {
  "IN PROGRESS": 0,
  COMPLETED: 1,
  ARCHIVED: 2,
}

/** Featured first, then by status. Static data, so sorted once. */
export const sortedProjects = [...projects].sort(
  (a, b) =>
    Number(!!b.featured) - Number(!!a.featured) ||
    statusOrder[a.status ?? "ARCHIVED"] - statusOrder[b.status ?? "ARCHIVED"],
)

export const PREVIEW_COUNT = 5
export const previewProjects = sortedProjects.slice(0, PREVIEW_COUNT)

/** "July 2026 — Present", "March 2026 — May 2026", or just the start date. */
export function projectPeriod(p: Project) {
  if (!p.startDate) return ""
  if (p.endDate) return `${p.startDate} — ${p.endDate}`
  return p.status === "IN PROGRESS" ? `${p.startDate} — Present` : p.startDate
}
