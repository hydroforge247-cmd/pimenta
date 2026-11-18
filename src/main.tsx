import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./base.css";
import "./film.css";
import "./pimenta.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
