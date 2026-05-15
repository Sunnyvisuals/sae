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
        className="absolute inset-0 z-0 block h-full min-h-0 w-full border-0 bg-[#05080f] outline-none ring-0 [transform:translateZ(0)]"
        loading="eager"
      />
    </div>
  );
}
