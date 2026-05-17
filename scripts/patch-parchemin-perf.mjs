import fs from "node:fs";
import path from "node:path";

const p = path.join(path.resolve(import.meta.dirname, ".."), "public/parchemin-senac.js");
let s = fs.readFileSync(p, "utf8");

if (!s.includes("function drawAtmosphereFog")) {
  if (!s.includes("puffs = [];\n      motes = [];\n      const { puffs: np")) {
    s = s.replace(
      "      scrollParallaxSmooth = getScrollY();\n    }\n\n    function spawnComet() {",
      `      scrollParallaxSmooth = getScrollY();
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

    function spawnComet() {`,
    );
  }

  if (!s.includes("if (senacAmbientPaused) {\n        requestAnimationFrame(draw);")) {
    s = s.replace(
      "    function draw(time) {\n      ctx.clearRect(0, 0, width, height);",
      `    function drawAtmosphereFog(time, sp, imm) {
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
        grd.addColorStop(0, \`rgba(\${rMist}, \${gMist}, \${bMist}, \${a0})\`);
        grd.addColorStop(0.42, \`rgba(\${rMist}, \${gMist}, \${bMist}, \${a0 * 0.42})\`);
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
        ctx.fillStyle = m.gold ? \`rgba(236, 212, 168, \${alpha})\` : \`rgba(165, 210, 255, \${alpha})\`;
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
      ctx.clearRect(0, 0, width, height);`,
    );
  }

  if (!s.includes("drawAtmosphereFog(time, sp, ht)")) {
    s = s.replace(
      /(\s+if \(c\.life <= 0 \|\| c\.y > height \+ 80 \|\| c\.x < -120\) \{\s+comets\.splice\(i, 1\);\s+\}\s+\})\s+requestAnimationFrame\(draw\);/,
      "$1\n\n      drawAtmosphereFog(time, sp, ht);\n      requestAnimationFrame(draw);",
    );
  }
}

if (!s.includes('root.classList.contains("senac-atmosphere-merged")) return')) {
  s = s.replace(
    "  function initFog() {\n    const canvas = document.getElementById(\"fog-canvas\");",
    '  function initFog() {\n    if (root.classList.contains("senac-atmosphere-merged")) return;\n    const canvas = document.getElementById("fog-canvas");',
  );
}

if (!s.includes("function maybeInitSenacColorFluid")) {
  s = s.replace(
    "  /** Fluide coloré WebGL (or → bleu nuit) - calque sous la brume. */\n  async function initSenacColorFluid() {",
    `  function maybeInitSenacColorFluid() {
    if (senacColorFluidStarted || reducedMotion) return;
    const ht = Number.parseFloat(root.style.getPropertyValue("--hero-t").trim() || "0");
    const ft = Number.parseFloat(root.style.getPropertyValue("--frise-t").trim() || "0");
    if (ht < 0.1 && ft < 0.06) return;
    senacColorFluidStarted = true;
    void initSenacColorFluid();
  }

  /** Fluide coloré WebGL (or → bleu nuit) - calque sous la brume. */
  async function initSenacColorFluid() {`,
  );
}

s = s.replace(
  /const count = inIframe \? \(compact \? \d+ : \d+\) : compact \? \d+ : \d+;/,
  "const count = inIframe ? (compact ? 36 : 60) : compact ? 52 : 88;",
);

fs.writeFileSync(p, s);
console.log("OK parchemin");
