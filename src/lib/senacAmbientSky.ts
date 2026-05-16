/** Ciel étoilé canvas (extrait de parchemin-senac.js, sans dépendance DOM frise). */

export type SenacAmbientSkyOpts = {
  reducedMotion?: boolean;
  /** 0 sable … 1 nuit bleue */
  immersion?: number;
  getImmersion?: () => number;
  getScrollY?: () => number;
};

export function attachSenacAmbientSky(
  canvas: HTMLCanvasElement,
  opts: SenacAmbientSkyOpts = {},
): () => void {
  const reducedMotion = opts.reducedMotion === true;
  const getImmersion = () => {
    const raw = opts.getImmersion?.() ?? opts.immersion ?? 0.35;
    return Math.min(1, Math.max(0, raw));
  };
  const getScrollY = opts.getScrollY ?? (() => 0);

  if (reducedMotion) {
    canvas.style.opacity = "0.35";
    return () => {};
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars: {
    x: number;
    y: number;
    r: number;
    a: number;
    tw: number;
    phase: number;
    drift: number;
    gold: boolean;
    connect: boolean;
    pz: number;
  }[] = [];
  let comets: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] =
    [];
  let scrollSmooth = getScrollY();
  let raf = 0;
  let disposed = false;

  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  function skyParallaxFor(pzRaw: number, sx: number) {
    const pz = Math.min(1, Math.max(0, pzRaw));
    return { ox: sx * (-0.01 + pz * 0.085), oy: sx * -(0.028 + pz * 0.44) };
  }

  function blendSkyRadial(t: number) {
    const u = Math.min(1, Math.max(0, t));
    const cx = width * 0.5;
    const cy = height * 0.175;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy * 1.06, width * 0.76);
    bg.addColorStop(
      0,
      `rgba(${Math.round(48 - 36 * u)}, ${Math.round(36 + 22 * u)}, ${Math.round(22 + 96 * u)}, ${0.18 + u * 0.16})`,
    );
    bg.addColorStop(
      0.38,
      `rgba(${Math.round(22 - 18 * u)}, ${Math.round(16 + 10 * u)}, ${Math.round(12 + 56 * u)}, ${0.12 + u * 0.06})`,
    );
    bg.addColorStop(1, "rgba(0, 2, 8, 0)");
    return bg;
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
    stars = [];
    const area = width * height;
    const compact = width < 768 || area < 480000;
    const count = Math.round(
      Math.min(compact ? 340 : 520, Math.max(compact ? 210 : 320, area / 4000)),
    );
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
        pz: rand(0, 1),
      });
    }
    scrollSmooth = getScrollY();
  }

  function draw(time: number) {
    if (disposed) return;
    ctx.clearRect(0, 0, width, height);
    const scrollTarget = getScrollY();
    scrollSmooth += (scrollTarget - scrollSmooth) * 0.125;
    const sp = scrollSmooth;
    const imm = getImmersion();

    ctx.fillStyle = blendSkyRadial(imm);
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < stars.length; i += 1) {
      const a = stars[i];
      if (!a.connect || a.y > height * 0.72) continue;
      const pa = skyParallaxFor(a.pz, sp);
      const ax = a.x + pa.ox;
      const ay = a.y + pa.oy;
      for (let j = i + 1; j < Math.min(i + 18, stars.length); j += 1) {
        const b = stars[j];
        if (!b.connect || b.y > height * 0.72) continue;
        const pb = skyParallaxFor(b.pz, sp);
        const bx = b.x + pb.ox;
        const by = b.y + pb.oy;
        const dist = Math.hypot(ax - bx, ay - by);
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
      const pp = skyParallaxFor(star.pz, sp);
      ctx.beginPath();
      ctx.arc(star.x + pp.ox, star.y + pp.oy, star.r, 0, Math.PI * 2);
      ctx.fillStyle = star.gold
        ? `rgba(234, 215, 164, ${Math.max(0.08, twinkle)})`
        : `rgba(165, 215, 255, ${Math.max(0.08, twinkle)})`;
      ctx.fill();
    }

    if (comets.length < 3 && Math.random() < 0.026) {
      comets.push({
        x: rand(width * 0.2, width * 0.95),
        y: rand(-height * 0.1, height * 0.35),
        vx: rand(-1.55, -0.58),
        vy: rand(0.68, 1.35),
        life: rand(135, 235),
        maxLife: 235,
      });
    }
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
      if (c.life <= 0 || c.y > height + 80 || c.x < -120) comets.splice(i, 1);
    }

    raf = requestAnimationFrame(draw);
  }

  const onResize = () => resize();
  resize();
  window.addEventListener("resize", onResize, { passive: true });
  raf = requestAnimationFrame(draw);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };
}
