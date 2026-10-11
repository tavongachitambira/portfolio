"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp } from "@/lib/motion";

export function StatCard({
  icon,
  title,
  failed,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  failed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="clay p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="clay clay-sm flex size-9 items-center justify-center rounded-full text-primary">
          {icon}
        </span>
        <h3 className="font-mono text-sm font-semibold text-foreground">{title}</h3>
        {failed && (
          <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <AlertCircle size={12} /> unavailable
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export function BigStat({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="mb-5">
      {loading ? (
        <Skeleton className="h-9 w-28 rounded-lg" />
      ) : (
        <div className="font-mono text-3xl font-bold text-foreground">{value}</div>
      )}
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
