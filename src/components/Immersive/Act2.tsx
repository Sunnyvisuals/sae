"use client";

import { useAppCopy } from "../../hooks/useAppCopy";
import { PARCHEMIN_STATIC_QUERY } from "../../lib/parcheminAssetVersion";

type Props = {
  /** Ouvre l’acte III dans la SPA parente (même URL), sans naviguer vers `/act3`. */
  onOpenActIII?: () => void;
};

/**
 * Acte II - frise parchemin Jean Sénac (page statique /public/parchemin-senac.html).
 * Utilise BASE_URL pour que le déploiement sous sous-chemin charge bien la page (évite iframe vide).
 */
export default function Act2({ onOpenActIII }: Props) {
  const copy = useAppCopy();
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const parcheminSrc = `${prefix}parchemin-senac.html?${PARCHEMIN_STATIC_QUERY}`;

  return (
    <div className="absolute inset-0 min-h-0 w-full overflow-hidden bg-da-depth-night">
      <iframe
        title={copy.act2IframeTitle}
        src={parcheminSrc}
        className="absolute inset-0 z-0 block h-[calc(100%+8px)] min-h-0 w-full border-0 outline-none ring-0 [transform:translateZ(0)]"
        loading="eager"
      />

      <div
        className={
          "pointer-events-none absolute inset-x-0 top-0 z-[5] flex justify-end px-[max(0.75rem,calc(env(safe-area-inset-right)+0.35rem))] pt-[max(0.6rem,calc(env(safe-area-inset-top)+0.35rem))]"
        }
      >
        <button
          type="button"
          aria-label={copy.act2NavigateActIIIAria}
          onClick={() => onOpenActIII?.()}
          className={
            "pointer-events-auto rounded-[2px] border border-[rgba(139,213,255,0.35)] bg-[rgba(4,14,38,0.58)] px-3 py-2 backdrop-blur-sm transition-[border-color,background-color,box-shadow,color] hover:border-[rgba(180,228,255,0.55)] hover:bg-[rgba(8,26,62,0.62)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(148,206,255,0.42)] md:px-[0.95rem]"
          }
        >
          <span className="block font-sans text-[9px] font-medium uppercase tracking-[0.38em] text-[rgba(230,244,252,0.78)] md:text-[10px]">
            {copy.act2NavigateActIII}
          </span>
        </button>
      </div>
    </div>
  );
}
