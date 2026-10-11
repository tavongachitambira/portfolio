"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

import { ViewMore } from "@/components/home/ViewMore"
import { fadeUp } from "@/lib/motion"

export function Section({
  id,
  title,
  more,
  children,
}: {
  id: string
  title: string
  /** adds a "view more" button under the content */
  more?: { href: string; label: string }
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mb-6 flex items-center gap-4"
      >
        <h2
          id={`${id}-title`}
          className="text-xs font-bold tracking-[0.2em] text-primary uppercase"
        >
          {title}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </motion.div>

      {children}
      {more && <ViewMore {...more} />}
    </section>
  )
}