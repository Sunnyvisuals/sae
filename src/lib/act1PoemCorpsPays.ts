/**
 * « Corps de mon pays » — Jean Sénac (16 vers).
 * Acte I : cinq vers tirés au hasard (sans remplacement), ordre de lecture = ordre dans le poème.
 */

export const ACT1_POEM_TITLE = "Corps de mon pays — Jean Sénac";

/** Seule source FR pour la carte, le bandeau et les tooltips. */
export const ACT1_POEM_LINES_FR = [
  "Ô corps de mon pays, ô terre de mémoire,",
  "Toi que le soleil fouille et que la mer embrasse !",
  "Je t’aime de ce goût d’argile et de victoire,",
  "De ce vent de maquis qui efface la trace.",
  "Algérie, ô ma mère au visage de pierre,",
  "Ta beauté n’est pas douce, elle est un cri de fer,",
  "Une source sauvage au fond de la poussière,",
  "Un incendie de fleurs aux portes de l’envers.",
  "Regarde : notre amour a la couleur des sables,",
  "Il a le poids du jour, la ferveur des torrents,",
  "Et nos mains, sur ta peau de dunes vulnérables,",
  "Dessinent l’avenir en des gestes géants.",
  "Nous t’avons épousée dans la nuit et l’orage,",
  "Nous te voulons solaire au matin de nos bras !",
  "Patrie, ô ma blessure au milieu du visage,",
  "Celui qui t’a vu libre ne t’oubliera pas.",
] as const;

export const ACT1_POEM_LINES_AR = [
  "يا جسد وطني، يا أرض الذاكرة،",
  "يا من يحفرها الشمس وتعانقها البحر !",
  "أحبّك بهذا طعم الطين والنصر،",
  "بهذا الريح من المّارقة يمحو الأثر.",
  "الجزائر، يا أمّي ذات الوجه الحجر،",
  "جمالك ليس رقيقًا، إنه صرخة حديد،",
  "نبع وحشي في قاع الغبار،",
  "حريق زهور على أبواب اللاّكون،",
  "انظر : لون حبّنا الرمال،",
  "له وزن النهار، ولنفرة السيول،",
  "ويدانا على جلد كثبان هشّة،",
  "يرسمون المستقبل بحركات عمالقة.",
  "تزوّجناك في الليل والعاصف،",
  "نريدك شمسية في صباح أذرعنا !",
  "يا وطن، يا جرحي في وسط الوجه،",
  "من رآكِ حرّة لا ينساكِ.",
] as const;

/** Mot-clé carte / révélation pour chaque vers (clé `mapWordData`). */
const LINE_HIGHLIGHT_WORD = [
  "mémoire",
  "soleil",
  "victoire",
  "vent",
  "algérie",
  "cri",
  "source",
  "fleurs",
  "sable",
  "torrents",
  "dune",
  "avenir",
  "nuit",
  "solaire",
  "patrie",
  "liberté",
] as const;

/** Forme telle qu’elle apparaît dans le vers (accord, flexion). */
const HIGHLIGHT_SURFACE_FR: Partial<Record<(typeof LINE_HIGHLIGHT_WORD)[number], string>> = {
  sable: "sables",
  dune: "dunes",
  liberté: "libre",
};

const HIGHLIGHT_SURFACE_AR: Partial<Record<(typeof LINE_HIGHLIGHT_WORD)[number], string>> = {
  liberté: "حرّة",
};

const ACT1_POEM_PICK_SEED = 0xc0b5de15;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cinq indices de vers, tirés au hasard puis triés (ordre du poème). */
export function pickAct1PoemLineIndices(
  lineCount = ACT1_POEM_LINES_FR.length,
  pick = 5,
  seed = ACT1_POEM_PICK_SEED,
): number[] {
  const rand = mulberry32(seed);
  const order = Array.from({ length: lineCount }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order.slice(0, pick).sort((a, b) => a - b);
}

export const ACT1_PICKED_LINE_INDICES = pickAct1PoemLineIndices();

type Act1HighlightWord = (typeof LINE_HIGHLIGHT_WORD)[number];

export type Act1PhraseStripRow = {
  word: Act1HighlightWord;
  before: string;
  after: string;
};

function surfaceInLine(line: string, word: Act1HighlightWord, surfaces: Partial<Record<Act1HighlightWord, string>>): string {
  const surface = surfaces[word] ?? word;
  const idx = line.toLocaleLowerCase("fr").indexOf(surface.toLocaleLowerCase("fr"));
  if (idx >= 0) return surface;
  const idxWord = line.toLocaleLowerCase("fr").indexOf(word.toLocaleLowerCase("fr"));
  if (idxWord >= 0) return word;
  return surface;
}

function buildPhraseStripRow(
  line: string,
  word: Act1HighlightWord,
  surfaces: Partial<Record<Act1HighlightWord, string>>,
  quote = true,
): Act1PhraseStripRow {
  const surface = surfaceInLine(line, word, surfaces);
  const idx = line.indexOf(surface);
  if (idx < 0) {
    return { word, before: quote ? "« " : "", after: quote ? " »" : line };
  }
  const before = line.slice(0, idx);
  const after = line.slice(idx + surface.length);
  return {
    word,
    before: quote ? `« ${before}` : before,
    after: quote ? `${after} »` : after,
  };
}

function buildAct1RevealRows(
  lines: readonly string[],
  surfaces: Partial<Record<Act1HighlightWord, string>>,
): Act1PhraseStripRow[] {
  return ACT1_PICKED_LINE_INDICES.map((lineIdx) => {
    const word = LINE_HIGHLIGHT_WORD[lineIdx]!;
    return buildPhraseStripRow(lines[lineIdx]!, word, surfaces);
  });
}

export const ACT1_REVELATION_SEQUENCE = ACT1_PICKED_LINE_INDICES.map(
  (i) => LINE_HIGHLIGHT_WORD[i]!,
) as readonly Act1HighlightWord[];

export const ACT1_PHRASE_STRIP_STEPS_FR = buildAct1RevealRows(
  ACT1_POEM_LINES_FR,
  HIGHLIGHT_SURFACE_FR,
) as readonly Act1PhraseStripRow[];

export const ACT1_PHRASE_STRIP_STEPS_AR = buildAct1RevealRows(
  ACT1_POEM_LINES_AR,
  HIGHLIGHT_SURFACE_AR,
) as readonly Act1PhraseStripRow[];

/** Vers FR affiché pour chaque mot révélation (tooltips, particules). */
export const ACT1_REVELATION_VERSE_FR: Record<Act1HighlightWord, string> = Object.fromEntries(
  ACT1_REVELATION_SEQUENCE.map((word, step) => {
    const lineIdx = ACT1_PICKED_LINE_INDICES[step]!;
    return [word, ACT1_POEM_LINES_FR[lineIdx]!];
  }),
) as Record<Act1HighlightWord, string>;

export const ACT1_REVELATION_VERSE_AR: Record<Act1HighlightWord, string> = Object.fromEntries(
  ACT1_REVELATION_SEQUENCE.map((word, step) => {
    const lineIdx = ACT1_PICKED_LINE_INDICES[step]!;
    return [word, ACT1_POEM_LINES_AR[lineIdx]!];
  }),
) as Record<Act1HighlightWord, string>;
