"use client";

import SplashCursor from "../SplashCursor";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAppCopy } from "../../hooks/useAppCopy";
import { PARCHEMIN_STATIC_QUERY } from "../../lib/parcheminAssetVersion";

type Act2Props = {
  /** 0–1 depuis postMessage parchemin — anime le fluide même sans scroll fenêtre. */
  iframeScrollRatio?: number;
  /** Masque le WebGL (menu pause, crédits iframe, morph langue, etc.). */
  suppressFluid?: boolean;
};

/**
 * Acte II - frise parchemin Jean Sénac (page statique /public/parchemin-senac.html).
 * Utilise BASE_URL pour que le déploiement sous sous-chemin charge bien la page (évite iframe vide).
 */
export default function Act2({
  iframeScrollRatio,
  suppressFluid = false,
}: Act2Props) {
  const copy = useAppCopy();
  /** Jamais préfixer par "" - sinon `// fichier` devient une URL scheme-relative cassée (iframe blanche). */
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const parcheminSrc = `${prefix}parchemin-senac.html?${PARCHEMIN_STATIC_QUERY}`;
  const finePointer = useMediaQuery("(any-pointer: fine)");

  /**
   * Iframe en pleine hauteur (`inset-0` + léger dépassement bas) : le document parchemin utilise
   * `position:fixed` / repères `vh` — réduire la hauteur CSS de l’iframe cassait le centrage (titre
   * coupé en haut, grand vide en bas).
   *
   * La zone pour ton futur décor est un calque **au-dessus** du bas du parchemin (`pointer-events-none`
   * pour laisser passer les clics vers l’iframe si besoin).
   */
  const bottomBackdropClass =
    "h-[min(14vh,10rem)] sm:h-[min(16vh,11.5rem)] md:h-[min(18vh,13rem)]";

  return (
    <div className="absolute inset-0 min-h-0 w-full overflow-hidden bg-[#05080f]">
      <iframe
        title={copy.act2IframeTitle}
        src={parcheminSrc}
        className="absolute inset-0 z-0 block h-[calc(100%+8px)] w-full border-0 outline-none ring-0 [transform:translateZ(0)]"
        loading="eager"
      />

      {finePointer && !suppressFluid ? (
        <SplashCursor
          layer="background"
          fillContainer
          syncPaletteFromAmbient
          iframeScrollRatio={iframeScrollRatio}
          scrollImpulse={1.12}
          zIndex={1}
          SIM_RESOLUTION={128}
          DYE_RESOLUTION={512}
          DENSITY_DISSIPATION={10}
          VELOCITY_DISSIPATION={5}
          PRESSURE={0.1}
          CURL={10}
          SPLAT_RADIUS={0.05}
          SPLAT_FORCE={11000}
          COLOR_UPDATE_SPEED={10}
          ambientOpacity={0.38}
        />
      ) : null}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[2] w-full bg-[#05080f] ${bottomBackdropClass}`}
        data-act2-backdrop="true"
      >
        {/* TODO Acte II : décor custom (dunes, ciel, canvas…) — même largeur que la vue ; masque le bas du scroll. */}
      </div>
    </div>
  );
}
