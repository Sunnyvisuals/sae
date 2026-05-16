/**
 * Arche 3D — source canonique (SPA crédits via Vite + iframe parchemin via `public/`).
 * Acte II iframe parchemin :
 * Modèle : public/models/model.glb - ratio = scrollY / scrollMax.
 *
 * Le canvas couvre tout le viewport (CSS fixed inset 0, 100% × 100%).
 * Le modèle descend puis, en phase zoom final (fin du scroll), slerp quaternion + petite caméra pour cadrer l'entrée d'arche - à tuner : _scratchEulerB (0.28…) et camera.lookAt Y.
 */

const THREE_VER = "0.170.0";
const THREE_SRC = `https://esm.sh/three@${THREE_VER}`;
const GLTF_LOADER_SRC = `https://esm.sh/three@${THREE_VER}/examples/jsm/loaders/GLTFLoader.js?deps=three@${THREE_VER}`;
const DRACO_LOADER_SRC = `https://esm.sh/three@${THREE_VER}/examples/jsm/loaders/DRACOLoader.js?deps=three@${THREE_VER}`;
const DRACO_DECODER_PATH = `https://esm.sh/three@${THREE_VER}/examples/jsm/libs/draco/gltf/`;

/** Ratio scroll où commence le zoom. Plus bas = phase zoom plus longue (moins « rapide » à la molette). Synchro `parchemin-senac.js`. */
const ARCH_ZOOM_BEGIN = 0.68;

/**
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {boolean} opts.reducedMotion
 * @param {string} opts.modelUrl
 * @param {() => number} opts.getScrollRatio 0-1
 * @param {() => { x: number, y: number }} [opts.getMouse01] pointeur 0–1 (x gauche→droite, y bas→haut)
 * @returns {Promise<{ dispose: () => void; sync: () => void }>}
 */
