import { useEffect, useRef, useCallback, useState } from 'react';

interface Track {
  src: string;
  volume?: number;
  loop?: boolean;
}

export function useAudio(track: Track | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!track) return;
    const audio = new Audio(track.src);
    audio.volume = track.volume ?? 0.35;
    audio.loop = track.loop ?? true;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [track?.src]);

  const play = useCallback(() => {
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(m => !m);
  }, []);

  const fadeTo = useCallback((targetVol: number, durationMs = 1500) => {
    const audio = audioRef.current;
    if (!audio) return;
    const start = audio.volume;
    const diff = targetVol - start;
    const steps = 30;
    const stepTime = durationMs / steps;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, start + diff * (i / steps)));
      if (i >= steps) clearInterval(interval);
    }, stepTime);
  }, []);

  return { play, pause, toggleMute, fadeTo, playing, muted };
}
