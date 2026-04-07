import { ReactLenis } from "lenis/react";
import { useState } from "react";
import Intro from "./components/Intro";
import SplashCursor from "./components/SplashCursor";
import CustomCursor from "./components/CustomCursor";
import CinematicOverlay from "./components/CinematicOverlay";
import Soundscape from "./components/Soundscape";
import DesertLandscape from "./components/DesertLandscape";
import PoeticReveal from "./components/PoeticReveal";
import PoeticFragments from "./components/PoeticFragments";

export default function App() {
  const [isExploring, setIsExploring] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  return (
    <ReactLenis root options={{ 
      lerp: 0.05,
      duration: 1.8,
      smoothWheel: true,
    }}>
      <main className={`relative w-full ${isExploring ? "h-[1000vh]" : "h-screen overflow-hidden"} bg-solar-brown`}>
        <CustomCursor />
        <CinematicOverlay videoStarted={videoStarted} />
        <Soundscape />
        <SplashCursor
          SIM_RESOLUTION={256}
          DYE_RESOLUTION={1024}
          DENSITY_DISSIPATION={10}
          VELOCITY_DISSIPATION={5}
          PRESSURE={0.1}
          CURL={10}
          SPLAT_RADIUS={0.05}
          SPLAT_FORCE={12000}
          COLOR_UPDATE_SPEED={10}
        />
        
        {/* The Desert Landscape stays fixed or moves slightly, appearing as we scroll */}
        {isExploring && <DesertLandscape />}

        {/* Word by word reveal of Jean Sénac's quote */}
        {isExploring && (
          <PoeticReveal 
            quote="Le soleil est mon corps, le sable est ma mémoire, un cri de lumière dans l'immensité."
            startProgress={0.05}
            endProgress={0.3}
          />
        )}

        <div id="intro" className="sticky top-0 w-full h-screen z-10">
          <Intro 
            onComplete={() => setIsExploring(true)} 
            isExploring={isExploring}
            onVideoStart={() => setVideoStarted(true)}
          />
        </div>

        {/* Initial space for dunes and reveal */}
        {isExploring && <div className="h-[400vh] pointer-events-none" />}

        {/* Floating words that assemble into a sentence */}
        {isExploring && <PoeticFragments />}

        {/* Final spacer for any subsequent content or just to finish the journey */}
        {isExploring && <div className="h-[100vh] pointer-events-none" />}
      </main>
    </ReactLenis>
  );
}
