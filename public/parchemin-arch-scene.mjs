/**
 * Copie iframe (Acte II) - source canonique : `src/lib/parchemin-arch-scene.mjs`.
 * Arche 3D pilotée par le scroll (Acte II, iframe parchemin).
 * Modèle : public/models/model.glb - ratio = scrollY / scrollMax.
 *
 * Descente + rotation sur tout le parcours scroll ; léger zoom caméra à partir du portail.
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
 * @param {() => number} opts.getScrollRatio 0-1
 * @param {() => number} [opts.getArchZoom01] 0-1 depuis « Le portail du voyage »
 * @param {() => { x: number, y: number }} [opts.getMouse01] pointeur 0-1
 * @returns {Promise<{ dispose: () => void; sync: () => void }>}
 */
export async function initSenacArchScene(opts) {
  const { canvas, reducedMotion, modelUrl, getScrollRatio, getArchZoom01, getMouse01 } = opts;
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

  const ARCH_CAM_Z_IDLE = 4.6;
  const ARCH_CAM_Z_PORTAL = 3.78;

  function readArchZoom01() {
    if (reducedMotion || typeof getArchZoom01 !== "function") return 0;
    const z = getArchZoom01();
    return Math.min(1, Math.max(0, Number.isFinite(z) ? z : 0));
  }

  /** Descente spiralée sur tout le scroll ; dolly léger quand le portail est lisible. */
  function applyPose(tRaw) {
    const t = Math.min(1, Math.max(0, tRaw));
    const zoomRaw = readArchZoom01();
    const zoomEased = THREE.MathUtils.smoothstep(zoomRaw, 0, 1);
    const pz = THREE.MathUtils.lerp(ARCH_CAM_Z_IDLE, ARCH_CAM_Z_PORTAL, zoomEased);

    camera.position.set(0, 0, pz);
    camera.lookAt(0, 0, 0);

    if (reducedMotion) {
      animRoot.quaternion.identity();
      animRoot.position.set(0, 0, 0);
      return;
    }

    const eased = THREE.MathUtils.smoothstep(t, 0, 1);
    const yDescend = THREE.MathUtils.lerp(3.0, -0.2, eased);
    const xDescend = Math.sin(eased * Math.PI * 2) * (1 - eased) * 3.0;
    const rxDesc = eased * Math.PI * -6.15;
    const ryDesc = -9.9;

    _scratchEulerA.set(rxDesc, ryDesc, 0, "XYZ");
    _scratchQFrom.setFromEuler(_scratchEulerA);
    animRoot.quaternion.copy(_scratchQFrom);
    animRoot.position.set(xDescend, yDescend, 0);

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
    if (typeof document !== "undefined" && document.hidden) {
      rafId = 0;
      return;
    }
    sync();
    rafId = requestAnimationFrame(tick);
  }
  const onVisibilityChange = () => {
    if (disposed || document.hidden) return;
    sync();
    if (!rafId) rafId = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

  rafId = requestAnimationFrame(tick);

  function dispose() {
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    try {
      renderer.dispose();
    } catch {
      /* ignore */
    }
  }

  return { dispose, sync };
}
