import type { AppLanguage } from "../stores/languageStore";

export type Act3FinaleGateLocale = {
  prompt: string;
  before: string;
  after: string;
  answers: readonly string[];
  inputAria: string;
};

/** Secours si `public/data/act3-finale-gate.json` est absent ou invalide — garder aligné avec ce fichier. */
export const ACT3_FINALE_GATE_FALLBACK: Record<"fr" | "ar", Act3FinaleGateLocale> = {
  fr: {
    prompt:
      "Complétez le mot manquant du vers, puis validez avec Entrée.",
    before: "Là où la carte devient constellation, ton ",
    after: " referme la nuit comme un rouleau, et la phrase tient encore le désert suspendu dans le bleu.",
    answers: ["souffle"],
    inputAria: "Mot manquant à compléter au clavier",
  },
  ar: {
    prompt: "كمّل الكلمة الناقصة من البيت، ثم اضغط مفتاح الإدخال (Enter) للتثبيت.",
    before: "حيث تولّد الخريطة كواكب، ",
    after: " تقفَل الليل حال واحد مخطوف؛ والبيت بعدو يعلق الصحراء فالزرقة.",
    answers: ["نفسك"],
    inputAria: "الكلمة الناقصة تُكمَل من لوحة المفاتيح",
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseLocale(v: unknown): Act3FinaleGateLocale | null {
  if (!isRecord(v)) return null;
  const prompt = v.prompt;
  const before = v.before;
  const after = v.after;
  const answers = v.answers;
  const inputAria = v.inputAria;
  if (
    typeof prompt !== "string" ||
    typeof before !== "string" ||
    typeof after !== "string" ||
    typeof inputAria !== "string" ||
    !Array.isArray(answers) ||
    !answers.every((a) => typeof a === "string")
  ) {
    return null;
  }
  return { prompt, before, after, answers: answers as string[], inputAria };
}

export async function loadAct3FinaleGate(language: AppLanguage): Promise<Act3FinaleGateLocale> {
  const key: "fr" | "ar" = language === "ar-dz" ? "ar" : "fr";
  try {
    const prefix = import.meta.env.BASE_URL || "/";
    const base = prefix.endsWith("/") ? prefix : `${prefix}/`;
    const res = await fetch(`${base}data/act3-finale-gate.json`, { cache: "no-store" });
    if (!res.ok) return ACT3_FINALE_GATE_FALLBACK[key];
    const json: unknown = await res.json();
    if (!isRecord(json)) return ACT3_FINALE_GATE_FALLBACK[key];
    const loc = parseLocale(json[key]);
    return loc ?? ACT3_FINALE_GATE_FALLBACK[key];
  } catch {
    return ACT3_FINALE_GATE_FALLBACK[key];
  }
}

export function normalizeFinaleAnswer(raw: string, arabicUi: boolean): string {
  let s = raw.trim();
  if (!arabicUi) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  }
  return s.normalize("NFC").replace(/\u0640/g, "");
}

export function finaleAnswerMatches(
  raw: string,
  answers: readonly string[],
  arabicUi: boolean
): boolean {
  const n = normalizeFinaleAnswer(raw, arabicUi);
  if (!n.length) return false;
  return answers.some((a) => normalizeFinaleAnswer(a, arabicUi) === n);
}
