/** Métadonnées textuelles + registre des 5 mots « révélation » (game design Acte I). */

import { ACT1_REVELATION_SEQUENCE } from "../../lib/act1IntroBridge";

/** Séquence carte / bandeau : alignée sur `ACT1_PHRASE_STRIP` et la VO vidéo d’intro. */
export const REVELATION_WORDS = ACT1_REVELATION_SEQUENCE;
export type RevelationWord = (typeof REVELATION_WORDS)[number];

export type WordFontRole = 'serifPoem' | 'sansNote';
export type Importance = 1 | 2 | 3;

interface WordEntry {
  verse: string;
  poem: string;
  /** Sert au choix Serif vs Sans sur la carte */
  fontRole: WordFontRole;
  importance: Importance;
}

const WORD_DATA: Record<string, WordEntry> = {
  soleil: {
    verse: 'Douce comme une peau que le soleil a longtemps aimée',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 3,
  },
  sable: {
    verse: "Une calligraphie de sable que personne n'a signée",
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 1,
  },
  mémoire: {
    verse: 'Rien dans les mains — le cœur ouvert comme une tente',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 2,
  },
  lumière: {
    verse: 'Une terre nouvelle sous le rayon du lendemain',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 2,
  },
  désert: {
    verse: 'Un seul mot, et la bouche devient désert',
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 2,
  },
  algérie: {
    verse:
      'Tamanrasset, Djanet, Timimoun — ces noms sont de la musique avant d’être des lieux',
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 2,
  },
  liberté: {
    verse: 'Arriver quelque part en soi-même qu’on n’avait jamais visité',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 3,
  },
  nuit: {
    verse: 'La nuit du Sahara est une autre naissance',
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 1,
  },
  horizon: {
    verse: 'Tu es l’avant et l’après sous un ciel sans pitié',
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 1,
  },
  silence: {
    verse: 'L’erg est une mer qui a choisi le silence',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 2,
  },
  vent: {
    verse: 'Le vent sculpte la nuit — demain tu trouves une terre nouvelle',
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 1,
  },
  étoile: {
    verse: 'Les étoiles descendent si bas qu’on pourrait les boire',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 2,
  },
  feu: {
    verse: 'Des tambours dans la gorge, des feux dans la bouche',
    poem: 'Sahara — solstice',
    fontRole: 'sansNote',
    importance: 1,
  },
  terre: {
    verse: 'Ici le temps est une matière — on peut s’asseoir dessus',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 2,
  },
  naissance: {
    verse: 'La nuit du Sahara est une autre naissance',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 3,
  },
  immensité: {
    verse: 'Qu’on peut traverser l’immensité avec rien dans les mains',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 3,
  },
  corps: {
    verse: 'Délicieusement minuscule, comme un grain parmi les grains',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 3,
  },
  mère: {
    verse: 'Timimoun la rouge dort dans son ocre comme une braise',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 3,
  },
  dune: {
    verse: 'Chaque dune est une vague arrêtée dans son élan',
    poem: 'Sahara — solstice',
    fontRole: 'serifPoem',
    importance: 2,
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
      verse: 'Sous le même ciel, un grain parmi les grains',
      poem: 'Sahara — solstice',
      fontRole: 'sansNote',
      importance: 1,
    }
  );
}

export function isRevelationWord(w: string): w is RevelationWord {
  return (REVELATION_WORDS as readonly string[]).includes(w);
}
