/**
 * Chapitre II - ciel étoilé, Lenis, révélations, transition Chapitre III.
 */
(function () {
  const root = document.documentElement;
  if (window.parent !== window) {
    root.classList.add("senac-in-iframe");
  }
  /** Dans la SPA : pas de barre de progression (elle était relayée au parent et grossissait au scroll). */
  const suppressScrollProgressChrome = window.parent !== window;
  if (suppressScrollProgressChrome) {
    document.getElementById("senac-scroll-progress")?.remove();
  }

  /** SPA : le parent n’écoute pas la molette dans l’iframe — masquer le repère « Molette · vers le bas ». */
  let senacParentScrollNotified = false;
  function notifySenacParentUserScrolled() {
    if (!suppressScrollProgressChrome || senacParentScrollNotified) return;
    senacParentScrollNotified = true;
    try {
      window.parent.postMessage({ type: "senac-user-scrolled" }, window.location.origin);
    } catch {
      /* ignore */
    }
  }

  /**
   * SPA : le parent ne reçoit pas `pointermove` quand le pointeur est dans l’iframe → CustomCursor / SplashCursor
   * restent figés ou passent en idle. On relaie les coords (viewport iframe = clientX/Y) ; le parent translate
   * avec getBoundingClientRect() de l’iframe.
   */
  if (suppressScrollProgressChrome) {
    const origin = window.location.origin;
    let senacPointerRaf = 0;
    let pendingX = 0;
    let pendingY = 0;
    function flushSenacPointer() {
      senacPointerRaf = 0;
      try {
        window.parent.postMessage({ type: "senac-pointer", clientX: pendingX, clientY: pendingY }, origin);
      } catch (_) {
        /* ignore */
      }
    }
    document.addEventListener(
      "pointermove",
      function (/** @type {PointerEvent} */ e) {
        pendingX = e.clientX;
        pendingY = e.clientY;
        if (!senacPointerRaf) {
          senacPointerRaf = window.requestAnimationFrame(flushSenacPointer);
        }
      },
      { passive: true }
    );
    document.addEventListener(
      "pointerdown",
      function (/** @type {PointerEvent} */ e) {
        try {
          window.parent.postMessage(
            { type: "senac-pointer", clientX: e.clientX, clientY: e.clientY, down: true },
            origin
          );
        } catch (_) {
          /* ignore */
        }
      },
      { passive: true }
    );
  }

  /** Racine SPA (`index.html`), même dossier que `parchemin-senac.html` (`new URL(".", …)`). */
  function spaRootHref() {
    try {
      const path = window.location.pathname.replace(/\\/g, "/");
      const slash = path.lastIndexOf("/");
      const dir = slash >= 0 ? path.slice(0, slash + 1) : "/";
      const u = new URL(".", window.location.origin + dir);
      let pathname = u.pathname.replace(/\/+/g, "/");
      if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
      const qs = window.location.search || "";
      return `${window.location.origin}${pathname || "/"}${qs}`;
    } catch (_) {
      try {
        return `${window.location.origin}/`;
      } catch {
        return "/";
      }
    }
  }

  /**
   * Parchemin en page pleine → recharger la racine SPA (même lien que le voyage) puis monter l’acte III.
   * Clé synchronisée avec `SESSION_BOOTSTRAP_ACTIII` dans `src/lib/appRoutes.ts`.
   */
  function bootstrapSpaActIIIEntry(opts) {
    const replace = Boolean(opts && opts.replace);
    try {
      sessionStorage.setItem("al-rihla-bootstrap-act3", "1");
    } catch (_) {
      /* ignore */
    }
    const href = spaRootHref();
    try {
      if (replace) window.location.replace(href);
      else window.location.assign(href);
    } catch (_) {
      window.location.href = href;
    }
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Pause les RAF ambiance (ciel / brume / temporal) quand l’onglet est masqué. */
  let senacAmbientPaused = document.hidden;
  document.addEventListener(
    "visibilitychange",
    () => {
      senacAmbientPaused = document.hidden;
    },
    { passive: true },
  );

  function markSenacBootReady() {
    root.classList.remove("senac-booting");
    root.classList.add("senac-boot-ready");
    if (window.parent !== window) {
      try {
        window.parent.postMessage({ type: "senac-parchemin-ready" }, window.location.origin);
      } catch (_) {
        /* ignore */
      }
    }
  }
  /** Ambiance locale chapitre II (copiée dans /public). */
  const SENAC_AMBIENCE_SRC_PUBLIC = "/Emotional%20Arabian%20Oud.mp3";
  /** Pavé tactile / souris : Ctrl+molette (ou meta) ne doit pas zoomer tout le navigateur - garde le défilement Lenis. */
  document.addEventListener(
    "wheel",
    function (/** @type {WheelEvent} */ e) {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false, capture: true }
  );
  /** Safari (macOS) : pincement = zoom page ; on neutralise pour rester en scroll vertical. */
  document.addEventListener(
    "gesturestart",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  function setRevealStagger() {
    document.querySelectorAll("[data-reveal]").forEach((el, index) => {
      const i = Math.max(0, index);
      const base = Math.min(26 + i * 22, 520);
      const pulse = Math.round(Math.sin(i * 0.85) * 8); // micro-variation organique
      el.style.setProperty("--stagger", String(Math.max(0, base + pulse)));
    });
  }

  const friseEl = document.getElementById("timeline-start");
  /** Lenis (scroll lissé) ; null si indisponible (reduced-motion ou échec import). */
  let yearGaugeLenis = null;
  /** Précharge Lenis tôt (évite d’attendre la fin du boot avant la molette). */
  let senacLenisInitPromise = /** @type {Promise<boolean> | null} */ (null);
  let senacLenisWheelSnapTimer = 0;
  /** @type {((time: number) => void) | null} */
  let senacLenisGsapTickerFn = null;
  /** @type {(() => void) | null} */
  let senacLenisFallbackRafCancel = null;
  let yearGaugeGsap = null;

  /** Scrub ScrollTrigger (s) : plus bas = molette plus réactive (exploration). */
  const SENAC_SCRUB_PIN_CARD = 0.4;
  const SENAC_SCRUB_PIN_CHAMBER = 0.46;
  const SENAC_SCRUB_PIN_RELIC = 0.4;
  /** Ré-appel depuis initLenis : figer scroll si le overlay de choix est encore là. */
  let senacFreezeLenisForChoiceOverlay = /** @type {(() => void) | null} */ (null);

  /** Dernier mode chrome parent (réduit les postMessage lors du scroll). */
  let lastPostedSenacChromeMode = /** @type {"solar" | "midnight" | null} */ (null);
  /** Aligne le seuil avec l’« immersion » (--hero-t + --frise-t × 0.42, cf. `--immersive-shift` en CSS). */
  const SENAC_CHROME_IMMERSIVE_TO_MIDNIGHT = 0.46;

  function postSenacChromeModeFromHeroFrise(heroT, friseT) {
    const hn = typeof heroT === "number" && Number.isFinite(heroT) ? Math.min(1, Math.max(0, heroT)) : 0;
    const fn = typeof friseT === "number" && Number.isFinite(friseT) ? Math.min(1, Math.max(0, friseT)) : 0;
    const shift = Math.min(1, Math.max(0, hn + fn * 0.42));
    const mode = shift >= SENAC_CHROME_IMMERSIVE_TO_MIDNIGHT ? "midnight" : "solar";
    if (mode === lastPostedSenacChromeMode) return;
    lastPostedSenacChromeMode = mode;
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "senac-chrome", mode }, window.location.origin);
      }
    } catch (_) {
      /* ignore */
    }
  }


  /**
   * Coller au repère utilisé par Lenis (`scrollHeight - clientHeight` sur `html`, pas `innerHeight`)
   * pour éviter un écart vite / scrollbar / arche. Compare aussi `body` si plus haut que `documentElement`.
   */
  function getScrollMax() {
    const root = document.documentElement;
    const body = document.body;
    const scrollH = Math.max(root.scrollHeight, body ? body.scrollHeight : 0);
    const viewH = Math.max(1, root.clientHeight || window.innerHeight || 1);
    return Math.max(1, scrollH - viewH);
  }

  /** Après inertia Lenis ou si limit pas rafraîchi : petite correction vers le bas réel du document. */
  function snapLenisNearBottomAfterIdle() {
    const lx = yearGaugeLenis;
    if (!lx || typeof lx.resize !== "function" || typeof lx.scrollTo !== "function") return;
    lx.resize();
    const domMax = getScrollMax();
    const lim =
      typeof lx.limit === "number" && Number.isFinite(lx.limit) ? lx.limit : domMax;
    const target = Math.max(domMax, lim);
    const gap = target - lx.scroll;
    if (gap > 0.35 && gap <= 40) {
      lx.scrollTo(target, { immediate: true });
      applyScrollDerivedState(lx.scroll);
    }
  }

  function scheduleSenacLenisWheelEndSnap() {
    if (!yearGaugeLenis) return;
    if (senacScrollEntryMode === "cinema") return;
    window.clearTimeout(senacLenisWheelSnapTimer);
    senacLenisWheelSnapTimer = window.setTimeout(() => {
      senacLenisWheelSnapTimer = 0;
      const lx = yearGaugeLenis;
      if (lx && typeof lx.isScrolling === "boolean" && lx.isScrolling) return;
      snapLenisNearBottomAfterIdle();
    }, 260);
  }

  /**
   * Un seul moteur RAF : GSAP ticker si dispo (sync ScrollTrigger), sinon requestAnimationFrame.
   * @param {import('lenis').default} lenis
   */
  function attachSenacLenisRaf(lenis) {
    if (senacLenisGsapTickerFn || senacLenisFallbackRafCancel) return;
    let rafId = 0;
    const loop = (/** @type {number} */ time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    senacLenisFallbackRafCancel = () => {
      cancelAnimationFrame(rafId);
      senacLenisFallbackRafCancel = null;
    };
  }

  /**
   * Ratio strict scrollY / max - aligné sur la barre native et la barre de progression (0 en haut, 1 en bas).
   * @param {number} scrollY
   */
  function senacScrollRatioVisual(scrollY) {
    const max = getScrollMax();
    if (max <= 0) return 1;
    const y = Math.min(max, Math.max(0, scrollY));
    return y / max;
  }

  /**
   * Epsilon bas de page : fin de parcours (navigation) si Lenis s’arrête à quelques px du max.
   */
  const SENAC_SCROLL_RATIO_BOTTOM_EPS_PX = 6;

  /** @param {number} scrollY */
  function senacScrollRatio(scrollY) {
    const max = getScrollMax();
    if (max <= 0) return 1;
    const y = Math.min(max, Math.max(0, scrollY));
    if (max - y <= SENAC_SCROLL_RATIO_BOTTOM_EPS_PX) return 1;
    return y / max;
  }

  function getScrollY() {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  /** Bandeau de progression en haut (scroll réel dans l’iframe parchemin). */
  let senacScrollFillEl = /** @type {HTMLElement | null} */ (null);
  /** États pour transition douce (pas de saut doré ↔ bleu au seuil fixe). */
  let senacBarNightBlendSmooth = /** @type {number | null} */ (null);
  let senacBarRatioSmooth = /** @type {number | null} */ (null);


  /** sRGB puis mélange - un lerp entre teintes HSL traverse le cercle (verts/cyan « fantômes »). */
  function rgbLerp(rgb1, rgb2, t) {
    const tt = Math.min(1, Math.max(0, t));
    return {
      r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * tt),
      g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * tt),
      b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * tt),
    };
  }

  function hslPctToRgb(hDeg, sp, lp) {
    const hh = ((((Number(hDeg) || 0) % 360) + 360) % 360);
    let s = Math.min(100, Math.max(0, sp)) / 100;
    let l = Math.min(100, Math.max(0, lp)) / 100;
    const kFn = (n) => ((n + hh / 30) % 12);
    const a = s * Math.min(l, 1 - l);
    const channel = (n) => l - a * Math.max(-1, Math.min(Math.min(kFn(n) - 3, 9 - kFn(n)), 1));
    return {
      r: Math.round(255 * channel(0)),
      g: Math.round(255 * channel(8)),
      b: Math.round(255 * channel(4)),
    };
  }

  /** @param {{ r: number; g: number; b: number }} rgb */
  function rgbToHsl(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const dl = max - min;
    const lMid = (max + min) / 2;
    if (dl < 1e-10) return { h: 0, s: 0, l: lMid * 100 };
    let h = 0;
    switch (max) {
      case r:
        h = ((g - b) / dl) % 6;
        break;
      case g:
        h = (b - r) / dl + 2;
        break;
      default:
        h = (r - g) / dl + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
    const s = dl / (1 - Math.abs(2 * lMid - 1));
    return { h, s: s * 100, l: lMid * 100 };
  }

  function rgbFmt(rgb) {
    return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  }

  /**
   * 0=en haut (discret) → 1=bas de page : barre plus saturée et glow plus lisible (profondeur de scroll).
   * @param {number} scroll01 Ratio scroll / max (~position verticale sur la page).
   */
  function scrollDepthEmphasis(scroll01) {
    const x = Math.min(1, Math.max(0, scroll01));
    return x * x * (3 - 2 * x);
  }

  /** 0=solar … 1=midnight avec rampe étalée sur l’axe immersion (sans marche à 0.46). */
  function scrollBarNightBlendFromShift(rawShift) {
    const e0 = 0.26;
    const e1 = 0.64;
    const x = Math.min(1, Math.max(0, (rawShift - e0) / (e1 - e0)));
    return x * x * (3 - 2 * x);
  }

  /**
   * Même logique stops que ScrollProgressBar : `uRaw` pour les teintes ; `emphasisScroll01` = ratio réel (accent).
   */
  function scrollBarSpectrum(uRaw, nightBlendSmooth, emphasisScroll01) {
    const u = Math.min(1, Math.max(0, uRaw));
    const nb = Math.min(1, Math.max(0, nightBlendSmooth));
    const emphasisSource =
      typeof emphasisScroll01 === "number"
        ? Math.min(1, Math.max(0, emphasisScroll01))
        : u;

    /** Ancres or / bleu (comme avant ton « trop orange ») - mélange toujours en sRGB. */
    let hSol = 36 + u * 18;
    let sSol = 48 + u * 12;
    let lSol = 48 - u * 10;
    let h2Sol = hSol - 8 + u * 6;
    const s2Sol = sSol + 6;
    const l2Sol = lSol - 6;

    let hMid = 198 + u * 22;
    let sMid = 52 + u * 14;
    let lMid = 54 + u * 10;
    let lMidA = lMid - 4;
    let lMidB = lMid + 4;
    let h2Mid = hMid + 12;
    let s2Mid = Math.min(72, sMid + 10);

    const r1Solar = hslPctToRgb(hSol, sSol, lSol);
    const r1Mid = hslPctToRgb(hMid, sMid, lMidA);
    const r2Solar = hslPctToRgb(h2Sol, s2Sol, l2Sol);
    const r2Mid = hslPctToRgb(h2Mid, s2Mid, lMidB);

    let rgbStop1 = rgbLerp(r1Solar, r1Mid, nb);
    let rgbStop2 = rgbLerp(r2Solar, r2Mid, nb);

    const e = scrollDepthEmphasis(emphasisSource);

    /** Emphase : comme avant mais sur RVB → HSL puis retour RVB pour garder trajet perceptif propre */
    let hsl1Post = rgbToHsl(rgbStop1);
    rgbStop1 = hslPctToRgb(
      hsl1Post.h,
      Math.min(76, Math.max(0, hsl1Post.s * (1 + e * 0.28))),
      Math.min(92, Math.max(17, hsl1Post.l - e * 4.2))
    );

    hsl1Post = rgbToHsl(rgbStop1);

    let hsl2Post = rgbToHsl(rgbStop2);
    let lStop2 = Math.min(94, Math.max(19, hsl2Post.l + e * 2.6));
    lStop2 = Math.min(94, Math.max(hsl1Post.l + 2, lStop2));
    rgbStop2 = hslPctToRgb(
      hsl2Post.h,
      Math.min(78, Math.max(0, hsl2Post.s * (1 + e * 0.24))),
      lStop2
    );

    const bg = `linear-gradient(90deg, ${rgbFmt(rgbStop1)} 0%, ${rgbFmt(rgbStop2)} 100%)`;

    const hslGlow = rgbToHsl(rgbLerp(rgbStop1, rgbStop2, 0.5));
    const g = hslGlow.h;
    const gSat = Math.min(80, Math.max(62, 64 + e * 12));
    const gLight = Math.min(60, Math.max(50, 55 + e * 5));
    const blurA = Math.round(6 + e * 16);
    const blurB = Math.round(16 + e * 28);
    const blurC = Math.round(28 + e * 36);
    const a1 = Math.min(0.52, 0.22 + e * 0.36);
    const a2 = Math.min(0.28, 0.08 + e * 0.22);
    const a3 = Math.min(0.14, 0.035 + e * 0.1);
    const aRim = Math.min(0.38, 0.14 + e * 0.26);

    const shadow =
      `0 0 ${blurA}px hsla(${g}, ${gSat}%, ${gLight}%, ${a1}), ` +
      `0 0 ${blurB}px hsla(${g}, ${Math.max(58, gSat - 6)}%, ${Math.max(48, gLight - 4)}%, ${a2}), ` +
      `0 0 ${blurC}px hsla(${g}, 58%, 52%, ${a3}), ` +
      `0 1px 0 hsla(${g}, 54%, ${50 + e * 4}%, ${aRim})`;

    return { bg, shadow };
  }

  let lastPostedScrollProgressRatio = -1;
  let lastPostedScrollProgressAt = 0;
  const SCROLL_PROGRESS_POST_MS = 120;

  function updateSenacScrollProgressFill() {
    let y = getScrollY();
    if (yearGaugeLenis && typeof yearGaugeLenis.scroll === "number") {
      y = yearGaugeLenis.scroll;
    }
    const ratioVisual = senacScrollRatioVisual(y);

    const ht = parseFloat(root.style.getPropertyValue("--hero-t").trim() || "0");
    const ft = parseFloat(root.style.getPropertyValue("--frise-t").trim() || "0");
    const shift = Math.min(1, Math.max(0, ht + ft * 0.42));
    const nightBlendTarget = scrollBarNightBlendFromShift(shift);
    const kk = reducedMotion ? 1 : 0.28;
    if (senacBarNightBlendSmooth === null || senacBarRatioSmooth === null) {
      senacBarNightBlendSmooth = nightBlendTarget;
      senacBarRatioSmooth = ratioVisual;
    } else {
      senacBarNightBlendSmooth += (nightBlendTarget - senacBarNightBlendSmooth) * kk;
      senacBarRatioSmooth += (ratioVisual - senacBarRatioSmooth) * kk;
    }

    const displayRatio = senacBarRatioSmooth;

    /** SPA : barre du haut = `ScrollProgressBar` parent (iframe ne rend plus #senac-scroll-progress). */
    if (window.parent !== window) {
      const delta = Math.abs(displayRatio - lastPostedScrollProgressRatio);
      if (delta > 0.0025) {
        const now = performance.now();
        if (delta < 0.02 && now - lastPostedScrollProgressAt < SCROLL_PROGRESS_POST_MS) {
          /* throttle léger : moins de setState React parent */
        } else {
          lastPostedScrollProgressRatio = displayRatio;
          lastPostedScrollProgressAt = now;
          try {
            window.parent.postMessage(
              { type: "senac-scroll-progress", ratio: displayRatio },
              window.location.origin,
            );
          } catch {
            /* ignore */
          }
        }
      }
    }

    /** Page parchemin seule : barre locale dans #senac-scroll-progress. */
    if (suppressScrollProgressChrome) return;

    if (!senacScrollFillEl) {
      const n = document.querySelector(".senac-scroll-progress__fill");
      senacScrollFillEl = n instanceof HTMLElement ? n : null;
    }
    if (!senacScrollFillEl) return;

    const uColor = senacBarRatioSmooth;
    const nb = senacBarNightBlendSmooth ?? 0;
    const { bg, shadow } = scrollBarSpectrum(uColor, nb, ratioVisual);

    senacScrollFillEl.style.width = `${displayRatio * 100}%`;
    senacScrollFillEl.style.background = bg;
    senacScrollFillEl.style.boxShadow = shadow;
  }

  /** Arche GLB pilotée par le scroll (voir `public/parchemin-arch-scene.mjs`). */
  let senacArchApi = /** @type {{ sync: () => void; dispose: () => void } | null} */ (null);
  let senacArchInitScheduled = false;

  function senacArchModelUrl() {
    const pathSeg = window.location.pathname.replace(/[^/]+$/, "");
    const base = pathSeg.endsWith("/") ? pathSeg : pathSeg + "/";
    return new URL("models/model.glb", window.location.origin + base).href;
  }
  let senacColorFluidStarted = false;

  function scheduleSenacArchScene() {
    if (senacArchInitScheduled) return;
    const canvas = document.getElementById("senac-arch-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    senacArchInitScheduled = true;
    import("./parchemin-arch-scene.mjs?v=53")
      .then((mod) =>
        mod.initSenacArchScene({
          canvas,
          reducedMotion,
          modelUrl: senacArchModelUrl(),
          getScrollRatio() {
            let y = getScrollY();
            if (yearGaugeLenis && typeof yearGaugeLenis.scroll === "number") {
              y = yearGaugeLenis.scroll;
            }
            return senacScrollRatioVisual(y);
          },
          getArchZoom01() {
            let y = getScrollY();
            if (yearGaugeLenis && typeof yearGaugeLenis.scroll === "number") {
              y = yearGaugeLenis.scroll;
            }
            return senacArchPortalZoom01(y);
          },
        }),
      )
      .then((api) => {
        senacArchApi = api;
        senacArchApi.sync();
      })
      .catch((err) => {
        console.error("[arch-scene] scheduleSenacArchScene failed:", err);
        senacArchInitScheduled = false;
      });
  }

  /**
   * Voile blanc : uniquement dans `.senac-arch-scroll-tail` (évite le « white bug » sur la frise).
   * 1er écran arche → début du fondu ; 2e écran brumeux → fondu terminé.
   */
  const ARCH_WHITEOUT_BEGIN_TAIL = 0.18;
  const ARCH_WHITEOUT_FULL_TAIL = 0.95;
  const ARCH_WHITEOUT_MAX_OPACITY = 0.86;
  /** Aucun voile avant la plage arche (fin de parchemin). */
  const ARCH_WHITEOUT_MIN_PAGE_RATIO = 0.87;
  /** Navigation Acte III : fin de la plage arche + bas de page. */
  const ARCH_WHITEOUT_NAV_TAIL = 0.94;
  const ARCH_WHITEOUT_TO_ACT3_RATIO = 0.992;

  /** Navigation Acte III déjà envoyée (le voile blanc reste piloté par le scroll). */
  let archWhiteoutNavTriggered = false;
  /** Parent SPA (crédits par-dessus acte III) : ne pas réappliquer le voile après hydrate scroll≈1. */
  let archWhiteoutSuppressed = false;
  const archWhiteoutEl = document.getElementById("senac-arch-whiteout");
  let archScrollTailEl = /** @type {HTMLElement | null} */ (null);
  if (archWhiteoutEl) {
    archWhiteoutEl.classList.remove("is-active");
    archWhiteoutEl.style.opacity = "0";
    archWhiteoutEl.style.visibility = "hidden";
  }

  function getArchScrollTailEl() {
    if (!archScrollTailEl || !archScrollTailEl.isConnected) {
      archScrollTailEl = document.querySelector(".senac-arch-scroll-tail");
    }
    return archScrollTailEl;
  }

  /** Plage scroll : « Le portail du voyage » lisible → fin de la queue arche. */
  let archPortalZoomY0 = /** @type {number | null} */ (null);
  let archPortalZoomY1 = /** @type {number | null} */ (null);

  function measureArchPortalZoomRange() {
    const portal = document.querySelector(".senac-scene--arch-portal");
    if (!(portal instanceof HTMLElement)) {
      archPortalZoomY0 = null;
      archPortalZoomY1 = null;
      return;
    }
    const vh = window.innerHeight || 1;
    const max = getScrollMax();
    /** Début : écran « Le portail du voyage » (carte épinglée / texte lisible). */
    archPortalZoomY0 = Math.max(0, portal.offsetTop - vh * 0.2);
    const tail = getArchScrollTailEl();
    archPortalZoomY1 = tail
      ? Math.min(max, tail.offsetTop + tail.offsetHeight - vh * 0.06)
      : max;
    if (archPortalZoomY1 <= archPortalZoomY0 + 48) {
      archPortalZoomY1 = max;
    }
  }

  /** 0 avant le portail ; 0→1 du portail à la fin de la descente (zoom caméra). */
  function senacArchPortalZoom01(scrollY) {
    if (archPortalZoomY0 == null || archPortalZoomY1 == null) measureArchPortalZoomRange();
    const y0 = archPortalZoomY0;
    const y1 = archPortalZoomY1;
    if (y0 == null || y1 == null) return 0;
    const y = Math.min(y1, Math.max(0, Number.isFinite(scrollY) ? scrollY : getScrollY()));
    if (y <= y0) return 0;
    const span = Math.max(1, y1 - y0);
    const raw = (y - y0) / span;
    return Math.min(1, Math.max(0, raw));
  }

  /**
   * Progression 0→1 dans la plage arche (viewport + ratio page).
   * Ne pas utiliser offsetTop (grille CSS) ni rect.bottom seul (faux positifs au chargement).
   */
  function senacArchTailProgress01(scrollY) {
    const tail = getArchScrollTailEl();
    if (!tail) return 0;
    const vh = window.innerHeight || 1;
    const max = getScrollMax();
    const y = Math.min(max, Math.max(0, Number.isFinite(scrollY) ? scrollY : getScrollY()));
    const pageRatio = max > 0 ? y / max : 0;
    if (pageRatio < ARCH_WHITEOUT_MIN_PAGE_RATIO) return 0;

    const rect = tail.getBoundingClientRect();
    if (!rect.height || rect.height < 48) return 0;
    /** Tail encore sous le viewport. */
    if (rect.top > vh * 0.97) return 0;
    /** Fin de séquence : tail passée, seulement si scroll page dans la zone arche. */
    if (rect.bottom <= 0 && pageRatio >= ARCH_WHITEOUT_MIN_PAGE_RATIO + 0.04) return 1;
    /** Pas encore dans la zone arche visible. */
    if (rect.top > vh * 0.86) return 0;

    const enterLine = vh * 0.76;
    const fullLine = vh * 0.06;
    const span = Math.max(1, enterLine - fullLine);
    return Math.min(1, Math.max(0, (enterLine - rect.top) / span));
  }

  function archWhiteoutOpacityFromTailProgress(tail01) {
    const p = Math.min(1, Math.max(0, tail01));
    if (p < ARCH_WHITEOUT_BEGIN_TAIL) return 0;
    if (p >= ARCH_WHITEOUT_FULL_TAIL) return ARCH_WHITEOUT_MAX_OPACITY;
    const span = Math.max(1e-6, ARCH_WHITEOUT_FULL_TAIL - ARCH_WHITEOUT_BEGIN_TAIL);
    const t = (p - ARCH_WHITEOUT_BEGIN_TAIL) / span;
    /** Montée douce : moins de « flash » blanc en début de zone arche. */
    const eased = Math.pow(t, 1.88);
    return eased * ARCH_WHITEOUT_MAX_OPACITY;
  }

  function setArchWhiteoutOpacity(opacity) {
    if (!archWhiteoutEl) return;
    const op = Math.min(1, Math.max(0, opacity));
    const on = op > 0.002;
    archWhiteoutEl.style.opacity = String(op);
    archWhiteoutEl.style.visibility = on ? "visible" : "hidden";
    archWhiteoutEl.classList.toggle("is-active", on);
  }

  function updateArchWhiteout(scrollY) {
    if (!archWhiteoutEl) return;
    if (archWhiteoutSuppressed) {
      setArchWhiteoutOpacity(0);
      return;
    }
    /** Pas de voile tant que l’utilisateur n’a pas passé le choix Cinéma / Exploration. */
    if (
      document.documentElement.classList.contains("senac-choice-pending") ||
      !document.documentElement.classList.contains("senac-choice-entered")
    ) {
      setArchWhiteoutOpacity(0);
      return;
    }
    const pageP = senacScrollRatioVisual(scrollY);
    if (pageP < ARCH_WHITEOUT_MIN_PAGE_RATIO) {
      setArchWhiteoutOpacity(0);
      return;
    }
    const tailP = senacArchTailProgress01(scrollY);
    if (!getArchScrollTailEl()) {
      setArchWhiteoutOpacity(0);
      return;
    }
    setArchWhiteoutOpacity(archWhiteoutOpacityFromTailProgress(tailP));

    const ratioComplete = senacScrollRatio(scrollY);
    const progress = senacScrollRatioVisual(scrollY);
    if (
      tailP >= ARCH_WHITEOUT_NAV_TAIL &&
      (ratioComplete >= ARCH_WHITEOUT_TO_ACT3_RATIO ||
        progress >= ARCH_WHITEOUT_TO_ACT3_RATIO) &&
      !archWhiteoutNavTriggered &&
      !archWhiteoutSuppressed
    ) {
      archWhiteoutNavTriggered = true;
      window.setTimeout(() => {
        const origin = window.location.origin;
        if (window.parent !== window) {
          try {
            window.parent.postMessage(
              { type: "senac-navigate", target: "act3-writing" },
              origin
            );
          } catch (_) { /* ignore */ }
        } else {
          bootstrapSpaActIIIEntry();
        }
      }, 600);
    }
  }

  let senacScrollApplyPending = false;
  let senacScrollApplyLastY = 0;
  /** Iframe SPA : sync arche 3D une frame sur deux pendant le scroll. */
  let senacArchSyncFrameSkip = 0;

  function updateSenacArchAmbient(scrollY) {
    const pageP = senacScrollRatioVisual(scrollY);
    const ft = Number.parseFloat(root.style.getPropertyValue("--frise-t").trim() || "0");
    const fn = Number.isFinite(ft) ? Math.min(1, Math.max(0, ft)) : 0;
    const vis = Math.min(1, Math.max(0, ((pageP - 0.04) / 0.52) * (0.35 + fn * 0.65)));
    root.style.setProperty("--senac-arch-visibility", vis.toFixed(3));
  }

  function applyScrollDerivedStateNow(scrollY) {
    senacScrollApplyLastY = scrollY;
    if (suppressScrollProgressChrome && scrollY > 12) {
      notifySenacParentUserScrolled();
    }
    computeImmersion(scrollY);
    updateSenacArchAmbient(scrollY);
    updateSenacScrollProgressFill();
    updateArchWhiteout(scrollY);
    updateSenacStellarFocus(scrollY);
    scheduleSenacArchScene();
    maybeInitSenacColorFluid();
    if (senacArchApi && typeof senacArchApi.sync === "function") {
      const archVis = Number.parseFloat(root.style.getPropertyValue("--senac-arch-visibility").trim() || "0");
      if (archVis >= 0.02) {
        if (suppressScrollProgressChrome) {
          senacArchSyncFrameSkip ^= 1;
          if (senacArchSyncFrameSkip === 0) senacArchApi.sync();
        } else {
          senacArchApi.sync();
        }
      }
    }
  }

  function applyScrollDerivedState(scrollY) {
    senacScrollApplyLastY = scrollY;
    if (senacScrollApplyPending) return;
    senacScrollApplyPending = true;
    requestAnimationFrame(() => {
      senacScrollApplyPending = false;
      applyScrollDerivedStateNow(senacScrollApplyLastY);
    });
  }

  let yearGaugeScrollTriggerInitScheduled = false;
  /** Parchemin initialisé - ScrollTrigger peut appliquer le proxy Lenis. */
  let senacPostLenisReady = false;
  /** Réf. ScrollTrigger (refresh resize). */
  let yearGaugeScrollTriggerPlugin =
    /** @type {{ refresh: (...a: unknown[]) => void } | null} */ (null);
  let senacRevealScrollTriggers = [];
  let senacAct2MotionInitScheduled = false;
  let senacAct2MotionReady = false;
  /** Stations frise (scroll cible mode Cinéma + repères constellation). */
  let senacObservatoryScenes = /** @type {{ el: HTMLElement, kind: string, holdMs: number, scrollY: number }[]} */ (
    []
  );
  let senacCinemaChainTimer = 0;
  let senacCinemaRafId = 0;
  /** Mode entrée actif (Cinéma / Exploration) — lu par les garde-fous Lenis globaux. */
  let senacScrollEntryMode = /** @type {"cinema"|"explore"|null} */ (null);
  let senacCinemaPaused = false;
  let senacCinemaScrollGen = 0;
  /** Waypoints cinéma figés entre deux recalculs (resize / démarrage tour). */
  let senacCinemaWaypointsCache = /** @type {{ y: number, holdMs: number }[] | null} */ (null);
  /** @type {(() => void) | null} */
  let senacCinemaOnResize = null;
  let senacCinemaLenisLerpSaved = /** @type {number | null} */ (null);

  function tryScheduleSenacScrollTriggerEffects() {
    if (!senacPostLenisReady) return;
    scheduleSenacScrollTriggerEffects();
  }

  /** Resize Lenis + waypoints cinéma (sans ScrollTrigger - trop lourd sur l’iframe). */
  function scheduleSenacScrollTriggerEffects() {
    if (yearGaugeScrollTriggerInitScheduled) {
      return;
    }
    yearGaugeScrollTriggerInitScheduled = true;

    window.addEventListener(
      "resize",
      () => {
        archPortalZoomY0 = null;
        archPortalZoomY1 = null;
        measureArchPortalZoomRange();
        if (yearGaugeLenis && typeof yearGaugeLenis.resize === "function") {
          yearGaugeLenis.resize();
        }
        applyScrollDerivedState(yearGaugeLenis ? yearGaugeLenis.scroll : getScrollY());
        if (senacAct2MotionReady) {
          refreshSenacStellarScenes();
          recordObservatorySceneMeta();
        }
        if (senacCinemaOnResize) senacCinemaOnResize();
      },
      { passive: true },
    );

    scheduleSenacAct2ScrollMotion();
  }


  function computeImmersion(scrollY) {
    /** Toujours mettre à jour --hero-t / --frise-t pour la DA (ambre désert → bleu nuit), même avec reduced-motion. */
    const vh = window.innerHeight || 1;
    const y = Number.isFinite(scrollY) ? scrollY : 0;
    /** Plus long au début = même « côté orange » acte I, puis transition douce vers le midnight au scroll. */
    const heroRaw = Math.min(1, Math.max(0, y / (vh * 4.2)));
    const heroT = heroRaw * heroRaw * (3 - 2 * heroRaw);
    let friseT = 0;
    if (friseEl) {
      const top = friseEl.offsetTop;
      const h = Math.max(friseEl.offsetHeight, 1);
      friseT = Math.min(1, Math.max(0, (y + vh * 0.38 - top) / h));
    }
    const hs = heroT.toFixed(4);
    const fs = friseT.toFixed(4);
    const gy = `${Math.round(y)}px`;
    root.style.setProperty("--senac-glyph-y", gy);
    root.style.setProperty("--senac-pillar-drift", `${((y / vh) * 5).toFixed(2)}px`);
    root.style.setProperty("--senac-pillar-glow", Math.min(1, heroT * 0.32 + friseT * 0.78).toFixed(3));
    if (root.style.getPropertyValue("--hero-t") === hs && root.style.getPropertyValue("--frise-t") === fs) {
      return;
    }
    root.style.setProperty("--hero-t", hs);
    root.style.setProperty("--frise-t", fs);
    postSenacChromeModeFromHeroFrise(heroT, friseT);
  }

  /** Parallax --hero-t / --frise-t quand Lenis est indisponible (scroll natif). */
  function initImmersionFromWindowScroll() {
    let ticking = false;
    function tick() {
      ticking = false;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      applyScrollDerivedState(y);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(tick);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    if (!reducedMotion) root.classList.add("senac-parallax-live");
  }

  /** Vagues temporelles : présence (visible) et mouvement (dérive) découplés. */
  function initSenacTemporalAmbience() {
    root.style.setProperty("--senac-time-phase", "0");
    root.style.setProperty("--senac-motion-gate", "1");
    root.style.setProperty("--senac-presence-gate", "1");
    if (reducedMotion) return;

    const cyclePresence = 26;
    const cycleMotion = 18;
    let raf = 0;
    const t0 = performance.now();

    function smooth01(x) {
      const c = Math.min(1, Math.max(0, x));
      return c * c * (3 - 2 * c);
    }

    function tick(now) {
      if (senacAmbientPaused) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = (now - t0) * 0.001;
      const phaseP = (t / cyclePresence) % 1;
      const phaseM = (t / cycleMotion) % 1;
      const waveP = 0.5 + 0.5 * Math.sin(phaseP * Math.PI * 2);
      const waveM = 0.5 + 0.5 * Math.sin(phaseM * Math.PI * 2 + 0.55);

      /** Plancher : éviter disparition totale des particules (ciel / brume / glyphes). */
      const presence = 0.62 + 0.38 * smooth01((waveP - 0.18) / 0.52);
      let motion = 0.55 + 0.45 * smooth01((waveM - 0.34) / 0.38);
      motion *= 0.72 + 0.28 * smooth01(1 - Math.max(0, (waveM - 0.78) / 0.22));

      root.style.setProperty("--senac-time-phase", phaseP.toFixed(4));
      root.style.setProperty("--senac-presence-gate", presence.toFixed(4));
      root.style.setProperty("--senac-motion-gate", motion.toFixed(4));
      document.body.classList.toggle("senac-temporal-rest", motion < 0.14);

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    document.body.classList.add("senac-temporal-live");
  }

  function readSenacPresenceGate() {
    if (reducedMotion) return 1;
    const n = Number.parseFloat(root.style.getPropertyValue("--senac-presence-gate").trim());
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
  }

  function readSenacMotionGate() {
    if (reducedMotion) return 1;
    const n = Number.parseFloat(root.style.getPropertyValue("--senac-motion-gate").trim());
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
  }

  /** Variation douce par particule (jamais à 0 : le fond reste vivant en continu). */
  function senacParticleTemporalGate(slot) {
    const presence = readSenacPresenceGate();
    const motion = readSenacMotionGate();
    const phase = Number.parseFloat(root.style.getPropertyValue("--senac-time-phase").trim());
    const p = ((Number.isFinite(phase) ? phase : 0) + (slot % 1)) % 1;
    const band = 0.38;
    let local = 0.55;
    if (p < band) local = 0.55 + (0.45 * p) / band;
    else if (p > 1 - band * 0.5) local = 0.55 + (0.45 * (1 - p)) / (band * 0.5);
    else local = 1;
    const c = Math.min(1, Math.max(0, local));
    const localSmooth = c * c * (3 - 2 * c);
    return Math.max(0.42, presence * motion * (0.58 + 0.42 * localSmooth));
  }

  /** Budget étoiles / brume selon surface écran (mobile plafonné, ~−30 % en compact). */
  function computeSenacParticleCounts(width, height) {
    const area = width * height;
    const compact = width < 768 || area < 480000;
    return {
      stars: Math.round(
        Math.min(compact ? 250 : 520, Math.max(compact ? 165 : 320, area / 5200)),
      ),
      motes: Math.round(
        Math.min(compact ? 210 : 460, Math.max(compact ? 120 : 250, area / 2200)),
      ),
      puffs: Math.round(
        Math.min(compact ? 44 : 92, Math.max(compact ? 28 : 52, area / 22000)),
      ),
    };
  }

  /**
   * Ciel + brume sur un seul canvas (#sky-canvas) — une boucle RAF au lieu de deux.
   * #fog-canvas masqué (même stack visuelle via composite 2D).
   */
  function initAtmosphereCanvas() {
    const canvas = document.getElementById("sky-canvas");
    const fogCanvas = document.getElementById("fog-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;

    if (fogCanvas instanceof HTMLCanvasElement) {
      fogCanvas.style.display = "none";
      fogCanvas.setAttribute("aria-hidden", "true");
    }
    root.classList.add("senac-atmosphere-merged");

    if (reducedMotion) {
      if (fogCanvas instanceof HTMLCanvasElement) fogCanvas.style.opacity = "0.38";
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let comets = [];
    /** @type {{ x: number; y: number; rx: number; ry: number; rot: number; vx: number; vy: number; vr: number; phase: number; layer: number; baseA: number }[]} */
    let puffs = [];
    /** @type {{ x: number; y: number; r: number; vx: number; vy: number; tw: number; phase: number; gold: boolean; pz: number; temporalSlot: number }[]} */
    let motes = [];
    /** Défilement lissé - parallax étoiles / brume. */
    let scrollParallaxSmooth = getScrollY();

    /** Décalage écran depuis le scroll ; `pz` 0 = loin, 1 = plus proche (bouge davantage). */
    function skyParallaxFor(pzRaw, sx) {
      const pz = Math.min(1, Math.max(0, pzRaw));
      const oy = sx * -(0.028 + pz * 0.44);
      const ox = sx * (-0.01 + pz * 0.085);
      return { ox, oy };
    }

    /** Orange / sable → bleu nuit : suit le scroll de la frise (section II narrative) autant que le hero. */
    function readSkyImmersion01() {
      const hRaw = root.style.getPropertyValue("--hero-t").trim();
      const fRaw = root.style.getPropertyValue("--frise-t").trim();
      const h = Number.parseFloat(hRaw);
      const f = Number.parseFloat(fRaw);
      const hn = Number.isFinite(h) ? Math.min(1, Math.max(0, h)) : 0;
      const fn = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
      return Math.min(1, Math.max(0, hn * 0.42 + fn * 0.58));
    }

    /** Interpolation halo ciel canvas : sable/ocre (#2d241e famille) → bleu nuit. */
    function blendSkyRadial(t) {
      const u = Math.min(1, Math.max(0, t));
      const cx = width * 0.5;
      const cy = height * 0.175;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy * 1.06, width * 0.76);
      bg.addColorStop(
        0,
        `rgba(${Math.round(48 - 36 * u)}, ${Math.round(36 + 22 * u)}, ${Math.round(22 + 96 * u)}, ${0.18 + u * 0.16})`
      );
      bg.addColorStop(
        0.38,
        `rgba(${Math.round(22 - 18 * u)}, ${Math.round(16 + 10 * u)}, ${Math.round(12 + 56 * u)}, ${0.12 + u * 0.06})`
      );
      bg.addColorStop(1, "rgba(0, 2, 8, 0)");
      return bg;
    }

    const rand = (min, max) => min + Math.random() * (max - min);
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars.length = 0;
      const { stars: count } = computeSenacParticleCounts(width, height);
      for (let i = 0; i < count; i += 1) {
        const micro = Math.random() > 0.55;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: micro ? rand(0.22, 0.95) : rand(0.45, 2.05),
          a: rand(0.2, 0.96),
          tw: rand(0.008, 0.03),
          phase: rand(0, Math.PI * 2),
          drift: rand(0.03, 0.2),
          gold: Math.random() > 0.68,
          connect: Math.random() > 0.58,
          /** Profondeur parallax scroll (loin → près). */
          pz: rand(0, 1),
          temporalSlot: Math.random(),
        });
      }
      scrollParallaxSmooth = getScrollY();
      puffs = [];
      motes = [];
      const { puffs: np, motes: nm } = computeSenacParticleCounts(width, height);
      for (let i = 0; i < np; i += 1) {
        puffs.push({
          x: rand(-width * 0.18, width * 1.15),
          y: rand(-height * 0.12, height * 1.1),
          rx: rand(72, 290),
          ry: rand(54, 230),
          rot: rand(0, Math.PI * 2),
          vx: rand(-0.42, 0.42),
          vy: rand(-0.2, 0.14),
          vr: rand(-0.0018, 0.0018),
          phase: rand(0, Math.PI * 2),
          layer: Math.random(),
          baseA: rand(0.038, 0.105),
        });
      }
      for (let i = 0; i < nm; i += 1) {
        const fine = Math.random() > 0.48;
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: fine ? rand(0.28, 1.15) : rand(0.55, 2.45),
          vx: rand(-0.28, 0.28),
          vy: rand(-0.52, -0.06),
          tw: rand(0.007, 0.023),
          phase: rand(0, Math.PI * 2),
          gold: Math.random() > 0.58,
          pz: Math.random(),
          temporalSlot: Math.random(),
        });
      }
    }

    function spawnComet() {
      if (readSenacMotionGate() < 0.42 || comets.length > 4 || Math.random() > 0.012) return;
      comets.push({
        x: rand(width * 0.2, width * 0.95),
        y: rand(-height * 0.1, height * 0.35),
        vx: rand(-1.55, -0.58),
        vy: rand(0.68, 1.35),
        life: rand(135, 235),
        maxLife: 235,
      });
    }

    function drawAtmosphereFog(time, sp, imm) {
      const motionG = readSenacMotionGate();
      const presenceG = readSenacPresenceGate();
      const rMist = Math.round(238 - imm * 105);
      const gMist = Math.round(208 + imm * 28);
      const bMist = Math.round(155 + imm * 95);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < puffs.length; i += 1) {
        const p = puffs[i];
        p.rot += p.vr;
        p.x += (p.vx + Math.sin(time * 0.00032 + p.phase) * 0.26) * motionG;
        p.y += (p.vy + Math.cos(time * 0.00026 + p.phase * 1.2) * 0.18) * motionG;
        if (p.x < -p.rx * 2.2) p.x += width + p.rx * 3;
        if (p.x > width + p.rx * 2.2) p.x -= width + p.rx * 3;
        if (p.y < -p.ry * 2) p.y += height + p.ry * 2.5;
        if (p.y > height + p.ry * 2) p.y -= height + p.ry * 2.5;
        const cx = p.x + sp * (-0.016 - p.layer * 0.058);
        const cy = p.y + sp * (-0.048 - p.layer * 0.13);
        const a0 = p.baseA * (0.82 + imm * 0.35) * (0.45 + presenceG * 0.55);
        ctx.globalAlpha = 0.55 + 0.45 * presenceG;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p.rot);
        ctx.scale(p.rx / 100, p.ry / 100);
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        grd.addColorStop(0, `rgba(${rMist}, ${gMist}, ${bMist}, ${a0})`);
        grd.addColorStop(0.42, `rgba(${rMist}, ${gMist}, ${bMist}, ${a0 * 0.42})`);
        grd.addColorStop(1, "rgba(8, 14, 28, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(0, 0, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < motes.length; i += 1) {
        const m = motes[i];
        const gate = senacParticleTemporalGate(m.temporalSlot ?? 0);
        if (gate < 0.1) continue;
        const twinkle = 0.62 + Math.sin(time * m.tw + m.phase) * 0.24 * gate;
        m.x += (m.vx * 0.09 + Math.sin(time * 0.0004 + m.phase) * 0.06) * gate;
        m.y += m.vy * 0.07 * gate;
        if (m.y < -6) m.y = height + 6;
        if (m.x < -4) m.x = width + 4;
        if (m.x > width + 4) m.x = -4;
        const sx = m.x + sp * (-0.011 - m.pz * 0.048);
        const sy = m.y + sp * (-0.038 - m.pz * 0.09);
        const alpha = Math.max(0.04, Math.min(0.72, twinkle * (0.52 + imm * 0.38) * gate));
        ctx.globalAlpha = 1;
        ctx.fillStyle = m.gold ? `rgba(236, 212, 168, ${alpha})` : `rgba(165, 210, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function draw(time) {
      if (senacAmbientPaused) {
        requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      const scrollTarget = getScrollY();
      scrollParallaxSmooth += (scrollTarget - scrollParallaxSmooth) * 0.125;
      const sp = scrollParallaxSmooth;

      const ht = readSkyImmersion01();
      ctx.fillStyle = blendSkyRadial(ht);
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const drawStarLinks = window.parent === window;
      if (drawStarLinks) for (let i = 0; i < stars.length; i += 1) {
        const a = stars[i];
        if (!a.connect || a.y > height * 0.72) continue;
        const pa = skyParallaxFor(a.pz ?? 0.4, sp);
        const ax = a.x + pa.ox;
        const ay = a.y + pa.oy;
        for (let j = i + 1; j < Math.min(i + 18, stars.length); j += 1) {
          const b = stars[j];
          if (!b.connect || b.y > height * 0.72) continue;
          const pb = skyParallaxFor(b.pz ?? 0.4, sp);
          const bx = b.x + pb.ox;
          const by = b.y + pb.oy;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.hypot(dx, dy);
          if (dist > 115) continue;
          const linkGate =
            senacParticleTemporalGate(a.temporalSlot ?? 0) * senacParticleTemporalGate(b.temporalSlot ?? 0);
          if (linkGate < 0.12) continue;
          const alpha = (1 - dist / 115) * 0.12 * linkGate;
          ctx.strokeStyle = `rgba(139, 213, 255, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
      ctx.restore();

      for (const star of stars) {
        const gate = senacParticleTemporalGate(star.temporalSlot ?? 0);
        if (gate < 0.08) continue;

        const twinkle =
          star.a * (0.35 + gate * 0.65) + Math.sin(time * star.tw + star.phase) * 0.14 * gate;
        star.y -= star.drift * 0.08 * gate;
        if (star.y < -4) star.y = height + 4;

        const pp = skyParallaxFor(star.pz ?? 0.4, sp);
        const sx = star.x + pp.ox;
        const sy = star.y + pp.oy;

        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fillStyle = star.gold
          ? `rgba(234, 215, 164, ${Math.max(0.04, twinkle)})`
          : `rgba(165, 215, 255, ${Math.max(0.04, twinkle)})`;
        ctx.fill();
      }

      spawnComet();
      /** Parallax léger pour les traits de comète ( même couche ciel ). */
      const comPx = sp * -0.016;
      const comPy = sp * -0.062;
      for (let i = comets.length - 1; i >= 0; i -= 1) {
        const c = comets[i];
        c.x += c.vx;
        c.y += c.vy;
        c.life -= 1;

        const ox = c.x + comPx;
        const oy = c.y + comPy;
        const opacity = Math.max(0, c.life / c.maxLife);
        const grad = ctx.createLinearGradient(ox, oy, ox - c.vx * 52, oy - c.vy * 52);
        grad.addColorStop(0, `rgba(234, 215, 164, ${0.82 * opacity})`);
        grad.addColorStop(0.35, `rgba(139, 213, 255, ${0.38 * opacity})`);
        grad.addColorStop(1, "rgba(121, 183, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox - c.vx * 58, oy - c.vy * 58);
        ctx.stroke();

        if (c.life <= 0 || c.y > height + 80 || c.x < -120) {
          comets.splice(i, 1);
        }
      }

      drawAtmosphereFog(time, sp, ht);
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
  }

  /**
   * Brume legacy (#fog-canvas) — ignoré si fusionné dans #sky-canvas.
   */
  function initFog() {
    if (root.classList.contains("senac-atmosphere-merged")) return;
    const canvas = document.getElementById("fog-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (reducedMotion) {
      canvas.style.opacity = "0.38";
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    /** @type {{ x: number; y: number; rx: number; ry: number; rot: number; vx: number; vy: number; vr: number; phase: number; layer: number; baseA: number }[]} */
    let puffs = [];
    /** @type {{ x: number; y: number; r: number; vx: number; vy: number; tw: number; phase: number; gold: boolean; pz: number }[]} */
    let motes = [];
    let scrollSmooth = getScrollY();

    function fogImmersion01() {
      const hRaw = root.style.getPropertyValue("--hero-t").trim();
      const fRaw = root.style.getPropertyValue("--frise-t").trim();
      const h = Number.parseFloat(hRaw);
      const f = Number.parseFloat(fRaw);
      const hn = Number.isFinite(h) ? Math.min(1, Math.max(0, h)) : 0;
      const fn = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
      return Math.min(1, Math.max(0, hn * 0.42 + fn * 0.58));
    }

    function rand(a, b) {
      return a + Math.random() * (b - a);
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      puffs = [];
      const { puffs: np, motes: nm } = computeSenacParticleCounts(width, height);
      for (let i = 0; i < np; i += 1) {
        puffs.push({
          x: rand(-width * 0.18, width * 1.15),
          y: rand(-height * 0.12, height * 1.1),
          rx: rand(72, 290),
          ry: rand(54, 230),
          rot: rand(0, Math.PI * 2),
          vx: rand(-0.42, 0.42),
          vy: rand(-0.2, 0.14),
          vr: rand(-0.0018, 0.0018),
          phase: rand(0, Math.PI * 2),
          layer: Math.random(),
          baseA: rand(0.038, 0.105),
        });
      }

      motes = [];
      for (let i = 0; i < nm; i += 1) {
        const fine = Math.random() > 0.48;
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: fine ? rand(0.28, 1.15) : rand(0.55, 2.45),
          vx: rand(-0.28, 0.28),
          vy: rand(-0.52, -0.06),
          tw: rand(0.007, 0.023),
          phase: rand(0, Math.PI * 2),
          gold: Math.random() > 0.58,
          pz: Math.random(),
          temporalSlot: Math.random(),
        });
      }
      scrollSmooth = getScrollY();
    }

    function drawFog(time) {
      const scrollTarget = getScrollY();
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.118;
      const sp = scrollSmooth;
      const imm = fogImmersion01();
      const motionG = readSenacMotionGate();
      const presenceG = readSenacPresenceGate();

      ctx.clearRect(0, 0, width, height);

      const rMist = Math.round(238 - imm * 105);
      const gMist = Math.round(208 + imm * 28);
      const bMist = Math.round(155 + imm * 95);

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < puffs.length; i += 1) {
        const p = puffs[i];
        p.rot += p.vr;
        p.x += (p.vx + Math.sin(time * 0.00032 + p.phase) * 0.26) * motionG;
        p.y += (p.vy + Math.cos(time * 0.00026 + p.phase * 1.2) * 0.18) * motionG;
        if (p.x < -p.rx * 2.2) p.x += width + p.rx * 3;
        if (p.x > width + p.rx * 2.2) p.x -= width + p.rx * 3;
        if (p.y < -p.ry * 2) p.y += height + p.ry * 2.5;
        if (p.y > height + p.ry * 2) p.y -= height + p.ry * 2.5;

        const ox = sp * (-0.016 - p.layer * 0.058);
        const oy = sp * (-0.048 - p.layer * 0.13);
        const cx = p.x + ox;
        const cy = p.y + oy;

        const a0 = p.baseA * (0.82 + imm * 0.35) * (0.45 + presenceG * 0.55);
        ctx.globalAlpha = 0.55 + 0.45 * presenceG;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p.rot);
        ctx.scale(p.rx / 100, p.ry / 100);
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        grd.addColorStop(0, `rgba(${rMist}, ${gMist}, ${bMist}, ${a0})`);
        grd.addColorStop(0.42, `rgba(${rMist}, ${gMist}, ${bMist}, ${a0 * 0.42})`);
        grd.addColorStop(1, "rgba(8, 14, 28, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(0, 0, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < motes.length; i += 1) {
        const m = motes[i];
        const gate = senacParticleTemporalGate(m.temporalSlot ?? 0);
        if (gate < 0.1) continue;

        const twinkle = 0.62 + Math.sin(time * m.tw + m.phase) * 0.24 * gate;
        const pa = sp * (-0.011 - m.pz * 0.048);
        const pb = sp * (-0.038 - m.pz * 0.09);
        m.x += (m.vx * 0.09 + Math.sin(time * 0.0004 + m.phase) * 0.06) * gate;
        m.y += m.vy * 0.07 * gate;
        if (m.y < -6) m.y = height + 6;
        if (m.x < -4) m.x = width + 4;
        if (m.x > width + 4) m.x = -4;

        const sx = m.x + pa;
        const sy = m.y + pb;
        const alpha = Math.max(0.04, Math.min(0.72, twinkle * (0.52 + imm * 0.38) * gate));
        ctx.globalAlpha = 1;
        if (m.gold) {
          ctx.fillStyle = `rgba(236, 212, 168, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(165, 210, 255, ${alpha})`;
        }
        ctx.beginPath();
        ctx.arc(sx, sy, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      requestAnimationFrame(drawFog);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(drawFog);
  }

  /** Points lumineux CSS (complément #sky-canvas / #fog-canvas). */
  function initSenacGlyphDust() {
    if (reducedMotion) return;
    const host = document.querySelector(".senac-scroll-glyphs");
    if (!(host instanceof HTMLElement) || host.querySelector(".senac-scroll-glyphs__layer--dust")) return;

    const layer = document.createElement("di" + "v");
    layer.className = "senac-scroll-glyphs__layer senac-scroll-glyphs__layer--dust";
    layer.setAttribute("aria-hidden", "true");

    const compact = window.innerWidth < 768;
    const inIframe = window.parent !== window;
    const count = inIframe ? (compact ? 36 : 60) : compact ? 52 : 88;

    for (let i = 0; i < count; i += 1) {
      const mote = document.createElement("span");
      mote.className = "senac-scroll-glyphs__dust-mote";
      const gold = Math.random() > 0.42;
      const size = gold ? 1.5 + Math.random() * 1.8 : 1 + Math.random() * 1.4;
      mote.style.left = `${(Math.random() * 100).toFixed(2)}%`;
      mote.style.top = `${(Math.random() * 100).toFixed(2)}%`;
      mote.style.setProperty("--senac-dust-size", `${size.toFixed(2)}px`);
      mote.style.setProperty(
        "--senac-dust-color",
        gold ? "rgba(236, 212, 168, 0.62)" : "rgba(165, 215, 255, 0.5)",
      );
      mote.style.setProperty(
        "--senac-dust-glow",
        gold ? "rgba(197, 160, 89, 0.42)" : "rgba(121, 183, 255, 0.32)",
      );
      mote.style.setProperty("--senac-dust-dur", `${(14 + Math.random() * 16).toFixed(1)}s`);
      mote.style.setProperty("--senac-dust-delay", `${(-Math.random() * 18).toFixed(2)}s`);
      mote.style.setProperty("--senac-dust-dx", `${((Math.random() - 0.5) * 18).toFixed(1)}px`);
      mote.style.setProperty("--senac-dust-dy", `${((Math.random() - 0.5) * 22).toFixed(1)}px`);
      mote.style.setProperty("--senac-dust-a0", (0.25 + Math.random() * 0.25).toFixed(2));
      mote.style.setProperty("--senac-dust-a1", (0.55 + Math.random() * 0.35).toFixed(2));
      layer.appendChild(mote);
    }

    host.appendChild(layer);
  }

  function maybeInitSenacColorFluid() {
    if (senacColorFluidStarted || reducedMotion) return;
    const ht = Number.parseFloat(root.style.getPropertyValue("--hero-t").trim() || "0");
    const ft = Number.parseFloat(root.style.getPropertyValue("--frise-t").trim() || "0");
    if (ht < 0.1 && ft < 0.06) return;
    senacColorFluidStarted = true;
    void initSenacColorFluid();
  }

  /** Fluide coloré WebGL (or → bleu nuit) - calque sous la brume. */
  async function initSenacColorFluid() {
    if (reducedMotion) return;
    const mount = document.getElementById("senac-color-fluid");
    if (!(mount instanceof HTMLElement)) return;

    function readCss01(prop) {
      const raw = root.style.getPropertyValue(prop).trim();
      const n = Number.parseFloat(raw);
      return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
    }

    function readScroll01() {
      return senacScrollRatioVisual(getScrollY());
    }

    try {
      const { attachSenacColorFluid } = await import("./parchemin-senac-color-fluid.mjs");
      await attachSenacColorFluid(mount, {
        reducedMotion,
        getHeroT: () => readCss01("--hero-t"),
        getFriseT: () => readCss01("--frise-t"),
        getScroll01: readScroll01,
        getPresenceGate: readSenacPresenceGate,
        getMotionGate: readSenacMotionGate,
      });
      document.body.classList.add("senac-color-fluid-active");
    } catch (_) {
      /* WebGL / import indisponible */
    }
  }

  async function initSmokeShader() {
    if (reducedMotion || window.parent !== window) return false;

    let THREE;
    try {
      THREE = await import("https://esm.sh/three@0.161.0");
    } catch (_) {
      return false;
    }

    const mount = document.createElement("div");
    mount.id = "senac-smoke-webgl";
    mount.setAttribute("aria-hidden", "true");
    document.body.appendChild(mount);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uFrise: { value: 0 },
      uHero: { value: 0 },
      uScroll01: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uFrise;
        uniform float uHero;
        uniform float uScroll01;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = m * p * 1.15;
            a *= 0.5;
          }
          return v;
        }

        float easeInOut(float x) {
          x = clamp(x, 0.0, 1.0);
          return x * x * (3.0 - 2.0 * x);
        }

        void main() {
          vec2 uv = vUv;
          vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          vec2 p = (uv - 0.5) * aspect;

          float s = clamp(uScroll01, 0.0, 1.0);
          float sEase = easeInOut(s);

          vec2 flow = vec2(0.0, uTime * (0.028 + sEase * 0.006));

          vec2 m = (uMouse - 0.5) * aspect;
          vec2 d = p - m;
          float dist = length(d);
          float influence = exp(-dist * 10.0);
          vec2 radial = normalize(d + 1e-6);
          vec2 perp = normalize(vec2(-d.y, d.x) + 1e-6);
          vec2 disp = (perp * (0.018 + sEase * 0.006) + radial * (0.012 + sEase * 0.004)) * influence;

          vec2 mouseVec = (uMouse - 0.5) * 2.0;
          vec2 mouseDrift = vec2(mouseVec.x * 0.045, -mouseVec.y * 0.036) * (0.22 + sEase * 0.28);

          float depthDrift = sin(uTime * 0.12 + p.y * 1.4) * 0.03;
          vec2 baseUv = p * (2.02 + sEase * 0.16) + flow + mouseDrift + vec2(0.0, depthDrift);

          float n0 = fbm(baseUv + disp * 0.85);
          float n1 = fbm(baseUv * 1.12 + vec2(0.42, -0.3) + vec2(-sEase * 0.12, sEase * 0.08));
          float n2 = fbm(baseUv * 1.27 + vec2(-0.56, 0.44) + vec2(sEase * 0.18, -sEase * 0.12));
          float n = n0 * 0.52 + n1 * 0.31 + n2 * 0.17;

          float smoke = smoothstep(0.31, 0.67, n);
          smoke *= smoothstep(1.26, 0.08, length(p));

          float breathe = 0.92 + sin(uTime * 0.22 + p.x * 0.9) * 0.08;
          smoke *= breathe;

          float shift = clamp(uHero * 0.42 + uFrise * 0.58, 0.0, 1.0);
          vec3 warm = vec3(0.6, 0.35, 0.15);
          vec3 cool = vec3(0.40, 0.55, 0.72);
          vec3 tint = mix(warm, cool, shift * 0.72);

          float alpha = smoke * (0.24 + sEase * 0.13);
          alpha *= smoothstep(0.0, 0.2, smoke) * (1.0 - smoothstep(0.75, 1.0, smoke));

          gl_FragColor = vec4(tint, alpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    let raf = 0;

    const readImmersion = () => {
      const h = parseFloat(root.style.getPropertyValue("--hero-t").trim() || "0");
      const f = parseFloat(root.style.getPropertyValue("--frise-t").trim() || "0");
      uniforms.uHero.value = Number.isFinite(h) ? Math.min(1, Math.max(0, h)) : 0;
      uniforms.uFrise.value = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
      const y = yearGaugeLenis && typeof yearGaugeLenis.scroll === "number" ? yearGaugeLenis.scroll : getScrollY();
      uniforms.uScroll01.value = senacScrollRatioVisual(y);
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    const onPointerMove = (e) => {
      uniforms.uMouse.value.set(
        e.clientX / Math.max(window.innerWidth, 1),
        1 - e.clientY / Math.max(window.innerHeight, 1)
      );
    };

    const render = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      readImmersion();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.body.classList.remove("senac-smoke-fallback");
    document.body.classList.add("senac-smoke-shader-active");
    render();

    window.addEventListener("beforeunload", () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.parentNode) mount.parentNode.removeChild(mount);
      document.body.classList.remove("senac-smoke-shader-active");
    });

    return true;
  }

  function initPointerGlow() {
    if (reducedMotion) return;

    const finePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    /** SPA : losange = CustomCursor parent (relais senac-pointer). */
    const spaParentCursor = suppressScrollProgressChrome;

    /* ── Curseur losange (identique à CustomCursor.tsx React) - non monté sur tactile ── */
    const cursorEl = document.createElement("div");
    cursorEl.id = "senac-diamond-cursor";

    /* Halo flou derrière le losange (lent, spring souple) */
    const haloEl = document.createElement("div");
    haloEl.className = "dc-halo";

    /* Losange SVG + queue */
    const shapeEl = document.createElement("div");
    shapeEl.className = "dc-shape";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "30");
    svg.setAttribute("viewBox", "0 0 22 30");
    svg.setAttribute("fill", "none");

    const poly = document.createElementNS(ns, "polygon");
    poly.setAttribute("points", "11,1 21,11 11,21 1,11");
    poly.setAttribute("stroke-width", "1.35");

    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", "11");
    dot.setAttribute("cy", "11");
    dot.setAttribute("r", "1.65");

    const tail = document.createElementNS(ns, "line");
    tail.setAttribute("x1", "11"); tail.setAttribute("y1", "22");
    tail.setAttribute("x2", "11"); tail.setAttribute("y2", "28");
    tail.setAttribute("stroke-width", "1");
    tail.setAttribute("stroke-linecap", "round");
    tail.setAttribute("stroke-opacity", "0.85");

    const arrow = document.createElementNS(ns, "polyline");
    arrow.setAttribute("points", "8,25 11,29 14,25");
    arrow.setAttribute("stroke-width", "1");
    arrow.setAttribute("stroke-opacity", "0.85");
    arrow.setAttribute("stroke-linejoin", "round");
    arrow.setAttribute("fill", "none");

    svg.appendChild(poly);
    svg.appendChild(dot);
    svg.appendChild(tail);
    svg.appendChild(arrow);
    shapeEl.appendChild(svg);
    cursorEl.appendChild(haloEl);
    cursorEl.appendChild(shapeEl);
    if (finePointer && !spaParentCursor) {
      document.body.appendChild(cursorEl);
    }

    /* Couleurs : or désert ↔ bleu constellation selon --immersive-shift */
    const GOLD_STROKE = "#e8d5a4";
    const GOLD_FILL   = "rgba(197,160,89,0.14)";
    const GOLD_TAIL   = "#c5a059";
    const GOLD_HALO   = "radial-gradient(circle, rgba(197,160,89,0.65) 0%, transparent 70%)";

    const BLUE_STROKE = "#cce8ff";
    const BLUE_FILL   = "rgba(90,168,255,0.14)";
    const BLUE_TAIL   = "#8bd5ff";
    const BLUE_HALO   = "radial-gradient(circle, rgba(100,185,235,0.7) 0%, transparent 70%)";

    let lastShift = -1;

    function applyColors(shift) {
      if (
        !finePointer ||
        !poly ||
        !dot ||
        !tail ||
        !arrow ||
        !cursorEl ||
        !haloEl
      ) {
        return;
      }
      if (Math.abs(shift - lastShift) < 0.02) return;
      lastShift = shift;
      const night = shift >= 0.46;
      const stroke = night ? BLUE_STROKE : GOLD_STROKE;
      const fill   = night ? BLUE_FILL   : GOLD_FILL;
      const tailC  = night ? BLUE_TAIL   : GOLD_TAIL;
      const halo   = night ? BLUE_HALO   : GOLD_HALO;
      poly.setAttribute("fill",   fill);
      poly.setAttribute("stroke", stroke);
      dot.setAttribute("fill",    stroke);
      tail.setAttribute("stroke", tailC);
      arrow.setAttribute("stroke", tailC);
      haloEl.style.background = halo;
    }
    if (!spaParentCursor) applyColors(0);

    /* Positions : rapide pour le losange, souple pour le halo */
    let rawX = -200, rawY = -200;
    /* Halo : lerp plus lent (comme `tx/ty` dans CustomCursor) */
    let hx = rawX, hy = rawY;
    /* Losange : lerp plus rapide (comme `sx/sy`) */
    let lx = rawX, ly = rawY;

    /* Pour --mx/--my de l'ambiance de fond */
    let mx_pct = 50, my_pct = 18;

    /* Portrait tilt */
    let prx = 0, pry = 0, crx = 0, cry = 0;
    const TILT_MAX = 10, DEPTH_MAX = 8, LERP_TILT = 0.06;

    window.addEventListener(
      "pointermove",
      (event) => {
        rawX = event.clientX;
        rawY = event.clientY;
        mx_pct = (rawX / window.innerWidth)  * 100;
        my_pct = (rawY / window.innerHeight) * 100;

        const nx = (rawX / window.innerWidth  - 0.5) * 2;
        const ny = (rawY / window.innerHeight - 0.5) * 2;
        prx = -ny * TILT_MAX;
        pry =  nx * TILT_MAX;
      },
      { passive: true }
    );

    const loop = () => {
      /* Halo ambiance (--mx/--my) */
      root.style.setProperty("--mx", `${mx_pct.toFixed(1)}%`);
      root.style.setProperty("--my", `${my_pct.toFixed(1)}%`);

      /* Losange (rapide) */
      lx += (rawX - lx) * 0.22;
      ly += (rawY - ly) * 0.22;

      /* Halo (souple, décalé) */
      hx += (rawX - hx) * 0.065;
      hy += (rawY - hy) * 0.065;

      if (finePointer && cursorEl && haloEl && !spaParentCursor) {
        cursorEl.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
        haloEl.style.left = `${(hx - lx).toFixed(1)}px`;
        haloEl.style.top = `${(hy - ly).toFixed(1)}px`;
      }

      /* Couleurs selon immersion */
      const ht = parseFloat(root.style.getPropertyValue("--hero-t")  || "0");
      const ft = parseFloat(root.style.getPropertyValue("--frise-t") || "0");
      if (!spaParentCursor) applyColors(Math.min(1, ht + ft * 0.42));

      /* Portrait tilt */
      crx += (prx - crx) * LERP_TILT;
      cry += (pry - cry) * LERP_TILT;
      const nrx = crx / TILT_MAX;
      const nry = cry / TILT_MAX;
      const ptx = -nry * DEPTH_MAX;
      const pty =  nrx * DEPTH_MAX;
      const gx  = 50 + nry * 38;
      const gy  = 35 + nrx * 28;
      const go  = Math.min(0.9, (Math.abs(nrx) + Math.abs(nry)) * 0.75);

      root.style.setProperty("--portrait-rx", `${crx.toFixed(2)}deg`);
      root.style.setProperty("--portrait-ry", `${cry.toFixed(2)}deg`);
      root.style.setProperty("--portrait-tx", `${ptx.toFixed(2)}px`);
      root.style.setProperty("--portrait-ty", `${pty.toFixed(2)}px`);
      root.style.setProperty("--portrait-gx", `${gx.toFixed(1)}%`);
      root.style.setProperty("--portrait-gy", `${gy.toFixed(1)}%`);
      root.style.setProperty("--portrait-go", `${go.toFixed(3)}`);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function ensureLenisInit() {
    if (!senacLenisInitPromise) senacLenisInitPromise = initLenis();
    return senacLenisInitPromise;
  }

  async function initLenis() {
    if (reducedMotion) return false;
    if (yearGaugeLenis) return true;
    try {
      const { default: Lenis } = await import("https://esm.sh/lenis@1.1.18");
      const lenis = new Lenis({
        /** SPA : scroll un peu plus vif ; page seule : inertie douce. */
        lerp: suppressScrollProgressChrome ? 0.16 : 0.12,
        smoothWheel: true,
        wheelMultiplier: suppressScrollProgressChrome ? 1.02 : 0.96,
        touchMultiplier: 1.12,
        syncTouch: false,
        smoothTouch: false,
        autoRaf: false,
      });

      lenis.on("scroll", () => {
        applyScrollDerivedState(lenis.scroll);
      });

      document.addEventListener("wheel", scheduleSenacLenisWheelEndSnap, { passive: true });
      window.addEventListener("touchend", scheduleSenacLenisWheelEndSnap, { passive: true });
      window.addEventListener(
        "load",
        () => {
          lenis.resize();
          applyScrollDerivedState(lenis.scroll);
        },
        { once: true },
      );

      attachSenacLenisRaf(lenis);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lenis.resize();
          applyScrollDerivedState(lenis.scroll);
        });
      });

      root.classList.add("lenis");
      root.classList.add("senac-parallax-live");
      yearGaugeLenis = lenis;
      applyScrollDerivedState(lenis.scroll);
      if (senacFreezeLenisForChoiceOverlay) senacFreezeLenisForChoiceOverlay();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Entrée (GSAP) + disparition après premier défilement (scroll / molette / tactile).
   * @param {import('gsap').GSAP|null} gsap
   */
  function initScrollCue(_gsap) {
    return;
    const cue = document.querySelector("header.hero a.scroll-cue");
    if (!(cue instanceof HTMLAnchorElement)) return;

    const passive = { passive: true };
    if (window.scrollY > 100) {
      cue.style.opacity = "0";
      cue.style.visibility = "hidden";
      cue.setAttribute("aria-hidden", "true");
      cue.style.pointerEvents = "none";
      return;
    }

    if (gsap) {
      const mouse = cue.querySelector(".scroll-cue-mouse");
      const label = cue.querySelector(".scroll-cue-label");
      const parts = [mouse, label].filter((n) => n instanceof HTMLElement);
      gsap.set(cue, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" });
      gsap.set(parts, { opacity: 0, y: 10, filter: "blur(6px)" });
      if (parts.length) {
        const intro = gsap.timeline({ delay: reducedMotion ? 0 : 0.38 });
        intro
          .to(parts, {
            opacity: (index) => (index === 0 ? 0.74 : 0.72),
            y: 0,
            filter: "blur(0px)",
            duration: reducedMotion ? 0.12 : 0.62,
            stagger: reducedMotion ? 0 : 0.08,
            ease: "power3.out",
          })
          .fromTo(
            label,
            { letterSpacing: "0.58em" },
            { letterSpacing: "0.38em", duration: reducedMotion ? 0.1 : 0.72, ease: "power3.out" },
            "<"
          );
      } else {
        gsap.from(cue, {
          opacity: 0,
          y: 18,
          duration: reducedMotion ? 0.1 : 0.55,
          delay: reducedMotion ? 0 : 0.35,
          ease: "power2.out",
        });
      }
    } else {
      cue.style.opacity = "1";
    }

    let dismissed = false;
    let touchY = 0;

    function tearDownListeners() {
      window.removeEventListener("scroll", onScroll, passive);
      window.removeEventListener("wheel", onWheel, passive);
      window.removeEventListener("touchstart", onTouchStart, passive);
      window.removeEventListener("touchmove", onTouchMove, passive);
    }

    function done() {
      cue.setAttribute("aria-hidden", "true");
      cue.style.pointerEvents = "none";
      cue.style.visibility = "hidden";
    }

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      tearDownListeners();
      cue.classList.add("is-dismissing");

      if (gsap) {
        const mouse = cue.querySelector(".scroll-cue-mouse");
        const label = cue.querySelector(".scroll-cue-label");
        const mouseTarget = mouse instanceof HTMLElement ? mouse : [];
        const labelTarget = label instanceof HTMLElement ? label : [];
        const partsKill = [cue];
        if (mouse instanceof HTMLElement) partsKill.push(mouse);
        if (label instanceof HTMLElement) partsKill.push(label);
        gsap.killTweensOf(partsKill);
        gsap
          .timeline({
            defaults: { overwrite: true },
            onComplete: done,
          })
          .to(labelTarget, {
            opacity: 0,
            y: -8,
            letterSpacing: "0.56em",
            filter: "blur(5px)",
            duration: reducedMotion ? 0.01 : 0.24,
            ease: "power2.in",
          })
          .to(
            mouseTarget,
            {
              opacity: 0,
              y: -18,
              scale: 0.82,
              filter: "blur(4px)",
              duration: reducedMotion ? 0.01 : 0.34,
              ease: "power3.in",
            },
            "<0.04"
          )
          .to(
            cue,
            {
              opacity: 0,
              y: -28,
              scale: 0.98,
              filter: "blur(2px)",
              duration: reducedMotion ? 0.01 : 0.42,
              ease: "power3.inOut",
              transformOrigin: "50% 50%",
            },
            "<0.04"
          );
      } else {
        cue.style.transition = reducedMotion ? "opacity 0.12s ease" : "opacity 0.48s ease, transform 0.48s ease";
        cue.style.opacity = "0";
        cue.style.transform = "translateY(-12px) scale(0.96)";
        window.setTimeout(done, reducedMotion ? 40 : 480);
      }
    }

    function onScroll() {
      if (window.scrollY > 24) dismiss();
    }

    function onWheel(/** @type {WheelEvent} */ e) {
      if (Math.abs(e.deltaY) > 4) dismiss();
    }

    function onTouchStart(/** @type {TouchEvent} */ e) {
      const t = e.touches[0];
      if (t) touchY = t.clientY;
    }

    function onTouchMove(/** @type {TouchEvent} */ e) {
      const t = e.touches[0];
      if (!t) return;
      if (Math.abs(t.clientY - touchY) > 12) dismiss();
    }

    window.addEventListener("scroll", onScroll, passive);
    window.addEventListener("wheel", onWheel, passive);
    window.addEventListener("touchstart", onTouchStart, passive);
    window.addEventListener("touchmove", onTouchMove, passive);

    cue.addEventListener(
      "click",
      () => {
        window.setTimeout(dismiss, 80);
      },
      { once: true }
    );
  }

  function killSenacAct2ScrollMotion() {
    senacRevealScrollTriggers.forEach((st) => {
      try {
        st.kill();
      } catch (_) {
        /* ignore */
      }
    });
    senacRevealScrollTriggers = [];
    senacObservatoryScenes = [];
    senacAct2MotionReady = false;
    document.documentElement.classList.remove("senac-observatory-motion");
  }

  function trackSenacScrollTrigger(/** @type {import('gsap/ScrollTrigger').ScrollTrigger | undefined} */ st) {
    if (st) senacRevealScrollTriggers.push(st);
  }

  /**
   * @param {gsap.core.Tween} tween
   */
  function trackTweenScrollTrigger(tween) {
    if (tween && tween.scrollTrigger) trackSenacScrollTrigger(tween.scrollTrigger);
  }

  /** Fallback sans GSAP : apparition immédiate au scroll (depuis le haut en CSS). */
  function initRevealFallback() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.09, rootMargin: "0px 0px -14% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function prepareSenacObservatoryDom() {
    const timeline = document.getElementById("timeline-start");
    const hero = document.querySelector("header.hero");
    document.body.classList.add("senac-reading-flow");
    if (hero) hero.classList.add("senac-hero-portal");
    if (!timeline) return [];

    timeline.classList.add("senac-constellation-track");
    const scenes = /** @type {HTMLElement[]} */ ([]);
    timeline.querySelectorAll(":scope > .story-card, :scope > .quote-break, :scope > figure.archive-window").forEach(
      (node, index) => {
        if (!(node instanceof HTMLElement)) return;
        node.classList.add("senac-scene");
        node.dataset.sceneIndex = String(index);
        if (node.classList.contains("story-card")) node.classList.add("senac-scene--card");
        else if (node.classList.contains("quote-break")) node.classList.add("senac-scene--chamber");
        else if (node.matches("figure.archive-window")) node.classList.add("senac-scene--reliquary");
        scenes.push(node);
      },
    );
    return scenes;
  }

  /**
   * @param {HTMLElement} card
   * @param {import('gsap').GSAP} gsapRef
   * @param {boolean} usePin
   */
  function bindObservatoryStoryCard(card, gsapRef, usePin) {
    const centered = document.body.classList.contains("senac-reading-flow");
    const isRight = card.classList.contains("story-card--right");
    const isLeft = card.classList.contains("story-card--left");
    const xFrom = centered ? 0 : isRight ? 52 : isLeft ? -52 : 0;
    const rotFrom = centered ? 0 : isRight ? -1.15 : isLeft ? 1.15 : 0;
    const ghost = card.querySelector(".date-ghost");
    const pinEl = card.querySelector(".pin");
    const panel = card.querySelector(".story-panel");
    const words = panel ? panel.querySelectorAll(".sq-word") : [];

    const onActive = (/** @type {boolean} */ active) => {
      card.classList.toggle("senac-scene--active", active);
      if (active) card.classList.add("is-visible");
    };

    if (!usePin) {
      const beatStart = centered ? "top 62%" : "top 82%";
      const beatEnd = centered ? "bottom 38%" : "bottom 18%";

      const parts = [ghost, pinEl].filter(Boolean);
      gsapRef.set(parts, { opacity: 0, y: -40, filter: "blur(12px)" });
      if (panel) gsapRef.set(panel, { opacity: 0, x: xFrom, y: -40, rotate: rotFrom * 0.65, filter: "blur(12px)" });
      if (words.length) gsapRef.set(words, { opacity: 0, y: -14, filter: "blur(8px)" });
      const tl = gsapRef.timeline({
        scrollTrigger: {
          trigger: card,
          start: beatStart,
          end: beatEnd,
          toggleActions: "play reverse play reverse",
          onEnter: () => onActive(true),
          onLeave: () => onActive(false),
          onEnterBack: () => onActive(true),
          onLeaveBack: () => onActive(false),
        },
      });
      if (ghost) tl.to(ghost, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, ease: "power3.out" }, 0);
      if (pinEl) tl.to(pinEl, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.12);
      if (panel) {
        tl.to(
          panel,
          { opacity: 1, x: 0, rotate: 0, y: 0, filter: "blur(0px)", duration: 1, ease: "power3.out" },
          0.18,
        );
      }
      if (words.length) {
        tl.to(
          words,
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.65, stagger: 0.028, ease: "power2.out" },
          0.38,
        );
      }
      trackTweenScrollTrigger(/** @type {import('gsap').core.Tween} */ (tl));
      return;
    }

    if (ghost) gsapRef.set(ghost, { opacity: 0, scale: 0.9, filter: "blur(10px)" });
    if (pinEl) gsapRef.set(pinEl, { opacity: 0, scale: 0.4 });
    if (panel) gsapRef.set(panel, { opacity: 0, x: xFrom, rotate: rotFrom, filter: "blur(14px)" });
    if (words.length) gsapRef.set(words, { opacity: 0, y: -14, filter: "blur(7px)" });

    const tl = gsapRef.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top top",
        end: "+=92%",
        pin: true,
        pinSpacing: true,
        scrub: SENAC_SCRUB_PIN_CARD,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => onActive(true),
        onLeave: () => onActive(false),
        onEnterBack: () => onActive(true),
        onLeaveBack: () => onActive(false),
      },
    });

    if (ghost) tl.to(ghost, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, 0);
    if (pinEl) tl.to(pinEl, { opacity: 1, scale: 1, duration: 0.14, ease: "back.out(2)" }, 0.1);
    if (panel) {
      tl.to(
        panel,
        { opacity: 1, x: 0, rotate: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" },
        0.16,
      );
    }
    if (words.length) {
      tl.to(
        words,
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.26, stagger: 0.022, ease: "power2.out" },
        0.34,
      );
    }
    tl.to({}, { duration: 0.26 }, 0.58);
    if (panel) {
      tl.to(
        panel,
        { opacity: 0.2, y: -28, filter: "blur(10px)", duration: 0.22, ease: "power2.in" },
        0.78,
      );
    }
    if (ghost) tl.to(ghost, { opacity: 0.15, y: -20, filter: "blur(8px)", duration: 0.2, ease: "power2.in" }, 0.8);
    if (pinEl) tl.to(pinEl, { opacity: 0.25, scale: 0.75, duration: 0.16 }, 0.84);

    trackTweenScrollTrigger(/** @type {import('gsap').core.Tween} */ (tl));
  }

  /**
   * @param {HTMLElement} chamber
   * @param {import('gsap').GSAP} gsapRef
   * @param {boolean} usePin
   */
  function bindObservatoryChamber(chamber, gsapRef, usePin) {
    const readingFlow = document.body.classList.contains("senac-reading-flow");
    const words = chamber.querySelectorAll(".sq-word");
    const cite = chamber.querySelector("cite");
    const glyph = chamber.querySelector(".quote-break--title > span");

    const onActive = (/** @type {boolean} */ active) => {
      chamber.classList.toggle("senac-scene--active", active);
      if (active) chamber.classList.add("is-visible");
    };

    gsapRef.set(chamber, { opacity: 1, filter: "none" });
    if (words.length) {
      gsapRef.set(words, { opacity: 0, y: -36, filter: "blur(16px)" });
    }
    if (cite) gsapRef.set(cite, { opacity: 0, y: -20 });
    if (glyph) gsapRef.set(glyph, { opacity: 0, scale: 0.88 });

    const stVars = usePin
      ? {
          trigger: chamber,
          start: "top top",
          end: "+=115%",
          pin: true,
          pinSpacing: true,
          scrub: SENAC_SCRUB_PIN_CHAMBER,
          anticipatePin: 1,
        }
      : {
          trigger: chamber,
          start: document.body.classList.contains("senac-reading-flow") ? "top 58%" : "top 78%",
          end: document.body.classList.contains("senac-reading-flow") ? "bottom 42%" : "bottom 22%",
          toggleActions: "play reverse play reverse",
        };

    const tl = gsapRef.timeline({
      scrollTrigger: {
        ...stVars,
        invalidateOnRefresh: true,
        onEnter: () => onActive(true),
        onLeave: () => onActive(false),
        onEnterBack: () => onActive(true),
        onLeaveBack: () => onActive(false),
      },
    });

    if (glyph) tl.to(glyph, { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" }, 0);
    if (words.length) {
      tl.to(
        words,
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.04, ease: "power2.out" },
        glyph ? 0.08 : 0,
      );
    }
    if (cite) tl.to(cite, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, readingFlow ? 0.38 : 0.42);
    if (usePin) {
      tl.to({}, { duration: 0.35 }, 0.55);
      if (words.length) {
        tl.to(
          words,
          {
            opacity: readingFlow ? 0 : 0.12,
            y: readingFlow ? 10 : -24,
            filter: readingFlow ? "none" : "blur(10px)",
            duration: 0.28,
            stagger: 0.02,
            ease: "power2.in",
          },
          0.82,
        );
      }
      if (cite) tl.to(cite, { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, 0.86);
    }

    trackTweenScrollTrigger(/** @type {import('gsap').core.Tween} */ (tl));
  }

  /**
   * @param {HTMLElement} reliquary
   * @param {import('gsap').GSAP} gsapRef
   * @param {boolean} usePin
   */
  function bindObservatoryReliquary(reliquary, gsapRef, usePin) {
    const media = reliquary.querySelector(".archive-media");
    const cap = reliquary.querySelector("figcaption");
    const img = reliquary.querySelector("img");

    const onActive = (/** @type {boolean} */ active) => {
      reliquary.classList.toggle("senac-scene--active", active);
      if (active) reliquary.classList.add("is-visible");
    };

    gsapRef.set(reliquary, { opacity: 0, scale: 0.94, filter: "blur(14px)" });
    if (media) gsapRef.set(media, { scale: 1.08 });
    if (cap) gsapRef.set(cap, { opacity: 0, y: 16 });

    const stVars = usePin
      ? {
          trigger: reliquary,
          start: "top top",
          end: "+=78%",
          pin: true,
          pinSpacing: true,
          scrub: SENAC_SCRUB_PIN_RELIC,
          anticipatePin: 1,
        }
      : {
          trigger: reliquary,
          start: document.body.classList.contains("senac-reading-flow") ? "top 60%" : "top 80%",
          end: document.body.classList.contains("senac-reading-flow") ? "bottom 40%" : "bottom 20%",
          toggleActions: "play reverse play reverse",
        };

    const tl = gsapRef.timeline({
      scrollTrigger: {
        ...stVars,
        invalidateOnRefresh: true,
        onEnter: () => onActive(true),
        onLeave: () => onActive(false),
        onEnterBack: () => onActive(true),
        onLeaveBack: () => onActive(false),
      },
    });

    tl.to(reliquary, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.32, ease: "power3.out" }, 0);
    if (media) tl.to(media, { scale: 1, duration: 0.38, ease: "power2.out" }, 0.1);
    if (img) tl.fromTo(img, { y: -18 }, { y: 12, duration: 0.45, ease: "none" }, 0.12);
    if (cap) tl.to(cap, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.22);
    if (usePin) {
      tl.to({}, { duration: 0.22 }, 0.52);
      tl.to(reliquary, { opacity: 0.15, scale: 0.96, filter: "blur(10px)", duration: 0.24, ease: "power2.in" }, 0.76);
    }

    trackTweenScrollTrigger(/** @type {import('gsap').core.Tween} */ (tl));
  }

  /** @type {HTMLElement[]} */
  let senacStellarScenes = [];

  function refreshSenacStellarScenes() {
    senacStellarScenes = Array.from(
      document.querySelectorAll("#timeline-start.timeline > .senac-scene"),
    ).filter((n) => n instanceof HTMLElement);
  }

  /** Nœud actif sur la frise (lecture stellaire, sans GSAP). */
  function updateSenacStellarFocus(scrollY) {
    const timeline = document.getElementById("timeline-start");
    if (!timeline || !senacStellarScenes.length) return;

    const vh = window.innerHeight || 1;
    const focusY = scrollY + vh * 0.44;
    let best = /** @type {HTMLElement | null} */ (null);
    let bestDist = Infinity;

    for (const el of senacStellarScenes) {
      const mid = el.offsetTop + el.offsetHeight * 0.48;
      const d = Math.abs(mid - focusY);
      if (d < bestDist) {
        bestDist = d;
        best = el;
      }
    }

    const max = getScrollMax();
    const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    timeline.style.setProperty("--senac-stellar-progress", progress.toFixed(4));

    if (!best) return;
    const idx = senacStellarScenes.indexOf(best);
    timeline.style.setProperty("--senac-stellar-active", String(Math.max(0, idx)));
    for (const el of senacStellarScenes) {
      el.classList.toggle("senac-scene--active", el === best);
    }
  }

  function recordObservatorySceneMeta() {
    senacObservatoryScenes = [];
    const timeline = document.getElementById("timeline-start");
    if (!timeline) return;

    timeline.querySelectorAll(":scope > .senac-scene").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      let kind = "card";
      const holdMs = senacSceneCinemaHoldMs(node);
      if (node.classList.contains("senac-scene--chamber")) {
        kind = "chamber";
      } else if (node.classList.contains("senac-scene--reliquary")) {
        kind = "reliquary";
      }

      senacObservatoryScenes.push({ el: node, kind, holdMs, scrollY: node.offsetTop });
    });

    senacObservatoryScenes.sort((a, b) => a.scrollY - b.scrollY);
  }

  /** holdMs cinéma selon le type de scène frise. */
  function senacSceneCinemaHoldMs(/** @type {HTMLElement} */ node) {
    if (node.classList.contains("senac-scene--chamber")) return 2200;
    if (node.classList.contains("senac-scene--reliquary")) return 1100;
    return 0;
  }

  /** Cible scroll : cadre le contenu au centre du viewport (pas le bord haut de chaque bloc). */
  function senacCinemaTargetY(/** @type {HTMLElement} */ el) {
    const maxY = getScrollMax();
    const viewH = window.innerHeight || 800;
    if (el.classList.contains("senac-act2-garde")) {
      const slab = Math.max(el.offsetHeight, viewH);
      const focus = el.offsetTop + slab * 0.5 - viewH * 0.5;
      return Math.min(maxY, Math.max(0, focus));
    }
    const focus = el.offsetTop + el.offsetHeight * 0.38 - viewH * 0.4;
    return Math.min(maxY, Math.max(0, focus));
  }

  function senacCinemaMinWaypointGap() {
    return Math.max(100, (window.innerHeight || 700) * 0.14);
  }

  /**
   * Waypoints Cinéma : garde, hero, chambres & reliquaires seulement (pas chaque carte).
   * Défilement continu entre eux — pauses uniquement sur les temps forts.
   */
  function getSenacCinemaWaypoints() {
    const raw = /** @type {{ y: number, holdMs: number }[]} */ ([]);
    const garde = document.querySelector(".senac-act2-garde");
    if (garde instanceof HTMLElement) {
      raw.push({ y: senacCinemaTargetY(garde), holdMs: 1600 });
    }
    const hero = document.querySelector("header.hero");
    if (hero instanceof HTMLElement) {
      raw.push({ y: senacCinemaTargetY(hero), holdMs: 1200 });
    }

    const timeline = document.getElementById("timeline-start");
    if (timeline) {
      timeline.querySelectorAll(":scope > .senac-scene").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (
          !node.classList.contains("senac-scene--chamber") &&
          !node.classList.contains("senac-scene--reliquary")
        ) {
          return;
        }
        const holdMs = senacSceneCinemaHoldMs(node);
        if (holdMs < 1) return;
        raw.push({ y: senacCinemaTargetY(node), holdMs });
      });
    } else {
      senacObservatoryScenes.forEach((s) => {
        if (s.kind !== "chamber" && s.kind !== "reliquary") return;
        const el = s.el && s.el.isConnected ? s.el : null;
        const y = el ? senacCinemaTargetY(el) : Math.max(0, s.scrollY);
        raw.push({ y, holdMs: s.holdMs });
      });
    }

    raw.sort((a, b) => a.y - b.y);

    const gap = senacCinemaMinWaypointGap();
    const points = /** @type {{ y: number, holdMs: number }[]} */ ([]);
    let lastY = -Infinity;
    for (const p of raw) {
      if (p.y <= lastY + gap) continue;
      points.push(p);
      lastY = p.y;
    }

    const maxY = getScrollMax();
    if (!points.length || points[points.length - 1].y < maxY - 24) {
      if (maxY > lastY + gap) {
        points.push({ y: maxY, holdMs: 500 });
      }
    }
    return points;
  }

  function refreshSenacCinemaWaypointsCache() {
    senacCinemaWaypointsCache = getSenacCinemaWaypoints();
  }

  function getSenacCinemaWaypointsCached() {
    if (!senacCinemaWaypointsCache) refreshSenacCinemaWaypointsCache();
    return senacCinemaWaypointsCache;
  }

  function applyCinemaLenisProfile(/** @type {boolean} */ on) {
    const lenis = yearGaugeLenis;
    if (!lenis || !lenis.options) return;
    if (on) {
      if (senacCinemaLenisLerpSaved == null) {
        senacCinemaLenisLerpSaved = lenis.options.lerp;
      }
      lenis.options.lerp = 1;
      lenis.options.smoothWheel = false;
    } else if (senacCinemaLenisLerpSaved != null) {
      lenis.options.lerp = senacCinemaLenisLerpSaved;
      lenis.options.smoothWheel = true;
      senacCinemaLenisLerpSaved = null;
    }
  }

  /**
   * Acte II : DOM observatoire + révélations CSS (IntersectionObserver).
   * Pas de ScrollTrigger par scène (blur/stagger = lag en iframe).
   */
  let senacGardeScrollCueReady = false;

  /** Flèche pied de garde Acte II : scroll vers le hero + masquage après défilement. */
  function initAct2GardeScrollCue() {
    if (senacGardeScrollCueReady) return;
    const garde = document.querySelector(".senac-act2-garde");
    const cue = document.querySelector(".senac-act2-garde__scroll-cue");
    if (!(garde instanceof HTMLElement) || !(cue instanceof HTMLButtonElement)) return;
    senacGardeScrollCueReady = true;

    const hero = document.querySelector("header.hero");
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      cue.classList.add("is-hidden");
      notifySenacParentUserScrolled();
    }

    function scrollToContent() {
      const target =
        hero instanceof HTMLElement
          ? hero
          : document.querySelector("#timeline-start") || document.querySelector(".chapter-two header.hero");
      const y =
        target instanceof HTMLElement
          ? Math.max(0, target.offsetTop - 8)
          : Math.max(0, garde.offsetHeight * 0.92);
      const lenis = yearGaugeLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(y, { duration: reducedMotion ? 0 : 1.15, easing: (t) => 1 - (1 - t) ** 3 });
      } else {
        window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
      }
      dismiss();
    }

    cue.addEventListener("click", () => scrollToContent());

    function onWheel(/** @type {WheelEvent} */ e) {
      if (e.deltaY > 0.5) dismiss();
    }

    function onScroll() {
      const y = getScrollY();
      const threshold = Math.max(48, garde.offsetHeight * 0.12);
      if (y > threshold) dismiss();
    }

    let lastTouchY = /** @type {number | null} */ (null);

    function onTouchStart(/** @type {TouchEvent} */ e) {
      lastTouchY = e.touches[0] ? e.touches[0].clientY : null;
    }

    function onTouchMove(/** @type {TouchEvent} */ e) {
      if (lastTouchY == null || !e.touches[0]) return;
      const dy = lastTouchY - e.touches[0].clientY;
      lastTouchY = e.touches[0].clientY;
      if (dy > 4) dismiss();
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    onScroll();
  }

  function initSenacAct2ScrollMotion() {
    if (senacAct2MotionReady) return;

    killSenacAct2ScrollMotion();
    document.documentElement.classList.remove("senac-gsap-reveal");
    prepareSenacObservatoryDom();

    if (!reducedMotion) {
      document.documentElement.classList.add("senac-observatory-motion");
    }

    initRevealFallback();
    initAct2GardeScrollCue();
    refreshSenacStellarScenes();
    recordObservatorySceneMeta();
    updateSenacStellarFocus(getScrollY());
    senacAct2MotionReady = true;
  }

  function scheduleSenacAct2ScrollMotion() {
    if (senacAct2MotionInitScheduled) return;
    senacAct2MotionInitScheduled = true;
    void initSenacAct2ScrollMotion();
  }

  const SENAC_NAV_PICTO_BY_TARGET = {
    "intro-video": "video",
    "act1-map": "map",
    "act3-writing": "quill",
  };

  /** Pictogrammes ludiques sur les liens d’étape (`data-nav-picto` ou cible). */
  function senacNavPictoSvg(/** @type {string} */ kind) {
    const k = kind || "compass";
    const svgOpen =
      '<svg class="senac-nav-picto" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">';
    const icons = {
      video: `${svgOpen}<rect x="3.5" y="7" width="17" height="11" rx="3" stroke="currentColor" stroke-width="1.35" fill="rgba(197,160,89,0.12)"/><path d="M10.2 10.2v3.6l4.8-1.8-4.8-1.8z" fill="currentColor"/><circle cx="18" cy="8.5" r="1.1" fill="currentColor" opacity="0.7"/></svg>`,
      map: `${svgOpen}<path d="M5 8.5c2.5-1.2 4.5-1.2 7 0s4.5 1.2 7 0v9c-2.5 1.2-4.5 1.2-7 0s-4.5-1.2-7 0v-9z" stroke="currentColor" stroke-width="1.25" fill="rgba(197,160,89,0.1)"/><circle cx="12" cy="11" r="1.6" fill="currentColor"/><path d="M12 6.5l.9 1.7 1.9.3-1.4 1.3.3 1.9-1.7-.9-1.7.9.3-1.9-1.4-1.3 1.9-.3.9-1.7z" fill="currentColor" opacity="0.55"/></svg>`,
      quill: `${svgOpen}<path d="M6 18c4-6 8-9 13-11-.5 5-3 9-8 12l-1 2-4-3z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="rgba(197,160,89,0.15)"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="7.5" cy="17" r="1.2" fill="currentColor"/></svg>`,
      star: `${svgOpen}<path d="M12 4.5l1.2 3.6h3.8l-3.1 2.3 1.2 3.6L12 12.2 8.9 14l1.2-3.6-3.1-2.3h3.8L12 4.5z" fill="currentColor"/><circle cx="18.5" cy="6" r="1" fill="currentColor" opacity="0.5"/></svg>`,
      dune: `${svgOpen}<path d="M4 16c3-2 6-2.5 8-1.5s5 .5 8-1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="17" cy="7.5" r="2.2" stroke="currentColor" stroke-width="1.1" fill="rgba(197,160,89,0.2)"/><path d="M6 19h12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>`,
      compass: `${svgOpen}<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.2" fill="rgba(197,160,89,0.08)"/><path d="M12 6.5l1.2 3.2 3.3.4-2.5 2 1 3.2-2.9-1.6-2.9 1.6 1-3.2-2.5-2 3.3-.4L12 6.5z" fill="currentColor"/></svg>`,
    };
    return icons[k] || icons.compass;
  }

  /** Dernière sauvegarde parent (Acte I / III) pour les raccourcis `[data-senac-navigate]`. */
  let senacCrossNavSave = { act1Completed: false, act3Unlocked: false };

  function isSenacNavTargetLocked(/** @type {string} */ target) {
    if (target === "intro-video" || target === "act1-map") return !senacCrossNavSave.act1Completed;
    if (target === "act3-writing") return !senacCrossNavSave.act3Unlocked;
    return false;
  }

  function applySenacCrossNavSave(/** @type {Record<string, unknown> | undefined} */ flags) {
    if (flags && typeof flags === "object") {
      senacCrossNavSave = {
        act1Completed: flags.act1Completed === true,
        act3Unlocked: flags.act3Unlocked === true,
      };
    }
    document.querySelectorAll("[data-senac-navigate]").forEach((node) => {
      if (!(node instanceof HTMLButtonElement)) return;
      const target = node.getAttribute("data-senac-navigate") || "";
      const locked = isSenacNavTargetLocked(target);
      node.disabled = locked;
      node.classList.toggle("is-save-locked", locked);
      if (locked) node.setAttribute("aria-disabled", "true");
      else node.removeAttribute("aria-disabled");
    });

    const heroHint = document.querySelector(
      ".senac-cross-nav-wrap--hero .senac-cross-nav__hint",
    );
    if (heroHint instanceof HTMLElement) {
      const key = senacCrossNavSave.act1Completed ? "cross_nav_hint" : "cross_nav_hint_locked";
      heroHint.setAttribute("data-i18n", key);
      const label = typeof window.SENAC_T === "function" ? window.SENAC_T(key) : "";
      if (label) heroHint.textContent = label;
    }
  }

  function enhanceSenacNavPictos() {
    document.querySelectorAll("[data-senac-navigate]").forEach((node) => {
      if (!(node instanceof HTMLButtonElement)) return;
      const inHeroNav = Boolean(node.closest(".senac-cross-nav-wrap--hero"));
      if (!inHeroNav) node.classList.add("senac-cross-nav__chip");
      if (!node.querySelector(".senac-nav-picto")) {
        const target = node.getAttribute("data-senac-navigate") || "";
        const kind =
          node.getAttribute("data-nav-picto") ||
          SENAC_NAV_PICTO_BY_TARGET[/** @type {keyof typeof SENAC_NAV_PICTO_BY_TARGET} */ (target)] ||
          "compass";
        node.insertAdjacentHTML("afterbegin", senacNavPictoSvg(kind));
      }
      if (!node.querySelector(".senac-nav-label")) {
        const picto = node.querySelector(".senac-nav-picto");
        const label = document.createElement("span");
        label.className = "senac-nav-label";
        Array.from(node.childNodes).forEach((child) => {
          if (child !== picto) label.appendChild(child);
        });
        if (label.childNodes.length) node.appendChild(label);
      }
    });
  }

  /** Acte II ↔ SPA parent : boutons `[data-senac-navigate]` (intro-video, act1-map, act3-writing). */
  function initSenacParentNavigateBridge() {
    document.addEventListener(
      "click",
      (e) => {
        const el =
          e.target instanceof Element ? e.target.closest("[data-senac-navigate]") : null;
        if (!el) return;
        const raw = el.getAttribute("data-senac-navigate");
        if (
          raw !== "intro-video" &&
          raw !== "act1-map" &&
          raw !== "act3-writing"
        ) {
          return;
        }
        if (isSenacNavTargetLocked(raw)) return;
        e.preventDefault();
        const origin = window.location.origin;
        if (raw === "act3-writing") {
          if (window.parent !== window) {
            try {
              window.parent.postMessage(
                { type: "senac-navigate", target: "act3-writing" },
                origin
              );
            } catch (_) {
              /* ignore */
            }
          } else {
            bootstrapSpaActIIIEntry();
          }
          return;
        }
        if (window.parent !== window) {
          try {
            window.parent.postMessage({ type: "senac-navigate", target: raw }, origin);
          } catch (_) {
            /* ignore */
          }
        } else {
          try {
            window.location.assign(origin + "/");
          } catch (_) {
            window.location.href = "/";
          }
        }
      },
      true,
    );
  }

  /** Progression acte II (parent React) : défilement jusqu'à la ligne de temps. */
  function initAct2QuestBridge() {
    if (window.parent === window) return;
    const origin = window.location.origin;
    let scrollReported = false;

    function postQuest(step) {
      window.parent.postMessage({ type: "senac-quest", step }, origin);
    }

    const timeline = document.getElementById("timeline-start");
    if (timeline) {
      const scrollIo = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || scrollReported) continue;
            scrollReported = true;
            postQuest("scroll");
            scrollIo.disconnect();
          }
        },
        { threshold: 0.06, rootMargin: "0px 0px -8% 0px" }
      );
      scrollIo.observe(timeline);
    }
  }

  /** Chapitre II : ambiance oud en boucle (démarre après interaction, contraintes autoplay navigateur). */
  function initChapterTwoAmbience() {
    const audio = new Audio(SENAC_AMBIENCE_SRC_PUBLIC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audio.setAttribute("playsinline", "");

    let started = false;
    /** Évite de spammer audio.play() à chaque frame si le navigateur bloque encore la lecture. */
    let lastPlayAttempt = 0;
    let fadeTimer = 0;
    let rafId = 0;
    let hidden = document.hidden;
    const MAX_GAIN = 0.42;
    let parentVolume = 0.85;
    let parentUnlocked = false;
    let wantedVolume = 0;

    function hasChosenEntryMode() {
      return document.documentElement.getAttribute("data-senac-mode-chosen") === "1";
    }

    function clearFadeTimer() {
      if (fadeTimer) {
        window.clearInterval(fadeTimer);
        fadeTimer = 0;
      }
    }

    function fadeTo(target, durationMs) {
      clearFadeTimer();
      const from = audio.volume;
      const to = Math.min(1, Math.max(0, target));
      if (Math.abs(to - from) < 0.002 || durationMs <= 0) {
        audio.volume = to;
        return;
      }
      const t0 = performance.now();
      fadeTimer = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - t0) / durationMs);
        audio.volume = from + (to - from) * t;
        if (t >= 1) clearFadeTimer();
      }, 32);
    }

    function targetVolumeFromParent() {
      const v = Math.min(1, Math.max(0, parentVolume));
      return v * MAX_GAIN;
    }

    /**
     * 0 = musique pleine, 1 = musique "échappée".
     * Débute avant le chapitre III et atteint 1 au cœur de la section.
     */
    function chapterThreeEscape01() {
      const section = document.getElementById("chapitre-3");
      if (!(section instanceof HTMLElement)) return 0;
      const vh = window.innerHeight || 1;
      const top = section.getBoundingClientRect().top;
      /** Fenêtre plus large pour une descente/retour bien plus douce. */
      const start = vh * 1.08;
      const end = vh * 0.06;
      const t = Math.min(1, Math.max(0, (start - top) / Math.max(1, start - end)));
      const smooth = t * t * (3 - 2 * t);
      /** Courbe plus organique (évite la sensation de seuil à l'entrée). */
      return Math.pow(smooth, 1.65);
    }

    function computeWantedVolume() {
      if (!hasChosenEntryMode()) return 0;
      if (!parentUnlocked || hidden) return 0;
      const base = targetVolumeFromParent();
      if (base < 0.002) return 0;

      /** Tout en haut : ambiance retenue ; le volume se déploie en scrollant. */
      const yVol = yearGaugeLenis && typeof yearGaugeLenis.scroll === "number" ? yearGaugeLenis.scroll : getScrollY();
      const scroll01 = senacScrollRatio(yVol);
      const topWindow = Math.min(1, scroll01 / 0.2);
      const topEase = topWindow * topWindow * (3 - 2 * topWindow);
      const topMul = 0.24 + topEase * 0.76;

      const escape = chapterThreeEscape01();
      /** En chapitre III, on laisse un souffle résiduel au lieu d’un cut sec. */
      const chapterMul = 1 - escape * 0.9;
      return base * chapterMul * topMul;
    }

    function startUpdateLoop() {
      if (rafId) return;
      const tick = () => {
        wantedVolume = computeWantedVolume();

        /**
         * Lecture : dès que le parent a débloqué (`parentUnlocked`) et qu’on veut du volume,
         * on retente play() (throttle) - évite de dépendre uniquement du 1er postMessage,
         * souvent envoyé avant que cet écouteur soit prêt.
         */
        if (hasChosenEntryMode() && parentUnlocked && wantedVolume > 0.003 && audio.paused) {
          const now = performance.now();
          if (now - lastPlayAttempt > 560) {
            lastPlayAttempt = now;
            void audio
              .play()
              .then(() => {
                started = true;
              })
              .catch(() => {});
          }
        }

        /** Inertie plus lente pour lisser l’aller-retour autour du seuil du chapitre III. */
        const k = hidden ? 0.08 : 0.045;
        audio.volume += (wantedVolume - audio.volume) * k;

        if (wantedVolume < 0.002 && audio.volume < 0.006 && !audio.paused) {
          audio.pause();
        }

        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    async function tryStart() {
      if (!hasChosenEntryMode()) return;
      if (started && !audio.paused) {
        startUpdateLoop();
        return;
      }
      started = true;
      try {
        await audio.play();
      } catch (_) {
        started = false;
        startUpdateLoop();
        return;
      }
      fadeTo(0, 0);
      startUpdateLoop();
    }

    function onInteract() {
      void tryStart();
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
    }

    function onVisibility() {
      hidden = document.hidden;
      if (!hidden && parentUnlocked && hasChosenEntryMode()) {
        void audio.play().catch(() => {});
      }
    }

    function onParentAudioMessage(event) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== "senac-audio") return;
      if (typeof data.volume === "number" && Number.isFinite(data.volume)) {
        parentVolume = Math.min(1, Math.max(0, data.volume));
      }
      parentUnlocked = Boolean(data.unlocked);
      if (parentUnlocked && hasChosenEntryMode()) {
        void tryStart();
      }
    }

    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("message", onParentAudioMessage);

    /** Boucle toujours active : volume + retry play si le 1er envoi parent est arrivé trop tôt. */
    startUpdateLoop();

    /** Demande l’état audio au parent une fois l’écouteur `message` en place (évite messages perdus). */
    if (window.parent !== window) {
      try {
        window.parent.postMessage({ type: "senac-request-audio" }, window.location.origin);
      } catch (_) {
        /* ignore */
      }
    }

    window.addEventListener("beforeunload", () => {
      clearFadeTimer();
      if (rafId) cancelAnimationFrame(rafId);
      audio.pause();
      audio.src = "";
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("message", onParentAudioMessage);
    });
  }

  /**
   * Choix d'entrée Cinéma / Exploration + toggle permanent bas-gauche.
   * Mode Cinéma : défilement auto jusqu’en bas ; molette/trackpad/barre restent actifs pour ne pas casser Lenis /
   * l’accès au bas de page. Après lecture, passer en Exploration (toggle bas-gauche) poursuit parcours.
   */
  function initScrollModeChoice() {
    const choiceEl  = document.getElementById("scroll-mode-choice");
    const backdropEl= document.getElementById("smc-backdrop");
    const toggleEl  = document.getElementById("scroll-mode-toggle");
    const cinemaBtn = document.getElementById("smc-cinema");
    const exploreBtn= document.getElementById("smc-explore");
    const tmtCinema = document.getElementById("smt-cinema-btn");
    const tmtExplore= document.getElementById("smt-explore-btn");
    const tmtCinemaPauseChip = document.getElementById("smt-cinema-pause-chip");

    if (!choiceEl || !toggleEl || !cinemaBtn || !exploreBtn || !tmtCinema || !tmtExplore) return;

    /* ── État : scroll bloqué jusqu'à fermeture visuelle complète du modal ── */
    let mode = /** @type {"cinema"|"explore"|null} */ (null);
    /** Bloque entrées scroll tant que l'overlay (ou son fondu de sortie) peut encore être vu */
    let choiceOverlayScrollLock = true;
    let retryTimer = 0;
    let cinemaExploreCalloutEl = /** @type {HTMLElement|null} */ (null);
    /** Vitesse du défilement auto Cinéma (px/s) — cruise RAF, régulier entre les pauses. */
    const SPEED_PX_S = 26;
    const SCROLL_BLOCK_KEYS = new Set([
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " ",
      "Spacebar",
    ]);

    /* ── Cinéma : cruise RAF (vitesse constante) + pauses sur temps forts seulement ── */
    let cinemaWaypointIndex = 0;
    /** @type {"scroll"|"hold"} */
    let cinemaTourPhase = "scroll";
    let cinemaHoldUntil = 0;
    let cinemaLastFrameTs = 0;
    let senacCinemaScrolling = false;

    function stopCinemaRaf() {
      if (senacCinemaRafId) {
        cancelAnimationFrame(senacCinemaRafId);
        senacCinemaRafId = 0;
      }
      cinemaLastFrameTs = 0;
      senacCinemaScrolling = false;
    }

    senacCinemaOnResize = () => {
      if (mode !== "cinema") return;
      refreshSenacCinemaWaypointsCache();
      syncCinemaWaypointFromScroll();
    };

    function syncCinemaWaypointFromScroll() {
      const lenis = yearGaugeLenis;
      if (!lenis) return;
      const waypoints = getSenacCinemaWaypointsCached();
      if (!waypoints.length) {
        cinemaWaypointIndex = 0;
        return;
      }
      const scrollY = lenis.scroll;
      let idx = 0;
      while (idx < waypoints.length - 1 && waypoints[idx + 1].y <= scrollY + 16) {
        idx += 1;
      }
      while (idx < waypoints.length && waypoints[idx].y < scrollY - 20) {
        idx += 1;
      }
      cinemaWaypointIndex = Math.min(idx, waypoints.length - 1);
    }

    function haltCinemaLenisAnimation() {
      senacCinemaScrollGen += 1;
      const lenis = yearGaugeLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(lenis.scroll, { immediate: true, duration: 0 });
      }
    }

    function clearCinemaTourTimers() {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = 0;
      }
      if (senacCinemaChainTimer) {
        window.clearTimeout(senacCinemaChainTimer);
        senacCinemaChainTimer = 0;
      }
    }

    function updateCinemaToggleUi() {
      const paused = mode === "cinema" && senacCinemaPaused;
      tmtCinema.classList.toggle("is-paused", paused);
      document.documentElement.classList.toggle("senac-cinema-paused", paused);
      document.body.classList.toggle("senac-cinema-paused", paused);
      tmtCinema.setAttribute(
        "aria-pressed",
        mode === "cinema" && !paused ? "true" : "false",
      );
      const key = paused ? "smt_cinema_resume_title" : "smt_cinema_pause_title";
      const fallback = paused ? "Reprendre le défilement Cinéma" : "Pause — défilement Cinéma";
      const title =
        typeof window.SENAC_T === "function" ? window.SENAC_T(key) : fallback;
      tmtCinema.title = title || fallback;
      if (tmtCinemaPauseChip) {
        tmtCinemaPauseChip.hidden = !paused;
        const chipKey = "smt_cinema_paused";
        const chipFallback = "Pause";
        const chipLabel =
          typeof window.SENAC_T === "function" ? window.SENAC_T(chipKey) : chipFallback;
        if (chipLabel) tmtCinemaPauseChip.textContent = chipLabel;
      }
    }

    function cinemaTourFrame(/** @type {number} */ now) {
      senacCinemaRafId = 0;
      if (mode !== "cinema" || senacCinemaPaused) return;

      const lenis = yearGaugeLenis;
      if (!lenis || typeof lenis.scrollTo !== "function") {
        senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
        return;
      }

      const waypoints = getSenacCinemaWaypointsCached();
      if (!waypoints.length || cinemaWaypointIndex >= waypoints.length) {
        stopCinemaRaf();
        showCinemaExploreCallout();
        return;
      }

      const maxY = getScrollMax();
      let curY = lenis.scroll;

      /* Waypoints déjà dépassés (scroll manuel ou recalcul) : avancer sans bloquer. */
      while (cinemaWaypointIndex < waypoints.length) {
        const aheadY = Math.min(Math.max(0, waypoints[cinemaWaypointIndex].y), maxY);
        if (aheadY >= curY - 12) break;
        cinemaWaypointIndex += 1;
        cinemaTourPhase = "scroll";
      }
      if (cinemaWaypointIndex >= waypoints.length) {
        stopCinemaRaf();
        showCinemaExploreCallout();
        return;
      }

      const wp = waypoints[cinemaWaypointIndex];
      const targetY = Math.min(Math.max(0, wp.y), maxY);
      curY = lenis.scroll;

      if (cinemaTourPhase === "hold") {
        senacCinemaScrolling = false;
        if (now < cinemaHoldUntil) {
          senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
          return;
        }
        cinemaWaypointIndex += 1;
        cinemaTourPhase = "scroll";
        cinemaLastFrameTs = 0;
        senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
        return;
      }

      const dist = targetY - curY;
      if (dist < 5) {
        senacCinemaScrolling = false;
        lenis.scrollTo(targetY, { immediate: true, duration: 0 });
        applyScrollDerivedState(targetY);
        cinemaTourPhase = "hold";
        cinemaHoldUntil = now + wp.holdMs;
        senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
        return;
      }

      const dt = cinemaLastFrameTs > 0 ? Math.min(50, now - cinemaLastFrameTs) : 16.7;
      cinemaLastFrameTs = now;
      const step = (SPEED_PX_S * dt) / 1000;
      const nextY = Math.min(targetY, curY + Math.max(step, 0.5));
      senacCinemaScrolling = true;
      lenis.scrollTo(nextY, { immediate: true, duration: 0 });
      applyScrollDerivedState(nextY);
      senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
    }

    function startAutoScroll() {
      clearCinemaTourTimers();
      stopCinemaRaf();
      senacCinemaPaused = false;
      cinemaTourPhase = "scroll";
      cinemaHoldUntil = 0;
      updateCinemaToggleUi();

      const lenis = yearGaugeLenis;
      if (!lenis || typeof lenis.scrollTo !== "function") {
        retryTimer = window.setTimeout(startAutoScroll, 150);
        return;
      }

      requestAnimationFrame(() => {
        if (mode !== "cinema") return;
        if (typeof lenis.resize === "function") lenis.resize();
        if (senacAct2MotionReady) recordObservatorySceneMeta();
        refreshSenacCinemaWaypointsCache();
        syncCinemaWaypointFromScroll();
        cinemaLastFrameTs = 0;
        senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
      });
    }

    function pauseCinemaTour() {
      if (mode !== "cinema" || senacCinemaPaused) return;
      senacCinemaPaused = true;
      clearCinemaTourTimers();
      stopCinemaRaf();
      haltCinemaLenisAnimation();
      updateCinemaToggleUi();
    }

    function resumeCinemaTour() {
      if (mode !== "cinema" || !senacCinemaPaused) return;
      senacCinemaPaused = false;
      updateCinemaToggleUi();
      syncCinemaWaypointFromScroll();
      cinemaTourPhase = "scroll";
      cinemaLastFrameTs = 0;
      senacCinemaRafId = requestAnimationFrame(cinemaTourFrame);
    }

    function toggleCinemaPause() {
      if (senacCinemaPaused) resumeCinemaTour();
      else pauseCinemaTour();
    }

    function stopAutoScroll() {
      clearCinemaTourTimers();
      stopCinemaRaf();
      senacCinemaPaused = false;
      cinemaTourPhase = "scroll";
      haltCinemaLenisAnimation();
      updateCinemaToggleUi();
    }

    /** Laisse passer clavier depuis boutons/champs interactifs uniquement */
    function cinemaKeyTargetIsPassthrough(el) {
      if (!el || typeof el.closest !== "function") return false;
      return !!(
        el.closest("button,a[href],[role='button'],input,textarea,select,[contenteditable='true']")
      );
    }

    /** Bloque entrées scroll seulement pendant l’overlay de choix (cinéma n’intercepte pas la molette pour éviter le « scrollbar oui / roue non »). */
    function scrollGuardActive() {
      return choiceOverlayScrollLock;
    }

    /** Scroll document autorisé dès le clic (le fondu visuel continue sans bloquer la molette). */
    function unlockParcheminDocumentScroll() {
      choiceOverlayScrollLock = false;
      document.documentElement.classList.remove("senac-choice-pending");
      document.body.classList.remove("senac-choice-pending");
      if (yearGaugeLenis && typeof yearGaugeLenis.start === "function") {
        yearGaugeLenis.start();
      } else {
        void ensureLenisInit().then((ok) => {
          if (ok && yearGaugeLenis && typeof yearGaugeLenis.start === "function") {
            yearGaugeLenis.start();
          }
        });
      }
    }

    function onWheelCinemaLock(e) {
      if (!scrollGuardActive()) return;
      e.preventDefault();
      try {
        e.stopImmediatePropagation();
      } catch (_) {
        /* ignore */
      }
    }

    function onTouchMoveCinemaLock(e) {
      if (!scrollGuardActive()) return;
      e.preventDefault();
      try {
        e.stopImmediatePropagation();
      } catch (_) {
        /* ignore */
      }
    }

    function onKeydownCinemaLock(e) {
      if (!scrollGuardActive()) return;
      if (!SCROLL_BLOCK_KEYS.has(e.key)) return;
      if (cinemaKeyTargetIsPassthrough(/** @type {Element} */ (e.target))) return;
      e.preventDefault();
    }

    document.addEventListener("wheel", onWheelCinemaLock, { passive: false, capture: true });
    document.addEventListener("touchmove", onTouchMoveCinemaLock, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", onKeydownCinemaLock);

    /** Molette en mode Cinéma : pause seulement pendant une pause sur image (pas en plein travel). */
    function onWheelDuringCinema(/** @type {WheelEvent} */ e) {
      if (choiceOverlayScrollLock || mode !== "cinema" || senacCinemaPaused) return;
      if (senacCinemaScrolling) return;
      if (Math.abs(e.deltaY) < 1.5) return;
      pauseCinemaTour();
    }
    document.addEventListener("wheel", onWheelDuringCinema, { passive: true });

    function onKeydownCinemaPause(/** @type {KeyboardEvent} */ e) {
      if (mode !== "cinema" || choiceOverlayScrollLock || e.repeat) return;
      if (e.key !== " " && e.key !== "Spacebar" && e.key !== "k" && e.key !== "K") return;
      if (cinemaKeyTargetIsPassthrough(/** @type {Element} */ (e.target))) return;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey || e.altKey)) return;
      if (e.key === " " || e.key === "Spacebar") e.preventDefault();
      toggleCinemaPause();
    }
    window.addEventListener("keydown", onKeydownCinemaPause);

    /**
     * Appel après init Lenis ou à chaque besoin : Lenis ignore overflow:hidden tant qu'il roule au RAF :
     * on stop() tant que l'overlay bloque encore la navigation.
     */
    function freezeLenisIfOverlayBlocks() {
      if (!choiceOverlayScrollLock || !yearGaugeLenis || typeof yearGaugeLenis.stop !== "function") return;
      yearGaugeLenis.stop();
    }
    senacFreezeLenisForChoiceOverlay = freezeLenisIfOverlayBlocks;
    freezeLenisIfOverlayBlocks();

    function postScrollModeChoiceOverlayToParent(open) {
      if (window.parent === window) return;
      try {
        window.parent.postMessage(
          { type: "senac-scroll-mode-choice-overlay", open },
          window.location.origin,
        );
      } catch (_) {
        /* ignore */
      }
    }

    function hideCinemaExploreCallout() {
      toggleEl.classList.remove("senac-highlight-explore");
      cinemaExploreCalloutEl = null;
      document.querySelectorAll(".senac-cinema-explore-callout").forEach((n) => n.remove());
    }

    /** Fin du cinéma : consigne + mise en avant du bouton Exploration (toggle bas-gauche). */
    function showCinemaExploreCallout() {
      if (mode !== "cinema") return;
      pauseCinemaTour();
      hideCinemaExploreCallout();

      const callout = document.createElement("aside");
      callout.className = "senac-cinema-explore-callout";
      callout.setAttribute("role", "status");
      const html =
        typeof window.SENAC_T === "function"
          ? window.SENAC_T("js_cinema_callout_html")
          : '<p class="senac-cinema-explore-callout__text">Pour continuer, appuie sur <strong>Exploration</strong> en bas à gauche.</p><div class="senac-cinema-explore-callout__arrows" aria-hidden="true"><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span><span class="senac-ce-arrow"></span></div>';
      callout.innerHTML = html || "";
      document.body.appendChild(callout);
      cinemaExploreCalloutEl = callout;

      toggleEl.classList.add("senac-highlight-explore");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => callout.classList.add("is-visible"));
      });
    }

    /** Durée sortie overlay choix (alignée CSS `.is-leaving`). */
    function scrollModeChoiceLeaveMs() {
      return typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 280
        : 1480;
    }

    /* ── Applique un mode ── */
    function setMode(newMode, fromChoice, opts) {
      const wasCinema = mode === "cinema";
      mode = newMode;
      senacScrollEntryMode = mode;
      const deferAutoScrollMs =
        opts && typeof opts.deferAutoScrollMs === "number" ? opts.deferAutoScrollMs : 0;

      hideCinemaExploreCallout();

      document.documentElement.classList.toggle("senac-cinema-mode", mode === "cinema");
      document.body.classList.toggle("senac-cinema-mode", mode === "cinema");

      tmtCinema.classList.toggle("is-active", mode === "cinema");
      tmtExplore.classList.toggle("is-active", mode === "explore");

      if (mode === "cinema") {
        senacCinemaPaused = false;
        applyCinemaLenisProfile(true);
        updateCinemaToggleUi();
        if (deferAutoScrollMs > 0) {
          window.setTimeout(startAutoScroll, deferAutoScrollMs);
        } else {
          startAutoScroll();
        }
      } else {
        stopAutoScroll();
        applyCinemaLenisProfile(false);
        senacCinemaWaypointsCache = null;
      }

      if (mode === "explore" && wasCinema && !fromChoice) {
        window.setTimeout(showScrollNudge, 160);
      }

      if (window.parent !== window && mode) {
        try {
          window.parent.postMessage({ type: "senac-entry-mode", mode }, window.location.origin);
        } catch (_) {
          /* ignore */
        }
      }
    }

    let skipChoiceOverlayShow = false;
    let choiceShowRaf = 0;

    /** ── Overlay de choix ── */
    function showChoice() {
      if (skipChoiceOverlayShow) return;
      if (backdropEl) backdropEl.classList.add("is-visible");
      choiceEl.classList.add("is-visible");
      markSenacBootReady();
      postScrollModeChoiceOverlayToParent(true);
      window.setTimeout(() => {
        try {
          choiceEl.focus({ focusVisible: false });
        } catch (_) {
          try {
            choiceEl.focus();
          } catch (_) {
            /* ignore */
          }
        }
      }, 50);
    }

    function showScrollNudge() {
      return;
      /* Cache le scroll-cue du hero pour éviter le doublon */
      const heroCue = document.querySelector("a.scroll-cue");
      if (heroCue instanceof HTMLElement) {
        heroCue.style.opacity = "0";
        heroCue.style.pointerEvents = "none";
      }

      const nudge = document.createElement("div");
      nudge.className = "senac-scroll-nudge";
      nudge.setAttribute("aria-hidden", "true");
      const nudgeLabel =
        typeof window.SENAC_T === "function"
          ? window.SENAC_T("js_scroll_nudge_label")
          : "Scroll vers le bas";
      /* Même picto que ScrollNudge.tsx : chevron vers le bas, sans cadre. */
      nudge.innerHTML = `
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" focusable="false">
          <g class="scroll-cue-chevrons-wrap" fill="none" stroke-linecap="round" stroke-linejoin="round"
            stroke="rgba(197,160,89,0.68)" stroke-width="1.35">
            <path d="M14 17.5 L22 25 L30 17.5"/>
          </g>
        </svg>
        <span class="senac-scroll-nudge-label">${nudgeLabel}</span>`;
      document.body.appendChild(nudge);

      /* Apparition */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => nudge.classList.add("is-visible"));
      });

      /* Disparaît dès un défilement vers le bas (comme ScrollNudge.tsx). */
      let nudgeGone = false;
      let lastScrollY = window.scrollY || 0;
      let lastTouchY = /** @type {number | null} */ (null);

      function removeNudge() {
        if (nudgeGone) return;
        nudgeGone = true;
        nudge.classList.add("is-leaving");
        window.removeEventListener("wheel", removeNudgeOnWheel);
        window.removeEventListener("scroll", removeNudgeOnScroll);
        window.removeEventListener("touchstart", onNudgeTouchStart);
        window.removeEventListener("touchmove", removeNudgeOnTouchMove);
        window.setTimeout(() => nudge.remove(), 550);
      }

      function removeNudgeOnWheel(/** @type {WheelEvent} */ e) {
        if (e.deltaY > 0.5) removeNudge();
      }

      function removeNudgeOnScroll() {
        const y = window.scrollY || 0;
        if (y > lastScrollY + 1) removeNudge();
        lastScrollY = y;
      }

      function onNudgeTouchStart(/** @type {TouchEvent} */ e) {
        lastTouchY = e.touches[0] ? e.touches[0].clientY : null;
      }

      function removeNudgeOnTouchMove(/** @type {TouchEvent} */ e) {
        if (lastTouchY == null || !e.touches[0]) return;
        const y = e.touches[0].clientY;
        const dy = y - lastTouchY;
        lastTouchY = y;
        if (dy < -4) removeNudge();
      }

      window.addEventListener("wheel", removeNudgeOnWheel, { passive: true });
      window.addEventListener("scroll", removeNudgeOnScroll, { passive: true });
      window.addEventListener("touchstart", onNudgeTouchStart, { passive: true });
      window.addEventListener("touchmove", removeNudgeOnTouchMove, { passive: true });
    }

    function pauseScrollModeDemoVideos() {
      choiceEl.querySelectorAll("video.smc-split-demo-video").forEach((node) => {
        if (!(node instanceof HTMLVideoElement)) return;
        try {
          node.pause();
          node.currentTime = 0;
        } catch (_) {
          /* ignore */
        }
      });
    }

    /** Survol fin (desktop) : lecture muted ; le texte reste en calque translucide (CSS). */
    function initScrollModeDemoHover() {
      const reduce =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hoverFine =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (reduce || !hoverFine) return;

      const vCin = cinemaBtn.querySelector("video.smc-split-demo-video");
      const vExp = exploreBtn.querySelector("video.smc-split-demo-video");
      if (!(vCin instanceof HTMLVideoElement) || !(vExp instanceof HTMLVideoElement)) return;

      /** @param {HTMLButtonElement} btn @param {HTMLVideoElement} v */
      function wire(btn, v) {
        btn.addEventListener(
          "pointerenter",
          () => {
            if (!choiceOverlayScrollLock) return;
            void v.play().catch(() => {});
          },
          { passive: true },
        );
        btn.addEventListener(
          "pointerleave",
          () => {
            try {
              v.pause();
              v.currentTime = 0;
            } catch (_) {
              /* ignore */
            }
          },
          { passive: true },
        );
      }
      wire(/** @type {HTMLButtonElement} */ (cinemaBtn), vCin);
      wire(/** @type {HTMLButtonElement} */ (exploreBtn), vExp);
    }

    /** Une seule frame d’entrée : garde sans blur ; hero + portrait (GSAP ou fallback). */
    function revealActTwoEntryNow() {
      const garde = document.querySelector(".senac-act2-garde[data-reveal]");
      const heroTargets = document.querySelectorAll(
        "header.hero [data-reveal], header.hero[data-reveal], header.hero .hero-portrait",
      );
      if (garde instanceof HTMLElement) {
        garde.style.setProperty("--stagger", "0");
        garde.classList.add("is-visible");
      }
      heroTargets.forEach((el) => {
        el.style.setProperty("--stagger", "0");
      });
      toggleEl.removeAttribute("hidden");
      toggleEl.classList.add("is-visible");

      if (reducedMotion) {
        heroTargets.forEach((el) => el.classList.add("is-visible"));
        return;
      }

      const gsapRef = yearGaugeGsap;
      if (gsapRef && heroTargets.length) {
        gsapRef.killTweensOf(heroTargets);
        gsapRef.fromTo(
          heroTargets,
          { opacity: 0, y: -56, filter: "blur(14px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.15,
            stagger: 0.08,
            ease: "power3.out",
            overwrite: "auto",
            onComplete: () => {
              heroTargets.forEach((el) => el.classList.add("is-visible"));
            },
          },
        );
      } else {
        heroTargets.forEach((el) => el.classList.add("is-visible"));
      }
    }

    /** Hero + atmosphère : révélés en chevauchement du fondu du volet (évite l’écran vide). */
    function revealActTwoChromeEarly() {
      if (document.documentElement.classList.contains("senac-choice-entered")) return;
      document.documentElement.classList.add("senac-choice-entered");
      requestAnimationFrame(() => {
        revealActTwoEntryNow();
      });
    }

    /**
     * Retour SPA (hydrate) : pas d’overlay Cinéma/Exploration ni fondu 1,4 s
     * (évite le flash d’une frame « choix » puis hero).
     */
    function completeEntryWithoutOverlay(chosen, scrollRatio) {
      skipChoiceOverlayShow = true;
      if (choiceShowRaf) {
        cancelAnimationFrame(choiceShowRaf);
        choiceShowRaf = 0;
      }
      pauseScrollModeDemoVideos();
      document.documentElement.setAttribute("data-senac-mode-chosen", "1");
      choiceOverlayScrollLock = false;
      if (backdropEl) {
        backdropEl.classList.remove("is-visible", "is-leaving");
        backdropEl.style.display = "none";
      }
      choiceEl.classList.remove("is-visible", "is-leaving");
      choiceEl.style.display = "none";
      document.documentElement.classList.add("senac-choice-entered");
      document.documentElement.classList.remove("senac-choice-pending", "senac-choice-leaving");
      document.body.classList.remove("senac-choice-pending");
      archWhiteoutNavTriggered = false;
      archWhiteoutSuppressed = false;
      setArchWhiteoutOpacity(0);
      markSenacBootReady();
      postScrollModeChoiceOverlayToParent(false);

      if (yearGaugeLenis && typeof yearGaugeLenis.start === "function") {
        yearGaugeLenis.start();
      }
      setMode(chosen, true, { deferAutoScrollMs: 0 });

      requestAnimationFrame(() => {
        revealActTwoEntryNow();
        if (senacAct2MotionReady) recordObservatorySceneMeta();
        applyScrollDerivedState(
          yearGaugeLenis && typeof yearGaugeLenis.scroll === "number"
            ? yearGaugeLenis.scroll
            : getScrollY(),
        );
        if (scrollRatio == null) return;
        const maxY = getScrollMax();
        const lenis = yearGaugeLenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(scrollRatio * maxY, { immediate: true });
          applyScrollDerivedState(lenis.scroll);
        } else {
          window.scrollTo(0, scrollRatio * maxY);
          applyScrollDerivedState(getScrollY());
        }
      });
    }

    function dismissChoice(chosen) {
      pauseScrollModeDemoVideos();
      document.documentElement.setAttribute("data-senac-mode-chosen", "1");
      unlockParcheminDocumentScroll();
      document.documentElement.classList.add("senac-choice-leaving");
      if (backdropEl) {
        backdropEl.classList.add("is-leaving");
      }
      choiceEl.classList.add("is-leaving");

      const unlockMs = scrollModeChoiceLeaveMs();
      const heroRevealMs = Math.max(
        220,
        Math.min(Math.round(unlockMs * 0.34), unlockMs - 72),
      );
      const cinemaScrollDelay = Math.round(unlockMs * 0.72);

      setMode(chosen, true, {
        deferAutoScrollMs: chosen === "cinema" ? cinemaScrollDelay : 0,
      });

      window.setTimeout(revealActTwoChromeEarly, heroRevealMs);

      window.setTimeout(() => {
        if (backdropEl) {
          backdropEl.classList.remove("is-visible", "is-leaving");
          backdropEl.style.display = "none";
        }
        choiceEl.classList.remove("is-visible", "is-leaving");
        choiceEl.style.display = "none";
        revealActTwoChromeEarly();
        document.documentElement.classList.remove("senac-choice-pending", "senac-choice-leaving");
        document.body.classList.remove("senac-choice-pending");
        archWhiteoutNavTriggered = false;
        archWhiteoutSuppressed = false;
        setArchWhiteoutOpacity(0);
        requestAnimationFrame(() => {
          revealActTwoEntryNow();
          postScrollModeChoiceOverlayToParent(false);
          markSenacBootReady();
          if (senacAct2MotionReady) recordObservatorySceneMeta();
          applyScrollDerivedState(
            yearGaugeLenis && typeof yearGaugeLenis.scroll === "number"
              ? yearGaugeLenis.scroll
              : getScrollY(),
          );
        });
      }, unlockMs);

      if (chosen === "explore") {
        window.setTimeout(showScrollNudge, Math.round(unlockMs * 0.88));
      }
    }

    let parentHydrateApplied = false;

    /** Parent SPA : restaurer mode d’entrée + ratio de scroll (après premier choix utilisateur, cf. `entryChosen`). */
    function applyParentHydrate(payload) {
      const p = payload || {};
      /** Retour SPA depuis l’acte III vers crédits : pas de voile blanc ni re-navigation arche. */
      if (p.suppressArchToAct3 === true) {
        archWhiteoutSuppressed = true;
        archWhiteoutNavTriggered = true;
        setArchWhiteoutOpacity(0);
      }
      const em =
        p.entryMode === "cinema" || p.entryMode === "explore" ? p.entryMode : "explore";
      const sr =
        typeof p.scrollRatio === "number" && Number.isFinite(p.scrollRatio)
          ? Math.min(1, Math.max(0, p.scrollRatio))
          : null;

      stopAutoScroll();
      completeEntryWithoutOverlay(em, sr);
    }

    window.addEventListener(
      "message",
      (event) => {
        if (event.origin !== window.location.origin) return;
        const d = event.data;
        if (!d || typeof d.type !== "string") return;
        if (d.type === "senac-reset-whiteout") {
          archWhiteoutSuppressed = false;
          archWhiteoutNavTriggered = false;
          setArchWhiteoutOpacity(0);
          return;
        }
        if (d.type !== "senac-hydrate") return;
        if (parentHydrateApplied) return;
        parentHydrateApplied = true;
        applyParentHydrate(d.payload);
      },
      false,
    );

    initScrollModeDemoHover();

    cinemaBtn.addEventListener("click",  () => dismissChoice("cinema"));
    exploreBtn.addEventListener("click", () => dismissChoice("explore"));

    /* Clavier dans l'overlay */
    choiceEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") dismissChoice("explore");
    });

    /* Toggle bas-gauche */
    tmtCinema.addEventListener("click", () => {
      if (mode === "cinema") {
        toggleCinemaPause();
        return;
      }
      setMode("cinema", false);
    });
    tmtExplore.addEventListener("click", () => {
      if (mode !== "explore") setMode("explore", false);
    });

    /* Bloque tout de suite ; l'overlay s'affiche au prochain frame (Lenis ignore overflow:hidden tant qu'il n'est pas stoppé). */
    if (!document.documentElement.classList.contains("senac-choice-pending")) {
      document.documentElement.classList.add("senac-choice-pending");
    }
    if (!document.body.classList.contains("senac-choice-pending")) {
      document.body.classList.add("senac-choice-pending");
    }

    void ensureLenisInit();

    choiceShowRaf = requestAnimationFrame(() => {
      choiceShowRaf = requestAnimationFrame(() => {
        choiceShowRaf = 0;
        showChoice();
      });
    });
  }

  setRevealStagger();
  void ensureLenisInit();
  root.style.setProperty("--senac-arch-visibility", "0");
  initSenacTemporalAmbience();
  initPointerGlow();
  initAtmosphereCanvas();
  measureArchPortalZoomRange();
  void scheduleSenacArchScene();
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => {
      measureArchPortalZoomRange();
      scheduleSenacArchScene();
    }, { timeout: 2400 });
  } else {
    setTimeout(() => scheduleSenacArchScene(), 500);
  }
  initSenacGlyphDust();
  initSmokeShader().then((ok) => {
    if (!ok) {
      document.body.classList.remove("senac-smoke-shader-active");
      document.body.classList.add("senac-smoke-fallback");
    }
  });
  initSenacParentNavigateBridge();
  enhanceSenacNavPictos();
  initAct2QuestBridge();
  initScrollModeChoice();
  initChapterTwoAmbience();

  import("https://esm.sh/gsap")
    .then((m) => {
      yearGaugeGsap = m.default;
      if (yearGaugeLenis) attachSenacLenisRaf(yearGaugeLenis);
      initScrollCue(yearGaugeGsap);
      applyScrollDerivedState(yearGaugeLenis ? yearGaugeLenis.scroll : getScrollY());
      tryScheduleSenacScrollTriggerEffects();
    })
    .catch(() => {
      initScrollCue(null);
      tryScheduleSenacScrollTriggerEffects();
    });

  /**
   * Divise chaque h2 et chaque blockquote en <span class="sq-word"> pour l'animation mot-par-mot.
   * Doit tourner avant initReveal() - les mots doivent etre en place quand is-visible est ajoute.
   */
  function initWordSplits() {
    /** Désactivé : centaines de .sq-word + timelines GSAP = saccades ; [data-reveal] + CSS suffisent. */
    return;

    /** Scinde un noeud texte en spans, en preservant les <br> */
    function splitNode(parent) {
      const nodes = Array.from(parent.childNodes);
      parent.innerHTML = "";
      let wordIndex = 0;
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/(\s+)/);
          words.forEach((chunk) => {
            if (/^\s+$/.test(chunk)) {
              parent.appendChild(document.createTextNode(chunk));
            } else if (chunk) {
              const sp = document.createElement("span");
              sp.className = "sq-word";
              sp.style.setProperty("--wi", String(wordIndex++));
              sp.textContent = chunk;
              parent.appendChild(sp);
            }
          });
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
          parent.appendChild(node.cloneNode());
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "EM") {
          const em = document.createElement("em");
          const words = node.textContent.split(/(\s+)/);
          words.forEach((chunk) => {
            if (/^\s+$/.test(chunk)) {
              em.appendChild(document.createTextNode(chunk));
            } else if (chunk) {
              const sp = document.createElement("span");
              sp.className = "sq-word";
              sp.style.setProperty("--wi", String(wordIndex++));
              sp.textContent = chunk;
              em.appendChild(sp);
            }
          });
          parent.appendChild(em);
        } else {
          parent.appendChild(node);
        }
      });
    }

    document.querySelectorAll(".story-panel h2").forEach((h2) => {
      splitNode(h2);
    });

    document.querySelectorAll(".quote-break:not(.quote-break--one-line) blockquote").forEach((bq) => {
      const nodes = Array.from(bq.childNodes);
      bq.innerHTML = "";
      let wordIndex = 0;
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/(\s+)/);
          words.forEach((chunk) => {
            if (/^\s+$/.test(chunk)) {
              bq.appendChild(document.createTextNode(chunk));
            } else if (chunk) {
              const sp = document.createElement("span");
              sp.className = "sq-word sq-word--quote";
              sp.style.setProperty("--wi", String(wordIndex++));
              sp.textContent = chunk;
              bq.appendChild(sp);
            }
          });
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
          bq.appendChild(node.cloneNode());
        } else {
          bq.appendChild(node);
        }
      });
    });
  }

  /** Ancre `#chapitre-3` : même URL racine que la SPA puis acte III. */
  function scrollToHashChapterIfNeeded() {
    try {
      const raw = (window.location.hash || "").replace(/^#/, "");
      if (raw === "chapitre-3") {
        if (window.parent !== window) {
          try {
            window.parent.postMessage(
              { type: "senac-navigate", target: "act3-writing" },
              window.location.origin
            );
          } catch (_) {
            /* ignore */
          }
          return;
        }
        bootstrapSpaActIIIEntry({ replace: true });
        return;
      }
      if (!raw) return;
      const el = document.getElementById(decodeURIComponent(raw));
      if (!(el instanceof HTMLElement)) return;
      const lx = yearGaugeLenis;
      if (lx && typeof lx.scrollTo === "function") {
        lx.scrollTo(el, { offset: 0, immediate: reducedMotion });
      } else {
        el.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
      }
    } catch {
      /* ignore */
    }
  }

  /** Après bascule FR ↔ AR (parent ou `storage`) : textes + découpe mot-par-mot. */
  function refreshSenacI18nDom() {
    if (typeof window.AL_RIHLA_APPLY_STATIC_I18N === "function") {
      window.AL_RIHLA_APPLY_STATIC_I18N();
    }
    initWordSplits();
    senacAct2MotionReady = false;
    senacAct2MotionInitScheduled = false;
    refreshSenacStellarScenes();
    scheduleSenacAct2ScrollMotion();
    document.querySelectorAll(".senac-cinema-explore-callout").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const html =
        typeof window.SENAC_T === "function"
          ? window.SENAC_T("js_cinema_callout_html")
          : "";
      if (html) node.innerHTML = html;
    });
    document.querySelectorAll(".senac-scroll-nudge-label").forEach((node) => {
      const label =
        typeof window.SENAC_T === "function"
          ? window.SENAC_T("js_scroll_nudge_label")
          : "";
      if (label) node.textContent = label;
    });
    enhanceSenacNavPictos();
    applySenacCrossNavSave(senacCrossNavSave);
  }

  window.AL_RIHLA_REFRESH_SENAC_DOM = refreshSenacI18nDom;

  window.addEventListener(
    "message",
    (event) => {
      if (event.origin !== window.location.origin) return;
      const d = event.data;
      if (d && d.type === "senac-language") {
        refreshSenacI18nDom();
        return;
      }
      if (d && d.type === "senac-cross-nav-save") {
        applySenacCrossNavSave(d);
      }
    },
    false,
  );

  ensureLenisInit().then((lenisOk) => {
    if (!lenisOk) {
      if (!reducedMotion) initImmersionFromWindowScroll();
      else applyScrollDerivedState(getScrollY());
    }
    senacPostLenisReady = true;
    initWordSplits();
    tryScheduleSenacScrollTriggerEffects();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToHashChapterIfNeeded();
      });
    });
  });
})();
