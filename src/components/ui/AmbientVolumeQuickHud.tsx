import { useCallback } from "react";
import { motion } from "motion/react";

import { useAppCopy } from "../../hooks/useAppCopy";
import { SHELL_CHROME_VOLUME_TOP } from "../../lib/shellChromeLayout";
import { useMasterVolumeStore } from "../../stores/masterVolumeStore";
import { IconVolume2, IconVolumeX } from "./icons";

const DEFAULT_MASTER_VOLUME = 0.2;

type Props = {
  /** Acte II nuit constellation - teinte bleu lune. */
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
  const isAudible = !disabled && volume > 0;

  const toggleMute = useCallback(() => {
    if (disabled) return;
    unlockPlayback();
    setVolume(silent ? DEFAULT_MASTER_VOLUME : 0);
  }, [disabled, silent, setVolume, unlockPlayback]);

  const shellBase =
    "border backdrop-blur-sm transition-[border-color,background-color,box-shadow,opacity,filter] duration-300 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed ";

  const shellMutedCls = midnight
    ? "border-[rgba(139,213,255,0.18)] bg-[rgba(3,12,34,0.38)] opacity-[0.72] saturate-[0.85] shadow-none hover:border-[rgba(139,213,255,0.28)] hover:bg-[rgba(3,12,34,0.48)] focus-visible:ring-[rgba(148,206,255,0.28)]"
    : "border-[rgba(197,160,89,0.2)] bg-[rgba(0,0,0,0.34)] opacity-[0.72] saturate-[0.8] shadow-none hover:border-[rgba(197,160,89,0.32)] hover:bg-black/48 focus-visible:ring-[color:rgba(197,160,89,0.28)]";

  const shellActiveCls = midnight
    ? "border-[rgba(155,226,255,0.52)] bg-[rgba(5,18,42,0.68)] opacity-100 shadow-[0_6px_28px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(180,218,255,0.08),0_0_32px_rgba(90,168,255,0.16)] hover:border-[rgba(175,232,255,0.62)] hover:shadow-[0_8px_34px_rgba(0,0,0,0.58),0_0_42px_rgba(90,168,255,0.22)] focus-visible:ring-[rgba(148,206,255,0.45)]"
    : "border-[color:rgba(197,160,89,0.55)] bg-[rgba(0,0,0,0.54)] opacity-100 shadow-[0_6px_28px_rgba(0,0,0,0.45),0_0_30px_rgba(197,160,89,0.22)] hover:border-[color:rgba(234,215,164,0.7)] hover:bg-black/62 hover:shadow-[0_8px_32px_rgba(0,0,0,0.52),0_0_38px_rgba(197,160,89,0.32)] focus-visible:ring-[color:rgba(197,160,89,0.5)]";

  const iconMutedCls = midnight
    ? "text-[rgba(198,226,252,0.45)]"
    : "text-[rgba(229,206,154,0.42)]";

  const iconActiveCls = midnight
    ? "text-[rgba(198,226,252,0.96)] drop-shadow-[0_0_10px_rgba(120,185,255,0.35)] hover:text-[#f0ebd4]"
    : "text-[rgba(244,234,210,0.98)] drop-shadow-[0_0_10px_rgba(197,160,89,0.35)] hover:text-[#fff8ee]";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: disabled ? 0.42 : 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={toggleMute}
      disabled={disabled}
      aria-pressed={isAudible}
      aria-label={isAudible ? copy.menuAmbientMuteOff : copy.menuAmbientMuteOn}
      className={
        "pointer-events-auto fixed z-[40] flex h-10 w-10 rotate-45 cursor-none items-center justify-center rounded-[2px] " +
        "right-[max(3.35rem,calc(env(safe-area-inset-right)+2.1rem))] " +
        `${SHELL_CHROME_VOLUME_TOP} ` +
        "md:right-[max(4.35rem,calc(env(safe-area-inset-right)+2.85rem))] " +
        shellBase +
        (isAudible ? shellActiveCls : shellMutedCls) +
        " " +
        className
      }
    >
      <span
        className={`-rotate-45 flex h-full w-full items-center justify-center transition-[color,filter] duration-300 ${isAudible ? iconActiveCls : iconMutedCls}`}
      >
        {isAudible ? (
          <IconVolume2 width={18} height={18} aria-hidden />
        ) : (
          <IconVolumeX width={18} height={18} aria-hidden />
        )}
      </span>
    </motion.button>
  );
}
