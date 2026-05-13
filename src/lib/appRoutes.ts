import { patchActSave } from "./actSave";

/** Après lecture Acte III : rouvrir le parchemin (phase acte II) à la même URL. */
export const SESSION_RESUME_ACT2 = "al-rihla-resume-act2";
/** Au retour acte II : ouvrir l’overlay crédits Voyage. */
export const SESSION_OPEN_VOYAGE_CREDITS = "al-rihla-open-voyage-credits";
/**
 * Parchemin ouvert en page seule : redirige vers la racine SPA, puis première mesure monte acte III.
 * (Synchroniser la chaîne avec `public/parchemin-senac.js`.)
 */
export const SESSION_BOOTSTRAP_ACTIII = "al-rihla-bootstrap-act3";

function baseDirUrl(): string {
  const b = import.meta.env.BASE_URL || "/";
  return b.endsWith("/") ? b : `${b}/`;
}

/** Racine SPA (dossier de `index.html`). */
export function mainSpaPathHref(): string {
  const u = new URL(".", `${window.location.origin}${baseDirUrl()}`);
  let pathname = u.pathname.replace(/\/+/g, "/");
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  return pathname || "/";
}

function normalizePathSansBase(pathname: string): string {
  let raw = pathname.replace(/\/{2,}/g, "/") || "/";
  const baseNorm = import.meta.env.BASE_URL.replace(/\/?$/, "");
  let rest = raw;
  if (baseNorm && baseNorm !== "/" && rest.startsWith(baseNorm)) {
    rest = rest.slice(baseNorm.length) || "/";
  }
  if (!rest.startsWith("/")) rest = `/${rest}`;
  if (rest.length > 1 && rest.endsWith("/")) rest = rest.slice(0, -1);
  return rest || "/";
}

/** Ancien lien `/act3` (bookmark / partage). */
export function pathnameIsActIII(): boolean {
  if (typeof window === "undefined") return false;
  return normalizePathSansBase(window.location.pathname) === "/act3";
}

/**
 * Réécrit `/…/act3` vers la même racine SPA que le reste du voyage.
 * Une fois préparé (`legacyActIIIUrlRewritePending`), l’entrée doit aller à la phase « acte III »
 * jusqu’à consommation (reset au montage de l’app) — évite le double-invoke StrictMode qui perdrait l’entrée après `replaceState`.
 */
let legacyActIIIUrlRewritePending = false;

/**
 * À appeler à chaque restauration d’historique : si la barre URL pointe encore vers `/act3`, prépare réécriture + phase III.
 */
export function canonicalizeLegacyActIIIUrlIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  if (!pathnameIsActIII()) return false;
  legacyActIIIUrlRewritePending = true;
  const path = mainSpaPathHref();
  const target = `${path}${window.location.search}${window.location.hash}`;
  try {
    window.history.replaceState(window.history.state ?? null, "", target || "/");
  } catch {
    /* ignore */
  }
  return true;
}

/** Fin du tout premier rendu SPA : après acte III entamé depuis l’URL legacy ou non. */
export function clearLegacyActIIIRewriteBootstrap(): void {
  legacyActIIIUrlRewritePending = false;
}

export function peekLegacyActIIIRewritePending(): boolean {
  return legacyActIIIUrlRewritePending;
}

/**
 * Étapes communes avant d’afficher l’acte III dans la SPA (même URL).
 * `resumeAct2` pose le drapeau session pour retrouver le parchemin après l’écriture.
 */
export function prepareActIIIEntry(options?: { resumeAct2?: boolean }): void {
  if (options?.resumeAct2) {
    try {
      sessionStorage.setItem(SESSION_RESUME_ACT2, "1");
    } catch {
      /* ignore */
    }
  }
  try {
    patchActSave((s) => ({ ...s, act3Unlocked: true }));
  } catch {
    /* ignore */
  }
}
