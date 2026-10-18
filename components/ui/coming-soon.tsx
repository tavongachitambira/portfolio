import { cn } from "@/lib/utils"

export function ComingSoon({ message, className }: { message: string; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5 font-mono text-xs text-muted-foreground", className)}>
      <span aria-hidden className="relative flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
        <span className="relative size-1.5 rounded-full bg-primary" />
      </span>
      {message}
    </p>
  )
}