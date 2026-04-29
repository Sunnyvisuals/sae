/**
 * Chapitre II - ciel étoilé, Lenis, révélations, transition Chapitre III.
 */
(function () {
  const root = document.documentElement;
  /** Barre rendue dans le parent React au-dessus du rail « Parcours » (l’iframe ne peut pas passer au-dessus du chrome). */
  const scrollProgressDelegatedToParent = window.parent !== window;
  if (scrollProgressDelegatedToParent) {
    const peg = document.getElementById("senac-scroll-progress");
    if (peg instanceof HTMLElement) {
      peg.classList.add("senac-scroll-progress--delegated-parent");
    }
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Ambiance locale chapitre II (copiée dans /public). */
  const SENAC_AMBIENCE_SRC_PUBLIC = "/Emotional%20Arabian%20Oud.mp3";
  /** Fallback dev absolu si besoin. */
  const SENAC_AMBIENCE_SRC_DEV = "/@fs/E:/bouab/Emotional%20Arabian%20Oud.mp3";
  /** `a.scroll-cue` hero - évite flash avant GSAP (entrée puis disparition au scroll). */
  const scrollCueEarly = document.querySelector("header.hero a.scroll-cue");
  if (scrollCueEarly instanceof HTMLAnchorElement) {
    scrollCueEarly.style.opacity = "0";
  }

  function setRevealStagger() {
    document.querySelectorAll("[data-reveal]").forEach((el, index) => {
      el.style.setProperty("--stagger", String(Math.min(index * 54, 540)));
    });
  }

  const friseEl = document.getElementById("timeline-start");
  /** Lenis (scroll lissé) ; null si indisponible (reduced-motion ou échec import). */
  let yearGaugeLenis = null;
  let yearGaugeGsap = null;

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



  /** sRGB puis mélange — un lerp entre teintes HSL traverse le cercle (verts/cyan « fantômes »). */
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

    /** Ancres or / bleu (comme avant ton « trop orange ») — mélange toujours en sRGB. */
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
    const max = getScrollMax();
    let y = getScrollY();
    if (yearGaugeLenis && typeof yearGaugeLenis.scroll === "number") {
      y = yearGaugeLenis.scroll;
    }
    const ratio = Math.min(1, Math.max(0, y / max));

    if (scrollProgressDelegatedToParent) {
      try {
        window.parent.postMessage({ type: "senac-scroll-progress", ratio }, window.location.origin);
      } catch (_) {
        /* ignore */
      }
      return;
    }

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
   * Brume / fumée diffuse + poussière lumineuse — calque plein cadre, sous le texte (z-index CSS),
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
    let tx = 50;
    let ty = 18;
    let cx = tx;
    let cy = ty;
    /** Ne recalcule --mx/--my que si le pointeur bouge (réduit le travail par frame). */
    let pointerDirty = true;

    window.addEventListener(
      "pointermove",
      (event) => {
        tx = (event.clientX / window.innerWidth) * 100;
        ty = (event.clientY / window.innerHeight) * 100;
        pointerDirty = true;
      },
      { passive: true }
    );

    const loop = () => {
      if (pointerDirty || Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04) {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        root.style.setProperty("--mx", `${cx}%`);
        root.style.setProperty("--my", `${cy}%`);
        if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
          pointerDirty = false;
        }
      }
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
    const COOLDOWN_MS = reducedMotion ? 180 : 520;

    function playCurtain() {
      if (!curtain) return;
      curtain.classList.remove("is-active");
      // Force reflow to replay the fade every time (down and up).
      void curtain.offsetWidth;
      curtain.classList.add("is-active");
      window.setTimeout(() => {
        curtain.classList.remove("is-active");
      }, reducedMotion ? 350 : 950);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const now = performance.now();
          const nextInChapter =
            entry.isIntersecting && entry.intersectionRatio >= 0.18;
          if (nextInChapter === inChapterThree) continue;
          if (now - lastSwitchAt < COOLDOWN_MS) continue;

          inChapterThree = nextInChapter;
          lastSwitchAt = now;

          if (inChapterThree) {
            inner.classList.add("is-visible");
          } else {
            inner.classList.remove("is-visible");
          }
          playCurtain();
        }
      },
      { threshold: [0.12, 0.18, 0.24] }
    );

    observer.observe(target);
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

        if (started && wantedVolume > 0.003 && audio.paused) {
          void audio.play().catch(() => {});
        }

        /** Inertie plus lente pour lisser l’aller-retour autour du seuil du chapitre III. */
        const k = hidden ? 0.08 : 0.045;
        audio.volume += (wantedVolume - audio.volume) * k;

        if (started && wantedVolume < 0.002 && audio.volume < 0.006 && !audio.paused) {
          audio.pause();
        }

        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    async function tryStart() {
      if (started && !audio.paused) {
        syncTargetVolume();
        return;
      }
      started = true;
      try {
        await audio.play();
      } catch (_) {
        try {
          audio.src = SENAC_AMBIENCE_SRC_DEV;
          await audio.play();
        } catch (_) {
          started = false;
          return;
        }
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
      if (!hidden && started && !audio.paused) {
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
      if (parentUnlocked && !started) {
        void tryStart();
      }
    }

    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("message", onParentAudioMessage);

    window.addEventListener("beforeunload", () => {
      clearFadeTimer();
      if (rafId) cancelAnimationFrame(rafId);
      audio.pause();
      audio.src = "";
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("message", onParentAudioMessage);
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
  initAct2QuestBridge();
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

  initLenis().then((lenisOk) => {
    if (!lenisOk) {
      if (!reducedMotion) initImmersionFromWindowScroll();
      else applyScrollDerivedState(getScrollY());
    }
    senacPostLenisReady = true;
    tryScheduleSenacScrollTriggerEffects();
    initReveal();
    initChapterThree();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToHashChapterIfNeeded);
    });
  });

  /** Relais souris → parent (React) : curseur custom + fluide suivent au-dessus de l’iframe. */
  if (window.parent !== window) {
    window.addEventListener(
      "pointermove",
      (e) => {
        window.parent.postMessage(
          { type: "senac-pointer", x: e.clientX, y: e.clientY },
          window.location.origin
        );
      },
      { passive: true }
    );
  }
})();
