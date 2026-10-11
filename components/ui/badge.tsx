import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* shadcn Badge, re-skinned.
   default   = a small raised pellet (use `tone` to tint it)
   secondary = an inset well: the right look for tags and read-only facts */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "clay clay-xs text-foreground",
        secondary:
          "clay-well text-muted-foreground [--clay-elev:var(--e-well-sm)] [--clay-radius:999px]",
        destructive: "clay clay-xs text-foreground [--clay-surface:var(--tone-rose)]",
        outline: "clay clay-xs text-foreground [--clay-surface:var(--tone-plum)]",
        ghost: "text-muted-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
      tone: {
        none: "",
        aqua: "[--clay-surface:var(--tone-peach)]",
        sky: "[--clay-surface:var(--tone-mauve)]",
        violet: "[--clay-surface:var(--tone-plum)]",
        coral: "[--clay-surface:var(--tone-rose)]",
        amber: "[--clay-surface:var(--tone-apricot)]",
      },
    },
    defaultVariants: {
      variant: "default",
      tone: "none",
    },
  }
)

function Badge({
  className,
  variant = "default",
  tone = "none",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
