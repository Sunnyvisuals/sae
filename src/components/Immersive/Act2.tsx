"use client";

import { useAppCopy } from "../../hooks/useAppCopy";
import { PARCHEMIN_STATIC_QUERY } from "../../lib/parcheminAssetVersion";

/**
 * Acte II - frise parchemin Jean Sénac (page statique /public/parchemin-senac.html).
 * Utilise BASE_URL pour que le déploiement sous sous-chemin charge bien la page (évite iframe vide).
 */
export default function Act2() {
  const copy = useAppCopy();
  /** Jamais préfixer par "" - sinon `// fichier` devient une URL scheme-relative cassée (iframe blanche). */
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const parcheminSrc = `${prefix}parchemin-senac.html?${PARCHEMIN_STATIC_QUERY}`;

  /**
   * `absolute inset-0` aligné sur le parent `fixed inset-0` : évite `max(dvh,lvh)` plus haut que la chaîne
   * `h-dvh` (Lenis/main) → débordement visible en 2–3 bandes horizontales au scroll.
   * Iframe légèrement plus haute + clip sur le wrapper pour masquer la couture GPU.
   */
  return (
    <div className="absolute inset-0 min-h-0 w-full overflow-hidden bg-[#05080f]">
      <iframe
        title={copy.act2IframeTitle}
        src={parcheminSrc}
        className="absolute left-0 right-0 top-0 block h-[calc(100%+8px)] w-full border-0 outline-none ring-0 [transform:translateZ(0)]"
        loading="eager"
      />
    </div>
  );
}
