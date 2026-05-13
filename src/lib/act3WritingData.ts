/**
 * Fragments Acte III — uniquement des textes déjà présents dans le projet
 * (vidéo / bande carte, vers du pool carte, ligne pont acte II, toast chapitre).
 */
import type { AppLanguage } from "../stores/languageStore";
import { revelationWordUISurface } from "./appCopy";
import {
  ACT1_PHRASE_STRIP_STEPS_AR,
  ACT1_PHRASE_STRIP_STEPS_FR,
  ACT1_REVELATION_SEQUENCE,
} from "./act1IntroBridge";
import { metaForWord } from "../components/Immersive/mapWordData";
import { wordTooltipLines } from "./wordTooltipLocale";

export type Act3FragmentSpec = {
  id: string;
  /** Vers ou phrase affichés dans la composition ET sur la pastilleinteractive. */
  line: string;
};

function phraseStripFragments(lang: AppLanguage): Act3FragmentSpec[] {
  const strip = lang === "ar-dz" ? ACT1_PHRASE_STRIP_STEPS_AR : ACT1_PHRASE_STRIP_STEPS_FR;
  return ACT1_REVELATION_SEQUENCE.map((word, i) => {
    const row = strip[i];
    if (!row) return { id: `vid-${word}`, line: "" };
    const surface = revelationWordUISurface(word, lang);
    const line =
      `${row.before}${surface}${row.after}`.replace(/\s+/g, " ").trim();
    return { id: `vid-${word}`, line };
  });
}

function mapPoolVerses(words: readonly string[], lang: AppLanguage): Act3FragmentSpec[] {
  const ar = lang === "ar-dz";
  return words.map((w) => {
    const lines = wordTooltipLines(w, ar);
    return { id: `map-${w}`, line: lines.verse.trim() };
  });
}

type EditorialSlice = {
  daTitle: string;
  daSubtitle: string;
  chapterToastSubtitle: string;
};

export function buildAct3Fragments(
  lang: AppLanguage,
  editorial: EditorialSlice
): Act3FragmentSpec[] {
  return [
    ...phraseStripFragments(lang),
    ...mapPoolVerses(["désert", "mémoire", "nuit"], lang),
    {
      id: "arc-da-title",
      line: editorial.daTitle.trim(),
    },
    {
      id: "arc-da-sub",
      line: editorial.daSubtitle.trim(),
    },
    {
      id: "toast-naissance-suite",
      line: editorial.chapterToastSubtitle.trim(),
    },
  ];
}

