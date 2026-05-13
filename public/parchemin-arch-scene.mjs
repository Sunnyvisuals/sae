/**
 * Arche 3D pilotée par le scroll (Acte II, iframe parchemin).
 * Modèle : public/models/model.glb — ratio = scrollY / scrollMax.
 *
 * Le canvas couvre tout le viewport (CSS fixed inset 0, 100% × 100%).
 * Le modèle descend depuis le haut et se pose centré, droit, face caméra à t = 1.
 */

const THREE_VER = "0.170.0";
const THREE_SRC = `https://esm.sh/three@${THREE_VER}`;
const GLTF_LOADER_SRC = `https://esm.sh/three@${THREE_VER}/examples/jsm/loaders/GLTFLoader.js?deps=three@${THREE_VER}`;
const DRACO_LOADER_SRC = `https://esm.sh/three@${THREE_VER}/examples/jsm/loaders/DRACOLoader.js?deps=three@${THREE_VER}`;
const DRACO_DECODER_PATH = `https://esm.sh/three@${THREE_VER}/examples/jsm/libs/draco/gltf/`;

/**
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {boolean} opts.reducedMotion
 * @param {string} opts.modelUrl
 * @param {() => number} opts.getScrollRatio 0–1
 * @returns {Promise<{ dispose: () => void; sync: () => void }>}
 */
export async function initSenacArchScene(opts) {
  const { canvas, reducedMotion, modelUrl, getScrollRatio } = opts;
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
    console.info("[arch-scene] WebGL context restored");
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
   * t = 0 → modèle haut hors écran
   * t = 1 → modèle centré (0,0,0), droit, face caméra, aucune rotation
   */
  function applyPose(tRaw) {
    const t = Math.min(1, Math.max(0, tRaw));
    const yPos = reducedMotion ? 0 : THREE.MathUtils.lerp(3.0, -0.7, t);
    const xSwing = reducedMotion ? 0 : Math.sin(t * Math.PI * 2) * (1 - t) * 2.0;
    animRoot.position.set(xSwing, yPos, 0);
    animRoot.rotation.set(t * Math.PI * -6.15, -9.9, 0);
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
      console.info("[arch-scene] GLB ready — scale:", scale.toFixed(3));
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
    if (meshReady) renderer.render(scene, camera);
  }

  function dispose() {
    disposed = true;
    window.removeEventListener("resize", onResize);
    try { renderer.dispose(); } catch { /* ignore */ }
  }

  return { dispose, sync };
}
