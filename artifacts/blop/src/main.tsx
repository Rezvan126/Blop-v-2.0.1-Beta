import { createRoot } from "react-dom/client";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App";
import "./index.css";

// Initialise Capacitor plugins for Android edge-to-edge
if (window.hasOwnProperty("Capacitor")) {
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
