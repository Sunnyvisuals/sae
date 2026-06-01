import type { ConstellationStarRow } from "./act3ConstellationApi";

const STORAGE_KEY = "al-rihla-constellation-vote";

export type ConstellationVoteRecord = {
  starId: string;
  mot: string;
  prenom_ville?: string;
  votedAt: string;
};

export function readConstellationVote(): ConstellationVoteRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConstellationVoteRecord & {
      prenom?: string;
      ville?: string;
    };
    if (!parsed?.starId || !parsed?.mot) return null;
    const prenom_ville =
      parsed.prenom_ville?.trim() ||
      [parsed.prenom, parsed.ville].filter(Boolean).join(" · ") ||
      undefined;
    return {
      starId: parsed.starId,
      mot: parsed.mot,
      prenom_ville,
      votedAt: parsed.votedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConstellationVote(record: ConstellationVoteRecord): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* quota / private mode */
  }
}

export function hasConstellationVote(): boolean {
  return readConstellationVote() !== null;
}

export function clearConstellationVote(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* quota / private mode */
  }
}

/** Garantit que l’étoile du visiteur (localStorage) est dans la liste affichée. */
export function mergeVisitorConstellationStar(rows: ConstellationStarRow[]): ConstellationStarRow[] {
  const vote = readConstellationVote();
  if (!vote?.starId) return rows;
  if (rows.some((s) => s.id === vote.starId)) return rows;
  return [
    ...rows,
    {
      id: vote.starId,
      mot: vote.mot,
      prenom_ville: vote.prenom_ville ?? null,
      created_at: vote.votedAt,
    },
  ];
}
