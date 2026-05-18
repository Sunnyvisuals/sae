import { useLayoutEffect, useRef, type RefObject } from "react";
import { attachIntroVideoMedia } from "../lib/introVideoMedia";

/** Monte la source prologue (MP4 ou HLS) sur un `<video>` quand `enabled`. */
export function useIntroVideoAttach(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  enabled: boolean,
  crossOrigin = false,
  onReady?: (video: HTMLVideoElement) => void,
): void {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = videoRef.current;
    if (!el) return;
    return attachIntroVideoMedia(el, src, {
      crossOrigin,
      onReady: (video) => onReadyRef.current?.(video),
    });
  }, [enabled, src, crossOrigin, videoRef]);
}
