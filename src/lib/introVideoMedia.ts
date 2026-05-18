import Hls from "hls.js";
import { PROLOGUE_CDN_HLS_URL, PROLOGUE_CDN_URL } from "./prologueCdn";

export function isIntroVideoHlsSrc(src: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(src);
}

export type IntroVideoAttachOptions = {
  crossOrigin?: boolean;
  /** Appelé quand la première image est prête (canplay / manifest HLS). */
  onReady?: (video: HTMLVideoElement) => void;
};

function whenCanPlay(
  video: HTMLVideoElement,
  onReady: IntroVideoAttachOptions["onReady"],
): void {
  if (!onReady) return;
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    onReady(video);
    return;
  }
  const fire = () => {
    video.removeEventListener("loadeddata", fire);
    video.removeEventListener("canplay", fire);
    onReady(video);
  };
  video.addEventListener("loadeddata", fire, { once: true });
  video.addEventListener("canplay", fire, { once: true });
}

/** Branche MP4 ou HLS (Bunny Stream) sur un `<video>`. Retourne un cleanup. */
export function attachIntroVideoMedia(
  video: HTMLVideoElement,
  src: string,
  options: IntroVideoAttachOptions | boolean = false,
): () => void {
  const opts: IntroVideoAttachOptions =
    typeof options === "boolean" ? { crossOrigin: options } : options;
  const { crossOrigin = false, onReady } = opts;

  if (crossOrigin) {
    video.crossOrigin = "anonymous";
  } else {
    video.removeAttribute("crossorigin");
  }

  const detachMp4 = () => {
    video.removeAttribute("src");
    video.load();
  };

  if (!isIntroVideoHlsSrc(src)) {
    video.src = src;
    whenCanPlay(video, onReady);
    return detachMp4;
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
    whenCanPlay(video, onReady);
    return detachMp4;
  }

  if (!Hls.isSupported()) {
    video.src = src;
    whenCanPlay(video, onReady);
    return detachMp4;
  }

  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: false,
  });

  const tryMp4Fallback = () => {
    const mp4 = PROLOGUE_CDN_URL;
    if (!mp4 || isIntroVideoHlsSrc(mp4) || src === mp4) return false;
    hls.destroy();
    video.src = mp4;
    whenCanPlay(video, onReady);
    return true;
  };

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    whenCanPlay(video, onReady);
  });

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data.fatal) return;
    if (tryMp4Fallback()) return;
    console.error("[intro-video] HLS fatal:", data.type, data.details);
  });

  hls.loadSource(src);
  hls.attachMedia(video);

  return () => {
    hls.destroy();
    detachMp4();
  };
}
