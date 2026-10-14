// FILE: teacher-app/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { injectStyles } from "./theme/theme";

// [teacher-app] admin me injectStyles() sirf SchoolERP mount hone par chalta tha;
// yahan app boot par chalate hain taaki login/forgot-password pe bhi same CSS (.slide-in, .syne, .btn ...) mile.
injectStyles();

const rootElement = document.getElementById("root")!;
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
