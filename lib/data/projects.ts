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
    role: "Solo Architect & Developer",
    status: "IN PROGRESS",
    startDate: "July 2026",
    // github: "https://github.com/cypherx72/syncboard",
  },
  // ── DUMMY ──────────────────────────────────────────────────────────────
  {
    name: "Sentinel",
    description:
      "Anomaly detection service that flags unusual traffic patterns in streaming logs and explains why each alert fired.",
    highlights: [
      "Isolation Forest baseline, evaluated against a labelled holdout instead of eyeballed.",
      "FastAPI inference endpoint with p95 latency tracked per release.",
      "Alert explanations generated from the top contributing features.",
    ],
    tags: ["Python", "scikit-learn", "FastAPI", "Docker"],
    role: "ML Engineer",
    status: "IN PROGRESS",
    startDate: "September 2026",
  },
  {
    name: "Ledgerly",
    description:
      "Personal finance tracker with CSV import, category rules and monthly trend charts.",
    highlights: [
      "Rule engine that auto-categorises transactions and learns from corrections.",
      "Server-side aggregation so charts stay fast with years of data.",
      "Fully typed GraphQL schema shared between API and client.",
    ],
    tags: ["Next.js", "GraphQL", "Apollo", "Prisma", "Tailwind"],
    role: "Full Stack Developer",
    status: "COMPLETED",
    startDate: "March 2026",
    endDate: "May 2026",
  },
  {
    name: "Lumen Search",
    description:
      "Retrieval-augmented search over personal notes, with citations back to the source passage.",
    highlights: [
      "Chunking and embedding pipeline with incremental re-indexing.",
      "Hybrid keyword + vector retrieval, compared on a small hand-built eval set.",
      "Answers always link back to the exact passage they came from.",
    ],
    tags: ["Python", "LLMs", "RAG", "pgvector", "FastAPI"],
    role: "Solo Developer",
    status: "IN PROGRESS",
    startDate: "August 2026",
  },
  {
    name: "Trailhead",
    description:
      "Mobile-first trip planner that turns a list of places into a day-by-day route.",
    highlights: [
      "Route ordering with a nearest-neighbour heuristic plus 2-opt clean-up.",
      "Offline-first itinerary view using a service worker.",
      "Shareable read-only links for travel companions.",
    ],
    tags: ["React", "TypeScript", "Node.js", "PWA"],
    role: "Frontend Developer",
    status: "COMPLETED",
    startDate: "January 2026",
    endDate: "February 2026",
  },
  {
    name: "Pixel Pantry",
    description:
      "Recipe app that suggests meals from a photo of what is in the fridge.",
    highlights: [
      "Image classifier fine-tuned on a small grocery dataset.",
      "Ingredient matching against a recipe index with substitutions.",
      "Pantry state synced across devices.",
    ],
    tags: ["PyTorch", "FastAPI", "React Native"],
    role: "ML + Mobile Developer",
    status: "ARCHIVED",
    startDate: "October 2025",
    endDate: "December 2025",
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