"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

import { fadeUp } from "@/lib/motion"
import { cn } from "@/lib/utils"

const Em = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-foreground">{children}</span>
)

const paragraphs: ReactNode[] = [
  <>
    I&apos;m a software engineer specializing in <Em>production Machine Learning systems</Em> and{" "}
    <Em>real-time web apps</Em>, from training and deploying models to shipping the interfaces,
    APIs, and infrastructure that serve them. I care about the architectural decisions that
    separate a system that holds up from one that collapses under load.
  </>,
  <>
    Right now I&apos;m building <Em>SyncBoard</Em>, a real-time multiplayer incident management
    workspace. Think PagerDuty meets Notion: Socket.io clusters bridged via Redis Pub/Sub, Yjs
    CRDTs for conflict-free collaborative editing, and an optimistic UI that rolls back
    gracefully when the network disagrees. The architecture problem is interesting; solving it
    without over-engineering it is the actual challenge.
  </>,
  <>
    In parallel, I&apos;m building up my ML foundations, from linear algebra and backpropagation
    through to fine-tuning and production LLM systems, with a focus on cloud MLOps. The plan is
    to bring that into SyncBoard: auto-classification of incidents, runbook RAG lookup, and
    on-call summarisation.
  </>,
]

export function Profile() {
  return (
    <div className="space-y-5">
      {paragraphs.map((text, i) => (
        <motion.p
          key={i}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          custom={i}
          className={cn("text-lg leading-relaxed text-foreground/85")}
        >
          {text}
        </motion.p>
      ))}
    </div>
  )
}
