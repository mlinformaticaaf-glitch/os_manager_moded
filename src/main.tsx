import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hide splash screen after app loads
const hideSplash = () => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.transition = "opacity 0.3s ease-out";
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 300);
  }
};

createRoot(document.getElementById("root")!).render(<App />);

// Hide splash after a short delay to ensure React has rendered
setTimeout(hideSplash, 500);
