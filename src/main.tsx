import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./safari-compat.css";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import { initSafariCompat } from "./lib/safariDetect.ts";
import { primePrologueVideoPreload } from "./lib/primePrologueVideo.ts";

initSafariCompat();
primePrologueVideoPreload();

const rootEl = document.getElementById("root")!;

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
