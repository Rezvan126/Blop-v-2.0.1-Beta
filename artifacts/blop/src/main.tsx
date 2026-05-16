import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialise Capacitor plugins for Android edge-to-edge (no-op on web)
if ((window as any).Capacitor) {
  import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
