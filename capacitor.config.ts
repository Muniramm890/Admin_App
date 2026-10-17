import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "tech.schooloffice.teacher",
  appName: "School Office Teacher",
  webDir: "dist",
  backgroundColor: "#0F1117", // status bar / system area ke peeche dark theme ka rang
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0F1117",
      showSpinner: false,
    },
  },
};

export default config;
