// FILE: teacher-app/src/App.tsx
// Source: admin App.tsx -> MainLayout (verbatim, except SchoolERP -> placeholder) + App providers order
// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { DialogProvider } from "./contexts/DialogContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/Login";
import { SplashScreen } from "./components/ui/SplashScreen";
import { C } from "./theme/theme";

// [teacher-app] TEMPORARY — yahan baad me teacher ka main shell/sidebar (SchoolERP ka teacher version) aayega.
const TeacherShellPlaceholder = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: C.text }}>
      <div>Logged in as {user?.name} ({user?.role})</div>
      <button className="btn btn-primary" onClick={logout}>Logout</button>
    </div>
  );
};

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
  return <TeacherShellPlaceholder />; // [teacher-app] was: <SchoolERP />
};

export default function App() {
  return (
    <DialogProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </DialogProvider>
  );
}
