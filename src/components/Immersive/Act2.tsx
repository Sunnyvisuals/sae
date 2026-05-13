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
   *
   * Bande inférieure réservée pour un futur arrière-plan personnalisé (ex. dune, ciel, animation).
   * - Hauteur : 18vh (~1/5 écran). Ajuste via les variables ci-dessous si besoin.
   * - L'iframe s'arrête juste au-dessus pour laisser la place visible et libre de contenu parchemin.
   */
  const bottomBackdropClass = "h-[18vh] sm:h-[20vh] md:h-[22vh]";
  const iframeBottomOffset = "bottom-[18vh] sm:bottom-[20vh] md:bottom-[22vh]";

  return (
    <div className="absolute inset-0 min-h-0 w-full overflow-hidden bg-[#05080f]">
      <iframe
        title={copy.act2IframeTitle}
        src={parcheminSrc}
        className={`absolute left-0 right-0 top-0 ${iframeBottomOffset} block w-full border-0 outline-none ring-0 [transform:translateZ(0)]`}
        loading="eager"
      />

      {/* Bande arrière-plan Acte II — espace libre pour ton décor custom (image / canvas / SVG / motion). */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 ${bottomBackdropClass} w-full bg-[#05080f]`}
        data-act2-backdrop="true"
      >
        {/* TODO Acte II : insérer ici l'arrière-plan custom (image plein cadre, canvas, particules…). */}
      </div>
    </div>
  );
}
