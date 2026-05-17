import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { INTRO_VIDEO_SRC } from "../../lib/act1IntroBridge";
import {
  creditsHeroFriseFromImmersion,
  creditsVideoFilter,
} from "../../lib/voyageCreditsDa";
import { attachSenacAmbientFog } from "../../lib/senacAmbientFog";
import { attachSenacAmbientSky } from "../../lib/senacAmbientSky";
import { attachSenacSmokeShader } from "../../lib/senacSmokeShader";
import { initSenacArchScene } from "../../lib/parchemin-arch-scene.mjs";

type Props = {
  fromAct3Finale: boolean;
  reduceMotion: boolean;
  creditsProgressRef: MutableRefObject<number>;
  immersion: number;
};

const MODEL_URL = `${import.meta.env.BASE_URL}models/model.glb`;

/** Vidéo floutée, ciel, brume, fumée shader, arche 3D - comme `.voyage-credits` sur le parchemin. */
export default function VoyageCreditsAmbient({
  fromAct3Finale,
  reduceMotion,
  creditsProgressRef,
  immersion,
}: Props) {
  const skyRef = useRef<HTMLCanvasElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  const smokeMountRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const archApiRef = useRef<{ sync: () => void; dispose: () => void } | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const immersionRef = useRef(immersion);
  immersionRef.current = immersion;
  const getImmersion = () => immersionRef.current;
  const getScrollY = () => creditsProgressRef.current * 4200;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    void video.play().catch(() => {});
    return () => {
      video.pause();
    };
  }, [reduceMotion]);

  useEffect(() => {
    const sky = skyRef.current;
    const fog = fogRef.current;
    if (!sky || !fog) return;

    const skyDispose = attachSenacAmbientSky(sky, {
      reducedMotion: reduceMotion,
      getImmersion,
      getScrollY,
    });
    const fogDispose = attachSenacAmbientFog(fog, {
      reducedMotion: reduceMotion,
      getImmersion,
      getScrollY,
    });

    return () => {
      skyDispose();
      fogDispose();
    };
  }, [reduceMotion, creditsProgressRef]);

  useEffect(() => {
    const mount = smokeMountRef.current;
    if (!mount || reduceMotion) return;

    let disposeSmoke = () => {};
    let cancelled = false;

    void attachSenacSmokeShader(mount, {
      getScroll01: () => creditsProgressRef.current,
      getHeroT: () => creditsHeroFriseFromImmersion(immersionRef.current).heroT,
      getFriseT: () => creditsHeroFriseFromImmersion(immersionRef.current).friseT,
    }).then((dispose) => {
      if (cancelled) {
        dispose();
        return;
      }
      disposeSmoke = dispose;
    });

    return () => {
      cancelled = true;
      disposeSmoke();
    };
  }, [reduceMotion, creditsProgressRef]);

  useEffect(() => {
    if (reduceMotion) return;
    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current = {
        x: e.clientX / Math.max(window.innerWidth, 1),
        y: 1 - e.clientY / Math.max(window.innerHeight, 1),
      };
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [reduceMotion]);

  useEffect(() => {
    const canvas = archRef.current;
    if (!canvas || reduceMotion) return;

    let cancelled = false;
    let raf = 0;

    void initSenacArchScene({
      canvas,
      reducedMotion: false,
      modelUrl: MODEL_URL,
      getScrollRatio: () => creditsProgressRef.current,
      getMouse01: () => mouseRef.current,
    }).then((api) => {
        if (cancelled) {
          api.dispose();
          return;
        }
        archApiRef.current = api;
        const tick = () => {
          archApiRef.current?.sync();
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.error("[voyage-credits] arch scene failed:", err);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      archApiRef.current?.dispose();
      archApiRef.current = null;
    };
  }, [reduceMotion, creditsProgressRef]);

  return (
    <>
      <CreditsVideoLayer
        reduceMotion={reduceMotion}
        videoRef={videoRef}
        immersion={immersion}
      />
      <CreditsParticlesLayer reduceMotion={reduceMotion} skyRef={skyRef} fogRef={fogRef} />
      {!reduceMotion ? (
        <canvas
          ref={archRef}
          className="pointer-events-none absolute inset-0 z-[2] block h-full w-full opacity-[0.48]"
          aria-hidden
        />
      ) : null}
      {!reduceMotion ? (
        <div
          ref={smokeMountRef}
          className="pointer-events-none absolute inset-0 z-[3] overflow-hidden mix-blend-screen [&_canvas]:block [&_canvas]:!h-full [&_canvas]:!w-full"
          aria-hidden
        />
      ) : null}
    </>
  );
}

function CreditsVideoLayer({
  reduceMotion,
  videoRef,
  immersion,
}: {
  reduceMotion: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  immersion: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-[-4%_-4%_0] z-0 overflow-hidden"
      aria-hidden
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-[50%_42%] opacity-[0.92]"
        style={{
          filter: creditsVideoFilter(immersion, reduceMotion),
        }}
        src={INTRO_VIDEO_SRC}
        preload="metadata"
        muted
        playsInline
        loop
        tabIndex={-1}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, rgba(255, 252, 245, 0.16) 0%, rgba(255, 252, 245, 0.04) 28%, transparent 52%)",
        }}
      />
    </div>
  );
}

function CreditsParticlesLayer({
  reduceMotion,
  skyRef,
  fogRef,
}: {
  reduceMotion: boolean;
  skyRef: RefObject<HTMLCanvasElement | null>;
  fogRef: RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${reduceMotion ? "opacity-60" : "opacity-[0.88]"}`}
      aria-hidden
    >
      <canvas ref={skyRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" />
      <canvas
        ref={fogRef}
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full mix-blend-soft-light opacity-[0.86]"
      />
    </div>
  );
}
