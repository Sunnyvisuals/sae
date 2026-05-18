import { PROLOGUE_CDN_HLS_URL, PROLOGUE_CDN_URL } from "./prologueCdn";

export function isIntroVideoHlsSrc(src: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(src);
}

export type IntroVideoAttachOptions = {
  /** Laisser false pour Bunny (Referer). */
  crossOrigin?: boolean;
  onReady?: (video: HTMLVideoElement) => void;
  onError?: (video: HTMLVideoElement) => void;
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
  onError: IntroVideoAttachOptions["onError"],
): () => void {
  if (crossOrigin) {
    video.crossOrigin = "anonymous";
  } else {
    video.removeAttribute("crossorigin");
  }

  const onErr = () => onError?.(video);
  video.addEventListener("error", onErr);

  video.src = src;
  video.load();
  whenCanPlay(video, onReady);

  return () => {
    video.removeEventListener("error", onErr);
    video.removeAttribute("src");
    video.load();
  };
}

function attachHls(
  video: HTMLVideoElement,
  src: string,
  crossOrigin: boolean,
  onReady: IntroVideoAttachOptions["onReady"],
  onError: IntroVideoAttachOptions["onError"],
): () => void {
  let cancelled = false;
  let cleanup: (() => void) | null = null;

  const finish = () => {
    cleanup?.();
    cleanup = null;
  };

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    cleanup = attachMp4(video, src, crossOrigin, onReady, onError);
    return () => {
      cancelled = true;
      finish();
    };
  }

  void import("hls.js")
    .then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        cleanup = attachMp4(video, PROLOGUE_CDN_URL, false, onReady, onError);
        return;
      }

      const hls = new Hls({ enableWorker: true });

      const tryMp4 = () => {
        if (!PROLOGUE_CDN_URL || src === PROLOGUE_CDN_URL) return false;
        hls.destroy();
        cleanup = attachMp4(video, PROLOGUE_CDN_URL, false, onReady, onError);
        return true;
      };

      hls.on(Hls.Events.MANIFEST_PARSED, () => whenCanPlay(video, onReady));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal && !tryMp4()) onError?.(video);
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      cleanup = () => {
        hls.destroy();
        video.removeAttribute("src");
        video.load();
      };
    })
    .catch(() => {
      if (!cancelled) {
        cleanup = attachMp4(video, PROLOGUE_CDN_URL, false, onReady, onError);
      }
    });

  return () => {
    cancelled = true;
    finish();
  };
}

/** Branche MP4 ou HLS sur `<video>`. */
export function attachIntroVideoMedia(
  video: HTMLVideoElement,
  src: string,
  options: IntroVideoAttachOptions | boolean = false,
): () => void {
  const opts: IntroVideoAttachOptions =
    typeof options === "boolean" ? { crossOrigin: options } : options;
  const { crossOrigin = false, onReady, onError } = opts;

  if (!src?.trim()) {
    console.error("[intro-video] source vide");
    return () => {};
  }

  if (isIntroVideoHlsSrc(src)) {
    return attachHls(video, src, crossOrigin, onReady, onError);
  }

  return attachMp4(video, src, crossOrigin, onReady, onError);
}

export { PROLOGUE_CDN_HLS_URL };
