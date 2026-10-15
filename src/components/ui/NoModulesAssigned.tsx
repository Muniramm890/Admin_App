// FILE: teacher-app/src/components/ui/NoModulesAssigned.tsx
// [teacher-app] NEW — jab user ko koi module assign nahi hota.
// @ts-nocheck
import { C } from "../../theme/theme";
import { Icon } from "./Icon";

export const NoModulesAssigned = () => (
  <div className="slide-in" style={{ display: "flex", justifyContent: "center", padding: "60px 16px" }}>
    <div className="card" style={{ maxWidth: 440, textAlign: "center", padding: "36px 28px" }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 18px",
          background: `${C.primary}1f`, color: C.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name="user" size={28} />
      </div>
      <div className="syne" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
        Koi module assign nahi hai
      </div>
      <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6 }}>
        Aapke account ko abhi tak kisi module ka access nahi mila hai. Apne school admin se
        <b> User Management</b> me permission dene ko kahein, phir page refresh karein.
      </div>
    </div>
  </div>
);
