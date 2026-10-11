"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Copy, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RotatingText } from "@/components/ui/rotating-text"
import { TypedText } from "@/components/ui/typed-text"
import { fadeIn, fadeUp, motionSpring } from "@/lib/motion"
import { navLinks } from "@/lib/data/nav"
import { roles } from "@/lib/data/profile"
import { socials } from "@/lib/data/socials"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

interface SidebarProps {
  asideRef: React.Ref<HTMLElement>
  activeSection: string
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void
}

const reveal = (i: number) =>
  ({ variants: fadeUp, initial: "hidden", animate: "visible", custom: i }) as const

export function Sidebar({ asideRef, activeSection, onNavigate }: SidebarProps) {
  const [emailCopied, setEmailCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setEmailCopied(true)
      window.setTimeout(() => setEmailCopied(false), 1800)
    } catch {
      // Clipboard access is unavailable in some browser contexts.
      window.prompt("Copy email address:", site.email)
    }
  }

  return (
    <aside
      ref={asideRef}
      className="flex w-full flex-col justify-between gap-10 px-6 py-10 lg:sticky lg:top-0 lg:h-screen lg:w-2/5 lg:px-12 lg:py-16"
    >
      <header className="flex flex-col gap-6">
        <TypedText text="Hi, my name is" className="font-mono text-sm text-primary" />

        <motion.div {...reveal(1)}>
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
            Tavonga
            <span className="block bg-linear-to-r from-primary to-glaze-rose bg-clip-text text-transparent">
              Chitambira
            </span>
          </h1>
          <RotatingText
            items={roles}
            className="mt-3 text-lg font-medium text-foreground/80 lg:text-xl"
          />
        </motion.div>

        <motion.p {...reveal(2)} className="max-w-sm text-base font-medium leading-relaxed text-muted-foreground">
          I build models and the web products around them.
        </motion.p>

        <motion.div {...reveal(3)} className="flex flex-row flex-wrap gap-3">
          <Button asChild>
            <Link href="/projects">
              Explore my work
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <a href={site.resume} download>
              <Download aria-hidden="true" />
              Download résumé
            </a>
          </Button>
        </motion.div>
      </header>

      <nav className="hidden flex-col items-start lg:flex" aria-label="Sections">
        {navLinks.map((link, i) => {
          const isActive = activeSection === link.id
          return (
            <motion.div key={link.id} {...reveal(i + 4)}>
              <Link
                href={`#${link.id}`}
                onClick={(e) => onNavigate(e, `#${link.id}`)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "group relative grid grid-cols-[1.75rem_auto] items-center gap-3 py-3 pl-5 text-left font-mono text-[11px] font-bold tracking-[0.12em] uppercase transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <>
                    <motion.span
                      layoutId="nav-route-rail"
                      className="absolute top-1/2 left-0 h-8 w-px -translate-y-1/2 bg-primary"
                      transition={motionSpring}
                    />
                    <motion.span
                      layoutId="nav-route-marker"
                      className="absolute top-1/2 left-[-3px] size-[7px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                      transition={motionSpring}
                    />
                  </>
                )}
                <span className={cn("text-[10px] tabular-nums transition-colors", isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary")}>{String(i + 1).padStart(2, "0")}</span>
                <span>{link.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <motion.ul variants={fadeIn} initial="hidden" animate="visible" className="flex items-center gap-4">
        {socials.filter(({ label }) => label !== "Gmail").map(({ label, href, icon: Icon }, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.05, duration: 0.25 }}
            className="group relative"
          >
            <motion.a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              whileHover={{ y: -3 }}
              whileFocus={{ y: -3 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="clay clay-sm clay-press flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
            >
              <Icon className="size-5" />
            </motion.a>
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-semibold text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              {label}
            </span>
          </motion.li>
        ))}
        <motion.li
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.25 }}
        >
          <motion.button
            type="button"
            onClick={copyEmail}
            aria-label={emailCopied ? "Email address copied" : "Copy email address"}
            whileHover={{ y: -3 }}
            whileFocus={{ y: -3 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="clay clay-sm clay-press flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            {emailCopied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {emailCopied ? "Copied" : "Copy email"}
          </motion.button>
        </motion.li>
      </motion.ul>
    </aside>
  )
}
