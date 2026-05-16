import { useCallback, type ChangeEvent } from "react";
import { motion } from "motion/react";

import { useAppCopy } from "../../hooks/useAppCopy";
import { useMasterVolumeStore } from "../../stores/masterVolumeStore";
import { IconVolume1, IconVolume2, IconVolumeX } from "./icons";

const DEFAULT_MASTER_VOLUME = 0.2;

type Props = {
  /** Acte II nuit constellation — teinte bleu lune. */
  midnight?: boolean;
  /** Pont ou crédits : contrôle visible mais inactif. */
  disabled?: boolean;
  className?: string;
};

export default function AmbientVolumeQuickHud({
  midnight = false,
  disabled = false,
  className = "",
}: Props) {
  const copy = useAppCopy();
  const volume = useMasterVolumeStore((s) => s.volume);
  const setVolume = useMasterVolumeStore((s) => s.setVolume);
  const unlockPlayback = useMasterVolumeStore((s) => s.unlockPlayback);

  const silent = volume <= 0;
  const effectiveVolume = disabled ? 0 : volume;

  const toggleMute = useCallback(() => {
    if (disabled) return;
    unlockPlayback();
    setVolume(silent ? DEFAULT_MASTER_VOLUME : 0);
  }, [disabled, silent, setVolume, unlockPlayback]);

  const onRange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      unlockPlayback();
      setVolume(parseFloat(e.target.value));
    },
    [disabled, setVolume, unlockPlayback],
  );

  const shellCls = midnight
    ? "border border-[rgba(139,213,255,0.34)] bg-[rgba(3,12,34,0.55)] shadow-[0_6px_28px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(180,218,255,0.06),0_0_28px_rgba(72,148,230,0.09)] hover:border-[rgba(155,226,255,0.5)] hover:bg-[rgba(5,18,42,0.68)] hover:shadow-[0_8px_34px_rgba(0,0,0,0.58),0_0_40px_rgba(90,168,255,0.13)] focus-visible:ring-[rgba(148,206,255,0.4)]"
    : "border border-[color:rgba(197,160,89,0.38)] bg-[rgba(0,0,0,0.48)] shadow-[0_6px_28px_rgba(0,0,0,0.45),0_0_28px_rgba(197,160,89,0.18)] hover:border-[color:rgba(197,160,89,0.55)] hover:bg-black/58 hover:shadow-[0_8px_32px_rgba(0,0,0,0.52),0_0_34px_rgba(197,160,89,0.28)] focus-visible:ring-[color:rgba(197,160,89,0.45)]";

  const iconCls = midnight
    ? "text-[rgba(198,226,252,0.92)] group-hover:text-[#f0ebd4] group-hover:drop-shadow-[0_0_14px_rgba(120,185,255,0.45)]"
    : "text-[rgba(229,206,154,0.95)] group-hover:text-[#fdf8ee] group-hover:drop-shadow-[0_0_12px_rgba(197,160,89,0.55)]";

  const rangeBorder = midnight
    ? "group-hover:border-[rgba(90,168,255,0.22)]"
    : "group-hover:border-solar-gold/20";

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: disabled ? 0.42 : 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={
        "group pointer-events-auto fixed z-[40] flex flex-row-reverse items-center gap-3 " +
        "right-[max(1.25rem,calc(env(safe-area-inset-right)+0.5rem))] top-[max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))] " +
        "md:right-[max(2rem,calc(env(safe-area-inset-right)+1rem))] md:top-[max(1.75rem,calc(env(safe-area-inset-top)+0.75rem))] " +
        className
      }
    >
      <button
        type="button"
        onClick={toggleMute}
        disabled={disabled}
        className={
          "flex h-10 w-10 rotate-45 cursor-none items-center justify-center rounded-[2px] backdrop-blur-sm transition-[border-color,background-color,box-shadow,opacity] duration-300 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed " +
          shellCls
        }
        aria-label={silent || effectiveVolume === 0 ? copy.menuAmbientMuteOn : copy.menuAmbientMuteOff}
      >
        <span className={`-rotate-45 transition-colors duration-300 ${iconCls}`}>
          {silent || effectiveVolume === 0 ? (
            <IconVolumeX width={18} height={18} aria-hidden />
          ) : effectiveVolume < 0.5 ? (
            <IconVolume1 width={18} height={18} aria-hidden />
          ) : (
            <IconVolume2 width={18} height={18} aria-hidden />
          )}
        </span>
      </button>
      <motion.div
        className={
          "flex h-8 w-0 items-center overflow-hidden rounded-full border border-transparent bg-black/40 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:w-32 group-hover:px-4 " +
          rangeBorder
        }
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={silent ? 0 : effectiveVolume}
          onChange={onRange}
          disabled={disabled}
          className={
            "h-0.5 w-24 cursor-none appearance-none rounded-full accent-solar-gold disabled:opacity-40 " +
            (midnight ? "bg-sky-300/20 accent-[rgba(155,226,255,0.85)]" : "bg-solar-gold/20")
          }
          aria-label={copy.menuAmbientVolume}
        />
      </motion.div>
    </motion.div>
  );
}
