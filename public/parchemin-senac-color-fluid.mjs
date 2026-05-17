/**
 * Acte II - fluide coloré plein écran (or / sable → bleu nuit au scroll).
 */

/**
 * @param {HTMLElement} mount
 * @param {{
 *   reducedMotion?: boolean;
 *   getHeroT?: () => number;
 *   getFriseT?: () => number;
 *   getScroll01?: () => number;
 *   getPresenceGate?: () => number;
 *   getMotionGate?: () => number;
 * }} [opts]
 */
export async function attachSenacColorFluid(mount, opts = {}) {
  if (opts.reducedMotion === true) return () => {};

  let THREE;
  try {
    THREE = await import("https://esm.sh/three@0.161.0");
  } catch {
    return () => {};
  }

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
    uPresence: { value: 1 },
    uMotion: { value: 1 },
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
      uniform float uPresence;
      uniform float uMotion;
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
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = m * p * 1.12;
          a *= 0.5;
        }
        return v;
      }

      float easeInOut(float x) {
        x = clamp(x, 0.0, 1.0);
        return x * x * (3.0 - 2.0 * x);
      }

      void main() {
        vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
        vec2 p = (vUv - 0.5) * aspect;
        float s = easeInOut(clamp(uScroll01, 0.0, 1.0));
        float shift = clamp(uHero * 0.38 + uFrise * 0.62, 0.0, 1.0);

        float presence = clamp(uPresence, 0.0, 1.0);
        float motion = clamp(uMotion, 0.0, 1.0);
        float phaseT = fract(uTime * 0.04 + p.x * 0.12);
        float local = smoothstep(0.0, 0.32, phaseT) * (1.0 - smoothstep(0.68, 1.0, phaseT));
        float cellGate = presence * motion * (0.25 + local * 0.75);

        vec2 flow = vec2(
          sin(uTime * 0.11 * motion + p.y * 0.8) * 0.06,
          uTime * (0.022 + s * 0.01) * motion
        );
        vec2 m = (uMouse - 0.5) * aspect;
        vec2 d = p - m;
        float dist = length(d);
        float influence = exp(-dist * 7.5) * motion;
        vec2 radial = normalize(d + 1e-5);
        vec2 perp = normalize(vec2(-d.y, d.x) + 1e-5);
        vec2 disp = (perp * 0.028 + radial * 0.018) * influence;
        vec2 mouseDrift = (uMouse - 0.5) * vec2(0.14, -0.11) * (0.35 + s * 0.4) * motion;

        vec2 q = p * (1.75 + s * 0.22) + flow + mouseDrift + disp;
        float n0 = fbm(q + vec2(uTime * 0.012 * motion, -uTime * 0.008 * motion));
        float n1 = fbm(q * 1.35 + vec2(0.55, -0.35) + vec2(-shift * 0.2, shift * 0.14));
        float n2 = fbm(q * 0.92 - vec2(0.4, 0.55) - uTime * 0.01);
        float n = n0 * 0.5 + n1 * 0.32 + n2 * 0.18;

        vec3 warmGold = vec3(0.98, 0.78, 0.42);
        vec3 sandRose = vec3(0.92, 0.52, 0.34);
        vec3 amber = vec3(0.88, 0.68, 0.38);
        vec3 teal = vec3(0.38, 0.78, 0.95);
        vec3 midnight = vec3(0.28, 0.42, 0.88);
        vec3 violet = vec3(0.52, 0.38, 0.82);

        vec3 warmMix = mix(warmGold, sandRose, n1);
        warmMix = mix(warmMix, amber, n2 * 0.6);
        vec3 coolMix = mix(teal, midnight, shift);
        coolMix = mix(coolMix, violet, n1 * 0.45 * shift);
        vec3 fluidColor = mix(warmMix, coolMix, shift * 0.72 + n2 * 0.2);

        float mask = smoothstep(0.22, 0.52, n);
        mask *= 1.0 - smoothstep(0.68, 0.98, n);
        mask *= smoothstep(1.4, 0.12, length(p));
        mask *= 0.82 + 0.18 * sin(uTime * 0.35 * motion + n * 8.0);

        float alpha = mask * (0.28 + s * 0.14) * (0.82 + shift * 0.22) * cellGate;
        alpha *= smoothstep(0.0, 0.12, mask);

        gl_FragColor = vec4(fluidColor * (0.85 + mask * 0.35), alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const clock = new THREE.Clock();
  let raf = 0;
  let disposed = false;

  const readImmersion = () => {
    uniforms.uHero.value = Math.min(1, Math.max(0, opts.getHeroT?.() ?? 0));
    uniforms.uFrise.value = Math.min(1, Math.max(0, opts.getFriseT?.() ?? 0));
    uniforms.uScroll01.value = Math.min(1, Math.max(0, opts.getScroll01?.() ?? 0));
    uniforms.uPresence.value = Math.min(1, Math.max(0, opts.getPresenceGate?.() ?? 1));
    uniforms.uMotion.value = Math.min(1, Math.max(0, opts.getMotionGate?.() ?? 1));
  };

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  };

  const onPointerMove = (e) => {
    uniforms.uMouse.value.set(
      e.clientX / Math.max(window.innerWidth, 1),
      1 - e.clientY / Math.max(window.innerHeight, 1),
    );
  };

  const render = () => {
    if (disposed) return;
    uniforms.uTime.value = clock.getElapsedTime();
    readImmersion();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  render();

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    mesh.geometry.dispose();
    material.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
