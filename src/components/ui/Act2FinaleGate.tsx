'use client';

import { useCallback, useId, useState } from 'react';
import { motion } from 'motion/react';
import { useAppCopy } from '../../hooks/useAppCopy';
import { useLanguageStore } from '../../stores/languageStore';

type Props = {
  /** Texte envoyé avec la fermeture (enregistré en session avec actSave). */
  onComplete: (completionLine: string) => void;
  midnight: boolean;
};

export default function Act2FinaleGate({ onComplete, midnight }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const id = useId();
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const canSubmit = trimmed.length >= 4;

  const submit = useCallback(() => {
    if (!canSubmit) return;
    onComplete(trimmed);
  }, [canSubmit, onComplete, trimmed]);

  const border = midnight ? 'border-[rgba(139,213,255,0.38)]' : 'border-[#c5a059]/42';
  const muted = midnight ? 'text-[rgba(200,226,246,0.48)]' : 'text-[#c5a059]/48';
  const prose = midnight ? 'text-[rgba(250,246,235,0.88)]' : 'text-[#f4eedd]/92';
  const baseBg = midnight ? 'bg-da-depth-abyss/92' : 'bg-da-depth-map/93';

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={copy.act2FinaleAria}
      className={`fixed inset-0 z-[520] flex items-center justify-center px-6 py-[max(1.25rem,env(safe-area-inset-bottom))] ${baseBg} backdrop-blur-[10px]`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        dir={lang === 'ar-dz' ? 'rtl' : 'ltr'}
        className={`w-full max-w-[min(100%,26rem)] border ${border} bg-black/35 px-[clamp(1.25rem,4vw,1.85rem)] py-[clamp(1.65rem,4vh,2.35rem)] shadow-[inset_0_1px_0_rgba(255,252,245,0.04)]`}
      >
        <p className={`mb-[1.1rem] font-sans text-[9px] font-normal uppercase tracking-[0.42em] ${muted}`}>
          Suite du voyage
        </p>
        <label htmlFor={id} className={`block font-sans text-[clamp(1rem,2.8vw,1.15rem)] font-medium leading-snug tracking-[0.04em] ${prose}`}>
          {copy.act2FinaleStem}
          {' '}
          <span className="block mt-4 text-[clamp(1.06rem,2.9vw,1.28rem)] font-normal tracking-[0.02em] text-[rgba(197,160,89,0.58)] italic">
            {copy.act2FinalePlaceholder}
          </span>
        </label>
        <textarea
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          maxLength={520}
          className={
            `mt-5 w-full resize-y rounded-none border px-3 py-2.5 font-sans text-[0.93rem] leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-black/35 ` +
            `${midnight ? 'border-[rgba(139,213,255,0.28)] bg-[#040c18]/96 text-[#f0f8ff]/96 focus-visible:border-[rgba(163,218,255,0.55)] focus-visible:ring-2 focus-visible:ring-[rgba(90,168,255,0.28)]'
              : 'border-[rgba(197,160,89,0.35)] bg-[#0b0907]/94 text-[#fdf9f4]/95 placeholder:text-black/35 focus-visible:border-[#c5a059]/65 focus-visible:ring-2 focus-visible:ring-[#c5a059]/22'}`
          }
          placeholder=""
        />
        <p className={`mt-3 font-sans text-[11px] leading-relaxed tracking-[0.02em] ${muted}`}>{copy.act2FinaleHint}</p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className={
            `mt-8 w-full border py-3 font-sans text-[10px] font-medium uppercase tracking-[0.34em] transition-colors disabled:pointer-events-none disabled:opacity-[0.38] ${midnight ? 'border-[rgba(139,213,255,0.55)] bg-[rgba(6,28,62,0.55)] text-sky-100/95 hover:border-[rgba(190,226,255,0.88)] hover:bg-[rgba(8,42,92,0.55)]'
              : 'border-[rgba(197,160,89,0.55)] bg-[rgba(22,16,10,0.65)] text-[#f4ead2]/95 hover:border-[#c5a059]/85 hover:bg-[rgba(197,160,89,0.12)]'}`
          }
        >
          {copy.act2FinaleSubmit}
        </button>
      </motion.div>
    </motion.div>
  );
}
