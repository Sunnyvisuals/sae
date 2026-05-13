import { useMemo } from "react";
import { useLanguageStore } from "../stores/languageStore";
import { copyFor } from "../lib/appCopy";

export function useAppCopy() {
  const lang = useLanguageStore((s) => s.language);
  return useMemo(() => copyFor(lang), [lang]);
}
