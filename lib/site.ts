export type LampState = "shipped" | "building" | "learning"

/* One place for the facts the site repeats. */
export const site = {
  name: "Tavonga Chitambira",
  email: "obichitas03@gmail.com",
  url: "https://tavongachitambira.vercel.app",
  resume: "/resume.pdf", // lives in /public
} as const
