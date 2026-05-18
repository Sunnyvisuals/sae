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

function attachMp4(
  video: HTMLVideoElement,
  src: string,
  crossOrigin: boolean,
  onReady: IntroVideoAttachOptions["onReady"],
): () => void {
  if (crossOrigin) {
    video.crossOrigin = "anonymous";
  } else {
    video.removeAttribute("crossorigin");
  }
  video.src = src;
  whenCanPlay(video, onReady);
  return () => {
    video.removeAttribute("src");
    video.load();
  };
}

function attachHls(
  video: HTMLVideoElement,
  src: string,
  crossOrigin: boolean,
  onReady: IntroVideoAttachOptions["onReady"],
): () => void {
  let cancelled = false;
  let cleanupMp4: (() => void) | null = null;
  let destroyHls: (() => void) | null = null;

  const finish = () => {
    destroyHls?.();
    destroyHls = null;
    cleanupMp4?.();
    cleanupMp4 = null;
    video.removeAttribute("src");
    video.load();
  };

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    cleanupMp4 = attachMp4(video, src, crossOrigin, onReady);
    return () => {
      cancelled = true;
      cleanupMp4?.();
    };
  }

  void import("hls.js")
    .then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        cleanupMp4 = attachMp4(video, src, crossOrigin, onReady);
        return;
      }

      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });

      const tryMp4Fallback = () => {
        const mp4 = PROLOGUE_CDN_URL;
        if (!mp4 || isIntroVideoHlsSrc(mp4) || src === mp4) return false;
        hls.destroy();
        destroyHls = null;
        cleanupMp4 = attachMp4(video, mp4, crossOrigin, onReady);
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
      destroyHls = () => hls.destroy();
    })
    .catch((err) => {
      console.error("[intro-video] hls.js:", err);
      if (!cancelled) {
        cleanupMp4 = attachMp4(video, PROLOGUE_CDN_URL || src, crossOrigin, onReady);
      }
    });

  return () => {
    cancelled = true;
    finish();
  };
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

  if (!src?.trim()) {
    console.error("[intro-video] source vide");
    return () => {};
  }

  if (isIntroVideoHlsSrc(src)) {
    return attachHls(video, src, crossOrigin, onReady);
  }

  return attachMp4(video, src, crossOrigin, onReady);
}

export { PROLOGUE_CDN_HLS_URL };
