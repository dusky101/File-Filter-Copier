import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // <--- IMPORT THIS
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

// Wrap App in HashRouter to support file:// protocol on macOS and Electron
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
