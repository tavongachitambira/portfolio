"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DiffBar({
  label,
  solved,
  total,
  loading,
  textClass,
  fillClass,
}: {
  label: string;
  solved: number;
  total: number;
  loading: boolean;
  textClass: string;
  fillClass: string;
}) {
  const pct = total ? Math.min(100, (solved / total) * 100) : 0;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className={cn("font-semibold", textClass)}>{label}</span>
        {loading ? (
          <Skeleton className="h-3 w-14 rounded-md" />
        ) : (
          <span className="text-foreground">
            {solved}
            <span className="text-muted-foreground"> / {total}</span>
          </span>
        )}
      </div>

     <div
   className={cn(
     "clay-well mt-2 h-3.5 overflow-hidden rounded-full p-0.5",
     loading && "animate-pulse",
   )}
 > 
        <motion.div
          className={cn(
            "h-full rounded-full shadow-[inset_0_2px_3px_rgba(255,255,255,0.4)]",
            fillClass,
          )}
          style={{ minWidth: !loading && solved > 0 ? 8 : 0 }}
          initial={{ width: 0 }}
          animate={{ width: `${loading ? 0 : pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
