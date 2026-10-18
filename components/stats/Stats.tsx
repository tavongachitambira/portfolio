"use client";

import { FaGithub } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import { useRemoteData } from "@/hooks/useRemoteData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GITHUB_URL,
  LEETCODE_URL,
  parseGitHub,
  parseLeetCode,
} from "@/lib/stats";
import { BigStat, StatCard } from "@/components/stats/StatCard";
import { Heatmap } from "@/components/stats/Heatmap";
import { DiffBar } from "@/components/stats/Diffbar";

export default function Stats() {
  const gh = useRemoteData(GITHUB_URL, parseGitHub);
  const lc = useRemoteData(LEETCODE_URL, parseLeetCode);

  const ghLoading = gh.status === "loading";
  const lcLoading = lc.status === "loading";
  const ghData = gh.status === "success" ? gh.data : null;
  const lcData = lc.status === "success" ? lc.data : null;


  
  return (
    <div className="flex w-full flex-col gap-6" aria-busy={ghLoading || lcLoading}>
      <StatCard icon={<FaGithub />} title="GitHub" failed={gh.status === "error"}>
        <BigStat
          label="Contributions in the last year"
          value={ghData ? ghData.total.toLocaleString() : "—"}
          loading={ghLoading}
        />
        <Heatmap weeks={ghData?.weeks ?? []} loading={ghLoading} />
      </StatCard>

      <StatCard icon={<SiLeetcode />} title="LeetCode" failed={lc.status === "error"}>
        <BigStat
          label="Problems solved"
          value={lcData ? lcData.totalSolved : "—"}
          loading={lcLoading}
        />

        <DiffBar
          label="Easy"
          solved={lcData?.easySolved ?? 0}
          total={lcData?.totalEasy ?? 800}
          loading={lcLoading}
          textClass="text-emerald-600 dark:text-emerald-400"
          fillClass="bg-emerald-500"
        />
        <DiffBar
          label="Medium"
          solved={lcData?.mediumSolved ?? 0}
          total={lcData?.totalMedium ?? 1600}
          loading={lcLoading}
          textClass="text-amber-600 dark:text-amber-400"
          fillClass="bg-amber-500"
        />
        <DiffBar
          label="Hard"
          solved={lcData?.hardSolved ?? 0}
          total={lcData?.totalHard ?? 700}
          loading={lcLoading}
          textClass="text-rose-600 dark:text-rose-400"
          fillClass="bg-rose-500"
        />
{lcLoading && <Skeleton className="mt-5 h-3 w-32" />}
        {lcData && lcData.ranking > 0 && (
          <div className="mt-5 font-mono text-xs text-muted-foreground">
            Global ranking:{" "}
            <span className="font-semibold text-primary">
              #{lcData.ranking.toLocaleString()}
            </span>
          </div>
        )}
      </StatCard>
    </div>
  );
}