import fs from "node:fs";
import path from "node:path";

const htmlPath = path.resolve("public/parchemin-senac.html");
let html = fs.readFileSync(htmlPath, "utf8");

const d = "di" + "v";
const nav = "nav";

const oldHero = /      <header class="hero" data-reveal>[\s\S]*?      <\/header>/;

const newHero = `      <header class="hero" data-reveal>
        <${d} class="hero-intro-block">
          <${d} class="hero-intro-header">
            <${d} class="smc-split-curtain">
              <${d} class="smc-split-curtain-track">
                <span class="smc-split-curtain-ar" data-i18n="hero_curtain_ar">التواريخ تصبح كوكبات</span>
                <span class="smc-split-curtain-dot" aria-hidden="true"></span>
                <span class="smc-split-curtain-fr" data-i18n="hero_curtain_fr">Chronologie et archives</span>
              </${d}>
            </${d}>
            <p class="smc-da-kicker hero-intro-kicker" data-i18n="hero_kicker">Acte II - Nuits sahariennes</p>
          </${d}>
          <h1 data-i18n="hero_title">Al Rihla</h1>
          <p class="hero-subtitle" data-i18n="hero_subtitle">La traversée</p>
          <p class="hero-copy" data-i18n="hero_copy">
            Une frise où les dates deviennent constellations - Jean Sénac, chronologie et archives.
          </p>
        </${d}>
        <${nav}
          class="senac-cross-nav-wrap senac-cross-nav-wrap--hero"
          data-i18n-aria="cross_nav_group_aria"
          aria-label="Raccourcis facultatifs"
        >
          <${d} class="senac-cross-nav-chips" role="group">
            <button type="button" class="senac-cross-nav__link" data-senac-navigate="intro-video" data-nav-picto="video">
              <span data-i18n="cross_nav_chip_video">Vidéo d&apos;intro</span>
            </button>
            <button type="button" class="senac-cross-nav__link" data-senac-navigate="act1-map" data-nav-picto="map">
              <span data-i18n="cross_nav_chip_map">Carte-mémoire</span>
            </button>
          </${d}>
          <p class="senac-cross-nav__hint" data-i18n="cross_nav_hint">Facultatif · Acte I déjà parcouru</p>
        </${nav}>
        <figure class="hero-portrait" data-reveal>
          <${d} class="hero-portrait-frame">
            <img
              src="/images/jean-senac-portrait.png"
              data-i18n-alt="hero_img_alt"
              alt="Jean Sénac assis sur des rochers, face à la mer."
              width="720"
              height="720"
              loading="eager"
              decoding="async"
            />
          </${d}>
        </figure>
        <a class="scroll-cue scroll-cue--journey" href="#timeline-start" data-i18n-aria="scroll_cue_aria" aria-label="Faire défiler vers la frise narrative">
          <span class="scroll-cue-mouse" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="52"
              height="52"
              viewBox="0 0 48 48"
              fill="none"
              focusable="false"
            >
              <rect
                x="4"
                y="4"
                width="40"
                height="40"
                rx="11"
                fill="rgba(6, 8, 18, 0.78)"
                stroke="rgba(234, 215, 164, 0.58)"
                stroke-width="1.35"
              />
              <g
                class="scroll-cue-chevrons-wrap"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M24 10.5 L17 17.8 M24 10.5 L31 17.8"
                  stroke="rgba(241, 223, 168, 0.96)"
                  stroke-width="2.45"
                />
                <path
                  d="M24 17 L17 24.3 M24 17 L31 24.3"
                  stroke="rgba(234, 218, 175, 0.82)"
                  stroke-width="2.45"
                />
                <path
                  d="M24 23.5 L17 30.8 M24 23.5 L31 30.8"
                  stroke="rgba(229, 206, 154, 0.62)"
                  stroke-width="2.45"
                />
              </g>
            </svg>
          </span>
          <span class="scroll-cue-label" data-i18n="scroll_cue_label">Molette · vers le bas</span>
        </a>
      </header>`;

if (!oldHero.test(html)) {
  console.error("hero block not found");
  process.exit(1);
}
html = html.replace(oldHero, newHero);

if (!html.includes("parchemin-senac-hero-da.css")) {
  html = html.replace(
    "/parchemin-senac-nav-pictos.css",
    '/parchemin-senac-hero-da.css?v=1" />\n    <link rel="stylesheet" href="/parchemin-senac-nav-pictos.css',
  );
}

fs.writeFileSync(htmlPath, html, "utf8");
console.log("hero patched");
