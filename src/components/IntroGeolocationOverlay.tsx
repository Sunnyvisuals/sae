import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAppCopy } from "../hooks/useAppCopy";
import { useLanguageStore } from "../stores/languageStore";
import { useGeolocationPrefsStore } from "../stores/geolocationPrefsStore";
import { useVisitorPlaceStore } from "../stores/visitorPlaceStore";
import { fetchVisitorPlace, isGeolocationSupported } from "../lib/visitorGeolocation";
import { DA_MOTION_EASE } from "../lib/motionDa";

type Props = {
  open: boolean;
  onRequestClose: () => void;
};

export default function IntroGeolocationOverlay({ open, onRequestClose }: Props) {
  const copy = useAppCopy();
  const lang = useLanguageStore((s) => s.language);
  const offerOnArrival = useGeolocationPrefsStore((s) => s.offerGeolocationOnArrival);
  const setOfferOnArrival = useGeolocationPrefsStore((s) => s.setOfferGeolocationOnArrival);
  const setPlace = useVisitorPlaceStore((s) => s.setPlace);
  const prefersReducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);

  const supported = typeof window !== "undefined" && isGeolocationSupported();
  const visible = open && supported && offerOnArrival;

  const finish = () => {
    setLoading(false);
    onRequestClose();
  };

  const onAccept = async () => {
    if (loading) return;
    setLoading(true);
    const place = await fetchVisitorPlace(lang);
    if (place) setPlace(place);
    finish();
  };

  const onLater = () => finish();

  const onNever = () => {
    setOfferOnArrival(false);
    finish();
  };

  if (!supported || !offerOnArrival) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro-geo-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={copy.geolocationPromptAria}
          dir={lang === "ar-dz" ? "rtl" : "ltr"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.02 }}
          transition={{ duration: prefersReducedMotion ? 0.28 : 0.88, ease: DA_MOTION_EASE }}
          className="pointer-events-auto fixed inset-0 z-[106] flex flex-col items-center justify-center overflow-hidden"
        >
          <motion.div className="absolute inset-0 bg-[#020100]" />
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

          <motion.div className="relative z-10 flex w-full max-w-xl flex-col items-center px-8 text-center">
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.82, ease: DA_MOTION_EASE }}
              className="text-[10px] uppercase tracking-[0.46em] text-[#c5a059]/42 sm:text-[11px]"
            >
              {copy.geolocationPromptTitle}
            </motion.span>

            {copy.geolocationPromptBody ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.82, ease: DA_MOTION_EASE }}
                className="mt-5 max-w-md text-[12px] leading-relaxed tracking-[0.04em] text-[#fdfaf6]/72 sm:text-[13px]"
              >
                {copy.geolocationPromptBody}
              </motion.p>
            ) : null}

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.32, duration: 0.95, ease: DA_MOTION_EASE }}
              className="mt-9 flex w-full max-w-md flex-col gap-3.5 sm:mt-11 sm:flex-row sm:justify-center sm:gap-5"
            >
              <button
                type="button"
                onClick={() => void onAccept()}
                disabled={loading}
                className="group relative flex min-h-[3.6rem] flex-1 flex-col items-center justify-center overflow-hidden border border-[#c5a059]/45 bg-[rgba(197,160,89,0.08)] px-6 py-3.5 transition-[border-color,background-color,box-shadow] duration-500 hover:border-[#c5a059]/65 hover:bg-[rgba(197,160,89,0.12)] disabled:opacity-60 sm:min-h-[3.9rem]"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#fdfaf6]/90 sm:text-[12px]">
                  {loading ? copy.geolocationPromptLoading : copy.geolocationPromptAccept}
                </span>
              </button>
              <button
                type="button"
                onClick={onLater}
                disabled={loading}
                className="group relative flex min-h-[3.6rem] flex-1 flex-col items-center justify-center overflow-hidden border border-[#c5a059]/22 bg-transparent px-6 py-3.5 transition-[border-color,background-color] duration-500 hover:border-[#c5a059]/40 hover:bg-[rgba(197,160,89,0.06)] disabled:opacity-50 sm:min-h-[3.9rem]"
              >
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#c5a059]/75 sm:text-[12px]">
                  {copy.geolocationPromptLater}
                </span>
              </button>
            </motion.div>

            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              onClick={onNever}
              disabled={loading}
              className="mt-9 text-[10px] uppercase tracking-[0.18em] text-[#c5a059]/26 disabled:opacity-40 sm:text-[11px]"
            >
              {copy.geolocationPromptNever}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
