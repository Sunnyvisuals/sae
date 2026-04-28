/**
 * Chapitre II - ciel étoilé, Lenis, révélations, transition Chapitre III.
 */
(function () {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  function applyScrollDerivedState(scrollY) {
    computeImmersion(scrollY);
  }

  function getScrollMax() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function getScrollY() {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  /** Tentative ScrollTrigger (proxy Lenis) déjà lancée. */
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

    let triggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || triggered) continue;
          triggered = true;
          inner.classList.add("is-visible");
          if (curtain) {
            curtain.classList.add("is-active");
            window.setTimeout(() => curtain.classList.remove("is-active"), reducedMotion ? 350 : 950);
          }
          observer.unobserve(target);
        }
      },
      { threshold: 0.2 }
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

  setRevealStagger();
  initPointerGlow();
  initSky();
  initAct2QuestBridge();

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
