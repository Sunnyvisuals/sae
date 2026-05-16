/** Fumée WebGL plein écran (extrait de parchemin-senac.js `initSmokeShader`). */

export type SenacSmokeShaderOpts = {
  reducedMotion?: boolean;
  getScroll01?: () => number;
  getHeroT?: () => number;
  getFriseT?: () => number;
};

export async function attachSenacSmokeShader(
  mount: HTMLElement,
  opts: SenacSmokeShaderOpts = {},
): Promise<() => void> {
  if (opts.reducedMotion === true) return () => {};

  type ThreeNS = typeof import("three");
  let THREE: ThreeNS;
  try {
    THREE = await import(
      /* @vite-ignore */ "https://esm.sh/three@0.161.0"
    );
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
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
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
        float alpha = smoke * (0.19 + sEase * 0.11);
        alpha *= smoothstep(0.0, 0.2, smoke) * (1.0 - smoothstep(0.75, 1.0, smoke));
        gl_FragColor = vec4(tint, alpha);
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
  };

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  };

  const onPointerMove = (e: PointerEvent) => {
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
