// @ts-nocheck
// Capacitor (Android/iOS) glue. Web par kuch nahi karta: sab kuch Capacitor.isNativePlatform() se guarded hai.
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

// status bar ke icons theme ke hisaab se (dark theme -> light icons)
export const setNativeTheme = async (mode) => {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: mode === "dark" ? Style.Dark : Style.Light });
  } catch (_) { /* plugin unavailable */ }
};

export const initNative = async () => {
  if (!isNative) return;
  document.documentElement.classList.add("is-native", `is-${Capacitor.getPlatform()}`);

  let theme = "dark";
  try { theme = localStorage.getItem("erp_theme") || "dark"; } catch (_) {}
  setNativeTheme(theme);

  try {
    const { App } = await import("@capacitor/app");

    // Android hardware/gesture back:  1) open modal / drawer band  2) router history me peeche  3) app minimize
    App.addListener("backButton", () => {
      const overlays = document.querySelectorAll(".modal-overlay, [data-native-back]");
      if (overlays.length) { overlays[overlays.length - 1].click(); return; }
      const idx = window.history.state && typeof window.history.state.idx === "number" ? window.history.state.idx : 0;
      if (idx > 0) window.history.back();
      else App.minimizeApp();
    });
  } catch (_) { /* ignore */ }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (_) { /* ignore */ }
};
