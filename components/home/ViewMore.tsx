"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { fadeUp } from "@/lib/motion"

export function ViewMore({ href, label }: { href: string; label: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      className="mt-8"
    >
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {label}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  )
}
