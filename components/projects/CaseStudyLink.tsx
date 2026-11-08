import Link from "next/link"
import { FileText } from "lucide-react"

/* The way into a project's case study, shown under its ticket: a paper icon on a clay chip and two lines of text,
   aligned with the ticket's left edge. There is deliberately no arrow; the whole block is the link. */
export function CaseStudyLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      href={`/projects/${slug}`}
      className="group mt-4 flex w-fit max-w-full items-center gap-3.5 rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <span
        aria-hidden
        className="clay clay-sm grid size-11 shrink-0 place-items-center text-primary transition-transform duration-300 [--clay-radius:0.95rem] group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
      >
        <FileText className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          Read the {name} case study
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">Problem, architecture and the decisions behind it</span>
      </span>
    </Link>
  )
}
