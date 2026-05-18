import { useLayoutEffect, type RefObject } from "react";
import { attachIntroVideoMedia } from "../lib/introVideoMedia";

/** Monte la source prologue (MP4 ou HLS) sur un `<video>` quand `enabled`. */
export function useIntroVideoAttach(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  enabled: boolean,
  crossOrigin = false,
  onReady?: (video: HTMLVideoElement) => void,
): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const el = videoRef.current;
    if (!el) return;
    return attachIntroVideoMedia(el, src, { crossOrigin, onReady });
  }, [enabled, src, crossOrigin, onReady, videoRef]);
}
