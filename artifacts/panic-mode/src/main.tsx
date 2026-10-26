import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA offline capabilities where supported
if (
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  (import.meta.env.PROD || process.env.NODE_ENV === "production")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => {
        // Silently fail if service worker registration is not supported in the hosting environment
        console.warn("ServiceWorker registration skipped:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
