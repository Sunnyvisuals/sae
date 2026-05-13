"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ShootingStars from "../ShootingStars";
import type { AppLanguage } from "../../stores/languageStore";
import {
  finaleAnswerMatches,
  loadAct3FinaleGate,
  type Act3FinaleGateLocale,
} from "../../lib/act3FinaleGate";

type Props = {
  language: AppLanguage;
  /** Fin juste : ouvre les crédits voyage (même chaîne que le bouton). */
  onSolved: () => void;
  onBackToParchemin: () => void;
  wrongLabel: string;
  enterHint: string;
  loadingLabel: string;
  redirectingLabel: string;
  backLabel: string;
};

export default function Act3FinaleKeywordGate({
  language,
  onSolved,
  onBackToParchemin,
  wrongLabel,
  enterHint,
  loadingLabel,
  redirectingLabel,
  backLabel,
}: Props) {
  const arabicUi = language === "ar-dz";
  const inputRef = useRef<HTMLInputElement>(null);
  const [cfg, setCfg] = useState<Act3FinaleGateLocale | null>(null);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [solved, setSolved] = useState(false);
  const solvedOnce = useRef(false);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const data = await loadAct3FinaleGate(language);
      if (!cancel) setCfg(data);
    })();
    return () => {
      cancel = true;
    };
  }, [language]);

  useEffect(() => {
    if (!cfg || solved) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [cfg, solved]);

  const trySubmit = useCallback(() => {
    if (!cfg || solved || solvedOnce.current) return;
    if (finaleAnswerMatches(value, cfg.answers, arabicUi)) {
      solvedOnce.current = true;
      setWrong(false);
      setSolved(true);
      onSolved();
      return;
    }
    setWrong(true);
    inputRef.current?.select();
  }, [arabicUi, cfg, onSolved, solved, value]);

  const verseTypography =
    "font-serif text-[clamp(1.35rem,2.6vw,1.82rem)] leading-[1.8] text-solar-gold/88 " +
    (arabicUi ? "font-arabic-ui not-italic text-right" : "font-bahlull italic text-left");

  return (
    <div
      className="fixed inset-0 z-[55] bg-da-depth-night"
      role="dialog"
      aria-modal
      aria-labelledby="act3-finale-verse"
      aria-describedby="act3-finale-instructions"
    >
      {/* Étoiles filantes — sans WebGL, pas de conflit avec le SplashCursor parent */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <ShootingStars />
      </div>
      <p id="act3-finale-instructions" className="sr-only">
        {cfg ? `${cfg.prompt} ${enterHint}` : `${loadingLabel} ${enterHint}`}
      </p>

      <button
        type="button"
        onClick={onBackToParchemin}
        className={
          "pointer-events-auto fixed left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-[1] border-0 bg-transparent p-2 font-sans text-[10px] font-normal uppercase tracking-[0.24em] text-solar-gold/32 outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/25 " +
          (arabicUi ? "not-italic" : "")
        }
      >
        {backLabel}
      </button>

      <div
        className={
          "pointer-events-auto flex min-h-full items-center justify-center px-[max(1.25rem,env(safe-area-inset-left))] py-[max(3.5rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))]"
        }
      >
        <div className="w-full max-w-[min(72rem,calc(100vw-4rem))]">
          {!cfg ? (
            <p
              id="act3-finale-verse"
              className={verseTypography + " opacity-45"}
              aria-live="polite"
            >
              {loadingLabel}
            </p>
          ) : solved ? (
            <p
              id="act3-finale-verse"
              className={
                verseTypography +
                " text-center font-sans text-[12px] font-normal tracking-[0.1em] text-[rgba(234,215,164,0.75)] " +
                (arabicUi ? "not-italic" : "")
              }
            >
              {redirectingLabel}
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                trySubmit();
              }}
              className="w-full"
              dir={arabicUi ? "rtl" : "ltr"}
            >
              <p id="act3-finale-verse" className={verseTypography}>
                <span>{cfg.before}</span>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setWrong(false);
                  }}
                  aria-label={cfg.inputAria}
                  aria-invalid={wrong}
                  aria-describedby={wrong ? "act3-finale-wrong" : undefined}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={56}
                  style={{
                    width: `${Math.max(value.length + 1, 2)}ch`,
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    fontStyle: "inherit",
                    fontWeight: "inherit",
                    letterSpacing: "inherit",
                    lineHeight: "inherit",
                  }}
                  data-cursor-text
      className="inline-block border-0 bg-transparent px-0 py-0 align-baseline text-solar-gold/88 caret-solar-gold outline-none ring-0"
                />
                <span>{cfg.after}</span>
              </p>
              {wrong ? (
                <p
                  id="act3-finale-wrong"
                  role="alert"
                  className={
                    "mt-4 font-sans text-[11px] text-[rgba(255,186,186,0.85)] " +
                    (arabicUi ? "text-right font-arabic-ui not-italic" : "text-left")
                  }
                >
                  {wrongLabel}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
