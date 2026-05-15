import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { CursorExperienceMode } from "../stores/cursorPrefsStore";
import { useLanguageStore } from "../stores/languageStore";
import { useAppCopy } from "../hooks/useAppCopy";

type Props = {
  prefersReducedMotion: boolean;
  onChoose: (experience: CursorExperienceMode) => void;
};

type CursorPanelProps = {
  experience: CursorExperienceMode;
  eyebrow: string;
  title: string;
  isArabic: boolean;
  enterY: number;
  enterDelay: number;
  radialAt: string;
  onChoose: (experience: CursorExperienceMode) => void;
  icon: ReactNode;
};

function CursorPanel({
  experience,
  eyebrow,
  title,
  isArabic,
  enterY,
  enterDelay,
  radialAt,
  onChoose,
  icon,
}: CursorPanelProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onChoose(experience)}
      dir={isArabic ? "rtl" : "ltr"}
      className="group relative flex min-h-[42dvh] flex-1 flex-col items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-solar-gold/35 sm:min-h-0"
      initial={{ opacity: 0, y: enterY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: enterDelay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(197,160,89,0.04),rgba(197,160,89,0.015))]" />
      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse 82% 76% at ${radialAt}, rgba(197,160,89,0.08) 0%, transparent 68%)`,
        }}
      />
      <motion.div className="absolute inset-0 bg-[#c5a059] opacity-0 transition-opacity duration-700 group-hover:opacity-[0.1]" />
      <motion.div
        className="absolute bottom-0 inset-x-0 h-2/3 translate-y-full transition-transform duration-700 ease-out group-hover:translate-y-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(197,160,89,0.18), transparent)" }}
      />
      <motion.div className="relative z-10 flex flex-col items-center gap-6 px-8">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: enterDelay + 0.21, duration: 0.9 }}
          className={isArabic ? "da-eyebrow-ar" : "da-eyebrow"}
        >
          {eyebrow}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: enterDelay + 0.31, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={
            (isArabic ? "da-display-title-ar" : "da-display-title") +
            " transition-colors duration-300 group-hover:text-[#fff4dc]"
          }
        >
          {title}
        </motion.span>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: enterDelay + 0.46, duration: 0.7 }}
          className="da-title-rule"
        />
        {icon}
      </motion.div>
    </motion.button>
  );
}

/** Volet curseur — split horizontal (haut / bas), textes selon la langue choisie. */
export default function CursorOnboardingGate({ prefersReducedMotion, onChoose }: Props) {
  const copy = useAppCopy();
  const isArabic = useLanguageStore((s) => s.language) === "ar-dz";

  const fluidIcon = (
    <svg
      className="mt-2 h-[3.25rem] w-[2.25rem] opacity-72 transition-opacity duration-500 group-hover:opacity-95 sm:h-[3.75rem] sm:w-[2.6rem]"
      viewBox="0 0 22 30"
      fill="none"
      aria-hidden
    >
      <polygon
        points="11,1 21,11 11,21 1,11"
        fill="rgba(197,160,89,0.12)"
        stroke="#e8d5a4"
        strokeWidth="1.35"
      />
      <circle cx="11" cy="11" r="1.65" fill="#e8d5a4" />
      <line
        x1="11"
        y1="22"
        x2="11"
        y2="28"
        stroke="#c5a059"
        strokeWidth={1}
        strokeOpacity={0.88}
        strokeLinecap="round"
      />
      <polyline
        points="8,25 11,29 14,25"
        stroke="#c5a059"
        strokeWidth={1}
        strokeOpacity={0.88}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  const basicIcon = (
    <motion.div
      className="mt-2 h-[5.75rem] w-[5.75rem] rounded-full border-[3px] border-solar-gold/58 opacity-72 shadow-[0_0_28px_rgba(197,160,89,0.22)] transition-opacity duration-500 group-hover:opacity-95 sm:h-[6.75rem] sm:w-[6.75rem] sm:border-[3.5px]"
      aria-hidden
    />
  );

  return (
    <motion.div
      key="cursor-onboarding"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cursor-onboarding-curtain"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, scale: 1.02 }}
      transition={{ duration: 1.85, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto fixed inset-0 z-[105] min-h-[100dvh] w-full overflow-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "linear-gradient(180deg, rgba(7, 5, 3, 0.985) 0%, rgba(5, 3, 2, 0.996) 42%, rgba(2, 1, 0, 1) 100%)",
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-x-[-18%] bottom-[-16%] h-[42vh]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(58, 34, 19, 0.08) 0%, rgba(20, 12, 7, 0.08) 34%, transparent 74%)",
          filter: "blur(18px)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          className="h-[70vmax] w-[70vmax] rounded-full opacity-12"
          style={{
            background: "radial-gradient(circle, rgba(197,160,89,0.015) 0%, transparent 70%)",
          }}
        />
      </motion.div>
      <motion.div
        id="cursor-onboarding-curtain"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-[max(4.25rem,calc(env(safe-area-inset-top)+2.75rem))] z-20 flex w-full -translate-x-1/2 justify-center px-6 pb-10 pt-2 text-center pointer-events-none sm:px-8 sm:pb-14 sm:pt-4"
      >
        <motion.div
          className="mx-auto flex max-w-[min(92vw,48rem)] flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2"
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0, 1] }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  opacity: {
                    duration: 3.4,
                    repeat: Infinity,
                    ease: [0.45, 0, 0.55, 1],
                    delay: 1.35,
                    times: [0, 0.52, 1],
                  },
                }
          }
        >
          {isArabic ? (
            <span dir="rtl" className="da-curtain-ar drop-shadow-[0_0_10px_rgba(0,0,0,0.72)]">
              {copy.cursorOnboardingCurtainAr}
            </span>
          ) : (
            <span className="da-curtain-fr sm:tracking-[0.4em]">
              {copy.cursorOnboardingCurtainFr}
            </span>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-full min-h-[100dvh] w-full flex-col pt-[max(10.5rem,calc(env(safe-area-inset-top)+8.25rem))] sm:pt-[max(11.5rem,calc(env(safe-area-inset-top)+9rem))]"
      >
        <CursorPanel
          experience="fluid"
          eyebrow={copy.cursorSectionHeading}
          title={copy.cursorOptionFluid}
          isArabic={isArabic}
          enterY={-36}
          enterDelay={0.34}
          radialAt="50% 28%"
          onChoose={onChoose}
          icon={fluidIcon}
        />

        <CursorPanel
          experience="basic"
          eyebrow={copy.cursorSectionHeading}
          title={copy.cursorOptionBasic}
          isArabic={isArabic}
          enterY={36}
          enterDelay={0.42}
          radialAt="50% 72%"
          onChoose={onChoose}
          icon={basicIcon}
        />
      </motion.div>
    </motion.div>
  );
}
