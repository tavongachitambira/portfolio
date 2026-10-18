import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* shadcn Button, re-skinned as clay. Same API as stock shadcn (variant, size, asChild),
   so docs and examples keep working. The depth recipes (including .clay-btn) live in styles/clay.css.
   Focus uses outline, not ring: Tailwind's ring is a box-shadow and would erase the clay. */
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // the one loud button: glaze gradient + glow
        default: "clay clay-glaze clay-btn text-on-glaze",
        // neutral raised clay
        secondary: "clay clay-btn text-secondary-foreground",
        // tinted raised clay
        outline:
          "clay clay-btn text-foreground [--clay-surface:var(--tone-plum)]",
        // flat until you reach for it
        ghost:
          "clay clay-btn clay-flat text-muted-foreground hover:text-foreground",
        destructive:
          "clay clay-btn text-on-glaze [--clay-surface:var(--glaze-rose)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 has-[>svg]:px-5",
        xs: "h-7 gap-1 px-3 text-xs has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3.5",
        lg: "h-14 px-8 text-base has-[>svg]:px-7",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }