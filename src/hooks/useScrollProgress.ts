import { useEffect, useRef, useState } from 'react';

export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const ratio = entry.intersectionRatio;
        setProgress(ratio);
      },
      { threshold: Array.from({ length: 101 }, (_, i) => i / 100) }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);

  return progress;
}
