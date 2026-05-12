import { motion } from "motion/react";
import type { AppLanguage } from "../stores/languageStore";

export interface LanguageGateProps {
  onSelect: (language: AppLanguage) => void;
}

export default function LanguageGate({ onSelect }: LanguageGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[40001] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-gate-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md border border-solar-gold/25 bg-solar-brown/95 px-8 py-10 shadow-[0_0_80px_rgba(0,0,0,0.65)]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-solar-gold/30 to-transparent" />

        <p
          id="language-gate-title"
          className="font-bahlull text-center text-3xl italic text-white md:text-4xl"
        >
          Al-Rihla
        </p>
        <p className="mt-3 text-center text-[9px] uppercase tracking-[0.45em] text-solar-gold/55">
          Choisir la langue · اختر اللغة
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onSelect("fr")}
            className="flex-1 border border-solar-gold/35 py-3.5 text-[10px] uppercase tracking-[0.35em] text-solar-gold transition-colors hover:border-solar-gold hover:bg-solar-gold/10"
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => onSelect("ar-dz")}
            className="flex-1 border border-solar-gold/35 py-3.5 text-[10px] transition-colors hover:border-solar-gold hover:bg-solar-gold/10 text-solar-gold"
          >
            العربية
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
