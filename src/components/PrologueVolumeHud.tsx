import { motion } from "motion/react";

const HUD_EASE = [0.22, 1, 0.36, 1] as const;

/** Aligné bande dorée droite — tutoriel + vidéo prologue. */
export const PROLOGUE_VOLUME_HUD_POSITION =
  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-right " +
  "right-[max(2.75rem,calc(env(safe-area-inset-right,0px)+1.35rem))]";

type Props = {
  volumePct: number;
  ariaLabel: string;
  className?: string;
};

type VolumeLevel = 0 | 1 | 2;

function volumeLevel(pct: number): VolumeLevel {
  if (pct <= 0) return 0;
  if (pct < 35) return 1;
  return 2;
}

/** Pictogramme son plat — aligné sur le chiffre, sans relief ni halo. */
function PrologueVolumeHudIcon({ level }: { level: VolumeLevel }) {
  const stroke = level === 0 ? "rgba(244, 234, 210, 0.38)" : "rgba(244, 234, 210, 0.62)";

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="relative shrink-0 h-[clamp(1.35rem,3.1vw,2rem)] w-[clamp(1.35rem,3.1vw,2rem)] sm:h-[2.05rem] sm:w-[2.05rem]"
      style={{
        color: stroke,
        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55))",
      }}
    >
      <path
        d="M5 10v4h3l4.5 3.4V6.6L8 10H5z"
        fill="currentColor"
        stroke="none"
      />
      {level >= 1 ? (
        <path
          d="M14.5 8.5a4 4 0 010 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ) : null}
      {level >= 2 ? (
        <path
          d="M17.5 6a7.5 7.5 0 010 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity="0.85"
        />
      ) : null}
      {level === 0 ? (
        <path
          d="M14.8 9.5l4 5M18.8 9.5l-4 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export default function PrologueVolumeHud({ volumePct, ariaLabel, className = "" }: Props) {
  const level = volumeLevel(volumePct);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`${PROLOGUE_VOLUME_HUD_POSITION} ${className}`.trim()}
      initial={{ opacity: 0, scale: 0.94, y: 8, filter: "blur(5px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: HUD_EASE }}
    >
      <motion.div
        key={volumePct}
        initial={{ opacity: 0.65, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: HUD_EASE }}
        dir="ltr"
        className="relative z-[1] inline-flex flex-row items-center justify-end gap-2.5 sm:gap-3"
      >
        <PrologueVolumeHudIcon level={level} />
        <span
          className="font-sans text-[clamp(1.65rem,3.6vw,2.35rem)] font-medium tabular-nums leading-none tracking-[0.06em] text-[#f4ead2]/78"
          style={{
            textShadow:
              "0 0 14px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.55)",
          }}
        >
          {volumePct}
        </span>
      </motion.div>
    </motion.div>
  );
}
