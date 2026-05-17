import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { subscribePrologueVolumeAudioLevel } from "../lib/prologueVolumeAudioLevel";

type Props = {
  visible: boolean;
  volume01: number;
  prefersReducedMotion: boolean | null;
  className?: string;
};

const HUD_EXIT_MS = 0.32;
const HUD_EASE = [0.22, 1, 0.36, 1] as const;
const AURORA_EASE = [0.45, 0, 0.55, 1] as const;

/** Palette DA - or solaire, ocre, parchemin (cf. index.css / AuroraMeshBackground). */
const DA = {
  gold: "197, 160, 89",
  goldBright: "232, 213, 164",
  sand: "213, 175, 110",
  oxide: "122, 92, 46",
  umber: "95, 42, 28",
  terracotta: "155, 72, 42",
  parchment: "244, 234, 210",
  depth: "10, 8, 6",
} as const;

/** Intensité de l’aurore selon le volume (lisible sans éblouir le HUD). */
function volumePresence(volume01: number, audioLevel: number): number {
  const v = Math.min(1, Math.max(0, volume01));
  const base = 0.28 + Math.pow(v, 0.52) * 0.52;
  const beat = Math.min(1, Math.max(0, audioLevel));
  return Math.min(1, base * (1 + beat * 0.62));
}

