import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { TempoDevtools } from "tempo-devtools";
import { initializeTheme } from "@/lib/theme";
import { cleanupExpiredGuests } from "@/lib/database";

TempoDevtools.init();
initializeTheme();

// Set up periodic cleanup of expired guests
setInterval(() => {
  cleanupExpiredGuests();
}, 60000); // Check every minute

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
