import { useMemo } from "react";
import { useLanguageStore } from "../stores/languageStore";
import { copyFor, type PoetryLevel } from "../lib/appCopy";

export type { PoetryLevel };

export function useAppCopy() {
  const lang = useLanguageStore((s) => s.language);
  return useMemo(() => copyFor(lang), [lang]);
}
