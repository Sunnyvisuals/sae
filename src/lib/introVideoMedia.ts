import Hls from "hls.js";

export function isIntroVideoHlsSrc(src: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(src);
}

/** Branche MP4 ou HLS (Bunny Stream) sur un élément `<video>`. Retourne un cleanup. */
export function attachIntroVideoMedia(
  video: HTMLVideoElement,
  src: string,
  crossOrigin = false,
): () => void {
  if (crossOrigin) {
    video.crossOrigin = "anonymous";
  }

  if (!isIntroVideoHlsSrc(src)) {
    video.src = src;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }

  if (!Hls.isSupported()) {
    video.src = src;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }

  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: false,
  });
  hls.loadSource(src);
  hls.attachMedia(video);

  return () => {
    hls.destroy();
    video.removeAttribute("src");
    video.load();
  };
}
