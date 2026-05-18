/** Métadonnées textuelles + registre des 5 mots « révélation » (game design Acte I). */

import { ACT1_REVELATION_SEQUENCE } from "../../lib/act1IntroBridge";
import {
  ACT1_POEM_TITLE,
  ACT1_REVELATION_VERSE_FR,
} from "../../lib/act1PoemCorpsPays";

/** Séquence carte / bandeau : alignée sur `ACT1_PHRASE_STRIP` et la VO vidéo d’intro. */
export const REVELATION_WORDS = ACT1_REVELATION_SEQUENCE;
export type RevelationWord = (typeof REVELATION_WORDS)[number];

export type WordFontRole = 'serifPoem' | 'sansNote';
export type Importance = 1 | 2 | 3;

const POEM = ACT1_POEM_TITLE;

interface WordEntry {
  verse: string;
  poem: string;
  /** Sert au choix Serif vs Sans sur la carte */
  fontRole: WordFontRole;
  importance: Importance;
}

const WORD_DATA: Record<string, WordEntry> = {
  mémoire: {
    verse: 'Ô corps de mon pays, ô terre de mémoire,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  soleil: {
    verse: 'Toi que le soleil fouille et que la mer embrasse !',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  algérie: {
    verse: 'Algérie, ô ma mère au visage de pierre,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  sable: {
    verse: 'Regarde : notre amour a la couleur des sables,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 2,
  },
  liberté: {
    verse: 'Celui qui t’a vu libre ne t’oubliera pas.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  corps: {
    verse: 'Ô corps de mon pays, ô terre de mémoire,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  terre: {
    verse: 'Ô corps de mon pays, ô terre de mémoire,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  mer: {
    verse: 'Toi que le soleil fouille et que la mer embrasse !',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  victoire: {
    verse: 'Je t’aime de ce goût d’argile et de victoire,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  vent: {
    verse: 'De ce vent de maquis qui efface la trace.',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  mère: {
    verse: 'Algérie, ô ma mère au visage de pierre,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  pierre: {
    verse: 'Algérie, ô ma mère au visage de pierre,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 2,
  },
  cri: {
    verse: 'Ta beauté n’est pas douce, elle est un cri de fer,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 2,
  },
  source: {
    verse: 'Une source sauvage au fond de la poussière,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  poussière: {
    verse: 'Une source sauvage au fond de la poussière,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  fleurs: {
    verse: 'Un incendie de fleurs aux portes de l’envers.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  amour: {
    verse: 'Regarde : notre amour a la couleur des sables,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  jour: {
    verse: 'Il a le poids du jour, la ferveur des torrents,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  torrents: {
    verse: 'Il a le poids du jour, la ferveur des torrents,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  dune: {
    verse: 'Et nos mains, sur ta peau de dunes vulnérables,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  avenir: {
    verse: 'Dessinent l’avenir en des gestes géants.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  nuit: {
    verse: 'Nous t’avons épousée dans la nuit et l’orage,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  orage: {
    verse: 'Nous t’avons épousée dans la nuit et l’orage,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  patrie: {
    verse: 'Patrie, ô ma blessure au milieu du visage,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 3,
  },
  blessure: {
    verse: 'Patrie, ô ma blessure au milieu du visage,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  lumière: {
    verse: 'Un incendie de fleurs aux portes de l’envers.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  désert: {
    verse: 'Une source sauvage au fond de la poussière,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  horizon: {
    verse: 'Dessinent l’avenir en des gestes géants.',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  silence: {
    verse: 'Une source sauvage au fond de la poussière,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
  étoile: {
    verse: 'Nous te voulons solaire au matin de nos bras !',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  feu: {
    verse: 'Un incendie de fleurs aux portes de l’envers.',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  naissance: {
    verse: 'Nous te voulons solaire au matin de nos bras !',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  immensité: {
    verse: 'Dessinent l’avenir en des gestes géants.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  ombre: {
    verse: 'Ta beauté n’est pas douce, elle est un cri de fer,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  racine: {
    verse: 'Je t’aime de ce goût d’argile et de victoire,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
  oasis: {
    verse: 'Une source sauvage au fond de la poussière,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
  caravane: {
    verse: 'De ce vent de maquis qui efface la trace.',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  vague: {
    verse: 'Il a le poids du jour, la ferveur des torrents,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
  aurore: {
    verse: 'Nous te voulons solaire au matin de nos bras !',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  solaire: {
    verse: 'Nous te voulons solaire au matin de nos bras !',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  eau: {
    verse: 'Une source sauvage au fond de la poussière,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  aube: {
    verse: 'Nous te voulons solaire au matin de nos bras !',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  poème: {
    verse: 'Celui qui t’a vu libre ne t’oubliera pas.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 2,
  },
  voix: {
    verse: 'Ta beauté n’est pas douce, elle est un cri de fer,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  rêve: {
    verse: 'Dessinent l’avenir en des gestes géants.',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
  sang: {
    verse: 'Patrie, ô ma blessure au milieu du visage,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  sel: {
    verse: 'Regarde : notre amour a la couleur des sables,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  souffle: {
    verse: 'De ce vent de maquis qui efface la trace.',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  dieu: {
    verse: 'Nous t’avons épousée dans la nuit et l’orage,',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
  peuple: {
    verse: 'Regarde : notre amour a la couleur des sables,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  chant: {
    verse: 'Ta beauté n’est pas douce, elle est un cri de fer,',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  chemin: {
    verse: 'De ce vent de maquis qui efface la trace.',
    poem: POEM,
    fontRole: 'sansNote',
    importance: 1,
  },
  éclat: {
    verse: 'Nous te voulons solaire au matin de nos bras !',
    poem: POEM,
    fontRole: 'serifPoem',
    importance: 1,
  },
};

/** Mots du parcours révélation : exclus du tirage aléatoire pour éviter des doublons illisibles sur la carte. */
const POEM_POOL = [
  'corps',
  'terre',
  'mer',
  'victoire',
  'vent',
  'mère',
  'pierre',
  'cri',
  'source',
  'poussière',
  'fleurs',
  'amour',
  'jour',
  'torrents',
  'dune',
  'avenir',
  'nuit',
  'orage',
  'patrie',
  'blessure',
  'lumière',
  'désert',
  'horizon',
  'silence',
  'étoile',
  'feu',
  'naissance',
  'immensité',
  'ombre',
  'racine',
  'oasis',
  'caravane',
  'vague',
  'aurore',
  'solaire',
  'eau',
  'aube',
  'poème',
  'voix',
  'rêve',
  'sang',
  'sel',
  'souffle',
  'dieu',
  'peuple',
  'chant',
  'chemin',
  'éclat',
].filter((w) => !(REVELATION_WORDS as readonly string[]).includes(w));

export function randomPoemWord(seed: number): string {
  return POEM_POOL[Math.floor(rnd(seed, 9) * POEM_POOL.length)]!;
}

/** Tirage sans remplacement pour éviter le même mot deux fois sur la carte. */
export function shuffledPoemPool(seed: number): string[] {
  const pool = [...POEM_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(seed + i, 17) * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool;
}

function rnd(s: number, salt: number) {
  const x = Math.sin(s * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function verseForWord(word: string): string {
  const reveal = ACT1_REVELATION_VERSE_FR[word as keyof typeof ACT1_REVELATION_VERSE_FR];
  if (reveal) return reveal;
  return WORD_DATA[word]?.verse ?? 'Patrie, ô ma blessure au milieu du visage,';
}

export function metaForWord(word: string): WordEntry {
  const base = WORD_DATA[word];
  if (!base) {
    return {
      verse: verseForWord(word),
      poem: POEM,
      fontRole: 'sansNote',
      importance: 1,
    };
  }
  return { ...base, verse: verseForWord(word), poem: POEM };
}

export function isRevelationWord(w: string): w is RevelationWord {
  return (REVELATION_WORDS as readonly string[]).includes(w);
}
