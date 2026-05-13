/**
 * Pont **vidéo d’intro ↔ Acte I** (carte inchangée : elle lit seulement ces données).
 *
 * À garder aligné avec le montage / VO de {@link INTRO_VIDEO_SRC} :
 * - Les cinq révélations doivent être **audibles dans le même ordre** que
 *   {@link ACT1_REVELATION_SEQUENCE}.
 * - Les lignes {@link ACT1_PHRASE_STRIP_STEPS_FR} / `_AR` reprennent des vers du
 *   texte Sahara (prologue atmosphère) ; resynchronise la VO vidéo si besoin.
 */

export const INTRO_VIDEO_SRC = "/al-rihla.mp4";

/** Ordre strict des clics sur la carte = ordre d’écoute souhaité dans la vidéo. */
export const ACT1_REVELATION_SEQUENCE = [
  "désert",
  "silence",
  "dune",
  "nuit",
  "immensité",
] as const;

export type Act1RevelationWordKey = (typeof ACT1_REVELATION_SEQUENCE)[number];

export type Act1PhraseStripRow = {
  word: Act1RevelationWordKey;
  before: string;
  after: string;
};

export const ACT1_PHRASE_STRIP_STEPS_FR: readonly Act1PhraseStripRow[] = [
  { word: "désert", before: "« Un seul mot, et la bouche devient ", after: " »" },
  {
    word: "silence",
    before: "« L’erg est une mer qui a choisi le ",
    after: " »",
  },
  {
    word: "dune",
    before: "« Chaque ",
    after: " est une vague arrêtée dans son élan »",
  },
  {
    word: "nuit",
    before: "« La ",
    after: " du Sahara est une autre naissance »",
  },
  {
    word: "immensité",
    before: "« … qu’on peut traverser l’",
    after: " avec rien dans les mains »",
  },
];

export const ACT1_PHRASE_STRIP_STEPS_AR: readonly Act1PhraseStripRow[] = [
  { word: "désert", before: "« كلمة واحدة، والفم يصبح ", after: " »" },
  {
    word: "silence",
    before: "« البحر الرملي اختار ",
    after: " »",
  },
  {
    word: "dune",
    before: "« كل ",
    after: " موجة وقفت في اندفاعها »",
  },
  {
    word: "nuit",
    before: "« ",
    after: " في عمق الصحراء ولادة ثانية »",
  },
  {
    word: "immensité",
    before: "« … يمكن قطع ",
    after: " بلا شيء في الأكُفّ »",
  },
];

/** Dev : strip et liste ordonnée restent synchrones après édition manuelle. */
export function assertAct1PhraseStripsOrdered(): void {
  if (import.meta.env.PROD) return;
  const check = (rows: readonly Act1PhraseStripRow[], label: string) => {
    if (rows.length !== ACT1_REVELATION_SEQUENCE.length) {
      console.warn(`[act1IntroBridge] ${label}: nombre d’étapes ≠ révélations.`);
      return;
    }
    for (let i = 0; i < ACT1_REVELATION_SEQUENCE.length; i++) {
      const expected = ACT1_REVELATION_SEQUENCE[i];
      const got = rows[i]?.word;
      if (got !== expected) {
        console.warn(`[act1IntroBridge] ${label}: à l’index ${i}, attendu "${expected}", reçu "${got}".`);
      }
    }
  };
  check(ACT1_PHRASE_STRIP_STEPS_FR, "FR");
  check(ACT1_PHRASE_STRIP_STEPS_AR, "AR");
}

assertAct1PhraseStripsOrdered();
