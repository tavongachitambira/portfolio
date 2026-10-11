export const GITHUB_USERNAME = "tavongachitambira";
export const LEETCODE_USERNAME = "tavongachitambira";

export const GITHUB_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`;
export const LEETCODE_URL = `https://leetcode-stats.tashif.codes/${LEETCODE_USERNAME}`;

// ── GitHub ───────────────────────────────────────────────────────────────
export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0–4
}
export type GitHubWeek = (ContributionDay | null)[];
export interface GitHubData {
  total: number;
  weeks: GitHubWeek[];
}

export function parseGitHub(json: unknown): GitHubData {
  const { contributions } = json as { contributions: ContributionDay[] };

  // Pad so the first column starts on Sunday and rows line up with weekdays.
  const lead = contributions.length
    ? new Date(`${contributions[0].date}T00:00:00`).getDay()
    : 0;
  const cells: (ContributionDay | null)[] = [
    ...Array<null>(lead).fill(null),
    ...contributions,
  ];

  const weeks: GitHubWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { total: contributions.reduce((s, c) => s + c.count, 0), weeks };
}

// ── LeetCode ─────────────────────────────────────────────────────────────
export interface LeetCodeData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
}

export function parseLeetCode(json: unknown): LeetCodeData {
  const d = json as Record<string, unknown>;
  if (d.status === "error") throw new Error("leetcode: user not found");

  const n = (v: unknown, fallback = 0) => Number(v) || fallback;
  return {
    totalSolved: n(d.totalSolved),
    easySolved: n(d.easySolved),
    mediumSolved: n(d.mediumSolved),
    hardSolved: n(d.hardSolved),
    ranking: n(d.ranking),
    // Use API totals when present, otherwise your previous constants.
    totalEasy: n(d.totalEasy, 800),
    totalMedium: n(d.totalMedium, 1600),
    totalHard: n(d.totalHard, 700),
  };
}