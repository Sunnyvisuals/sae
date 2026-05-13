"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { IconVolume1, IconVolume2, IconVolumeX } from "./ui/icons";
import {
  applyVolumeKeyStep,
  getVolumeKeyDirection,
  shouldIgnoreVolumeKeyboardTarget,
} from "../lib/volumeKeyboard";
import { useAppCopy } from "../hooks/useAppCopy";
import {
  ACT23_BRIDGE_FALLBACK_WEBM,
  ACT23_BRIDGE_MP4,
  ACT23_BRIDGE_WEBM,
} from "../lib/act23Bridge";

type Props = {
  open: boolean;
  onComplete: () => void;
};

export default function ChapterAct23Bridge({ open, onComplete }: Props) {
  const copy = useAppCopy();
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [volume, setVolume] = useState(0.35);
  const [isMuted, setIsMuted] = useState(false);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  volumeRef.current = volume;
  isMutedRef.current = isMuted;

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
    onComplete();
  }, [onComplete]);

  useLayoutEffect(() => {
    if (!open) {
      finishedRef.current = false;
      return;
    }
    if (prefersReducedMotion === true) finishOnce();
  }, [open, prefersReducedMotion, finishOnce]);

  useEffect(() => {
    if (!open || prefersReducedMotion === true) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => finishOnce());
  }, [open, prefersReducedMotion, finishOnce]);

  useEffect(() => {
    if (!open || prefersReducedMotion === true) return;
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreVolumeKeyboardTarget(e.target)) return;
      const dir = getVolumeKeyDirection(e);
      if (!dir) return;
      e.preventDefault();
      const { volume: v, muted: m } = applyVolumeKeyStep(dir, volumeRef.current, isMutedRef.current);
      setVolume(v);
      setIsMuted(m);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, prefersReducedMotion]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    setVolume(next);
    if (next > 0) setIsMuted(false);
    else setIsMuted(true);
  };

  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    if (!next && volume === 0) setVolume(0.5);
  };

  if (!open || prefersReducedMotion === true) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[220] min-h-[100dvh] w-full overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 z-[1] h-full w-full object-cover object-center"
        playsInline
        muted={isMuted}
        preload="auto"
        onEnded={finishOnce}
        onError={finishOnce}
      >
        <source src={ACT23_BRIDGE_MP4} type="video/mp4" />
        <source src={ACT23_BRIDGE_WEBM} type="video/webm" />
        <source src={ACT23_BRIDGE_FALLBACK_WEBM} type='video/webm; codecs="vp09.00.10.08"' />
      </video>

      {/* Contrôle volume — même losange que le prologue */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ delay: 0.6, duration: 0.9 }}
          className="pointer-events-auto absolute right-6 top-12 z-[2] flex items-center gap-3 group sm:right-16 sm:top-16 sm:gap-4"
        >
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-10 w-10 rotate-45 cursor-default items-center justify-center border border-solar-gold/40 bg-black/40 backdrop-blur-md transition-colors hover:border-solar-gold hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]"
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
              className="h-0.5 w-24 cursor-default appearance-none rounded-full bg-solar-gold/20 accent-solar-gold"
              aria-label={copy.introVideoVolumeRange}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
