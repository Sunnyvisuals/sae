import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAppCopy } from "../hooks/useAppCopy";
import { useLanguageStore } from "../stores/languageStore";
import { useFullscreenPrefsStore } from "../stores/fullscreenPrefsStore";
import {
  exitDocumentFullscreen,
  isFullscreenApiSupported,
  requestDocumentFullscreen,
  useDocumentFullscreenActive,
} from "../lib/fullscreenDocument";

type Props = {
  /** Parent : true une fois le délai post-langue écoulé. */
  open: boolean;
  onRequestClose: () => void;
};

/**
 * Plein écran - même esthétique que l’écran de choix de langue (fond, halos, filets),
 * affiché à la suite du gate langue sur l’intro.
 */
export default function IntroFullscreenOverlay({ open, onRequestClose }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const offerOnArrival = useFullscreenPrefsStore((s) => s.offerFullscreenOnArrival);
  const setOfferOnArrival = useFullscreenPrefsStore((s) => s.setOfferFullscreenOnArrival);
  const fsActive = useDocumentFullscreenActive();
  const prefersReducedMotion = useReducedMotion();
  const supported = typeof window !== "undefined" && isFullscreenApiSupported();

  const visible =
    open &&
    supported &&
    offerOnArrival &&
    !fsActive;

  const onAccept = async () => {
    const ok = await requestDocumentFullscreen();
    if (ok) {
      onRequestClose();
    }
  };

  const onLater = () => {
    onRequestClose();
  };

  const onNever = async () => {
    setOfferOnArrival(false);
    await exitDocumentFullscreen();
    onRequestClose();
  };

  if (!supported || !offerOnArrival) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro-fs-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={copy.fullscreenPromptAria}
          dir={lang === "ar-dz" ? "rtl" : "ltr"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.02 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed inset-0 z-[105] flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#020100]" />
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="h-[70vmax] w-[70vmax] rounded-full opacity-60"
              style={{
                background: "radial-gradient(circle, rgba(197,160,89,0.09) 0%, transparent 70%)",
              }}
            />
          </div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 inset-x-0 h-px origin-center"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(197,160,89,0.32), transparent)",
            }}
            aria-hidden
          />
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 inset-x-0 h-px origin-center"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(197,160,89,0.32), transparent)",
            }}
            aria-hidden
          />

          <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-8">
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55 }}
              className="text-[10px] uppercase tracking-[0.46em] text-[#c5a059]/42 sm:text-[11px]"
            >
              {copy.fullscreenPromptTitle}
            </motion.span>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex w-full max-w-md flex-col gap-3.5 sm:mt-11 sm:flex-row sm:justify-center sm:gap-5"
            >
              <button
                type="button"
                onClick={onAccept}
                className="group relative flex min-h-[3.6rem] flex-1 flex-col items-center justify-center overflow-hidden border border-[#c5a059]/45 bg-[rgba(197,160,89,0.08)] px-6 py-3.5 transition-[border-color,background-color,box-shadow] duration-500 hover:border-[#c5a059]/65 hover:bg-[rgba(197,160,89,0.12)] sm:min-h-[3.9rem]"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#fdfaf6]/90 sm:text-[12px]">
                  {copy.fullscreenPromptAccept}
                </span>
              </button>
              <button
                type="button"
                onClick={onLater}
                className="group relative flex min-h-[3.6rem] flex-1 flex-col items-center justify-center overflow-hidden border border-[#c5a059]/22 bg-transparent px-6 py-3.5 transition-[border-color,background-color] duration-500 hover:border-[#c5a059]/40 hover:bg-[rgba(197,160,89,0.06)] sm:min-h-[3.9rem]"
              >
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#c5a059]/75 sm:text-[12px]">
                  {copy.fullscreenPromptLater}
                </span>
              </button>
            </motion.div>

            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              onClick={onNever}
              className="mt-9 text-[10px] uppercase tracking-[0.18em] text-[#c5a059]/26 sm:text-[11px]"
            >
              {copy.fullscreenPromptNever}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
