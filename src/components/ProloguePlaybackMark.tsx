import { useId } from "react";
import { motion } from "motion/react";

export function GoldPlayIcon({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={`play-grad-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8d5a4" />
          <stop offset="42%" stopColor="#c5a059" />
          <stop offset="100%" stopColor="#7a5c2e" />
        </linearGradient>
      </defs>
      <polygon
        points="8,5 8,19 19,12"
        fill={`url(#play-grad-${gid})`}
        className="transition-[filter] duration-500 group-hover:brightness-110"
        style={{ filter: "drop-shadow(0 0 8px rgba(197, 160, 89, 0.35))" }}
      />
    </svg>
  );
}

function ProloguePauseIcon({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={`pause-grad-${gid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4ead2" />
          <stop offset="50%" stopColor="#e8d5a4" />
          <stop offset="100%" stopColor="#c5a059" />
        </linearGradient>
      </defs>
      <rect x="6" y="5" width="4.5" height="14" rx="0.75" fill={`url(#pause-grad-${gid})`} />
      <rect x="13.5" y="5" width="4.5" height="14" rx="0.75" fill={`url(#pause-grad-${gid})`} />
    </svg>
  );
}

export default function ProloguePlaybackMark({
  mode,
  ariaLabel,
  prefersReducedMotion,
}: {
  mode: "pause" | "play";
  ariaLabel: string;
  prefersReducedMotion: boolean | null;
}) {
  const iconClass = "h-7 w-7 sm:h-8 sm:w-8";
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-0 z-[18] flex items-center justify-center"
    >
      <motion.div
        className="relative flex h-[4.75rem] w-[4.75rem] items-center justify-center sm:h-[5.25rem] sm:w-[5.25rem]"
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 rotate-45 border border-solar-gold/45 bg-transparent shadow-[0_0_28px_rgba(197,160,89,0.28)]"
        />
        <motion.div className="relative z-[1] flex items-center justify-center">
          {mode === "pause" ? (
            <ProloguePauseIcon className={iconClass} />
          ) : (
            <GoldPlayIcon className={`${iconClass} translate-x-[2px]`} />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
