// FILE: teacher-app/src/modules/commhub/MessageHistoryTab.tsx
// Source: admin App.tsx -> MessageHistoryTab [10440-10560]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { Modal } from "../../components/ui/Modal";
import { C } from "../../theme/theme";

export const MessageHistoryTab = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [viewers, setViewers] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/comm/messages?limit=30");
      setMessages(Array.isArray(res?.data) ? res.data : []);
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    try {
      const res = await apiRequest(`/comm/messages/${id}`);
      setDetail(res?.data || null);
    } catch (e) { console.error(e.message); }
  };

  const openViewers = async (id) => {
    try {
      const res = await apiRequest(`/comm/messages/${id}/viewers`);
      setViewers(res?.data || null);
    } catch (e) { console.error(e.message); }
  };

  const statusColor = (s) => (s === "sent" ? C.green : s === "partial" ? (C.orange || C.red) : s === "failed" ? C.red : C.textMuted);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Loading...</div>;

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Files</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th><th>Date</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.category}</td>
                <td>{m.attachment_count > 0 ? m.attachment_count : "--"}</td>
                <td>{m.recipient_count}</td>
                <td style={{ color: C.green }}>{m.sent_count}</td>
                <td style={{ color: m.failed_count > 0 ? C.red : C.textMuted }}>{m.failed_count}</td>
                <td><span style={{ color: statusColor(m.status), fontWeight: 600, textTransform: "capitalize" }}>{m.status}</span></td>
                <td>{new Date(m.created_at).toLocaleDateString("en-IN")}</td>
                <td><button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => openDetail(m.id)}>View</button></td>
                <td><button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => openViewers(m.id)}>Viewers</button></td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No messages sent yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || ""} width={520}>
        {detail && (
          <div>
            <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 14 }}>{detail.body}</p>
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              <strong>Channels:</strong> {detail.channels?.join(", ") || "--"}
            </div>
            {detail.attachments?.length > 0 && (
              <div style={{ fontSize: 12, marginBottom: 14 }}>
                <strong>Attachments:</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                  {detail.attachments.map((a) => (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>
                      {a.file_name} ({a.file_type}, {(a.file_size_bytes / 1024 / 1024).toFixed(1)} MB)
                    </a>
                  ))}
                </div>
              </div>
            )}
            <table className="table">
              <thead><tr><th>Channel</th><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {detail.delivery_stats?.map((d, i) => (
                  <tr key={i}><td>{d.channel}</td><td>{d.status}</td><td>{d.cnt}</td></tr>
                ))}
                {(!detail.delivery_stats || detail.delivery_stats.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: "center", padding: 16, color: C.textMuted }}>No delivery data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal open={!!viewers} onClose={() => setViewers(null)} title="Viewers" width={420}>
        {viewers && (
          <div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 10 }}>
              {viewers.seen} / {viewers.total} seen (in-app only)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 350, overflowY: "auto" }}>
              {viewers.viewers.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.border || "#eee"}` }}>
                  <span>{v.name} <span style={{ color: C.textMuted, fontSize: 11 }}>({v.recipient_type})</span></span>
                  <span style={{ color: v.is_read ? C.green : C.textMuted }}>{v.is_read ? "Seen" : "Not seen"}</span>
                </div>
              ))}
              {viewers.viewers.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: C.textMuted }}>No in-app recipients</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
