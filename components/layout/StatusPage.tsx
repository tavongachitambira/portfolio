import Link from "next/link"

import { Button } from "@/components/ui/button"

export function StatusPage({
  code,
  title,
  message,
  digest,
  hardNav = false,
}: {
  code: string
  title: string
  message: string
  digest?: string
  /** plain <a> (full reload); use in global-error where the router may be broken */
  hardNav?: boolean
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6">
      <div className="clay flex flex-col items-center gap-5 p-10 text-center sm:p-14">
        <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {code}
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="max-w-sm text-base leading-relaxed text-muted-foreground">{message}</p>
        {digest && (
          <p className="font-mono text-[10px] text-muted-foreground">ref: {digest}</p>
        )}
        <Button asChild>
          {hardNav ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/">Back to home</a>
          ) : (
            <Link href="/">Back to home</Link>
          )}
        </Button>
      </div>
    </main>
  )
}