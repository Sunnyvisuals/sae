import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

/**
 * Phase 2 — Carte-mémoire 3D (vol plané, constellations, vignettes).
 * Brancher dans App à la place d’AlgeriaMap quand le socle Three.js sera prêt.
 */
export default function GreatMap() {
  return (
    <div className="fixed inset-0 z-[5] bg-[#0a0806]">
      <Canvas camera={{ position: [0, 1.8, 7], fov: 50 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#0a0806']} />
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 6, 4]} intensity={0.8} color="#c5a059" />
        <Stars radius={80} depth={50} count={2000} factor={3} saturation={0} fade speed={0.3} />
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 24, 1, 1]} />
          <meshStandardMaterial color="#120e0a" metalness={0.2} roughness={0.85} />
        </mesh>
      </Canvas>
      <p className="pointer-events-none absolute bottom-6 left-6 max-w-sm text-[10px] leading-relaxed text-solar-gold/35">
        GreatMap · espace 3D — remplacer le plan par le tracé Algérie (TubeGeometry / extrude), sprites texte,
        CameraControls fly-through, raycaster mots & vignettes.
      </p>
    </div>
  );
}
