import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { IconVolume1, IconVolume2, IconVolumeX } from './icons';
import {
  applyVolumeKeyStep,
  getVolumeKeyDirection,
  shouldIgnoreVolumeKeyboardTarget,
} from '../../lib/volumeKeyboard';
import { useAppCopy } from '../../hooks/useAppCopy';
import { INTRO_VIDEO_SRC } from '../../lib/act1IntroBridge';

type Props = {
  /** Retour à l’expérience (carte / acte) - ne recharge rien */
  onClose: () => void;
};

/**
 * Même lecture cinématique que l’intro : plein écran, volume losange, « Passer l’introduction ».
 * Surcouche uniquement - la phase et la progression ne changent pas.
 */
export default function IntroVideoOverlay({ onClose }: Props) {
  const copy = useAppCopy();
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(0.35);
  const [isMuted, setIsMuted] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  volumeRef.current = volume;
  isMutedRef.current = isMuted;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreVolumeKeyboardTarget(e.target)) return;
      const dir = getVolumeKeyDirection(e);
      if (!dir) return;
      e.preventDefault();
      const { volume: v, muted: m } = applyVolumeKeyStep(
        dir,
        volumeRef.current,
        isMutedRef.current
      );
      setVolume(v);
      setIsMuted(m);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p !== undefined) p.catch(() => {});
  }, []);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setShowSkip(true), 4000);
    const hideTimer = window.setTimeout(() => setShowSkip(false), 12000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
    else setIsMuted(true);
  };

  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    if (!next && volume === 0) setVolume(0.5);
  };

  const handleSkip = () => {
    if (videoRef.current) videoRef.current.pause();
    onClose();
  };

  const handleVideoEnd = () => {
    onClose();
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={copy.introVideoAria}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[620] cursor-none bg-black"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className="absolute inset-0 h-full w-full"
      >
        <video
          ref={videoRef}
          src={INTRO_VIDEO_SRC}
          className="h-full w-full cursor-none object-cover"
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnd}
          onError={() => {}}
        />
      </motion.div>

      {/* Volume - même principe que Intro */}
      <AnimatePresence>
        {!showSkip && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.6, duration: 0.9 }}
            className="pointer-events-auto absolute right-6 top-12 z-50 flex items-center gap-3 group sm:right-16 sm:top-16 sm:gap-4"
          >
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 rotate-45 cursor-none items-center justify-center border border-solar-gold/40 bg-black/40 backdrop-blur-md transition-colors hover:border-solar-gold hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]"
              aria-label={isMuted || volume === 0 ? copy.introVideoMuteOff : copy.introVideoMuteOn}
            >
              <div className="-rotate-45 text-white transition-colors group-hover:text-solar-gold">
                {isMuted || volume === 0 ? (
                  <IconVolumeX width={16} height={16} />
                ) : volume < 0.5 ? (
                  <IconVolume1 width={16} height={16} />
                ) : (
                  <IconVolume2 width={16} height={16} />
                )}
              </div>
            </button>
            <div className="flex h-8 w-0 items-center overflow-hidden rounded-full border border-transparent bg-black/40 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:w-32 group-hover:border-solar-gold/20 group-hover:px-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-0.5 w-24 cursor-none appearance-none rounded-full bg-solar-gold/20 accent-solar-gold"
                aria-label={copy.introVideoVolumeRange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passer l'introduction - aligné intro */}
      <AnimatePresence>
        {showSkip && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute bottom-10 right-6 z-50 sm:bottom-16 sm:right-16"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              className="group relative flex items-center gap-3 transition-[gap] duration-700 ease-[0.22,1,0.36,1] hover:gap-4 sm:gap-4 sm:hover:gap-5"
            >
              <div className="flex min-w-0 flex-col items-end gap-1.5">
                <span className="max-w-[85vw] text-right text-[9px] font-light uppercase tracking-[0.55em] text-solar-gold/70 transition-colors duration-500 group-hover:text-solar-gold sm:text-[10px] sm:tracking-[0.6em]">
                  {copy.introVideoSkip}
                </span>
                <div className="relative mt-0.5 h-[2px] w-[min(17rem,72vw)] overflow-hidden rounded-full bg-solar-gold/15">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                    className="h-full bg-solar-gold/50"
                  />
                </div>
              </div>
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
                <div className="absolute inset-0 rotate-45 border border-solar-gold/40 bg-black/45 backdrop-blur-md transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:border-solar-gold group-hover:shadow-[0_0_18px_rgba(197,160,89,0.5)]" />
                <div className="relative z-[1] -rotate-45 flex items-center justify-center">
                  <motion.div
                    className="relative h-5 w-5"
                    animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
                    transition={{ rotate: { duration: 4.2, repeat: Infinity, ease: 'linear' } }}
                    aria-hidden
                  >
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 block h-[7px] w-[7px] rounded-full bg-solar-gold/90 shadow-[0_0_10px_rgba(197,160,89,0.55)] blur-[0.35px]"
                      style={{ transform: 'translate(-50%, -50%) translate(-4.5px, -4.5px)' }}
                    />
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 block h-[7px] w-[7px] rounded-full bg-solar-gold/65 shadow-[0_0_8px_rgba(197,160,89,0.4)] blur-[0.35px]"
                      style={{ transform: 'translate(-50%, -50%) translate(4.5px, 4.5px)' }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
