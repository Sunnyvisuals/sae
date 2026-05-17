import type { AppLanguage } from "../stores/languageStore";

export type Act3FinaleGateLocale = {
  kicker: string;
  eyebrow: string;
  prompt: string;
  before: string;
  after: string;
  placeholder: string;
  inputAria: string;
  /** Indice affiché après {@link ACT3_FINALE_HINT_DELAY_MS} si la phrase n’est pas encore scellée. */
  timedHint: string;
  minLength: number;
};

/** Délai avant l’indice (ms), aligné sur le composant gate. */
export const ACT3_FINALE_HINT_DELAY_MS = 28_000;

/** Secours si `public/data/act3-finale-gate.json` est absent ou invalide - garder aligné avec ce fichier. */
const ACT3_FINALE_GATE_FALLBACK: Record<"fr" | "ar", Act3FinaleGateLocale> = {
  fr: {
    kicker: "Clôture du voyage",
    eyebrow: "À compléter · sans bonne réponse",
    prompt: "Complète ta phrase, puis Entrée pour sceller le voyage et ouvrir les crédits.",
    before: "Chacun a sa traversée,",
    after: "",
    placeholder: "sa poésie de la vie",
    inputAria: "Ta conclusion — finir la phrase à ta manière",
    timedHint:
      "Aucune bonne réponse imposée : un mot, un vers, une image — ce que le désert t’a laissé.",
    minLength: 2,
  },
  ar: {
    kicker: "خاتمة الرحلة",
    eyebrow: "أكمِل · بلا جواب واحد",
    prompt: "أكمِل جملتك، ثم Enter لختم الرحلة وفتح التذييل.",
    before: "لكلّ واحد مسيرته،",
    after: "",
    placeholder: "شعر حياته",
    inputAria: "خاتمتك — أكمِل الجملة على طريقتك",
    timedHint: "لا جواب واحد مطلوب : صورة، نفس، ما تركه الصحراء فيك.",
    minLength: 2,
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseLocale(v: unknown): Partial<Act3FinaleGateLocale> | null {
  if (!isRecord(v)) return null;
  const out: Partial<Act3FinaleGateLocale> = {};
  if (typeof v.kicker === "string") out.kicker = v.kicker.trim();
  if (typeof v.eyebrow === "string") out.eyebrow = v.eyebrow.trim();
  if (typeof v.prompt === "string") out.prompt = v.prompt;
  if (typeof v.before === "string") out.before = v.before;
  if (typeof v.after === "string") out.after = v.after;
  if (typeof v.placeholder === "string") out.placeholder = v.placeholder;
  if (typeof v.inputAria === "string") out.inputAria = v.inputAria;
  if (typeof v.timedHint === "string") out.timedHint = v.timedHint.trim();
  if (typeof v.minLength === "number" && Number.isFinite(v.minLength)) {
    out.minLength = Math.max(1, Math.floor(v.minLength));
  }
  if (typeof out.before !== "string" || typeof out.prompt !== "string" || typeof out.inputAria !== "string") {
    return null;
  }
  return out;
}

function mergeLocale(
  partial: Partial<Act3FinaleGateLocale> | null,
  fb: Act3FinaleGateLocale
): Act3FinaleGateLocale {
  const p = partial ?? {};
  return {
    kicker: p.kicker ?? fb.kicker,
    eyebrow: p.eyebrow ?? fb.eyebrow,
    prompt: p.prompt ?? fb.prompt,
    before: p.before ?? fb.before,
    after: p.after ?? fb.after,
    placeholder: p.placeholder ?? fb.placeholder,
    inputAria: p.inputAria ?? fb.inputAria,
    timedHint: p.timedHint ?? fb.timedHint,
    minLength: p.minLength ?? fb.minLength,
  };
}

export async function loadAct3FinaleGate(language: AppLanguage): Promise<Act3FinaleGateLocale> {
  const key: "fr" | "ar" = language === "ar-dz" ? "ar" : "fr";
  const fb = ACT3_FINALE_GATE_FALLBACK[key];
  try {
    const prefix = import.meta.env.BASE_URL || "/";
    const base = prefix.endsWith("/") ? prefix : `${prefix}/`;
    const res = await fetch(`${base}data/act3-finale-gate.json`, { cache: "no-store" });
    if (!res.ok) return fb;
    const json: unknown = await res.json();
    if (!isRecord(json)) return fb;
    return mergeLocale(parseLocale(json[key]), fb);
  } catch {
    return fb;
  }
}

/** Toute conclusion non vide (après trim) scelle le voyage — pas de mot imposé. */
export function finaleCompletionReady(raw: string, minLength: number): boolean {
  return raw.trim().length >= minLength;
}
