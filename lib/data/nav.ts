export const navLinks = [
  { id: "profile", label: "Who's behind the code" },
  { id: "projects", label: "Projects" },
  { id: "writing", label: "Writing" },
  { id: "skills", label: "Skills" },
] as const

export type SectionId = (typeof navLinks)[number]["id"]

export const sectionIds = navLinks.map((l) => l.id)

export const labelOf = (id: SectionId) => navLinks.find((l) => l.id === id)!.label