/**
 * Chapitre II - ciel étoilé, Lenis, révélations, transition Chapitre III.
 */
(function () {
  const root = document.documentElement;
  /** Dans la SPA : pas de barre de progression (elle était relayée au parent et grossissait au scroll). */
  const suppressScrollProgressChrome = window.parent !== window;
  if (suppressScrollProgressChrome) {
    document.getElementById("senac-scroll-progress")?.remove();
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Ambiance locale chapitre II (copiée dans /public). */
  const SENAC_AMBIENCE_SRC_PUBLIC = "/Emotional%20Arabian%20Oud.mp3";
  /** `a.scroll-cue` hero - évite flash avant GSAP (entrée puis disparition au scroll). */
  const scrollCueEarly = document.querySelector("header.hero a.scroll-cue");
  if (scrollCueEarly instanceof HTMLAnchorElement) {
    scrollCueEarly.style.opacity = "0";
  }

  /** Pavé tactile / souris : Ctrl+molette (ou meta) ne doit pas zoomer tout le navigateur — garde le défilement Lenis. */
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
      /**
       * Rythme plus “ciné” : moins linéaire et moins lent au début.
       * - départ rapide (les 6-8 premiers arrivent vite)
       * - puis espacement qui s’étire doucement, sans dépasser un cap
       */
      const i = Math.max(0, index);
      const base = Math.min(26 + i * 22, 520);
      const pulse = Math.round(Math.sin(i * 0.85) * 8); // micro-variation organique
      el.style.setProperty("--stagger", String(Math.max(0, base + pulse)));
    });
  }

  const friseEl = document.getElementById("timeline-start");
  /** Lenis (scroll lissé) ; null si indisponible (reduced-motion ou échec import). */
  let yearGaugeLenis = null;
  let yearGaugeGsap = null;
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


  function getScrollMax() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
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

  function updateSenacScrollProgressFill() {
    if (suppressScrollProgressChrome) return;

    const max = getScrollMax();
    let y = getScrollY();
    if (yearGaugeLenis && typeof yearGaugeLenis.scroll === "number") {
      y = yearGaugeLenis.scroll;
    }
    const ratio = Math.min(1, Math.max(0, y / max));

    if (!senacScrollFillEl) {
      const n = document.querySelector(".senac-scroll-progress__fill");
      senacScrollFillEl = n instanceof HTMLElement ? n : null;
    }
    if (!senacScrollFillEl) return;

    const ht = parseFloat(root.style.getPropertyValue("--hero-t").trim() || "0");
    const ft = parseFloat(root.style.getPropertyValue("--frise-t").trim() || "0");
    const shift = Math.min(1, Math.max(0, ht + ft * 0.42));

    const nightBlendTarget = scrollBarNightBlendFromShift(shift);
    const kk = reducedMotion ? 1 : 0.28;
    if (senacBarNightBlendSmooth === null || senacBarRatioSmooth === null) {
      senacBarNightBlendSmooth = nightBlendTarget;
      senacBarRatioSmooth = ratio;
    } else {
      senacBarNightBlendSmooth += (nightBlendTarget - senacBarNightBlendSmooth) * kk;
      senacBarRatioSmooth += (ratio - senacBarRatioSmooth) * kk;
    }

    const uColor = senacBarRatioSmooth;
    const nb = senacBarNightBlendSmooth ?? 0;
    const { bg, shadow } = scrollBarSpectrum(uColor, nb, ratio);

    senacScrollFillEl.style.width = `${ratio * 100}%`;
    senacScrollFillEl.style.background = bg;
    senacScrollFillEl.style.boxShadow = shadow;
  }

  function applyScrollDerivedState(scrollY) {
    computeImmersion(scrollY);
    updateSenacScrollProgressFill();
  }

  let yearGaugeScrollTriggerInitScheduled = false;
  /** Parchemin initialisé - ScrollTrigger peut appliquer le proxy Lenis. */
  let senacPostLenisReady = false;
  /** Réf. ScrollTrigger (refresh resize). */
  let yearGaugeScrollTriggerPlugin =
    /** @type {{ refresh: (...a: unknown[]) => void } | null} */ (null);

  function tryScheduleSenacScrollTriggerEffects() {
    if (!senacPostLenisReady || yearGaugeGsap === null) return;
    scheduleSenacScrollTriggerEffects();
  }

  /** ScrollTrigger : proxy Lenis uniquement (repère années retiré). */
  function scheduleSenacScrollTriggerEffects() {
    if (yearGaugeScrollTriggerInitScheduled || yearGaugeGsap === null) {
      return;
    }
    yearGaugeScrollTriggerInitScheduled = true;

    (async () => {
      const gsapRef = yearGaugeGsap;
      let ScrollTrigger;
      try {
        ({ ScrollTrigger } = await import("https://esm.sh/gsap@3.12.5/ScrollTrigger"));
      } catch {
        yearGaugeScrollTriggerInitScheduled = false;
        return;
      }

      gsapRef.registerPlugin(ScrollTrigger);
      yearGaugeScrollTriggerPlugin = ScrollTrigger;

      if (yearGaugeLenis && typeof yearGaugeLenis.scrollTo === "function") {
        ScrollTrigger.scrollerProxy(document.documentElement, {
          scrollTop(value) {
            if (arguments.length) {
              yearGaugeLenis.scrollTo(value, { immediate: true });
            }
            return yearGaugeLenis.scroll;
          },
          getBoundingClientRect() {
            return {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            };
          },
        });
        yearGaugeLenis.on("scroll", () => {
          ScrollTrigger.update(false);
        });
      }

      window.addEventListener(
        "resize",
        () => {
          yearGaugeScrollTriggerPlugin?.refresh(true);
          applyScrollDerivedState(yearGaugeLenis ? yearGaugeLenis.scroll : getScrollY());
        },
        { passive: true }
      );

      ScrollTrigger.refresh();
    })().catch(() => {
      yearGaugeScrollTriggerInitScheduled = false;
      yearGaugeScrollTriggerPlugin = null;
    });
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

  function initSky() {
    const canvas = document.getElementById("sky-canvas");
    if (!(canvas instanceof HTMLCanvasElement) || reducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let comets = [];
    /** Défilement lissé - parallax étoiles / traînées sans à-coups. */
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
      const count = Math.round(Math.min(260, Math.max(140, width * height / 7600)));
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: rand(0.32, 1.75),
          a: rand(0.16, 0.92),
          tw: rand(0.007, 0.026),
          phase: rand(0, Math.PI * 2),
          drift: rand(0.025, 0.16),
          gold: Math.random() > 0.76,
          connect: Math.random() > 0.76,
          /** Profondeur parallax scroll (loin → près). */
          pz: rand(0, 1),
        });
      }
      scrollParallaxSmooth = getScrollY();
    }

    function spawnComet() {
      if (comets.length > 3 || Math.random() > 0.026) return;
      comets.push({
        x: rand(width * 0.2, width * 0.95),
        y: rand(-height * 0.1, height * 0.35),
        vx: rand(-1.55, -0.58),
        vy: rand(0.68, 1.35),
        life: rand(135, 235),
        maxLife: 235,
      });
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);

      const scrollTarget = getScrollY();
      scrollParallaxSmooth += (scrollTarget - scrollParallaxSmooth) * 0.125;
      const sp = scrollParallaxSmooth;

      const ht = readSkyImmersion01();
      ctx.fillStyle = blendSkyRadial(ht);
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < stars.length; i += 1) {
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
          const alpha = (1 - dist / 115) * 0.12;
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
        const twinkle = star.a + Math.sin(time * star.tw + star.phase) * 0.18;
        star.y -= star.drift * 0.08;
        if (star.y < -4) star.y = height + 4;

        const pp = skyParallaxFor(star.pz ?? 0.4, sp);
        const sx = star.x + pp.ox;
        const sy = star.y + pp.oy;

        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fillStyle = star.gold
          ? `rgba(234, 215, 164, ${Math.max(0.08, twinkle)})`
          : `rgba(165, 215, 255, ${Math.max(0.08, twinkle)})`;
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

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
  }

  /**
   * Brume / fumée diffuse + poussière lumineuse - calque plein cadre, sous le texte (z-index CSS),
   * parallax lié au scroll (comme le ciel), teinte ambre → bleu avec l’immersion.
   */
  function initFog() {
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
      const np = Math.round(Math.min(48, Math.max(26, (width * height) / 38000)));
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
      const nm = Math.round(Math.min(200, Math.max(85, (width * height) / 3400)));
      for (let i = 0; i < nm; i += 1) {
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: rand(0.35, 2.25),
          vx: rand(-0.28, 0.28),
          vy: rand(-0.52, -0.06),
          tw: rand(0.007, 0.023),
          phase: rand(0, Math.PI * 2),
          gold: Math.random() > 0.58,
          pz: Math.random(),
        });
      }
      scrollSmooth = getScrollY();
    }

    function drawFog(time) {
      const scrollTarget = getScrollY();
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.118;
      const sp = scrollSmooth;
      const imm = fogImmersion01();

      ctx.clearRect(0, 0, width, height);

      const rMist = Math.round(238 - imm * 105);
      const gMist = Math.round(208 + imm * 28);
      const bMist = Math.round(155 + imm * 95);

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < puffs.length; i += 1) {
        const p = puffs[i];
        p.rot += p.vr;
        p.x += p.vx + Math.sin(time * 0.00032 + p.phase) * 0.26;
        p.y += p.vy + Math.cos(time * 0.00026 + p.phase * 1.2) * 0.18;
        if (p.x < -p.rx * 2.2) p.x += width + p.rx * 3;
        if (p.x > width + p.rx * 2.2) p.x -= width + p.rx * 3;
        if (p.y < -p.ry * 2) p.y += height + p.ry * 2.5;
        if (p.y > height + p.ry * 2) p.y -= height + p.ry * 2.5;

        const ox = sp * (-0.016 - p.layer * 0.058);
        const oy = sp * (-0.048 - p.layer * 0.13);
        const cx = p.x + ox;
        const cy = p.y + oy;

        const a0 = p.baseA * (0.82 + imm * 0.35);
        ctx.globalAlpha = 0.92;
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
        const twinkle = 0.62 + Math.sin(time * m.tw + m.phase) * 0.24;
        const pa = sp * (-0.011 - m.pz * 0.048);
        const pb = sp * (-0.038 - m.pz * 0.09);
        m.x += m.vx * 0.09 + Math.sin(time * 0.0004 + m.phase) * 0.06;
        m.y += m.vy * 0.07;
        if (m.y < -6) m.y = height + 6;
        if (m.x < -4) m.x = width + 4;
        if (m.x > width + 4) m.x = -4;

        const sx = m.x + pa;
        const sy = m.y + pb;
        const alpha = Math.max(0.06, Math.min(0.72, twinkle * (0.52 + imm * 0.38)));
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

  /** @type {{ stop: () => void } | null} */
  let voyageCreditsParticlesHandle = null;

  /** Parallax ciel / brume des crédits : dérivé du défilement du rouleau (pas la souris). */
  let voyageCreditsRollParallaxActive = false;
  let voyageCreditsRollParallaxStartMs = 0;
  let voyageCreditsRollParallaxDurationMs = 0;

  function beginVoyageCreditsRollParallaxClock(durationSec) {
    voyageCreditsRollParallaxActive = true;
    voyageCreditsRollParallaxStartMs = performance.now();
    voyageCreditsRollParallaxDurationMs = Math.max(1, durationSec * 1000);
  }

  function resetVoyageCreditsRollParallaxClock() {
    voyageCreditsRollParallaxActive = false;
    voyageCreditsRollParallaxStartMs = 0;
    voyageCreditsRollParallaxDurationMs = 0;
  }

  function stopVoyageCreditsParticles() {
    voyageCreditsParticlesHandle?.stop();
  }

  /**
   * Même rendu 2D que #sky-canvas + #fog-canvas (frise), sur le générique de fin.
   * Parallax : même équations que la frise, mais `sp` suit la progression du rouleau (générique).
   */
  function startVoyageCreditsParticles(overlay) {
    if (reducedMotion || voyageCreditsParticlesHandle) return;
    const skyCanvas = document.getElementById("voyage-credits-sky-canvas");
    const fogCanvas = document.getElementById("voyage-credits-fog-canvas");
    if (!(skyCanvas instanceof HTMLCanvasElement) || !(fogCanvas instanceof HTMLCanvasElement)) return;

    const sctx = skyCanvas.getContext("2d");
    const fctx = fogCanvas.getContext("2d");
    if (!sctx || !fctx) return;

    function readCreditsScrollTarget() {
      if (voyageCreditsRollParallaxActive && voyageCreditsRollParallaxDurationMs > 0) {
        const elapsed = performance.now() - voyageCreditsRollParallaxStartMs;
        const t = Math.min(1, Math.max(0, elapsed / voyageCreditsRollParallaxDurationMs));
        /* Amplitude proche d’un scroll de frise (px) pour réutiliser skyParallaxFor / brouillard. */
        return t * 1180;
      }
      return 0;
    }

    let skyStopped = false;
    let fogStopped = false;

    let sw = 0;
    let sh = 0;
    let sdpr = 1;
    /** @type {{ x: number; y: number; r: number; a: number; tw: number; phase: number; drift: number; gold: boolean; connect: boolean; pz: number }[]} */
    let stars = [];
    /** @type {{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[]} */
    let comets = [];
    let scrollParallaxSmooth = readCreditsScrollTarget();

    function skyParallaxFor(pzRaw, sx) {
      const pz = Math.min(1, Math.max(0, pzRaw));
      const oy = sx * -(0.028 + pz * 0.44);
      const ox = sx * (-0.01 + pz * 0.085);
      return { ox, oy };
    }

    function blendSkyRadial(t) {
      const u = Math.min(1, Math.max(0, t));
      const cx = sw * 0.5;
      const cy = sh * 0.175;
      const bg = sctx.createRadialGradient(cx, cy, 0, cx, cy * 1.06, sw * 0.76);
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

    const srand = (min, max) => min + Math.random() * (max - min);

    function skyResize() {
      sdpr = Math.min(window.devicePixelRatio || 1, 2);
      sw = window.innerWidth;
      sh = window.innerHeight;
      skyCanvas.width = Math.floor(sw * sdpr);
      skyCanvas.height = Math.floor(sh * sdpr);
      skyCanvas.style.width = `${sw}px`;
      skyCanvas.style.height = `${sh}px`;
      sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
      stars.length = 0;
      comets.length = 0;
      const count = Math.round(Math.min(260, Math.max(140, (sw * sh) / 7600)));
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * sw,
          y: Math.random() * sh,
          r: srand(0.32, 1.75),
          a: srand(0.16, 0.92),
          tw: srand(0.007, 0.026),
          phase: srand(0, Math.PI * 2),
          drift: srand(0.025, 0.16),
          gold: Math.random() > 0.76,
          connect: Math.random() > 0.76,
          pz: srand(0, 1),
        });
      }
      scrollParallaxSmooth = readCreditsScrollTarget();
    }

    function spawnComet() {
      if (comets.length > 3 || Math.random() > 0.026) return;
      comets.push({
        x: srand(sw * 0.2, sw * 0.95),
        y: srand(-sh * 0.1, sh * 0.35),
        vx: srand(-1.55, -0.58),
        vy: srand(0.68, 1.35),
        life: srand(135, 235),
        maxLife: 235,
      });
    }

    function creditsSkyDraw(time) {
      if (skyStopped) return;
      sctx.clearRect(0, 0, sw, sh);
      const scrollTarget = readCreditsScrollTarget();
      scrollParallaxSmooth += (scrollTarget - scrollParallaxSmooth) * 0.125;
      const sp = scrollParallaxSmooth;
      const roll01 = Math.min(1, Math.max(0, sp / 1180));
      const ht = Math.min(1, Math.max(0.76, 0.76 + 0.24 * roll01));
      sctx.fillStyle = blendSkyRadial(ht);
      sctx.fillRect(0, 0, sw, sh);

      sctx.save();
      sctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < stars.length; i += 1) {
        const a = stars[i];
        if (!a.connect || a.y > sh * 0.72) continue;
        const pa = skyParallaxFor(a.pz ?? 0.4, sp);
        const ax = a.x + pa.ox;
        const ay = a.y + pa.oy;
        for (let j = i + 1; j < Math.min(i + 18, stars.length); j += 1) {
          const b = stars[j];
          if (!b.connect || b.y > sh * 0.72) continue;
          const pb = skyParallaxFor(b.pz ?? 0.4, sp);
          const bx = b.x + pb.ox;
          const by = b.y + pb.oy;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.hypot(dx, dy);
          if (dist > 115) continue;
          const alpha = (1 - dist / 115) * 0.12;
          sctx.strokeStyle = `rgba(139, 213, 255, ${alpha})`;
          sctx.lineWidth = 0.7;
          sctx.beginPath();
          sctx.moveTo(ax, ay);
          sctx.lineTo(bx, by);
          sctx.stroke();
        }
      }
      sctx.restore();

      for (const star of stars) {
        const twinkle = star.a + Math.sin(time * star.tw + star.phase) * 0.18;
        star.y -= star.drift * 0.08;
        if (star.y < -4) star.y = sh + 4;
        const pp = skyParallaxFor(star.pz ?? 0.4, sp);
        const px = star.x + pp.ox;
        const py = star.y + pp.oy;
        sctx.beginPath();
        sctx.arc(px, py, star.r, 0, Math.PI * 2);
        sctx.fillStyle = star.gold
          ? `rgba(234, 215, 164, ${Math.max(0.08, twinkle)})`
          : `rgba(165, 215, 255, ${Math.max(0.08, twinkle)})`;
        sctx.fill();
      }

      spawnComet();
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
        const grad = sctx.createLinearGradient(ox, oy, ox - c.vx * 52, oy - c.vy * 52);
        grad.addColorStop(0, `rgba(234, 215, 164, ${0.82 * opacity})`);
        grad.addColorStop(0.35, `rgba(139, 213, 255, ${0.38 * opacity})`);
        grad.addColorStop(1, "rgba(121, 183, 255, 0)");
        sctx.strokeStyle = grad;
        sctx.lineWidth = 1.8;
        sctx.beginPath();
        sctx.moveTo(ox, oy);
        sctx.lineTo(ox - c.vx * 58, oy - c.vy * 58);
        sctx.stroke();
        if (c.life <= 0 || c.y > sh + 80 || c.x < -120) comets.splice(i, 1);
      }

      requestAnimationFrame(creditsSkyDraw);
    }

    let fw = 0;
    let fh = 0;
    let fdpr = 1;
    /** @type {{ x: number; y: number; rx: number; ry: number; rot: number; vx: number; vy: number; vr: number; phase: number; layer: number; baseA: number }[]} */
    let puffs = [];
    /** @type {{ x: number; y: number; r: number; vx: number; vy: number; tw: number; phase: number; gold: boolean; pz: number }[]} */
    let motes = [];
    let scrollSmooth = readCreditsScrollTarget();

    function frand(a, b) {
      return a + Math.random() * (b - a);
    }

    function fogResize() {
      fdpr = Math.min(window.devicePixelRatio || 1, 2);
      fw = window.innerWidth;
      fh = window.innerHeight;
      fogCanvas.width = Math.floor(fw * fdpr);
      fogCanvas.height = Math.floor(fh * fdpr);
      fogCanvas.style.width = `${fw}px`;
      fogCanvas.style.height = `${fh}px`;
      fctx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
      puffs = [];
      const np = Math.round(Math.min(48, Math.max(26, (fw * fh) / 38000)));
      for (let i = 0; i < np; i += 1) {
        puffs.push({
          x: frand(-fw * 0.18, fw * 1.15),
          y: frand(-fh * 0.12, fh * 1.1),
          rx: frand(72, 290),
          ry: frand(54, 230),
          rot: frand(0, Math.PI * 2),
          vx: frand(-0.42, 0.42),
          vy: frand(-0.2, 0.14),
          vr: frand(-0.0018, 0.0018),
          phase: frand(0, Math.PI * 2),
          layer: Math.random(),
          baseA: frand(0.038, 0.105),
        });
      }
      motes = [];
      const nm = Math.round(Math.min(200, Math.max(85, (fw * fh) / 3400)));
      for (let i = 0; i < nm; i += 1) {
        motes.push({
          x: Math.random() * fw,
          y: Math.random() * fh,
          r: frand(0.35, 2.25),
          vx: frand(-0.28, 0.28),
          vy: frand(-0.52, -0.06),
          tw: frand(0.007, 0.023),
          phase: frand(0, Math.PI * 2),
          gold: Math.random() > 0.58,
          pz: Math.random(),
        });
      }
      scrollSmooth = readCreditsScrollTarget();
    }

    function creditsFogDraw(time) {
      if (fogStopped) return;
      const scrollTarget = readCreditsScrollTarget();
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.118;
      const sp = scrollSmooth;
      const roll01 = Math.min(1, Math.max(0, sp / 1180));
      const imm = Math.min(1, Math.max(0.78, 0.78 + 0.22 * roll01));
      fctx.clearRect(0, 0, fw, fh);

      const rMist = Math.round(238 - imm * 105);
      const gMist = Math.round(208 + imm * 28);
      const bMist = Math.round(155 + imm * 95);

      fctx.save();
      fctx.globalCompositeOperation = "screen";

      for (let i = 0; i < puffs.length; i += 1) {
        const p = puffs[i];
        p.rot += p.vr;
        p.x += p.vx + Math.sin(time * 0.00032 + p.phase) * 0.26;
        p.y += p.vy + Math.cos(time * 0.00026 + p.phase * 1.2) * 0.18;
        if (p.x < -p.rx * 2.2) p.x += fw + p.rx * 3;
        if (p.x > fw + p.rx * 2.2) p.x -= fw + p.rx * 3;
        if (p.y < -p.ry * 2) p.y += fh + p.ry * 2.5;
        if (p.y > fh + p.ry * 2) p.y -= fh + p.ry * 2.5;

        const ox = sp * (-0.016 - p.layer * 0.058);
        const oy = sp * (-0.048 - p.layer * 0.13);
        const cx = p.x + ox;
        const cy = p.y + oy;

        const a0 = p.baseA * (0.82 + imm * 0.35);
        fctx.globalAlpha = 0.92;
        fctx.save();
        fctx.translate(cx, cy);
        fctx.rotate(p.rot);
        fctx.scale(p.rx / 100, p.ry / 100);
        const grd = fctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        grd.addColorStop(0, `rgba(${rMist}, ${gMist}, ${bMist}, ${a0})`);
        grd.addColorStop(0.42, `rgba(${rMist}, ${gMist}, ${bMist}, ${a0 * 0.42})`);
        grd.addColorStop(1, "rgba(8, 14, 28, 0)");
        fctx.fillStyle = grd;
        fctx.beginPath();
        fctx.arc(0, 0, 100, 0, Math.PI * 2);
        fctx.fill();
        fctx.restore();
      }

      fctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < motes.length; i += 1) {
        const m = motes[i];
        const twinkle = 0.62 + Math.sin(time * m.tw + m.phase) * 0.24;
        const pa = sp * (-0.011 - m.pz * 0.048);
        const pb = sp * (-0.038 - m.pz * 0.09);
        m.x += m.vx * 0.09 + Math.sin(time * 0.0004 + m.phase) * 0.06;
        m.y += m.vy * 0.07;
        if (m.y < -6) m.y = fh + 6;
        if (m.x < -4) m.x = fw + 4;
        if (m.x > fw + 4) m.x = -4;

        const mtx = m.x + pa;
        const mty = m.y + pb;
        const alpha = Math.max(0.06, Math.min(0.72, twinkle * (0.52 + imm * 0.38)));
        fctx.globalAlpha = 1;
        fctx.fillStyle = m.gold
          ? `rgba(236, 212, 168, ${alpha})`
          : `rgba(165, 210, 255, ${alpha})`;
        fctx.beginPath();
        fctx.arc(mtx, mty, m.r, 0, Math.PI * 2);
        fctx.fill();
      }

      fctx.restore();
      requestAnimationFrame(creditsFogDraw);
    }

    function onResizeCreditsParticles() {
      skyResize();
      fogResize();
    }

    voyageCreditsParticlesHandle = {
      stop() {
        skyStopped = true;
        fogStopped = true;
        resetVoyageCreditsRollParallaxClock();
        window.removeEventListener("resize", onResizeCreditsParticles);
        voyageCreditsParticlesHandle = null;
      },
    };

    resetVoyageCreditsRollParallaxClock();
    skyResize();
    fogResize();
    window.addEventListener("resize", onResizeCreditsParticles, { passive: true });
    requestAnimationFrame(creditsSkyDraw);
    requestAnimationFrame(creditsFogDraw);
  }

  /**
   * Fumée WebGL plein écran (Three.js ShaderMaterial)
   * - fBm 4 octaves
   * - rampe chaude transparente -> ocre -> transparente
   * - montée lente
   * - répulsion/tourbillon léger autour du curseur
   */
  async function initSmokeShader() {
    if (reducedMotion) return false;

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

        // fBm 4 octaves
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

          // Fumée monte lentement ; le scroll ajoute surtout de l'amplitude (pas un boost vitesse agressif).
          vec2 flow = vec2(0.0, uTime * (0.028 + sEase * 0.006));

          // souris : influence douce (plus cinématique, moins "agressive")
          vec2 m = (uMouse - 0.5) * aspect;
          vec2 d = p - m;
          float dist = length(d);
          float influence = exp(-dist * 10.0);
          vec2 radial = normalize(d + 1e-6);
          vec2 perp = normalize(vec2(-d.y, d.x) + 1e-6);
          vec2 disp = (perp * (0.018 + sEase * 0.006) + radial * (0.012 + sEase * 0.004)) * influence;

          // drift global très léger vers la souris pour conserver du vivant
          vec2 mouseVec = (uMouse - 0.5) * 2.0;
          vec2 mouseDrift = vec2(mouseVec.x * 0.045, -mouseVec.y * 0.036) * (0.22 + sEase * 0.28);

          // "3D smoke" : 3 couches volumétriques simulées (profondeur parallax + vitesses différentes)
          float depthDrift = sin(uTime * 0.12 + p.y * 1.4) * 0.03;
          vec2 baseUv = p * (2.02 + sEase * 0.16) + flow + mouseDrift + vec2(0.0, depthDrift);

          float n0 = fbm(baseUv + disp * 0.85);
          float n1 = fbm(baseUv * 1.12 + vec2(0.42, -0.3) + vec2(-sEase * 0.12, sEase * 0.08));
          float n2 = fbm(baseUv * 1.27 + vec2(-0.56, 0.44) + vec2(sEase * 0.18, -sEase * 0.12));
          float n = n0 * 0.52 + n1 * 0.31 + n2 * 0.17;

          float smoke = smoothstep(0.31, 0.67, n);
          smoke *= smoothstep(1.26, 0.08, length(p));

          // respiration lente (mouvement "beau", pas brutal)
          float breathe = 0.92 + sin(uTime * 0.22 + p.x * 0.9) * 0.08;
          smoke *= breathe;

          // immersion chapitre II : plus bleu en frise, plus chaud en hero
          float shift = clamp(uHero * 0.42 + uFrise * 0.58, 0.0, 1.0);
          vec3 warm = vec3(0.6, 0.35, 0.15);
          vec3 cool = vec3(0.40, 0.55, 0.72);
          vec3 tint = mix(warm, cool, shift * 0.72);

          // rampe alpha: transparent -> warm -> transparent
          float alpha = smoke * (0.19 + sEase * 0.11);
          alpha *= smoothstep(0.0, 0.2, smoke) * (1.0 - smoothstep(0.75, 1.0, smoke));
          alpha *= 1.0;

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
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const y = yearGaugeLenis && typeof yearGaugeLenis.scroll === "number" ? yearGaugeLenis.scroll : getScrollY();
      uniforms.uScroll01.value = Math.min(1, Math.max(0, y / max));
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
    tail.setAttribute("x1", "11"); tail.setAttribute("y1", "21");
    tail.setAttribute("x2", "11"); tail.setAttribute("y2", "27");
    tail.setAttribute("stroke-width", "1");
    tail.setAttribute("stroke-opacity", "0.85");

    const arrow = document.createElementNS(ns, "polyline");
    arrow.setAttribute("points", "8,24 11,28 14,24");
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
    if (finePointer) {
      document.body.appendChild(cursorEl);
    }

    /* Dans l'iframe React (act2) : le curseur parent s'occupe du rendu -
       on masque le nôtre pour éviter le doublon (pointeur précis uniquement). */
    if (finePointer && window.parent !== window) {
      cursorEl.style.display = "none";
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
    applyColors(0);

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

      if (finePointer && cursorEl && haloEl) {
        cursorEl.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
        haloEl.style.left = `${(hx - lx).toFixed(1)}px`;
        haloEl.style.top = `${(hy - ly).toFixed(1)}px`;
      }

      /* Couleurs selon immersion */
      const ht = parseFloat(root.style.getPropertyValue("--hero-t")  || "0");
      const ft = parseFloat(root.style.getPropertyValue("--frise-t") || "0");
      applyColors(Math.min(1, ht + ft * 0.42));

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

  async function initLenis() {
    if (reducedMotion) return false;
    try {
      const { default: Lenis } = await import("https://esm.sh/lenis@1.1.18");
      const lenis = new Lenis({
        lerp: 0.14,
        smoothWheel: true,
        wheelMultiplier: 1.05,
        syncTouch: false,
        smoothTouch: false,
      });

      lenis.on("scroll", () => {
        applyScrollDerivedState(lenis.scroll);
      });

      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };

      requestAnimationFrame(raf);

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
  function initScrollCue(gsap) {
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

  function initReveal() {
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
      { threshold: 0.09, rootMargin: "0px 0px -12% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function initChapterThree() {
    const target = document.getElementById("chapitre-3");
    const inner = target?.querySelector(".chapter-three-inner");
    const curtain = document.getElementById("chapter-curtain");
    if (!target || !inner) return;

    let inChapterThree = false;
    let lastSwitchAt = 0;
    const COOLDOWN_MS = reducedMotion ? 120 : 240;
    let curtainHideT = 0;

    function hideChapterCurtain() {
      if (curtainHideT) { window.clearTimeout(curtainHideT); curtainHideT = 0; }
      if (curtain) curtain.classList.remove("is-active");
    }

    function playCurtain(durationMs) {
      if (!curtain) return;
      if (curtainHideT) { window.clearTimeout(curtainHideT); curtainHideT = 0; }
      curtain.classList.remove("is-active");
      void curtain.offsetWidth;
      curtain.classList.add("is-active");
      curtainHideT = window.setTimeout(() => {
        curtainHideT = 0;
        curtain.classList.remove("is-active");
      }, reducedMotion ? 300 : durationMs);
    }

    /**
     * Progression 0→1 quand la section traverse le viewport - pour couches parallax.
     */
    function updateChapterThreeParallax() {
      if (!(target instanceof HTMLElement)) return;
      if (reducedMotion) {
        target.style.removeProperty("--ch3-scroll");
        target.style.removeProperty("--ch3-scroll-soft");
        return;
      }
      const rect = target.getBoundingClientRect();
      const vh = window.innerHeight;
      let t = 0;
      if (rect.top >= vh || rect.bottom <= 0) {
        t = rect.bottom <= 0 ? 1 : 0;
      } else {
        const denom = Math.max(rect.height + vh, 1);
        t = Math.min(1, Math.max(0, (vh - rect.top) / denom));
      }
      const soft = t * t;
      target.style.setProperty("--ch3-scroll", t.toFixed(4));
      target.style.setProperty("--ch3-scroll-soft", soft.toFixed(4));
    }

    /* ── Détection par scroll (réactive - volet + parallax tous les événements) ── */
    let tickingVisibility = false;
    function onScrollCh3() {
      updateChapterThreeParallax();

      if (tickingVisibility) return;
      tickingVisibility = true;
      requestAnimationFrame(() => {
        tickingVisibility = false;

        const now = performance.now();
        if (now - lastSwitchAt < COOLDOWN_MS) return;

        const rect = target.getBoundingClientRect();
        /* Entré dans Ch3 : le haut de l'élément franchit 55 % du viewport vers le haut */
        const entering = rect.top < window.innerHeight * 0.55 && rect.bottom > 0;

        if (entering === inChapterThree) return;

        inChapterThree = entering;
        lastSwitchAt = now;

        if (inChapterThree) {
          inner.classList.add("is-visible");
          playCurtain(900);
        } else {
          inner.classList.remove("is-visible");
          /* Fondu au noir aussi au retour vers Ch2 */
          playCurtain(700);
        }
      });
    }

    /* Brancher sur Lenis ou scroll natif */
    function attachScrollListener() {
      if (yearGaugeLenis && typeof yearGaugeLenis.on === "function") {
        yearGaugeLenis.on("scroll", onScrollCh3);
      } else {
        window.addEventListener("scroll", onScrollCh3, { passive: true });
      }
      onScrollCh3(); /* état initial */
    }

    /* Lenis peut ne pas être prêt au moment de l'init - on attend qu'il soit disponible */
    if (yearGaugeLenis) {
      attachScrollListener();
    } else {
      const poll = window.setInterval(() => {
        if (!yearGaugeLenis) return;
        window.clearInterval(poll);
        attachScrollListener();
      }, 80);
      /* Fallback si Lenis ne charge jamais */
      window.setTimeout(() => {
        window.clearInterval(poll);
        if (!yearGaugeLenis) window.addEventListener("scroll", onScrollCh3, { passive: true });
      }, 3000);
    }

    const backSpa = document.getElementById("ch3-back-experience");
    if (backSpa instanceof HTMLAnchorElement && window.parent !== window) {
      backSpa.addEventListener("click", (e) => {
        e.preventDefault();
        try {
          window.parent.postMessage({ type: "senac-navigate", target: "intro" }, window.location.origin);
        } catch (_) {
          /* ignore */
        }
      });
    }
  }

  /** Générique de fin façon cinéma - scroll vertical, Lenis figé, Escape / passer pour fermer. */
  function initVoyageCredits() {
    const overlay = document.getElementById("voyage-credits");
    const roll = document.getElementById("voyage-credits-roll");
    const skipBtn = document.getElementById("voyage-credits-skip");
    const trigger = document.getElementById("voyage-credits-trigger");
    const ctaWrap = document.getElementById("voyage-credits-cta");
    if (
      !(overlay instanceof HTMLElement) ||
      !(roll instanceof HTMLElement) ||
      !skipBtn ||
      !trigger ||
      !(ctaWrap instanceof HTMLElement)
    ) {
      return;
    }

    const bgVideo = overlay.querySelector(".voyage-credits-bg-video");

    function notifyParentCreditsChrome(isOpen) {
      if (window.parent === window) return;
      try {
        window.parent.postMessage(
          { type: "senac-credits-chrome", open: isOpen },
          window.location.origin
        );
      } catch {
        /* ignore */
      }
    }

    let open = false;
    const motionReduced =
      reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function stopPageScroll() {
      document.documentElement.classList.add("voyage-credits-active");
      document.body.classList.add("voyage-credits-active");
      if (yearGaugeLenis && typeof yearGaugeLenis.stop === "function") {
        try {
          yearGaugeLenis.stop();
        } catch {
          /* ignore */
        }
      }
    }

    function resumePageScroll() {
      document.documentElement.classList.remove("voyage-credits-active");
      document.body.classList.remove("voyage-credits-active");
      if (yearGaugeLenis && typeof yearGaugeLenis.start === "function") {
        try {
          yearGaugeLenis.start();
        } catch {
          /* ignore */
        }
      }
    }

    function stripPreviewCreditsParam() {
      try {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("previewCredits")) return;
        url.searchParams.delete("previewCredits");
        const next = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, "", next);
      } catch {
        /* ignore */
      }
    }

    /** Retour à l’app React : depuis l’iframe → message parent (sans recharger tout le site). */
    function goToMainExperience() {
      if (window.parent !== window) {
        try {
          window.parent.postMessage({ type: "senac-journey-complete" }, window.location.origin);
          return;
        } catch (_) {
          /* ignore */
        }
      }
      const home = `${window.location.origin}/`;
      try {
        if (window.parent !== window) {
          window.top.location.href = home;
        } else {
          window.location.href = home;
        }
      } catch {
        try {
          window.location.href = home;
        } catch {
          /* ignore */
        }
      }
    }

    let creditsExitUnlocked = false;
    /** @type {(() => void) | null} */
    let staticScrollCleanup = null;
    /** Très court battement après la fin du rouleau avant le CTA (ms). */
    const CREDITS_REVEAL_DELAY_MS = 48;
    let revealTimer = 0;

    function clearRevealTimer() {
      if (revealTimer) {
        window.clearTimeout(revealTimer);
        revealTimer = 0;
      }
    }

    function clearStaticScrollListener() {
      if (typeof staticScrollCleanup === "function") {
        staticScrollCleanup();
        staticScrollCleanup = null;
      }
    }

    function detachCreditsPointer() {
      window.removeEventListener("pointermove", onCreditsPointerMove);
      overlay.style.removeProperty("--credits-mx");
      overlay.style.removeProperty("--credits-my");
    }

    /** @param {PointerEvent} e */
    function onCreditsPointerMove(e) {
      if (!open || creditsExitUnlocked || motionReduced) return;
      const mx = e.clientX / Math.max(window.innerWidth, 1);
      const my = e.clientY / Math.max(window.innerHeight, 1);
      overlay.style.setProperty("--credits-mx", mx.toFixed(4));
      overlay.style.setProperty("--credits-my", my.toFixed(4));
    }

    function playCreditsVideo() {
      if (!(bgVideo instanceof HTMLVideoElement)) return;
      try {
        bgVideo.currentTime = 0;
        const p = bgVideo.play();
        if (p !== undefined) void p.catch(() => {});
      } catch {
        /* ignore */
      }
    }

    function pauseCreditsVideo() {
      if (!(bgVideo instanceof HTMLVideoElement)) return;
      try {
        bgVideo.pause();
        bgVideo.currentTime = 0;
      } catch {
        /* ignore */
      }
    }

    function lockExitControls() {
      creditsExitUnlocked = false;
      ctaWrap.classList.add("is-locked-out");
      skipBtn.setAttribute("tabindex", "-1");
      skipBtn.setAttribute("aria-hidden", "true");
    }

    function revealExitControls() {
      creditsExitUnlocked = true;
      ctaWrap.classList.remove("is-locked-out");
      skipBtn.removeAttribute("tabindex");
      skipBtn.setAttribute("aria-hidden", "false");
      try {
        skipBtn.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    }

    /** @param {KeyboardEvent} e */
    function onKeyEscape(e) {
      if (e.key !== "Escape") return;
      if (!creditsExitUnlocked) return;
      exitCreditsToHome();
    }

    function scheduleRevealAfterCreditsDone() {
      clearRevealTimer();
      revealTimer = window.setTimeout(() => {
        revealTimer = 0;
        revealExitControls();
      }, CREDITS_REVEAL_DELAY_MS);
    }

    /** @param {AnimationEvent} e */
    function onCreditsRollAnimationEnd(e) {
      if (e.animationName !== "voyage-credits-marquee") return;
      roll.removeEventListener("animationend", onCreditsRollAnimationEnd);
      scheduleRevealAfterCreditsDone();
    }

    /** Liste statique : débloquer le retour quand le bas des crédits a été atteint dans le clip. */
    function attachStaticScrollFinish() {
      clearStaticScrollListener();
      const clip = overlay.querySelector(".voyage-credits-roll-clip");
      if (!(clip instanceof HTMLElement)) return;

      function checkScrollEnd() {
        if (creditsExitUnlocked || !open) return;
        if (clip.scrollTop + clip.clientHeight >= clip.scrollHeight - 36) {
          clearStaticScrollListener();
          scheduleRevealAfterCreditsDone();
        }
      }

      clip.addEventListener("scroll", checkScrollEnd, { passive: true });
      staticScrollCleanup = () => {
        clip.removeEventListener("scroll", checkScrollEnd);
      };
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(checkScrollEnd);
      });
    }

    function exitCreditsToHome() {
      if (!open || !creditsExitUnlocked) return;
      notifyParentCreditsChrome(false);
      stopVoyageCreditsParticles();
      open = false;
      creditsExitUnlocked = false;
      roll.removeEventListener("animationend", onCreditsRollAnimationEnd);
      clearStaticScrollListener();
      detachCreditsPointer();
      pauseCreditsVideo();
      overlay.classList.remove("is-open");
      overlay.classList.remove("voyage-credits--static");
      overlay.setAttribute("aria-hidden", "true");
      roll.classList.remove("is-rolling");
      stripPreviewCreditsParam();
      resumePageScroll();
      window.removeEventListener("keydown", onKeyEscape);
      clearRevealTimer();
      lockExitControls();
      goToMainExperience();
    }

    function openCredits() {
      if (open) return;
      open = true;
      clearRevealTimer();
      lockExitControls();
      clearStaticScrollListener();
      detachCreditsPointer();
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");

      stopPageScroll();
      notifyParentCreditsChrome(true);
      startVoyageCreditsParticles(overlay);
      window.addEventListener("keydown", onKeyEscape);

      playCreditsVideo();

      if (motionReduced) {
        overlay.classList.add("voyage-credits--static");
        roll.classList.remove("is-rolling");
        attachStaticScrollFinish();
        return;
      }

      overlay.style.setProperty("--credits-mx", "0.5");
      overlay.style.setProperty("--credits-my", "0.5");
      window.addEventListener("pointermove", onCreditsPointerMove, { passive: true });

      overlay.classList.remove("voyage-credits--static");
      roll.classList.remove("is-rolling");
      void roll.offsetHeight;
      const h = roll.scrollHeight;
      /** Défilement vertical : plus lent qu’avant (~38-92 s selon la hauteur du texte). */
      const duration = Math.min(92, Math.max(38, h / 28));
      roll.style.setProperty("--credits-duration", `${duration}s`);
      void roll.offsetHeight;
      roll.classList.add("is-rolling");
      beginVoyageCreditsRollParallaxClock(duration);
      roll.addEventListener("animationend", onCreditsRollAnimationEnd);
    }

    trigger.addEventListener("click", () => openCredits());
    skipBtn.addEventListener("click", () => {
      if (!creditsExitUnlocked) return;
      exitCreditsToHome();
    });
  }

  /**
   * Navigation directe `#chapitre-3` (raccourci dev, lien profond) :
   * le navigateur peut scroller vers l’ancre avant Lenis, puis la synchronisation Lenis réinitialise le scroll - 
   * on recale une fois tout est prêt.
   */
  function scrollToHashChapterIfNeeded() {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    if (raw !== "chapitre-3") return;

    const el = document.getElementById("chapitre-3");
    if (!(el instanceof HTMLElement)) return;

    const inset = Math.min(window.innerHeight * 0.12, 140);
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - inset);

    if (yearGaugeLenis && typeof yearGaugeLenis.scrollTo === "function") {
      try {
        yearGaugeLenis.scrollTo(top, { immediate: reducedMotion });
      } catch {
        window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      }
    } else {
      window.scrollTo({ top, behavior: reducedMotion ? "instant" : "smooth" });
    }

    window.requestAnimationFrame(() => {
      applyScrollDerivedState(getScrollY());
    });
  }

  /** Acte II ↔ SPA parent : boutons `data-senac-navigate` (vidéo d'intro, carte Acte I). */
  function initSenacParentNavigateBridge() {
    document.addEventListener(
      "click",
      (e) => {
        const el =
          e.target instanceof Element ? e.target.closest("[data-senac-navigate]") : null;
        if (!el) return;
        const raw = el.getAttribute("data-senac-navigate");
        if (raw !== "intro-video" && raw !== "act1-map") return;
        e.preventDefault();
        const origin = window.location.origin;
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
      if (!parentUnlocked || hidden) return 0;
      const base = targetVolumeFromParent();
      if (base < 0.002) return 0;

      /** Tout en haut : ambiance retenue ; le volume se déploie en scrollant. */
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scroll01 = Math.min(1, Math.max(0, getScrollY() / max));
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
        if (parentUnlocked && wantedVolume > 0.003 && audio.paused) {
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
      if (!hidden && parentUnlocked) {
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
      if (parentUnlocked) {
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
   * Mode Cinéma : défilement auto uniquement (molette/clavier/tactile bloqués) jusqu'en bas ;
   * l'utilisateur doit appuyer sur Exploration (toggle bas-gauche) pour continuer.
   */
  function initScrollModeChoice() {
    const choiceEl  = document.getElementById("scroll-mode-choice");
    const backdropEl= document.getElementById("smc-backdrop");
    const toggleEl  = document.getElementById("scroll-mode-toggle");
    const cinemaBtn = document.getElementById("smc-cinema");
    const exploreBtn= document.getElementById("smc-explore");
    const tmtCinema = document.getElementById("smt-cinema-btn");
    const tmtExplore= document.getElementById("smt-explore-btn");

    if (!choiceEl || !toggleEl || !cinemaBtn || !exploreBtn || !tmtCinema || !tmtExplore) return;

    /* ── État : scroll bloqué jusqu'à fermeture visuelle complète du modal ── */
    let mode = /** @type {"cinema"|"explore"|null} */ (null);
    /** Bloque entrées scroll tant que l'overlay (ou son fondu de sortie) peut encore être vu */
    let choiceOverlayScrollLock = true;
    let retryTimer = 0;
    let cinemaExploreCalloutEl = /** @type {HTMLElement|null} */ (null);
    const SPEED_PX_S = 44;
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

    /* ── Auto-scroll via Lenis natif (durée calculée, pas de RAF custom) ── */
    function startAutoScroll() {
      if (retryTimer) { window.clearTimeout(retryTimer); retryTimer = 0; }

      const lenis = yearGaugeLenis;
      if (!lenis || typeof lenis.scrollTo !== "function") {
        /* Lenis pas encore prêt - réessaye dans 150 ms */
        retryTimer = window.setTimeout(startAutoScroll, 150);
        return;
      }

      const curY  = lenis.scroll;
      const maxY  = getScrollMax();
      const remaining = maxY - curY;
      if (remaining < 2) {
        showCinemaExploreCallout();
        return;
      }

      const duration = remaining / SPEED_PX_S;   /* secondes */
      lenis.scrollTo(maxY, {
        duration,
        easing: (t) => t,                         /* vitesse constante */
        onComplete: () => {
          if (mode === "cinema") showCinemaExploreCallout();
        },
      });
    }

    function stopAutoScroll() {
      if (retryTimer) { window.clearTimeout(retryTimer); retryTimer = 0; }
      /* Annule le scroll Lenis en cours en ciblant la position actuelle */
      const lenis = yearGaugeLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(lenis.scroll, { immediate: true });
      }
    }

    /** Laisse passer clavier depuis boutons/champs interactifs uniquement */
    function cinemaKeyTargetIsPassthrough(el) {
      if (!el || typeof el.closest !== "function") return false;
      return !!(
        el.closest("button,a[href],[role='button'],input,textarea,select,[contenteditable='true']")
      );
    }

    /** Bloque scroll tant que le modal impose le gel ou que le mode Cinéma impose le gel */
    function scrollGuardActive() {
      return choiceOverlayScrollLock || mode === "cinema";
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

    /**
     * Appel après init Lenis ou à chaque besoin - Lenis ignore overflow:hidden tant qu'il roule au RAF :
     * on stop() tant que l'overlay bloque encore la navigation.
     */
    function freezeLenisIfOverlayBlocks() {
      if (!choiceOverlayScrollLock || !yearGaugeLenis || typeof yearGaugeLenis.stop !== "function") return;
      yearGaugeLenis.stop();
    }
    senacFreezeLenisForChoiceOverlay = freezeLenisIfOverlayBlocks;
    freezeLenisIfOverlayBlocks();

    function hideCinemaExploreCallout() {
      toggleEl.classList.remove("senac-highlight-explore");
      cinemaExploreCalloutEl = null;
      document.querySelectorAll(".senac-cinema-explore-callout").forEach((n) => n.remove());
    }

    /** Fin du cinéma : consigne + mise en avant du bouton Exploration (toggle bas-gauche). */
    function showCinemaExploreCallout() {
      if (mode !== "cinema") return;
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

    /* ── Applique un mode ── */
    function setMode(newMode, fromChoice) {
      const wasCinema = mode === "cinema";
      mode = newMode;

      hideCinemaExploreCallout();

      document.documentElement.classList.toggle("senac-cinema-mode", mode === "cinema");
      document.body.classList.toggle("senac-cinema-mode", mode === "cinema");

      tmtCinema.classList.toggle("is-active", mode === "cinema");
      tmtExplore.classList.toggle("is-active", mode === "explore");

      if (mode === "cinema") {
        startAutoScroll();
      } else {
        stopAutoScroll();
      }

      if (mode === "explore" && wasCinema && !fromChoice) {
        window.setTimeout(showScrollNudge, 160);
      }
    }

    /* ── Overlay de choix ── */
    function showChoice() {
      if (backdropEl) backdropEl.classList.add("is-visible");
      choiceEl.classList.add("is-visible");
      window.setTimeout(() => cinemaBtn.focus(), 50);
    }

    function showScrollNudge() {
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
          : "Molette · défiler";
      /* Couleurs figées comme ScrollNudge.tsx (Acte I) pour même rendu or désert. */
      nudge.innerHTML = `
        <svg width="48" height="52" viewBox="0 0 44 48" fill="none" focusable="false">
          <path d="M22 4c-5.5 0-10 4-10 9.2V28c0 5.2 4.5 9.2 10 9.2s10-4 10-9.2V13.2C32 8 27.5 4 22 4Z"
            stroke="rgba(229,206,154,0.78)" stroke-width="1.45"/>
          <g class="scroll-cue-wheel-wrap">
            <rect x="19" y="14" width="6" height="7" rx="1.2"
              fill="rgba(234,215,164,0.98)"/>
          </g>
          <path d="M22 1.2l-3.2 3.2 1.2 1.1 2-2 2 2 1.2-1.1L22 1.2Z"
            fill="rgba(229,206,154,0.82)"/>
          <path d="M22 40l3.2-3.2-1.2-1.1-2 2-2-2-1.2 1.1L22 40Z"
            fill="rgba(229,206,154,0.82)"/>
          <line x1="12" y1="22" x2="32" y2="22"
            stroke="rgba(197,160,89,0.22)" stroke-width="0.65"/>
        </svg>
        <span class="senac-scroll-nudge-label">${nudgeLabel}</span>`;
      document.body.appendChild(nudge);

      /* Apparition */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => nudge.classList.add("is-visible"));
      });

      /* Disparaît au premier scroll ou après 5 s */
      let nudgeGone = false;
      function removeNudge() {
        if (nudgeGone) return;
        nudgeGone = true;
        nudge.classList.add("is-leaving");
        window.removeEventListener("wheel",     removeNudge);
        window.removeEventListener("touchmove", removeNudge);
        window.setTimeout(() => nudge.remove(), 550);
      }
      window.setTimeout(removeNudge, 5000);
      window.addEventListener("wheel",     removeNudge, { passive: true, once: true });
      window.addEventListener("touchmove", removeNudge, { passive: true, once: true });
    }

    function dismissChoice(chosen) {
      if (backdropEl) {
        backdropEl.classList.remove("is-visible");
      }
      choiceEl.classList.add("is-leaving");

      if (yearGaugeLenis && typeof yearGaugeLenis.start === "function") {
        yearGaugeLenis.start();
      }
      setMode(chosen, true);

      const unlockMs =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 120
          : 420;

      window.setTimeout(() => {
        choiceOverlayScrollLock = false;
        if (backdropEl) {
          backdropEl.style.display = "none";
        }
        choiceEl.style.display = "none";
        document.documentElement.classList.remove("senac-choice-pending");
        document.body.classList.remove("senac-choice-pending");
        toggleEl.removeAttribute("hidden");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => toggleEl.classList.add("is-visible"));
        });
      }, unlockMs);

      if (chosen === "explore") {
        window.setTimeout(showScrollNudge, Math.max(unlockMs, 260));
      }
    }

    cinemaBtn.addEventListener("click",  () => dismissChoice("cinema"));
    exploreBtn.addEventListener("click", () => dismissChoice("explore"));

    /* Clavier dans l'overlay */
    choiceEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") dismissChoice("explore");
    });

    /* Toggle bas-gauche */
    tmtCinema.addEventListener("click",  () => { if (mode !== "cinema")  setMode("cinema",  false); });
    tmtExplore.addEventListener("click", () => { if (mode !== "explore") setMode("explore", false); });

    /* Bloque tout de suite ; l'overlay s'affiche au prochain frame (Lenis ignore overflow:hidden tant qu'il n'est pas stoppé). */
    document.documentElement.classList.add("senac-choice-pending");
    document.body.classList.add("senac-choice-pending");

    requestAnimationFrame(() => {
      requestAnimationFrame(showChoice);
    });
  }

  setRevealStagger();
  initPointerGlow();
  initSky();
  initSmokeShader().then((ok) => {
    if (!ok) {
      document.body.classList.remove("senac-smoke-shader-active");
      document.body.classList.add("senac-smoke-fallback");
      initFog();
    }
  });
  initSenacParentNavigateBridge();
  initAct2QuestBridge();
  initScrollModeChoice();
  initChapterTwoAmbience();

  import("https://esm.sh/gsap")
    .then((m) => {
      yearGaugeGsap = m.default;
      initScrollCue(yearGaugeGsap);
      applyScrollDerivedState(yearGaugeLenis ? yearGaugeLenis.scroll : getScrollY());
      tryScheduleSenacScrollTriggerEffects();
    })
    .catch(() => {
      initScrollCue(null);
    });

  /**
   * Divise chaque h2 et chaque blockquote en <span class="sq-word"> pour l'animation mot-par-mot.
   * Doit tourner avant initReveal() - les mots doivent etre en place quand is-visible est ajoute.
   */
  function initWordSplits() {
    if (reducedMotion) return;

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

    document.querySelectorAll(".quote-break blockquote").forEach((bq) => {
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

  initLenis().then((lenisOk) => {
    if (!lenisOk) {
      if (!reducedMotion) initImmersionFromWindowScroll();
      else applyScrollDerivedState(getScrollY());
    }
    senacPostLenisReady = true;
    tryScheduleSenacScrollTriggerEffects();
    initWordSplits();
    initReveal();
    initChapterThree();
    initVoyageCredits();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToHashChapterIfNeeded();
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.has("previewCredits")) {
            window.requestAnimationFrame(() => {
              document.getElementById("voyage-credits-trigger")?.dispatchEvent(
                new MouseEvent("click", { bubbles: true })
              );
            });
          }
        } catch {
          /* ignore */
        }
      });
    });
  });

  /** Relais souris → parent (React) — max ~1 msg / frame pour réduire rafales (curseur + SplashCursor parent). */
  if (window.parent !== window) {
    let relayRaf = 0;
    let relayX = 0;
    let relayY = 0;
    const flushRelay = () => {
      relayRaf = 0;
      try {
        window.parent.postMessage(
          { type: "senac-pointer", x: relayX, y: relayY },
          window.location.origin
        );
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        relayX = e.clientX;
        relayY = e.clientY;
        if (relayRaf !== 0) return;
        relayRaf = window.requestAnimationFrame(flushRelay);
      },
      { passive: true }
    );
  }
})();
