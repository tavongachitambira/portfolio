import { cn } from "@/lib/utils"

/* The "x" in Web x ML: a glaze-coloured clay orb. */
export function XOrb({
  className,
  glyphClassName,
  mode = "multiply",
}: {
  className?: string
  glyphClassName?: string
  mode?: "multiply" | "signal"
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "clay clay-glaze inline-grid place-items-center text-on-glaze [--clay-radius:999px]",
        mode === "signal" && "x-orb--signal",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("x-orb__multiply absolute size-[44%]", glyphClassName)}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="x-orb__signal absolute size-[58%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 12 5 6M12 12l7-6M12 12v7" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <circle cx="5" cy="6" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="19" cy="6" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}
