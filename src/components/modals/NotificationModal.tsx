// FILE: teacher-app/src/components/modals/NotificationModal.tsx
// Source: admin App.tsx -> NotificationModal [25313-25397]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { Modal } from "../ui/Modal";
import { C } from "../../theme/theme";

export const NotificationModal = ({ open, onClose, onUnreadChange }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/notifications");
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (open) load(); }, [open]); // eslint-disable-line

  const openMsg = async (n) => {
    if (!n.is_read) {
      try {
        await apiRequest(`/notifications/${n.id}/read`, "PATCH");
        setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        onUnreadChange?.((c) => Math.max(0, c - 1));
      } catch (e) { console.error(e.message); }
    }
    try {
      const res = await apiRequest(`/comm/messages/${n.related_id}`);
      setDetail(res?.data || null);
    } catch (e) { console.error(e.message); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Notifications" width={480}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
          {list.map((n) => (
            <div
              key={n.id}
              onClick={() => openMsg(n)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                background: n.is_read ? "transparent" : (C.blueBg || "#eef4ff"),
                border: `1px solid ${C.border || "#e5e7eb"}`,
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: n.is_read ? 500 : 700 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Koi notification nahi</div>
          )}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || ""} width={480}>
        {detail && (
          <div>
            <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 10 }}>{detail.body}</p>
            <div style={{ fontSize: 12, marginBottom: 10 }}><strong>By:</strong> {detail.created_by_name}</div>
            {detail.attachments?.length > 0 && (
              <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {detail.attachments.map((a) => (
                  a.file_type === "image" ? (
                    <img key={a.id} src={a.file_url} alt={a.file_name} style={{ maxWidth: "100%", borderRadius: 8 }} />
                  ) : (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>
                      {a.file_name}
                    </a>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Modal>
  );
};
