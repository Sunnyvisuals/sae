import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { motion, AnimatePresence } from "motion/react";

const SOUNDS = {
  ambient: "https://assets.mixkit.co/music/preview/mixkit-ethereal-meditation-151.mp3",
  wind: "https://assets.mixkit.co/sfx/preview/mixkit-wind-howling-at-night-1160.mp3",
  chime: "https://assets.mixkit.co/sfx/preview/mixkit-magic-sparkle-chime-2831.mp3"
};

export default function Soundscape() {
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const ambientRef = useRef<Howl | null>(null);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      setIsMuted(false);
      window.removeEventListener("click", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    
    ambientRef.current = new Howl({
      src: [SOUNDS.ambient],
      loop: true,
      volume: 0.3
    });

    return () => {
      window.removeEventListener("click", handleInteraction);
      ambientRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!isMuted && hasInteracted) {
      ambientRef.current?.play();
      ambientRef.current?.fade(0, 0.3, 2000);
    } else {
      ambientRef.current?.fade(0.3, 0, 1000);
      setTimeout(() => ambientRef.current?.pause(), 1000);
    }
  }, [isMuted, hasInteracted]);

  const toggleMute = () => {
    if (!hasInteracted) setHasInteracted(true);
    setIsMuted(!isMuted);
  };

  return null;
}
