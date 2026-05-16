/** Brume / poussière canvas (extrait de parchemin-senac.js). */

export type SenacAmbientFogOpts = {
  reducedMotion?: boolean;
  immersion?: number;
  getImmersion?: () => number;
  getScrollY?: () => number;
};

export function attachSenacAmbientFog(
  canvas: HTMLCanvasElement,
  opts: SenacAmbientFogOpts = {},
): () => void {
  const getImmersion = () => {
    const raw = opts.getImmersion?.() ?? opts.immersion ?? 0.35;
    return Math.min(1, Math.max(0, raw));
  };
  const getScrollY = opts.getScrollY ?? (() => 0);

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  if (opts.reducedMotion === true) {
    canvas.style.opacity = "0.38";
    return () => {};
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let puffs: {
    x: number;
    y: number;
    rx: number;
    ry: number;
    rot: number;
    vx: number;
    vy: number;
    vr: number;
    phase: number;
    layer: number;
    baseA: number;
  }[] = [];
  let motes: {
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;
    tw: number;
    phase: number;
    gold: boolean;
    pz: number;
  }[] = [];
  let scrollSmooth = getScrollY();
  let raf = 0;
  let disposed = false;

  const rand = (a: number, b: number) => a + Math.random() * (b - a);

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
    const area = width * height;
    const compact = width < 768 || area < 480000;
    const np = Math.round(
      Math.min(compact ? 62 : 92, Math.max(compact ? 38 : 52, area / 17000)),
    );
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
    const nm = Math.round(
      Math.min(compact ? 300 : 460, Math.max(compact ? 165 : 250, area / 1650)),
    );
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

  function drawFog(time: number) {
    if (disposed) return;
    const scrollTarget = getScrollY();
    scrollSmooth += (scrollTarget - scrollSmooth) * 0.118;
    const sp = scrollSmooth;
    const imm = getImmersion();
    ctx.clearRect(0, 0, width, height);

    const rMist = Math.round(238 - imm * 105);
    const gMist = Math.round(208 + imm * 28);
    const bMist = Math.round(155 + imm * 95);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const p of puffs) {
      p.rot += p.vr;
      p.x += p.vx + Math.sin(time * 0.00032 + p.phase) * 0.26;
      p.y += p.vy + Math.cos(time * 0.00026 + p.phase * 1.2) * 0.18;
      if (p.x < -p.rx * 2.2) p.x += width + p.rx * 3;
      if (p.x > width + p.rx * 2.2) p.x -= width + p.rx * 3;
      if (p.y < -p.ry * 2) p.y += height + p.ry * 2.5;
      if (p.y > height + p.ry * 2) p.y -= height + p.ry * 2.5;
      const cx = p.x + sp * (-0.016 - p.layer * 0.058);
      const cy = p.y + sp * (-0.048 - p.layer * 0.13);
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
    for (const m of motes) {
      const twinkle = 0.62 + Math.sin(time * m.tw + m.phase) * 0.24;
      m.x += m.vx * 0.09 + Math.sin(time * 0.0004 + m.phase) * 0.06;
      m.y += m.vy * 0.07;
      if (m.y < -6) m.y = height + 6;
      if (m.x < -4) m.x = width + 4;
      if (m.x > width + 4) m.x = -4;
      const sx = m.x + sp * (-0.011 - m.pz * 0.048);
      const sy = m.y + sp * (-0.038 - m.pz * 0.09);
      const alpha = Math.max(0.06, Math.min(0.72, twinkle * (0.52 + imm * 0.38)));
      ctx.globalAlpha = 1;
      ctx.fillStyle = m.gold
        ? `rgba(236, 212, 168, ${alpha})`
        : `rgba(165, 210, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    raf = requestAnimationFrame(drawFog);
  }

  const onResize = () => resize();
  resize();
  window.addEventListener("resize", onResize, { passive: true });
  raf = requestAnimationFrame(drawFog);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };
}
