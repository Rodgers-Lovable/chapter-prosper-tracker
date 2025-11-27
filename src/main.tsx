import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { runSetup } from "./scripts/setup.ts";

runSetup();

createRoot(document.getElementById("root")!).render(<App />);
