/**
 * Acte II - frise parchemin Jean Sénac (page statique /public/parchemin-senac.html).
 * Utilise BASE_URL pour que le déploiement sous sous-chemin charge bien la page (évite iframe vide).
 */
export default function Act2() {
  /** Jamais préfixer par "" — sinon `// fichier` devient une URL scheme-relative cassée (iframe blanche). */
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const parcheminSrc = `${prefix}parchemin-senac.html`;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#120e0a]">
      <iframe
        title="Jean Sénac - frise narrative"
        src={parcheminSrc}
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
      />
    </div>
  );
}
