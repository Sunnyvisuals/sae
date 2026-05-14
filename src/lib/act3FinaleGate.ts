import type { AppLanguage } from "../stores/languageStore";

export type Act3FinaleGateLocale = {
  prompt: string;
  before: string;
  after: string;
  answers: readonly string[];
  inputAria: string;
  /** Indice affiché après {@link ACT3_FINALE_HINT_DELAY_MS} si le mot n’est pas encore trouvé. */
  timedHint: string;
};

/** Délai avant l’indice (ms), aligné sur le composant gate. */
export const ACT3_FINALE_HINT_DELAY_MS = 38_000;

/** Secours si `public/data/act3-finale-gate.json` est absent ou invalide - garder aligné avec ce fichier. */
const ACT3_FINALE_GATE_FALLBACK: Record<"fr" | "ar", Act3FinaleGateLocale> = {
  fr: {
    prompt:
      "Complétez le mot manquant du vers, puis validez avec Entrée.",
    before: "Là où la carte devient constellation, ton",
    after: "referme la nuit comme un rouleau, et la phrase tient encore le désert suspendu dans le bleu.",
    answers: ["souffle"],
    inputAria: "Mot manquant à compléter au clavier",
    timedHint:
      "Pense au souffle du vivant : ce qui anime le corps et porte aussi la voix du vers (un seul mot).",
  },
  ar: {
    prompt: "كمّل الكلمة الناقصة من البيت، ثم اضغط مفتاح الإدخال (Enter) للتثبيت.",
    before: "حيث تولّد الخريطة كواكب،",
    after: "تقفَل الليل حال واحد مخطوف؛ والبيت بعدو يعلق الصحراء فالزرقة.",
    answers: ["نفسك"],
    inputAria: "الكلمة الناقصة تُكمَل من لوحة المفاتيح",
    timedHint: "كلمة واحدة قريبة من النَفَس والحياة، كما يقول البيت عن الليل والجسد.",
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseLocale(v: unknown): (Omit<Act3FinaleGateLocale, "timedHint"> & { timedHint?: string }) | null {
  if (!isRecord(v)) return null;
  const prompt = v.prompt;
  const before = v.before;
  const after = v.after;
  const answers = v.answers;
  const inputAria = v.inputAria;
  const timedHint = v.timedHint;
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
  const base = { prompt, before, after, answers: answers as string[], inputAria };
  if (typeof timedHint === "string" && timedHint.trim()) {
    return { ...base, timedHint: timedHint.trim() };
  }
  return base;
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
    const fb = ACT3_FINALE_GATE_FALLBACK[key];
    const merged = loc ?? fb;
    return { ...merged, timedHint: merged.timedHint ?? fb.timedHint };
  } catch {
    return ACT3_FINALE_GATE_FALLBACK[key];
  }
}

function normalizeFinaleAnswer(raw: string, arabicUi: boolean): string {
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
