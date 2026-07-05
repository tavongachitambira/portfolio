"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";

interface GitHubStats {
  totalCommits: number;
  weeks: { days: number[] }[];
}
interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
}

const GITHUB_USERNAME = "tavongachitambira";
const LEETCODE_USERNAME = "tavongachitambira";

const fallbackGH: GitHubStats = { totalCommits: 0, weeks: [] };
const fallbackLC: LeetCodeStats = {
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  ranking: 0,
};

function getColor(count: number) {
  if (count === 0) return "oklch(97% 0.014 254.604)";
  if (count < 3) return "oklch(80.9% 0.105 251.813)";
  if (count < 6) return "oklch(70.7% 0.165 254.624)";
  if (count < 10) return "oklch(62.3% 0.214 259.815)";
  return "oklch(37.9% 0.146 265.522)"; 
}

function Heatmap({ weeks }: { weeks: { days: number[] }[] }) {
  const placeholder = Array.from({ length: 52 }, () => ({
    days: Array(7).fill(0),
  }));
  const data = weeks.length ? weeks : placeholder;

  return (
    <div className="relative pb-3 w-full overflow-x-auto">
      <div
        className={`flex gap-0.75 min-w-max transition-opacity ${
          weeks.length ? "opacity-100" : "opacity-30"
        }`}
      >
        {data.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-0.75">
            {w.days.map((count, di) => (
              <div
                key={di}
                title={`${count} contributions`}
                className="rounded-xs w-2.5 h-2.5 hover:scale-[1.4] transition-transform duration-100 cursor-default"
                style={{ background: getColor(count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const colorMap: Record<string, string> = {
  amber: "text-amber-500",
  red: "text-red-500",
  green: "text-primary",
};

function DiffBar({
  label,
  solved,
  total,
  color,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.25 font-mono text-[12px] text-neutral-300">
        <span className={colorMap[color]}>{label}</span>
        <span>
          {solved}
          <span className="mx-0.75 text-neutral-400">/</span>
          <span className="text-neutral-400">{total || "—"}</span>
        </span>
      </div>
    </div>
  );
}

export default function Stats() {
  const [github, setGithub] = useState<GitHubStats>(fallbackGH);
  const [leetcode, setLeetcode] = useState<LeetCodeStats>(fallbackLC);
  const [ghError, setGhError] = useState(false);
  const [lcError, setLcError] = useState(false);
  const [ghLoading, setGhLoading] = useState(true);
  const [lcLoading, setLcLoading] = useState(true);

  useEffect(() => {
    fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=2026`,
    )
    

    
      .then((r) => r.json())
      .then((data) => {
        const contributions = data.contributions as { count: number }[];
        const weeks: { days: number[] }[] = [];
        for (let i = 0; i < contributions.length; i += 7) {
          weeks.push({
            days: contributions.slice(i, i + 7).map((c) => c.count),
          });
        }
        const totalCommits = contributions.reduce((sum, c) => sum + c.count, 0);
        setGithub({ totalCommits, weeks });
      })
      .catch(() => setGhError(true))
      .finally(() => setGhLoading(false));

    fetch(`https://leetcode-stats.tashif.codes/${LEETCODE_USERNAME}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "error") throw new Error();
        setLeetcode({
          totalSolved: data.totalSolved,
          easySolved: data.easySolved,
          mediumSolved: data.mediumSolved,
          hardSolved: data.hardSolved,
          ranking: data.ranking,
        });
      })
      .catch(() => setLcError(true))
      .finally(() => setLcLoading(false));
  }, []);

  return (
    <section id="activity-progress" className="pt-10 w-full">
      <div className="flex flex-col space-y-4">
        {/* ── GitHub Card ─────────────────────────────────── */}
        <div className="p-6 border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-5 text-primary">
            <FaGithub />
            <span className="font-mono font-medium">GitHub</span>
            {ghError && (
              <span className="flex items-center gap-1 ml-auto font-mono text-[10px] text-neutral-300">
                <AlertCircle size={10} /> unavailable
              </span>
            )}
          </div>

          <div className="mb-5">
            <div className="font-mono font-bold text-neutral-300 text-3xl">
              {ghLoading ? "—" : github.totalCommits.toLocaleString()}
            </div>
            <div className="font-mono text-[10px] text-neutral-300 tracking-widest">
              CONTRIBUTIONS THIS YEAR
            </div>
          </div>

          <Heatmap weeks={github.weeks} />
        </div>

        {/* ── LeetCode Card ───────────────────────────────── */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center gap-2 mb-5 text-primary">
            <SiLeetcode />
            <span className="font-mono font-medium">LeetCode</span>
            {lcError && (
              <span className="flex items-center gap-1 ml-auto font-mono text-[10px] text-neutral-500">
                <AlertCircle size={10} /> unavailable
              </span>
            )}
          </div>

          <div className="mb-5">
            <div className="font-mono font-bold text-neutral-300 text-3xl">
              {lcLoading ? "—" : leetcode.totalSolved}
            </div>
            <div className="font-mono text-[10px] text-neutral-300 tracking-widest">
              PROBLEMS SOLVED
            </div>
          </div>

          <DiffBar
            label="Easy"
            solved={leetcode.easySolved}
            total={800}
            color="green"
          />
          <DiffBar
            label="Medium"
            solved={leetcode.mediumSolved}
            total={1600}
            color="amber"
          />
          <DiffBar
            label="Hard"
            solved={leetcode.hardSolved}
            total={700}
            color="red"
          />

          {leetcode.ranking > 0 && (
            <div className="mt-4 font-mono text-[12px] text-neutral-300">
              Global Ranking:{" "}
              <span className="text-blue-400">
                #{leetcode.ranking.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
