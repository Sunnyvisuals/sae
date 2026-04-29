import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

import { useMasterVolumeStore } from '../stores/masterVolumeStore';

const SOUNDS = {
  ambient: 'https://assets.mixkit.co/music/preview/mixkit-ethereal-meditation-151.mp3',
};

/** Intensité max du morceau ambient (gain global régler via menu pause). */
const AMBIENT_GAIN_MAX = 0.38;

type SoundscapeProps = {
  enabled?: boolean;
};

export default function Soundscape({ enabled = true }: SoundscapeProps) {
  const ambientRef = useRef<Howl | null>(null);
  const volume = useMasterVolumeStore((s) => s.volume);
  const playbackUnlocked = useMasterVolumeStore((s) => s.playbackUnlocked);
  const unlockPlayback = useMasterVolumeStore((s) => s.unlockPlayback);

  useEffect(() => {
    const onInteract = () => unlockPlayback();
    window.addEventListener('click', onInteract, { passive: true });
    window.addEventListener('keydown', onInteract);

    ambientRef.current = new Howl({
      src: [SOUNDS.ambient],
      loop: true,
      volume: 0,
    });

    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
      ambientRef.current?.stop();
      ambientRef.current = null;
    };
  }, [unlockPlayback]);

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
