// FILE: teacher-app/src/App.tsx
// Source: admin App.tsx -> MainLayout [25702-25722], App [25725-25737]
// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { SplashScreen } from "./components/ui/SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { DialogProvider } from "./contexts/DialogContext";
import { PdfViewerProvider } from "./components/pdf/PdfViewerProvider";
import { SessionProvider } from "./contexts/SessionContext";
import { SchoolERP } from "./layout/SchoolERP";
import { LoginPage } from "./pages/Login";

// Gatekeeper Component: Check karta hai user logged in hai ya nahi
const MainLayout = () => {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const hadUserRef = useRef(false);

  useEffect(() => {
    // Sirf login ke moment pe (no-user -> user transition) splash dikhao,
    // page refresh ka case AuthProvider ke apne loading state se already handle hai.
    if (user && !hadUserRef.current) {
      setShowSplash(true);
      hadUserRef.current = true;
      const t = setTimeout(() => setShowSplash(false), 2200);
      return () => clearTimeout(t);
    }
    if (!user) hadUserRef.current = false;
  }, [user]);

  if (!user) return <LoginPage />;
  if (showSplash) return <SplashScreen />;
  return <SchoolERP />;
};

// Naya Main App Export
export default function App() {
  return (
    <ErrorBoundary label="app" fullscreen>
      <DialogProvider>
        <PdfViewerProvider>
          <AuthProvider>
            <DataProvider>
              <SessionProvider>
                <MainLayout />
              </SessionProvider>
            </DataProvider>
          </AuthProvider>
        </PdfViewerProvider>
      </DialogProvider>
    </ErrorBoundary>
  );
}
