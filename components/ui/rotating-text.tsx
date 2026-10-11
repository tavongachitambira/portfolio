"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function RotatingText({
  items,
  interval = 3000,
  className,
}: {
  items: readonly string[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || items.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval, reduce]);

  return (
    <span className={cn("relative block h-[1.4em] overflow-hidden", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={items[i]}
          className="block"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {items[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}