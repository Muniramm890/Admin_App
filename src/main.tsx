// FILE: teacher-app/src/main.tsx
import ReactDOM from "react-dom/client";
import App from "./App";
import { injectStyles } from "./theme/theme";

// [teacher-app] admin me injectStyles() sirf SchoolERP mount hone par chalta tha;
// yahan app boot par chalate hain taaki login/forgot-password pe bhi same CSS (.slide-in, .syne, .btn ...) mile.
injectStyles();

// [teacher-app] React.StrictMode hataya: dev mode (npm run dev) me StrictMode effects 2 baar chalata hai,
// jisse MainLayout ka splash-timer cancel ho jata hai aur page refresh (saved token) par splash screen par atak jata hai.
// Production build me ye issue nahi tha; yahan dono me safe rakha hai.
const rootElement = document.getElementById("root")!;
ReactDOM.createRoot(rootElement).render(<App />);
