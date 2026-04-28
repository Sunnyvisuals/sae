/** Métadonnées textuelles + registre des 5 mots « révélation » (game design Acte I). */

export const REVELATION_WORDS = ['naissance', 'soleil', 'mère', 'liberté', 'corps'] as const;
export type RevelationWord = (typeof REVELATION_WORDS)[number];

export type WordFontRole = 'serifPoem' | 'sansNote';
export type Importance = 1 | 2 | 3;

export interface WordEntry {
  verse: string;
  poem: string;
  /** Sert au choix Serif vs Sans sur la carte */
  fontRole: WordFontRole;
  importance: Importance;
}

export const WORD_DATA: Record<string, WordEntry> = {
  soleil: {
    verse: 'Soleil, soleil, tu brûles ma bouche',
    poem: "Vocation de l'arbre",
    fontRole: 'serifPoem',
    importance: 3,
  },
  sable: {
    verse: "Le sable garde l'empreinte du vent",
    poem: 'Diwan du Noûn',
    fontRole: 'sansNote',
    importance: 1,
  },
  mémoire: {
    verse: 'Ma mémoire est une mer sans rivage',
    poem: 'Corps corail',
    fontRole: 'serifPoem',
    importance: 2,
  },
  lumière: {
    verse: 'La lumière ici est une blessure douce',
    poem: 'Citoyens de beauté',
    fontRole: 'serifPoem',
    importance: 2,
  },
  désert: {
    verse: "Le désert n'est pas absence, c'est présence absolue",
    poem: 'Matinale de mon peuple',
    fontRole: 'sansNote',
    importance: 2,
  },
  algérie: {
    verse: 'Algérie, mon amour, ma douleur',
    poem: 'Citoyens de beauté',
    fontRole: 'sansNote',
    importance: 2,
  },
  liberté: {
    verse: "Liberté, j'écris ton nom dans le sable",
    poem: 'Matinale de mon peuple',
    fontRole: 'serifPoem',
    importance: 3,
  },
  nuit: {
    verse: "La nuit ici a le goût du jasmin",
    poem: 'Diwan du Noûn',
    fontRole: 'sansNote',
    importance: 1,
  },
  horizon: {
    verse: "L'horizon est une promesse que le soleil tient",
    poem: 'Corps corail',
    fontRole: 'sansNote',
    importance: 1,
  },
  silence: {
    verse: 'Le silence des pierres est une parole',
    poem: "Vocation de l'arbre",
    fontRole: 'serifPoem',
    importance: 2,
  },
  vent: {
    verse: 'Le vent porte les noms des disparus',
    poem: 'Diwan du Noûn',
    fontRole: 'sansNote',
    importance: 1,
  },
  étoile: {
    verse: 'Chaque étoile est un œil qui nous regarde',
    poem: 'Corps corail',
    fontRole: 'serifPoem',
    importance: 2,
  },
  feu: {
    verse: 'Le feu est la langue des ancêtres',
    poem: 'Matinale de mon peuple',
    fontRole: 'sansNote',
    importance: 1,
  },
  terre: {
    verse: 'Cette terre est ma chair et mon sang',
    poem: 'Citoyens de beauté',
    fontRole: 'serifPoem',
    importance: 2,
  },
  naissance: {
    verse: 'Naissance du poème, naissance du jour',
    poem: 'Citoyens de beauté',
    fontRole: 'serifPoem',
    importance: 3,
  },
  immensité: {
    verse: "L'immensité se mesure au silence qu'elle contient",
    poem: 'Diwan du Noûn',
    fontRole: 'serifPoem',
    importance: 3,
  },
  corps: {
    verse: 'Corps corail, corps de feu et de sel',
    poem: 'Corps corail',
    fontRole: 'serifPoem',
    importance: 3,
  },
  mère: {
    verse: 'Terre-mère, soleil au front des vagues',
    poem: 'Matinale de mon peuple',
    fontRole: 'serifPoem',
    importance: 3,
  },
};

/** Mots du parcours révélation : exclus du tirage aléatoire pour éviter des doublons illisibles sur la carte. */
const POEM_POOL = [
  'sable',
  'mémoire',
  'lumière',
  'désert',
  'algérie',
  'cri',
  'immensité',
  'vent',
  'dune',
  'horizon',
  'nuit',
  'étoile',
  'racine',
  'silence',
  'feu',
  'terre',
  'eau',
  'ombre',
  'aube',
  'poème',
  'voix',
  'rêve',
  'sang',
  'pierre',
  'sel',
  'oasis',
  'caravane',
  'aurore',
  'souffle',
  'source',
  'vague',
  'dieu',
  'peuple',
  'chant',
  'chemin',
  'éclat',
].filter((w) => !(REVELATION_WORDS as readonly string[]).includes(w));

export function randomPoemWord(seed: number): string {
  return POEM_POOL[Math.floor(rnd(seed, 9) * POEM_POOL.length)]!;
}

function rnd(s: number, salt: number) {
  const x = Math.sin(s * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function metaForWord(word: string): WordEntry {
  return (
    WORD_DATA[word] ?? {
      verse: 'Fragment du vent et du sel',
      poem: 'Œuvres',
      fontRole: 'sansNote',
      importance: 1,
    }
  );
}

export function isRevelationWord(w: string): w is RevelationWord {
  return (REVELATION_WORDS as readonly string[]).includes(w);
}
