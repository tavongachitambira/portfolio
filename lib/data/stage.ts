export type StageSide = "web" | "ml"

export interface StagePane {
  side: StageSide
  title: string
  blurb: string
  points: string[]
  stack: string[]
}

/* The copy that appears under each hero slab once they split apart. */
export const stagePanes: Record<StageSide, StagePane> = {
  web: {
    side: "web",
    title: "Web Development",
    blurb: "Real-time products, from the database to the pixel.",
    points: [
      "Multi-tenant APIs with strict isolation",
      "Live collaboration over WebSockets and CRDTs",
      "Typed end to end, from Prisma to the UI",
    ],
    stack: ["Next.js", "TypeScript", "Node.js", "GraphQL", "Prisma", "Redis"],
  },
  ml: {
    side: "ml",
    title: "Machine Learning",
    blurb: "Models that earn their place in a product.",
    points: [
      "Classical ML and evaluation done honestly",
      "Moving from notebooks to served models",
      "LLM features: RAG, classification, summaries",
    ],
    stack: ["Python", "scikit-learn", "pandas", "PyTorch", "FastAPI", "MLOps"],
  },
}