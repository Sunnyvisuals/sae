import { useEffect, useRef } from 'react';

import { useMasterVolumeStore } from '../stores/masterVolumeStore';

const SOUNDS = {
  // Keep ambient optional until a local licensed asset is added.
  ambient: null as string | null,
};

/** Intensité max du morceau ambient (gain global régler via menu pause). */
const AMBIENT_GAIN_MAX = 0.38;

type SoundscapeProps = {
  enabled?: boolean;
};

export default function Soundscape({ enabled = true }: SoundscapeProps) {
  const ambientRef = useRef<{
    stop: () => void;
    pause: () => void;
    playing: () => boolean;
    fade: (from: number, to: number, ms: number) => void;
    volume: {
      (): number;
      (value: number): void;
    };
    play: () => void;
  } | null>(null);
  const volume = useMasterVolumeStore((s) => s.volume);
  const playbackUnlocked = useMasterVolumeStore((s) => s.playbackUnlocked);

  useEffect(() => {
    if (!SOUNDS.ambient) return;

    let disposed = false;
    import('howler').then(({ Howl }) => {
      if (disposed || !SOUNDS.ambient) return;
      ambientRef.current = new Howl({
        src: [SOUNDS.ambient],
        loop: true,
        volume: 0,
      });
    });

    return () => {
      disposed = true;
      ambientRef.current?.stop();
      ambientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const howl = ambientRef.current;
    if (!howl) return;

    const target = enabled ? volume * AMBIENT_GAIN_MAX : 0;

    if (!playbackUnlocked) {
      howl.volume(0);
      return;
    }

    if (target < 0.002) {
      if (howl.playing()) {
        howl.fade(howl.volume(), 0, 720);
        const t = window.setTimeout(() => {
          howl.pause();
        }, 760);
        return () => window.clearTimeout(t);
      }
      howl.pause();
      return;
    }

    if (!howl.playing()) {
      howl.volume(0);
      howl.play();
      howl.fade(0, target, 2000);
    } else {
      howl.volume(target);
    }
  }, [enabled, volume, playbackUnlocked]);

  return null;
}
