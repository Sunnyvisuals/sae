/**
 * Pont **vidéo d’intro ↔ Acte I** (carte inchangée : elle lit seulement ces données).
 *
 * À garder aligné avec le montage / VO de {@link INTRO_VIDEO_SRC} :
 * - Les cinq révélations doivent être **audibles dans le même ordre** que
 *   {@link ACT1_REVELATION_SEQUENCE}.
 * - Les lignes {@link ACT1_PHRASE_STRIP_STEPS_FR} / `_AR` sont les phrases affichées
 *   sous la carte ; adapte `before` / `after` quand tu finalises la vidéo.
 */

export const INTRO_VIDEO_SRC = "/al-rihla.mp4";

/** Ordre strict des clics sur la carte = ordre d’écoute souhaité dans la vidéo. */
export const ACT1_REVELATION_SEQUENCE = [
  "naissance",
  "soleil",
  "mère",
  "liberté",
  "corps",
] as const;

export type Act1RevelationWordKey = (typeof ACT1_REVELATION_SEQUENCE)[number];

export type Act1PhraseStripRow = {
  word: Act1RevelationWordKey;
  before: string;
  after: string;
};

export const ACT1_PHRASE_STRIP_STEPS_FR: readonly Act1PhraseStripRow[] = [
  { word: "naissance", before: "« ", after: " du poème, naissance du jour »" },
  { word: "soleil", before: "« ", after: ", soleil, tu brûles ma bouche »" },
  { word: "mère", before: "« Terre-", after: ", soleil au front des vagues »" },
  { word: "liberté", before: "« ", after: ", j’écris ton nom dans le sable »" },
  { word: "corps", before: "« ", after: " corail, corps de feu et de sel »" },
];

export const ACT1_PHRASE_STRIP_STEPS_AR: readonly Act1PhraseStripRow[] = [
  { word: "naissance", before: "« ", after: " للقصيدة ولادة الصباح »" },
  { word: "soleil", before: "« ", after: "، يا شمس تحرّق فمي »" },
  { word: "mère", before: "« أرض الأم، ", after: " وفوق موج البحر »" },
  { word: "liberté", before: "« ", after: "، نكتب اسمك على الرمال »" },
  { word: "corps", before: "« ", after: " مرجان، بدن النار والملح »" },
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