export default function PrologueVolumeFluid({
  visible,
  volume01,
  prefersReducedMotion,
  className = "",
}: Props) {
  const [audioLevel, setAudioLevel] = useState(0);
  const presence = volumePresence(volume01, audioLevel);
  const spread = 0.48 + presence * 0.52;
  const prevVol = useRef(presence);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!visible) {
      setAudioLevel(0);
      return;
    }
    return subscribePrologueVolumeAudioLevel(setAudioLevel);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (Math.abs(presence - prevVol.current) > 0.02) {
      setBurst((n) => n + 1);
      prevVol.current = presence;
    }
  }, [presence, visible]);

  const reduced = prefersReducedMotion === true;
  const baseOpacity = 0.34 + presence * 0.44;
  const curtainW = `${spread * 100}%`;
  const beatBoost = 1 + audioLevel * 0.38;
  const waveDuration = (base: number) =>
    reduced ? base : Math.max(2.8, base / beatBoost);

  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.div
          key="prologue-volume-fluid"
          aria-hidden
          className={`pointer-events-none overflow-hidden ${className}`}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          transition={{
            duration: reduced ? 0.12 : HUD_EXIT_MS,
            ease: HUD_EASE,
          }}
        >
          <motion.div
            className="absolute inset-y-[-8%] right-0 w-[min(48vw,24rem)]"
            initial={false}
            animate={{ opacity: (0.35 + presence * 0.25) * beatBoost }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{
              background: `linear-gradient(270deg, rgba(${DA.depth}, 0.62) 0%, rgba(${DA.umber}, 0.22) 45%, transparent 100%)`,
            }}
          />

          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: baseOpacity * beatBoost }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          >
            <motion.div
              key={burst}
              className="absolute inset-0 origin-right"
              initial={reduced ? false : { opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.16, 1, 0.32, 1] }}
            >
              <motion.div
                className="absolute top-[-28%] bottom-[-28%] right-[-4%] mix-blend-screen"
                style={{
                  width: curtainW,
                  filter: reduced ? "blur(52px)" : "blur(72px)",
                  background: [
                    `radial-gradient(ellipse 42% 88% at 92% 38%, rgba(${DA.gold}, 0.52) 0%, transparent 72%)`,
                    `radial-gradient(ellipse 38% 75% at 88% 62%, rgba(${DA.sand}, 0.38) 0%, transparent 70%)`,
                    `linear-gradient(192deg, transparent 8%, rgba(${DA.goldBright}, 0.2) 42%, rgba(${DA.oxide}, 0.14) 58%, transparent 88%)`,
                  ].join(", "),
                }}
                animate={
                  reduced
                    ? undefined
                    : {
                        y: [0, -28, 14, -8, 0],
                        x: [0, -6, 4, -3, 0],
                        scaleY: [1, 1.06 + audioLevel * 0.04, 0.97, 1.03, 1],
                        opacity: [
                          0.5 * beatBoost,
                          0.72 * beatBoost,
                          0.58 * beatBoost,
                          0.68 * beatBoost,
                          0.5 * beatBoost,
                        ],
                      }
                }
                transition={{
                  duration: waveDuration(7.2),
                  repeat: reduced ? 0 : Infinity,
                  ease: AURORA_EASE,
                }}
              />

              <motion.div
                className="absolute top-[-22%] bottom-[-22%] right-[-2%] mix-blend-screen"
                style={{
                  width: `calc(${curtainW} * 0.88)`,
                  filter: reduced ? "blur(44px)" : "blur(64px)",
                  background: [
                    `radial-gradient(ellipse 36% 70% at 90% 48%, rgba(${DA.goldBright}, 0.36) 0%, transparent 68%)`,
                    `radial-gradient(ellipse 28% 55% at 84% 72%, rgba(${DA.parchment}, 0.22) 0%, transparent 75%)`,
                  ].join(", "),
                }}
                animate={
                  reduced
                    ? undefined
                    : {
                        y: [0, 22, -18, 10, 0],
                        x: [0, 8, -5, 2, 0],
                        scaleX: [1, 1.04 + audioLevel * 0.03, 0.98, 1.02, 1],
                        opacity: [
                          0.32 * beatBoost,
                          0.52 * beatBoost,
                          0.38 * beatBoost,
                          0.48 * beatBoost,
                          0.32 * beatBoost,
                        ],
                      }
                }
                transition={{
                  duration: waveDuration(5.4),
                  repeat: reduced ? 0 : Infinity,
                  ease: AURORA_EASE,
                  delay: 0.6,
                }}
              />

              <motion.div
                className="absolute top-[-18%] bottom-[10%] right-0 mix-blend-screen"
                style={{
                  width: `calc(${curtainW} * 0.72)`,
                  filter: reduced ? "blur(48px)" : "blur(70px)",
                  background: [
                    `radial-gradient(ellipse 34% 58% at 86% 28%, rgba(${DA.terracotta}, 0.4) 0%, transparent 72%)`,
                    `radial-gradient(ellipse 26% 48% at 82% 18%, rgba(${DA.gold}, 0.28) 0%, transparent 78%)`,
                    `radial-gradient(ellipse 22% 40% at 78% 42%, rgba(${DA.umber}, 0.2) 0%, transparent 80%)`,
                  ].join(", "),
                }}
                animate={
                  reduced
                    ? undefined
                    : {
                        y: [0, -16, 20, -6, 0],
                        opacity: [
                          0.28 * beatBoost,
                          0.48 * beatBoost,
                          0.34 * beatBoost,
                          0.44 * beatBoost,
                          0.28 * beatBoost,
                        ],
                        rotate: [0, 1.5, -1, 0.5, 0],
                      }
                }
                transition={{
                  duration: waveDuration(8.6),
                  repeat: reduced ? 0 : Infinity,
                  ease: AURORA_EASE,
                  delay: 1.1,
                }}
              />

              <motion.div
                className="absolute top-[8%] bottom-[-12%] right-0 mix-blend-screen"
                style={{
                  width: `calc(${curtainW} * 0.95)`,
                  filter: reduced ? "blur(40px)" : "blur(58px)",
                  background: `radial-gradient(ellipse 50% 65% at 88% 78%, rgba(${DA.oxide}, 0.24) 0%, rgba(${DA.umber}, 0.12) 40%, transparent 72%)`,
                }}
                animate={
                  reduced
                    ? undefined
                    : {
                        y: [0, 14, -10, 6, 0],
                        opacity: [
                          0.22 * beatBoost,
                          0.38 * beatBoost,
                          0.26 * beatBoost,
                          0.34 * beatBoost,
                          0.22 * beatBoost,
                        ],
                      }
                }
                transition={{
                  duration: waveDuration(6.1),
                  repeat: reduced ? 0 : Infinity,
                  ease: AURORA_EASE,
                  delay: 0.2,
                }}
              />

              <motion.div
                className="absolute inset-y-[-15%] right-0 mix-blend-plus-lighter"
                style={{
                  width: curtainW,
                  filter: reduced ? "blur(28px)" : "blur(42px)",
                  background: [
                    `repeating-linear-gradient(100deg, transparent 0%, transparent 12%, rgba(${DA.gold}, 0.09) 18%, transparent 24%, transparent 38%, rgba(${DA.parchment}, 0.06) 44%, transparent 52%)`,
                    `linear-gradient(278deg, rgba(${DA.gold}, 0.16) 0%, rgba(${DA.goldBright}, 0.09) 35%, transparent 62%)`,
                  ].join(", "),
                  maskImage:
                    "linear-gradient(270deg, black 0%, black 42%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(270deg, black 0%, black 42%, transparent 100%)",
                }}
                animate={
                  reduced
                    ? undefined
                    : {
                        x: [0, -24 - audioLevel * 8, -12, -20, 0],
                        opacity: [
                          0.35 * beatBoost,
                          0.55 * beatBoost,
                          0.42 * beatBoost,
                          0.5 * beatBoost,
                          0.35 * beatBoost,
                        ],
                      }
                }
                transition={{
                  duration: waveDuration(9.5),
                  repeat: reduced ? 0 : Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>

            <motion.div
              className="absolute inset-0 mix-blend-screen"
              initial={false}
              animate={{ opacity: (0.2 + presence * 0.28) * beatBoost }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                filter: "blur(48px)",
                background: `radial-gradient(ellipse 95% 80% at 72% 50%, rgba(${DA.gold}, 0.2) 0%, rgba(${DA.parchment}, 0.08) 38%, transparent 72%)`,
              }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
