import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AssistTriggers } from "@/components/assist/AssistTriggers"
import { Footer } from "@/components/layout/Footer"

/* Shared frame for the "view more" pages. */
export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  intro: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      {/* one row: "Back home" on the left, the search bar on the right. It scrolls with the page, so it never
          floats over the content below; the row is the `@container` the bar measures */}
      <div className="@container flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          Back home
        </Link>
        <AssistTriggers />
      </div>

      <header className="mt-10 mb-12">
        <p className="font-mono text-sm text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{intro}</p>
      </header>

      {children}

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  )
}