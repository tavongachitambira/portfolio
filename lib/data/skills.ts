export type Level = 1 | 2 | 3 | 4 | 5

export interface Skill {
  name: string
  level: Level
  /** still being learned: shown with a pulse */
  learning?: boolean
}

export interface SkillGroup {
  id: string
  title: string
  blurb: string
  items: Skill[]
}

/* Levels are your own honest read: 1 = just started, 5 = could teach it.
   All levels below are placeholders. Edit freely. */
export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend",
    blurb: "Interfaces that feel fast and stay accessible.",
    items: [
      { name: "TypeScript", level: 4 },
      { name: "Next.js", level: 4 },
      { name: "React", level: 4 },
      { name: "Tailwind CSS", level: 4 },
      { name: "Framer Motion", level: 3 },
      { name: "shadcn/ui", level: 4 },
      { name: "Apollo Client", level: 3 },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    blurb: "APIs, real-time systems and the data under them.",
    items: [
      { name: "Node.js", level: 4 },
      { name: "GraphQL", level: 4 },
      { name: "Prisma", level: 4 },
      { name: "PostgreSQL", level: 3 },
      { name: "Redis", level: 3 },
      { name: "Socket.io", level: 3 },
      { name: "BullMQ", level: 2 },
    ],
  },
  {
    id: "ml",
    title: "Data & ML",
    blurb: "Foundations first, then production.",
    items: [
      { name: "Python", level: 4 },
      { name: "pandas", level: 4 },
      { name: "scikit-learn", level: 3 },
      { name: "Power BI", level: 3 },
      { name: "Tableau", level: 3 },
      { name: "PyTorch", level: 2, learning: true },
      { name: "LLMs & RAG", level: 2, learning: true },
    ],
  },
  {
    id: "tooling",
    title: "Tooling",
    blurb: "Shipping and keeping things running.",
    items: [
      { name: "Git & GitHub", level: 4 },
      { name: "Linux", level: 4 },
      { name: "Docker", level: 3 },
      { name: "Kubernetes", level: 2, learning: true },
      { name: "CI/CD", level: 3 },
      { name: "Turborepo", level: 3 },
    ],
  },
  {
    id: "practice",
    title: "Practice",
    blurb: "How I work, beyond any one tool.",
    items: [
      { name: "System design", level: 3 },
      { name: "Testing", level: 3 },
      { name: "Technical writing", level: 3 },
      { name: "Code review", level: 4 },
    ],
  },
]

export const SKILLS_PREVIEW_GROUPS = 4
export const SKILLS_PREVIEW_ITEMS = 6
export const learningSkills = skillGroups.flatMap((g) => g.items.filter((s) => s.learning))