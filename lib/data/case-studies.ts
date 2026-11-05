import type { DiagramSpec } from "@/lib/diagram"

/* Case-study copy, keyed by project slug.

   Rule for this file: say only what is true and checkable. No invented numbers, no outcomes that
   haven't happened. For a project still being built, "results" is an honest status, not a victory lap.
   Everything below comes from the project descriptions on this site and from the owner's own notes. */

export interface CaseStudy {
  tagline: string
  problem: string[]
  decisions: { title: string; body: string }[]
  diagram: DiagramSpec
  /** shown under the diagram */
  diagramNote?: string
  stack: { layer: string; items: string[] }[]
  results: { heading: string; items: string[] }
}

export const caseStudies: Record<string, CaseStudy> = {
  syncboard: {
    tagline: "A real-time workspace where a team can run an incident together without stepping on each other.",
    problem: [
      "During an incident several people are in the same record at once: editing the write-up, changing status, handing it over. Last-write-wins loses work, and a page refresh to see what others did is too slow.",
      "SyncBoard is built as a multi-tenant product, so the same system also has to keep each customer's data invisible to every other customer, and meter usage for billing, without any of that slowing the live connection down.",
    ],
    decisions: [
      {
        title: "Scale the socket layer sideways",
        body: "Socket.io runs as a cluster of nodes that share events through Redis Pub/Sub, so a user connected to one node still sees changes made through another.",
      },
      {
        title: "CRDT for shared text, locking for records",
        body: "Collaborative editing uses Yjs, which merges concurrent edits without a referee. Structured fields use optimistic locking: a stale write gets a 409 and the client rolls back.",
      },
      {
        title: "Keep the hot path clean",
        body: "Stripe usage metering is pushed onto BullMQ queues, so billing work never blocks a socket message.",
      },
      {
        title: "Auth without a black box",
        body: "RS256 JWTs with refresh-token rotation kept in Redis, written directly instead of through an auth library.",
      },
      {
        title: "Tenants can't probe each other",
        body: "A request for another tenant's resource always returns 404, never 403, so the response doesn't confirm the resource exists. Ownership changes only through one dedicated, atomic route.",
      },
    ],
    diagram: {
      title: "SyncBoard architecture",
      lanes: [
        { label: "Client", nodes: [{ id: "web", label: "Next.js app", sub: "optimistic UI · Yjs doc" }] },
        {
          label: "Servers",
          nodes: [
            { id: "api", label: "REST API", sub: "Fastify · JWT" },
            { id: "ws", label: "Socket.io nodes", sub: "horizontally scaled" },
          ],
        },
        {
          label: "Cache & queue",
          nodes: [
            { id: "redis", label: "Redis", sub: "Pub/Sub · tokens · presence" },
            { id: "queue", label: "BullMQ workers", sub: "persistence · metering" },
          ],
        },
        {
          label: "Stores & services",
          nodes: [
            { id: "pg", label: "PostgreSQL", sub: "Prisma · versioned rows" },
            { id: "stripe", label: "Stripe", sub: "usage billing" },
          ],
        },
      ],
      edges: [
        { from: "web", to: "api", label: "REST" },
        { from: "web", to: "ws", label: "WebSocket" },
        { from: "api", to: "redis", label: "tokens" },
        { from: "ws", to: "redis", label: "Pub/Sub" },
        { from: "ws", to: "queue", label: "enqueue" },
        { from: "queue", to: "pg", label: "persist" },
        { from: "queue", to: "stripe", label: "usage" },
      ],
    },
    diagramNote: "Shows the architecture SyncBoard is being built to. The project is in progress, so individual pieces are at different stages.",
    stack: [
      { layer: "Front end", items: ["Next.js", "TypeScript"] },
      { layer: "Real time", items: ["Socket.io", "Yjs", "Redis Pub/Sub"] },
      { layer: "Back end", items: ["Fastify", "BullMQ", "Stripe"] },
      { layer: "Data", items: ["PostgreSQL", "Prisma", "Redis"] },
      { layer: "Platform", items: ["Turborepo + pnpm", "Kubernetes (EKS)", "Terraform", "Prometheus + Grafana"] },
    ],
    results: {
      heading: "Where it stands",
      items: [
        "In progress, built solo, started July 2026.",
        "Engineering docs and decision records written for the monorepo, auth, WebSockets, Yjs, PostgreSQL and Redis.",
        "The data model is scaffolded in Prisma, and the plan was checked for consistency across all docs before building.",
      ],
    },
  },

  educampus: {
    tagline: "One platform for the day-to-day of a campus, with a separate view for teachers and for students.",
    problem: [
      "Assignments, timetable, grades, announcements, attendance, quizzes, course materials and the library tend to live in separate tools. Teachers and students need different views of the same records, and early versions of the app ran on mock data.",
    ],
    decisions: [
      {
        title: "Route groups with role-switch Server Components",
        body: "The parallel-route layout was refactored into route groups; a Server Component picks the teacher or student experience from the signed-in role.",
      },
      {
        title: "A real GraphQL contract",
        body: "The schema and resolvers were rebuilt as a whole, and the Apollo client was wired correctly into the App Router through ApolloNextAppProvider.",
      },
      {
        title: "One login across two servers",
        body: "JWT cookie auth works across the boundary between the Next.js app and the Express API.",
      },
      {
        title: "Real data everywhere",
        body: "Mock data was replaced with database-driven data across assignments, timetable, grades, announcements, attendance, quizzes, course materials and the library.",
      },
    ],
    diagram: {
      title: "EduCampus architecture",
      lanes: [
        { label: "Client", nodes: [{ id: "browser", label: "Browser", sub: "teacher or student" }] },
        { label: "Front end", nodes: [{ id: "next", label: "Next.js App Router", sub: "role route groups" }] },
        { label: "Back end", nodes: [{ id: "gql", label: "Express + Apollo", sub: "GraphQL API" }] },
        { label: "Data", nodes: [{ id: "pg", label: "PostgreSQL", sub: "via Prisma" }] },
      ],
      edges: [
        { from: "browser", to: "next", label: "pages" },
        { from: "next", to: "gql", label: "GraphQL" },
        { from: "gql", to: "pg", label: "Prisma" },
      ],
    },
    stack: [
      { layer: "Front end", items: ["Next.js (App Router)", "shadcn/ui", "Apollo Client"] },
      { layer: "Back end", items: ["Express", "Apollo Server", "GraphQL"] },
      { layer: "Data", items: ["PostgreSQL", "Prisma"] },
      { layer: "Auth", items: ["JWT in cookies"] },
    ],
    results: {
      heading: "What changed",
      items: [
        "A full codebase audit, with 57 issues found and fixed.",
        "Eight domains moved from mock data to database-backed data.",
        "The GraphQL schema and resolvers rebuilt from the ground up.",
        "Role-based routing restructured into route groups.",
      ],
    },
  },
}
