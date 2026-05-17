/** Mots Sénac proposés en clôture d’acte III (flottent sur la carte en acte I). */
export const ACT3_CONSTELLATION_WORDS = [
  "désert",
  "dune",
  "ombre",
  "terre",
  "sable",
  "lumière",
  "racine",
  "immensité",
  "oasis",
  "horizon",
  "vent",
  "cri",
  "aurore",
  "étoile",
  "vague",
  "nuit",
  "caravane",
] as const;

export type Act3ConstellationWord = (typeof ACT3_CONSTELLATION_WORDS)[number];

const WORD_SET = new Set<string>(ACT3_CONSTELLATION_WORDS);

export function isAct3ConstellationWord(w: string): w is Act3ConstellationWord {
  return WORD_SET.has(w);
}

/** Positions flottantes stables (écran), une par mot + paramètres de dérive lente. */
export function act3WordFloatLayout(index: number): {
  x: number;
  y: number;
  rot: number;
  drift: { dur: number; delay: number; ampX: number; ampY: number; rotDelta: number };
} {
  const w = ACT3_CONSTELLATION_WORDS[index]!;
  let h = 0;
  for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) >>> 0;
  const t = h * 0.0001;
  return {
    x: 8 + (((h >>> 0) % 840) / 840) * 84,
    y: 10 + (((h >>> 8) % 720) / 720) * 78,
    rot: -4 + (t % 1) * 8 - 4,
    drift: {
      dur: 5.5 + (h % 11) * 0.55,
      delay: ((h % 19) / 19) * 2.2,
      ampX: 16 + (h % 14),
      ampY: 18 + ((h >> 4) % 12),
      rotDelta: 2.4 + (h % 4) * 0.75,
    },
  };
}