export async function initSenacArchScene(opts) {
  const { canvas, reducedMotion, modelUrl, getScrollRatio, getMouse01 } = opts;
  let disposed = false;

  let THREE;
  try {
    THREE = /** @type {typeof import('three')} */ (await import(THREE_SRC));
  } catch (err) {
    console.error("[arch-scene] Three.js import failed:", err);
    return { dispose() {}, sync() {} };
  }

  let GLTFLoader;
  try {
    GLTFLoader = (await import(GLTF_LOADER_SRC)).GLTFLoader;
  } catch (err) {
    console.error("[arch-scene] GLTFLoader import failed:", err);
    return { dispose() {}, sync() {} };
  }

  let DRACOLoader = null;
  try {
    DRACOLoader = (await import(DRACO_LOADER_SRC)).DRACOLoader;
  } catch {
    /* Draco optionnel */
  }

  if (disposed) return { dispose() {}, sync() {} };

  THREE.ColorManagement.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 4.6);
  camera.lookAt(0, 0, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
  } catch (err) {
    console.error("[arch-scene] WebGLRenderer creation failed:", err);
    return { dispose() {}, sync() {} };
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    console.warn("[arch-scene] WebGL context lost");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    fitSize();
    if (meshReady) renderer.render(scene, camera);
  });

  const hemi = new THREE.HemisphereLight(0xc8dcff, 0x2a1810, 0.52);
  const key = new THREE.DirectionalLight(0xffeed8, 1.5);
  key.position.set(-3, 5, 4);
  const rim = new THREE.DirectionalLight(0x6a8cff, 0.4);
  rim.position.set(4, 2, -3);
  const fill = new THREE.DirectionalLight(0xfff4e0, 0.3);
  fill.position.set(0, -2, 3);
  scene.add(hemi, key, rim, fill);

  const animRoot = new THREE.Group();
  scene.add(animRoot);

  const _scratchEulerA = new THREE.Euler();
  const _scratchEulerB = new THREE.Euler();
  const _scratchQFrom = new THREE.Quaternion();
  const _scratchQTo = new THREE.Quaternion();
  const _scratchQWobble = new THREE.Quaternion();
  const mouseSmooth = { x: 0.5, y: 0.5 };

  function applyMouseParallax() {
    if (reducedMotion || typeof getMouse01 !== "function") return;
    const m = getMouse01();
    if (!m) return;
    const tx = Math.min(1, Math.max(0, m.x));
    const ty = Math.min(1, Math.max(0, m.y));
    mouseSmooth.x += (tx - mouseSmooth.x) * 0.11;
    mouseSmooth.y += (ty - mouseSmooth.y) * 0.11;
    const mx = (mouseSmooth.x - 0.5) * 2;
    const my = (mouseSmooth.y - 0.5) * 2;
    const t = Math.min(1, Math.max(0, getScrollRatio()));

    _scratchEulerB.set(my * 0.11, mx * 0.16, mx * 0.045, "XYZ");
    _scratchQWobble.setFromEuler(_scratchEulerB);
    animRoot.quaternion.multiply(_scratchQWobble);

    const par = 0.28 + t * 0.22;
    animRoot.position.x += mx * par;
    animRoot.position.y += my * par * 0.82;

    camera.position.x += mx * 0.12;
    camera.position.y += my * 0.09;
  }

  function fitSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * Math.min(window.devicePixelRatio || 1, 2);
    canvas.height = h * Math.min(window.devicePixelRatio || 1, 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
  }

  /**
   * Une seule courbe descente→zoom : wobble quaternion enveloppé (0 aux bords du zoom)
   * pour éviter le « pop » perceptif à l’entrée de phase zoom (~ARCH_ZOOM_BEGIN).
   */
  function applyPose(tRaw) {
    const t = Math.min(1, Math.max(0, tRaw));

    camera.position.set(0, 0, 4.6);
    camera.lookAt(0, 0, 0);

    if (reducedMotion) {
      animRoot.quaternion.identity();
      animRoot.position.set(0, 0, 0);
      return;
    }

    const z0 = ARCH_ZOOM_BEGIN;
    const zSpan = Math.max(1e-6, 1 - z0);

    const tDescend = Math.min(t / z0, 1);
    const yDescend = THREE.MathUtils.lerp(3.0, -0.2, tDescend);
    const xDescend = Math.sin(tDescend * Math.PI * 2) * (1 - tDescend) * 3.0;
    const rxDesc = tDescend * Math.PI * -6.15;
    const ryDesc = -9.9;

    const zoomT = Math.min(1, Math.max(0, (t - z0) / zSpan));
    const zoomEased = THREE.MathUtils.smoothstep(zoomT, 0, 1);
    const wobbleEnv = zoomEased * (1 - zoomEased) * 4;

    const pz = zoomEased * 5.1;
    const py = THREE.MathUtils.lerp(yDescend, -0.34, zoomEased);
    const px =
      THREE.MathUtils.lerp(xDescend, 0, zoomEased) +
      Math.sin(zoomT * Math.PI * 4.2) * 0.048 * wobbleEnv;

    _scratchEulerA.set(rxDesc, ryDesc, 0, "XYZ");
    _scratchQFrom.setFromEuler(_scratchEulerA);
    _scratchEulerB.set(0.28, 0.05, -0.04, "XYZ");
    _scratchQTo.setFromEuler(_scratchEulerB);
    _scratchQFrom.slerp(_scratchQTo, zoomEased);

    const wAmp = wobbleEnv * 0.12;
    _scratchEulerB.set(
      Math.sin(zoomT * Math.PI * 5.5) * wAmp,
      Math.sin(zoomT * Math.PI * 3.1) * wAmp * 0.85,
      Math.cos(zoomT * Math.PI * 4.3) * wAmp * 0.62,
      "XYZ",
    );
    _scratchQWobble.setFromEuler(_scratchEulerB);
    _scratchQFrom.multiply(_scratchQWobble);

    animRoot.quaternion.copy(_scratchQFrom);
    animRoot.position.set(px, py, pz);

    camera.position.set(
      THREE.MathUtils.lerp(0, -0.12, zoomEased),
      THREE.MathUtils.lerp(0, 0.06, zoomEased),
      4.6,
    );
    camera.lookAt(
      THREE.MathUtils.lerp(0, 0.02, zoomEased),
      THREE.MathUtils.lerp(0, -0.56, zoomEased),
      0,
    );

    applyMouseParallax();
  }

  let meshReady = false;

  async function loadGltf() {
    try {
      const loader = new GLTFLoader();
      if (DRACOLoader) {
        const draco = new DRACOLoader();
        draco.setDecoderPath(DRACO_DECODER_PATH);
        draco.setDecoderConfig({ type: "js" });
        loader.setDRACOLoader(draco);
      }

      const gltf = await new Promise((resolve, reject) => {
        loader.load(modelUrl, resolve, undefined, reject);
      });
      if (disposed || !gltf || !gltf.scene) return;

      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3());
      const maxD = Math.max(size.x, size.y, size.z, 1e-3);
      const scale = 1.5 / maxD;
      model.scale.setScalar(scale);
      animRoot.clear();
      animRoot.add(model);
      meshReady = true;
      fitSize();
      applyPose(getScrollRatio());
      renderer.render(scene, camera);
    } catch (err) {
      console.error("[arch-scene] GLB load failed:", modelUrl, err);
      meshReady = false;
    }
  }

  fitSize();

  const onResize = () => {
    if (disposed) return;
    fitSize();
    applyPose(getScrollRatio());
    if (meshReady) renderer.render(scene, camera);
  };
  window.addEventListener("resize", onResize);

  applyPose(getScrollRatio());
  void loadGltf();

  function sync() {
    if (disposed) return;
    applyPose(getScrollRatio());
    if (meshReady) {
      if (!canvas.classList.contains("senac-arch-live")) {
        canvas.classList.add("senac-arch-live");
      }
      renderer.render(scene, camera);
    }
  }

  let rafId = 0;
  function tick() {
    if (disposed) return;
    sync();
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  function dispose() {
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    try { renderer.dispose(); } catch { /* ignore */ }
  }

  return { dispose, sync };
}
