// FILE: teacher-app/src/modules/commhub/CommHubModule.tsx
// Source: admin App.tsx -> CommHubModule [10096-10131]
// @ts-nocheck
import { useState } from "react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { useSession } from "../../contexts/SessionContext";
import { ComposeMessageTab } from "./ComposeMessageTab";
import { MessageHistoryTab } from "./MessageHistoryTab";
import { C } from "../../theme/theme";

export const CommHubModule = () => {
  const { currentYear } = useSession();
  const [tab, setTab] = useState("compose"); // 'compose' | 'history'

  return (
    <div>
      <SectionHeader
        title="Communication Hub"
        sub="Targeted notices and notifications -- in-app and email, with attachments, from one place."
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "compose", label: "Compose" },
          { id: "history", label: "History" },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13.5,
              color: tab === tb.id ? C.blue : C.textMuted,
              borderBottom: tab === tb.id ? `2px solid ${C.blue}` : "2px solid transparent",
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "compose" && <ComposeMessageTab academicYearId={currentYear?.id} onSent={() => setTab("history")} />}
      {tab === "history" && <MessageHistoryTab />}
    </div>
  );
};
