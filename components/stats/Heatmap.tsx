"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { GitHubWeek } from "@/lib/stats";

const levelColor = [
  "color-mix(in oklch, var(--muted-foreground) 18%, transparent)",
  "color-mix(in oklch, var(--primary) 30%, transparent)",
  "color-mix(in oklch, var(--primary) 55%, transparent)",
  "color-mix(in oklch, var(--primary) 78%, transparent)",
  "var(--primary)",
];

export function Heatmap({
  weeks,
  loading,
}: {
  weeks: GitHubWeek[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Show the most recent weeks first on narrow screens.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

 if (loading) {
   return (
     <div className="clay-well overflow-hidden" aria-hidden>
       <div className="mx-3 mb-3 mt-4 overflow-hidden px-1 pb-3">
         <div className="flex min-w-max gap-[3px]">
           {Array.from({ length: 53 }, (_, w) => (
             <div key={w} className="flex flex-col gap-[3px]">
               {Array.from({ length: 7 }, (_, d) => (
                 <Skeleton
                   key={d}
                   className="size-2.5 rounded-[3px]"
                   style={{ animationDelay: `${w * 25}ms` }}
                 />
               ))}
             </div>
           ))}
         </div>
       </div>
     </div>
   );
 }

  if (!weeks.length) {
    return (
      <div className="clay-well flex h-28 items-center justify-center text-xs text-muted-foreground">
        No contribution data
      </div>
    );
  }

  return (
    <>
      <div className="clay-well overflow-hidden">
        <div
          ref={scrollRef}
          className="scrollbar-clay mx-3 mb-3 mt-4 overflow-x-auto px-1 pb-3"
        >
          <div className="flex min-w-max gap-[3px]">
            {weeks.map((week, wi) => (
              <motion.div
                key={wi}
                className="flex flex-col gap-[3px]"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wi * 0.012, duration: 0.35 }}
              >
                {week.map((day, di) =>
                  day ? (
                    <div
                      key={di}
                      title={`${day.count} contributions on ${day.date}`}
                      className="size-2.5 cursor-default rounded-[3px] transition-transform duration-100 hover:scale-150"
                      style={{ background: levelColor[day.level] ?? levelColor[0] }}
                    />
                  ) : (
                    <div key={di} className="size-2.5" />
                  ),
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        Less
        {levelColor.map((c, i) => (
          <span key={i} className="size-2.5 rounded-[3px]" style={{ background: c }} />
        ))}
        More
      </div>
    </>
  );
}
