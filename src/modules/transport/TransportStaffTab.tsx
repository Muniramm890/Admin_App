// FILE: teacher-app/src/modules/transport/TransportStaffTab.tsx
// Source: admin App.tsx -> TransportStaffTab [9377-9480]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { FormGrid } from "../../components/ui/FormGrid";
import { FormRow } from "../../components/ui/FormRow";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { useDialog } from "../../contexts/DialogContext";
import { C } from "../../theme/theme";

// ── STAFF: DRIVERS & CONDUCTORS (Level 1) ───────────────────────────────
export const TransportStaffTab = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await apiRequest("/transport/staff"); setRows(res?.data || []); }
    catch (e) { dialogAlert("Failed to load staff: " + e.message, "Error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ role: "driver" }); setModal("new"); };
  const openEdit = (row) => { setForm({ ...row }); setModal(row); };
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name || !form.phone) { dialogAlert("Name and Phone are required.", "Missing Info"); return; }
    setSaving(true);
    try {
      if (modal === "new") await apiRequest("/transport/staff", "POST", form);
      else await apiRequest(`/transport/staff/${modal.id}`, "PUT", form);
      setModal(null); await load();
    } catch (e) { dialogAlert("Save failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    const ok = await dialogConfirm(`Remove ${row.full_name}?`, "Confirm Remove");
    if (!ok) return;
    try { await apiRequest(`/transport/staff/${row.id}`, "DELETE"); await load(); }
    catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={13} /> Add Driver/Conductor</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>License No</th><th>License Expiry</th><th>Verified</th><th>Status</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No drivers/conductors added yet.</td></tr>
              ) : rows.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                  <td style={{ textTransform: "capitalize" }}><span className={`badge ${s.role === "driver" ? "badge-green" : "badge-yellow"}`}>{s.role}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.phone}</td>
                  <td style={{ fontSize: 12 }}>{s.license_no || "—"}</td>
                  <td style={{ fontSize: 12 }}>{s.license_expiry?.slice?.(0, 10) || "—"}</td>
                  <td>{s.is_verified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-red">Unverified</span>}</td>
                  <td><span className={`badge ${s.status === "active" ? "badge-green" : "badge-yellow"}`}>{s.status}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => openEdit(s)}><Icon name="edit" size={13} /></button>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => handleDelete(s)}><Icon name="trash" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Add Driver/Conductor" : "Edit Staff"} width={480}>
        {modal && (
          <div>
            <FormRow label="Full Name"><input className="input" value={form.full_name || ""} onChange={(e) => setF("full_name", e.target.value)} /></FormRow>
            <FormRow label="Role">
              <select className="select" value={form.role || "driver"} onChange={(e) => setF("role", e.target.value)}>
                <option value="driver">Driver</option><option value="conductor">Conductor</option>
              </select>
            </FormRow>
            <FormGrid cols={2}>
              <FormRow label="Phone"><input className="input" value={form.phone || ""} onChange={(e) => setF("phone", e.target.value)} /></FormRow>
              <FormRow label="License No"><input className="input" value={form.license_no || ""} onChange={(e) => setF("license_no", e.target.value)} /></FormRow>
              <FormRow label="License Expiry"><input className="input" type="date" value={form.license_expiry?.slice?.(0, 10) || ""} onChange={(e) => setF("license_expiry", e.target.value)} /></FormRow>
              <FormRow label="Status">
                <select className="select" value={form.status || "active"} onChange={(e) => setF("status", e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </FormRow>
            </FormGrid>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 14 }}>
              <input type="checkbox" checked={!!form.is_verified} onChange={(e) => setF("is_verified", e.target.checked)} /> Documents Verified
            </label>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
